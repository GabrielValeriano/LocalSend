import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'node:path'
import { Descubrimiento, obtenerIpLocal } from '../src/electron/red/descubrimiento'
import { iniciarServidorTcp } from '../src/electron/red/servidorTcp'
import { enviarLote } from '../src/electron/transferencia/enviarArchivo'
import type { DecisionUsuario } from '../src/electron/transferencia/recibirArchivo'
import { cambiarAlias, cambiarCarpetaDescargas, obtenerAjustes } from '../src/electron/config/ajustes'
import { PUERTO_TCP } from '../src/electron/config/constantes'
import { notificarArchivoEntrante } from '../src/electron/notificaciones'
import { CANALES } from '../src/electron/ipc'
import type { Beacon, OfertaLote } from '../src/compartido/tipos'

let ventana: BrowserWindow | null = null
let servidorActivo = false
// Ofertas esperando que el usuario decida (por id de transferencia)
const ofertasPendientes = new Map<string, (decision: DecisionUsuario) => void>()
// Notificaciones abiertas por lote, para cerrarlas si el usuario responde desde la ventana
const notificacionesAbiertas = new Map<string, () => void>()

function crearVentana(): void {
  ventana = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 550,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true, // la vista NO tiene acceso a Node
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    ventana.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    ventana.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

function enviarAVista(canal: string, datos: unknown): void {
  ventana?.webContents.send(canal, datos)
}

function miBeacon(): Beacon {
  const { idDispositivo, alias } = obtenerAjustes()
  return { id: idDispositivo, alias, tipo: 'pc', puertoTcp: PUERTO_TCP }
}

function preguntarAlUsuario(oferta: OfertaLote, idsExistentes: string[]): Promise<DecisionUsuario> {
  return new Promise((resolve) => {
    ofertasPendientes.set(oferta.idLote, resolve)
    enviarAVista(CANALES.ofertaEntrante, { oferta, idsExistentes })

    // Si la app está en segundo plano, también avisamos con una notificación del sistema.
    // Desde la notificación se acepta TODO el lote (los repetidos se renombran).
    if (!ventana?.isFocused()) {
      const cerrar = notificarArchivoEntrante(
        oferta,
        (aceptado) =>
          resolverOferta(oferta.idLote, {
            idsAceptados: aceptado ? oferta.archivos.map((a) => a.id) : [],
            accionConflicto: 'renombrar'
          }),
        () => {
          ventana?.show()
          ventana?.focus()
        }
      )
      notificacionesAbiertas.set(oferta.idLote, cerrar)
    }
  })
}

// Vale solo la PRIMERA respuesta (ventana o notificación): después se borra y las demás no hacen nada.
function resolverOferta(id: string, decision: DecisionUsuario): void {
  const resolver = ofertasPendientes.get(id)
  if (!resolver) return
  resolver(decision)
  ofertasPendientes.delete(id)

  // Cerramos la notificación (si quedó abierta) y le avisamos a la ventana que saque el diálogo
  notificacionesAbiertas.get(id)?.()
  notificacionesAbiertas.delete(id)
  enviarAVista(CANALES.ofertaResuelta, id)
}

function iniciarServicios(): Descubrimiento {
  const descubrimiento = new Descubrimiento(miBeacon, (lista) =>
    enviarAVista(CANALES.dispositivosActualizados, lista)
  )
  descubrimiento.iniciar()

  iniciarServidorTcp(
    {
      carpetaDestino: () => obtenerAjustes().carpetaDescargas,
      preguntarAlUsuario,
      alProgreso: (progreso) => enviarAVista(CANALES.progresoActualizado, progreso)
    },
    (activo) => {
      servidorActivo = activo
      enviarAVista(CANALES.estadoServidor, activo)
    }
  )
  return descubrimiento
}

function registrarIpc(descubrimiento: Descubrimiento): void {
  ipcMain.handle(CANALES.obtenerEstado, () => ({
    ajustes: obtenerAjustes(),
    dispositivos: descubrimiento.obtenerLista(),
    servidorActivo,
    ip: obtenerIpLocal()
  }))

  ipcMain.handle(CANALES.enviarArchivos, (_e, idDestino: string, rutas: string[]) => {
    const destino = descubrimiento.obtenerLista().find((d) => d.id === idDestino)
    if (!destino) throw new Error('El dispositivo ya no está disponible')

    const { idDispositivo, alias } = obtenerAjustes()
    // UN solo lote con todos los archivos: el receptor ve un único diálogo.
    // No esperamos acá: corre en segundo plano y la vista se entera por el progreso.
    enviarLote({
      rutas,
      destino,
      remitente: { id: idDispositivo, alias },
      alProgreso: (progreso) => enviarAVista(CANALES.progresoActualizado, progreso)
    }).catch((error) => console.error('[Envío] error:', error.message))
  })

  ipcMain.handle(CANALES.responderOferta, (_e, id: string, decision: DecisionUsuario) =>
    resolverOferta(id, decision)
  )

  ipcMain.handle(CANALES.elegirCarpeta, async () => {
    const resultado = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (resultado.canceled) return null
    cambiarCarpetaDescargas(resultado.filePaths[0])
    return resultado.filePaths[0]
  })

  ipcMain.handle(CANALES.cambiarAlias, (_e, alias: string) => cambiarAlias(alias))

  ipcMain.handle(CANALES.agregarIp, (_e, ip: string) => descubrimiento.agregarIp(ip))
}

app.whenReady().then(() => {
  const descubrimiento = iniciarServicios()
  registrarIpc(descubrimiento)
  crearVentana()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

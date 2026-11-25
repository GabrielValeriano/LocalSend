import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { CANALES } from '../src/electron/ipc'
import type { Dispositivo, OfertaLote, ProgresoTransferencia } from '../src/compartido/tipos'
import type { DecisionUsuario } from '../src/electron/transferencia/recibirArchivo'

// ¿Por qué contextBridge y no importar fs en React?
// Si la vista tuviera acceso a Node, cualquier script malicioso cargado en ella
// podría leer o borrar archivos de la PC. Con contextBridge exponemos SOLO
// estas funciones puntuales; la vista nunca toca fs ni la red directamente.

function escuchar<T>(canal: string, callback: (datos: T) => void): () => void {
  const manejador = (_evento: unknown, datos: T): void => callback(datos)
  ipcRenderer.on(canal, manejador)
  return () => ipcRenderer.removeListener(canal, manejador) // para limpiar en useEffect
}

const api = {
  obtenerEstado: () => ipcRenderer.invoke(CANALES.obtenerEstado),
  enviarArchivos: (idDestino: string, rutas: string[]) =>
    ipcRenderer.invoke(CANALES.enviarArchivos, idDestino, rutas),
  responderOferta: (id: string, decision: DecisionUsuario) =>
    ipcRenderer.invoke(CANALES.responderOferta, id, decision),
  elegirCarpeta: (): Promise<string | null> => ipcRenderer.invoke(CANALES.elegirCarpeta),
  cambiarAlias: (alias: string) => ipcRenderer.invoke(CANALES.cambiarAlias, alias),
  agregarIp: (ip: string) => ipcRenderer.invoke(CANALES.agregarIp, ip),

  // Con contextIsolation, File.path ya no existe: así obtenemos la ruta real del archivo arrastrado
  rutaDeArchivo: (archivo: File): string => webUtils.getPathForFile(archivo),

  alCambiarDispositivos: (cb: (lista: Dispositivo[]) => void) => escuchar(CANALES.dispositivosActualizados, cb),
  alCambiarProgreso: (cb: (p: ProgresoTransferencia) => void) => escuchar(CANALES.progresoActualizado, cb),
  alRecibirOferta: (cb: (d: { oferta: OfertaLote; idsExistentes: string[] }) => void) => escuchar(CANALES.ofertaEntrante, cb),
  alCambiarServidor: (cb: (activo: boolean) => void) => escuchar(CANALES.estadoServidor, cb),
  alResolverOferta: (cb: (idLote: string) => void) => escuchar(CANALES.ofertaResuelta, cb)
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api

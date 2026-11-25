import { Notification } from 'electron'
import { spawn } from 'node:child_process'
import type { OfertaLote } from '../compartido/tipos'
import { formatearBytes } from '../utils/formato'

type AlDecidir = (aceptado: boolean) => void

// Notificación del sistema con botones Aceptar / Rechazar cuando la app está en segundo plano.
// Devuelve una función para cerrarla (si el usuario responde desde la ventana).
//
// ¿Por qué dos caminos?
// - En Linux, las notificaciones de Electron NO muestran botones de acción (solo un "View" genérico).
//   Usamos "notify-send" del sistema con --action, que sí muestra los botones y nos dice cuál tocó.
// - En Windows y macOS usamos la notificación de Electron.
export function notificarArchivoEntrante(oferta: OfertaLote, alDecidir: AlDecidir, alHacerClic: () => void): () => void {
  const { titulo, cuerpo } = armarTexto(oferta)

  if (process.platform === 'linux') {
    return notificarConNotifySend(titulo, cuerpo, alDecidir, alHacerClic)
  }
  return notificarConElectron(titulo, cuerpo, alDecidir, alHacerClic)
}

function armarTexto(oferta: OfertaLote): { titulo: string; cuerpo: string } {
  const cantidad = oferta.archivos.length
  const total = oferta.archivos.reduce((suma, a) => suma + a.tamano, 0)
  return {
    titulo: `${oferta.remitente.alias} quiere enviarte ${cantidad === 1 ? 'un archivo' : `${cantidad} archivos`}`,
    cuerpo: `${cantidad === 1 ? oferta.archivos[0].nombre : 'Varios archivos'} (${formatearBytes(total)})`
  }
}

// notify-send --wait espera a que el usuario toque un botón e imprime su nombre ("aceptar" / "rechazar").
function notificarConNotifySend(titulo: string, cuerpo: string, alDecidir: AlDecidir, alHacerClic: () => void): () => void {
  let cerradaPorNosotros = false
  let respuesta = ''

  const proceso = spawn('notify-send', [
    '--app-name=LocalSend',
    '--urgency=critical', // no se oculta sola mientras el usuario no responda
    '--wait',
    '--action=aceptar=Aceptar',
    '--action=rechazar=Rechazar',
    '--action=default=Abrir LocalSend', // tocar la notificación (no un botón)
    titulo,
    cuerpo
  ])

  proceso.stdout.on('data', (datos) => { respuesta += datos.toString() })

  proceso.on('close', (codigo) => {
    if (cerradaPorNosotros) return
    const accion = respuesta.trim()
    if (accion === 'aceptar') return alDecidir(true)
    if (accion === 'rechazar') return alDecidir(false)
    if (accion === 'default') return alHacerClic()
    // notify-send viejo (sin --action) termina con error: usamos la de Electron como respaldo
    if (codigo !== 0) notificarConElectron(titulo, cuerpo, alDecidir, alHacerClic)
  })

  // Si no existe notify-send en el sistema, también usamos la de Electron
  proceso.on('error', () => {
    if (!cerradaPorNosotros) notificarConElectron(titulo, cuerpo, alDecidir, alHacerClic)
  })

  return () => {
    cerradaPorNosotros = true
    proceso.kill()
  }
}

function notificarConElectron(titulo: string, cuerpo: string, alDecidir: AlDecidir, alHacerClic: () => void): () => void {
  const notificacion = new Notification({
    title: titulo,
    body: cuerpo,
    actions: [
      { type: 'button', text: 'Aceptar' },
      { type: 'button', text: 'Rechazar' }
    ]
  })

  notificacion.on('action', (_evento, indice) => alDecidir(indice === 0))
  notificacion.on('click', alHacerClic)
  notificacion.show()

  return () => notificacion.close()
}

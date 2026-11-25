import { Notification } from 'electron'
import type { OfertaLote } from '../compartido/tipos'
import { formatearBytes } from '../utils/formato'

// Notificación nativa con botones Aceptar/Rechazar.
// Los botones (actions) funcionan en Windows y macOS; en Linux depende del escritorio,
// por eso hacer clic en la notificación abre la ventana para decidir ahí.
export function notificarArchivoEntrante(
  oferta: OfertaLote,
  alDecidir: (aceptado: boolean) => void,
  alHacerClic: () => void
): void {
  const cantidad = oferta.archivos.length
  const total = oferta.archivos.reduce((suma, a) => suma + a.tamano, 0)
  const notificacion = new Notification({
    title: `${oferta.remitente.alias} quiere enviarte ${cantidad === 1 ? 'un archivo' : `${cantidad} archivos`}`,
    body: `${cantidad === 1 ? oferta.archivos[0].nombre : 'Varios archivos'} (${formatearBytes(total)})`,
    actions: [
      { type: 'button', text: 'Aceptar' },
      { type: 'button', text: 'Rechazar' }
    ]
  })

  notificacion.on('action', (_evento, indice) => alDecidir(indice === 0))
  notificacion.on('click', alHacerClic)
  notificacion.show()
}

import TcpSocket from 'react-native-tcp-socket'
import { PUERTO_TCP } from '../config/constantes'
import { atenderConexion, type OpcionesRecepcion } from '../transferencia/recibirArchivo'

// El celular también es servidor (P2P): así una PC u otro celular le pueden mandar archivos.
//
// OJO en desarrollo: al hacer "Reload" se reinicia el JS pero el servidor nativo anterior
// puede seguir ocupando el puerto. Si aparece "puerto ocupado", cerrá la app del todo
// (desde recientes) y abrila de nuevo. En el APK final esto no pasa.
export function iniciarServidorTcp(
  opciones: OpcionesRecepcion,
  alCambiarEstado: (activo: boolean) => void = () => {}
): () => void {
  const servidor = TcpSocket.createServer((socket) => atenderConexion(socket, opciones))

  servidor.on('listening', () => {
    console.log(`[TCP] escuchando en el puerto ${PUERTO_TCP}`)
    alCambiarEstado(true)
  })
  servidor.on('close', () => alCambiarEstado(false))
  servidor.on('error', (error: any) => {
    alCambiarEstado(false)
    const detalle = error?.message ?? JSON.stringify(error)
    const puertoOcupado = String(detalle).includes('EADDRINUSE')
    console.warn(
      puertoOcupado
        ? `[TCP] el puerto ${PUERTO_TCP} está ocupado. Cerrá la app del todo y volvé a abrirla.`
        : `[TCP] error: ${detalle}`
    )
  })

  servidor.listen({ port: PUERTO_TCP, host: '0.0.0.0', reuseAddress: true })

  return () => servidor.close()
}

import net from 'node:net'
import { PUERTO_TCP } from '../config/constantes'
import { atenderConexion, type OpcionesRecepcion } from '../transferencia/recibirArchivo'

// Cada dispositivo es también servidor (P2P): escucha conexiones entrantes
// y cada una se atiende por separado.
export function iniciarServidorTcp(
  opciones: OpcionesRecepcion,
  alCambiarEstado: (activo: boolean) => void
): net.Server {
  const servidor = net.createServer((socket) => atenderConexion(socket, opciones))

  servidor.on('listening', () => alCambiarEstado(true))
  servidor.on('close', () => alCambiarEstado(false))
  servidor.on('error', (error) => {
    console.error('[TCP] error:', error.message)
    alCambiarEstado(false)
  })

  servidor.listen(PUERTO_TCP, '0.0.0.0')
  return servidor
}

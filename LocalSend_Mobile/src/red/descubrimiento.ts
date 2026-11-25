import dgram from 'react-native-udp'
import { Buffer } from 'buffer'
import type { Beacon, Dispositivo } from '../compartido/tipos'
import {
  IP_BROADCAST,
  INTERVALO_BEACON_MS,
  INTERVALO_LIMPIEZA_MS,
  PUERTO_UDP,
  TTL_DISPOSITIVO_MS
} from '../config/constantes'

type AlCambiarLista = (dispositivos: Dispositivo[]) => void

// Misma lógica que en el escritorio:
// beacon por broadcast cada 2s + borrar a quien no se reporta en 6s (TTL).
export class Descubrimiento {
  private socket: ReturnType<typeof dgram.createSocket> | null = null
  private dispositivos = new Map<string, Dispositivo>()
  private temporizadores: ReturnType<typeof setInterval>[] = []

  constructor(
    private miBeacon: Beacon,
    private alCambiarLista: AlCambiarLista
  ) {}

  iniciar(): void {
    if (this.socket) return
    const socket = dgram.createSocket({ type: 'udp4', reusePort: true })
    this.socket = socket

    socket.on('message', (mensaje: Buffer, info: { address: string }) => this.procesarBeacon(mensaje, info.address))
    socket.on('error', (error: Error) => console.warn('[UDP] error:', error.message))

    socket.bind(PUERTO_UDP)
    socket.once('listening', () => {
      socket.setBroadcast(true)
      this.enviarBeacon()
      this.temporizadores.push(
        setInterval(() => this.enviarBeacon(), INTERVALO_BEACON_MS),
        setInterval(() => this.borrarVencidos(), INTERVALO_LIMPIEZA_MS)
      )
    })
  }

  detener(): void {
    this.temporizadores.forEach(clearInterval)
    this.temporizadores = []
    this.socket?.close()
    this.socket = null
    this.dispositivos.clear()
    this.avisarCambio()
  }

  actualizarBeacon(beacon: Beacon): void {
    this.miBeacon = beacon
  }

  private enviarBeacon(): void {
    const mensaje = Buffer.from(JSON.stringify(this.miBeacon))
    this.socket?.send(mensaje, 0, mensaje.length, PUERTO_UDP, IP_BROADCAST, () => {})
  }

  private procesarBeacon(mensaje: Buffer, ip: string): void {
    const beacon = leerBeacon(mensaje)
    if (!beacon || beacon.id === this.miBeacon.id) return

    const anterior = this.dispositivos.get(beacon.id)
    this.dispositivos.set(beacon.id, { ...beacon, ip, ultimaVez: Date.now() })

    // Avisamos a la pantalla si es nuevo O si cambió algo visible (ej: le cambiaron el nombre).
    // Si solo se renovó el TTL, no hace falta volver a dibujar la lista.
    const cambioAlgo = !anterior || anterior.alias !== beacon.alias || anterior.tipo !== beacon.tipo || anterior.ip !== ip
    if (cambioAlgo) this.avisarCambio()
  }

  private borrarVencidos(): void {
    const ahora = Date.now()
    let huboCambios = false
    for (const [id, dispositivo] of this.dispositivos) {
      if (ahora - dispositivo.ultimaVez > TTL_DISPOSITIVO_MS) {
        this.dispositivos.delete(id)
        huboCambios = true
      }
    }
    if (huboCambios) this.avisarCambio()
  }

  private avisarCambio(): void {
    this.alCambiarLista([...this.dispositivos.values()])
  }
}

function leerBeacon(mensaje: Buffer): Beacon | null {
  try {
    const datos = JSON.parse(Buffer.from(mensaje).toString())
    return datos.id && datos.alias && datos.puertoTcp ? datos : null
  } catch {
    return null
  }
}

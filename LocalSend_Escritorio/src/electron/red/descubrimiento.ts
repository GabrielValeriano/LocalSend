import dgram from 'node:dgram'
import os from 'node:os'
import type { Beacon, Dispositivo } from '../../compartido/tipos'
import {
  IP_BROADCAST,
  INTERVALO_BEACON_MS,
  INTERVALO_LIMPIEZA_MS,
  PUERTO_UDP,
  TTL_DISPOSITIVO_MS
} from '../config/constantes'

type AlCambiarLista = (dispositivos: Dispositivo[]) => void

// Descubrimiento por UDP:
// 1. Cada 2s mandamos un beacon por broadcast ("soy X y escucho en el puerto Y").
// 2. Escuchamos los beacons de los demás y los guardamos con la hora de llegada.
// 3. Cada 1s borramos los que no mandaron nada en 6s (TTL).
//    Así, si alguien apaga el Wi-Fi, desaparece solo de la lista.
export class Descubrimiento {
  private socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
  private dispositivos = new Map<string, Dispositivo>()
  private temporizadores: NodeJS.Timeout[] = []

  constructor(
    private obtenerMiBeacon: () => Beacon,
    private alCambiarLista: AlCambiarLista
  ) {}

  iniciar(): void {
    this.socket.on('message', (mensaje, info) => this.procesarBeacon(mensaje, info.address))
    this.socket.on('error', (error) => console.error('[UDP] error:', error.message))

    this.socket.bind(PUERTO_UDP, () => {
      this.socket.setBroadcast(true)
      this.enviarBeacon()
      this.temporizadores.push(
        setInterval(() => this.enviarBeacon(), INTERVALO_BEACON_MS),
        setInterval(() => this.borrarVencidos(), INTERVALO_LIMPIEZA_MS)
      )
    })
  }

  detener(): void {
    this.temporizadores.forEach(clearInterval)
    this.socket.close()
  }

  obtenerLista(): Dispositivo[] {
    return [...this.dispositivos.values()]
  }

  private enviarBeacon(): void {
    const mensaje = Buffer.from(JSON.stringify(this.obtenerMiBeacon()))
    this.socket.send(mensaje, PUERTO_UDP, IP_BROADCAST)
  }

  private procesarBeacon(mensaje: Buffer, ip: string): void {
    const beacon = leerBeacon(mensaje)
    if (!beacon) return
    if (beacon.id === this.obtenerMiBeacon().id) return // es nuestro propio beacon

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
    this.alCambiarLista(this.obtenerLista())
  }
}

function leerBeacon(mensaje: Buffer): Beacon | null {
  try {
    const datos = JSON.parse(mensaje.toString())
    const esValido = datos.id && datos.alias && datos.puertoTcp
    return esValido ? datos : null
  } catch {
    return null // llegó algo que no es nuestro, lo ignoramos
  }
}

export function obtenerIpLocal(): string {
  for (const interfaces of Object.values(os.networkInterfaces())) {
    const ipv4 = interfaces?.find((i) => i.family === 'IPv4' && !i.internal)
    if (ipv4) return ipv4.address
  }
  return '127.0.0.1'
}

// Protocolo de mensajes sobre TCP. Debe ser IDÉNTICO en escritorio y móvil.
//
// Cada mensaje viaja dentro de un "sobre":
//   [ 1 byte: tipo ][ 4 bytes: largo del contenido ][ contenido ]
//
// Tipo 1 = JSON de control (oferta, respuesta, fin...)
// Tipo 2 = chunk binario del archivo
//
// Así el receptor sabe, leyendo SOLO el primer byte, si lo que llega
// son metadatos o datos del archivo.

import { Buffer } from 'buffer'
import type { OfertaLote, RespuestaLote } from './tipos'

export const TIPO_JSON = 1
export const TIPO_CHUNK = 2
const TAMANO_CABECERA = 5 // 1 byte de tipo + 4 de largo

// Orden de los mensajes en un envío:
//   oferta (lista de archivos) -> respuesta (cuáles se aceptan)
//   por cada archivo aceptado: inicio-archivo -> chunks -> fin-archivo
//   fin-lote
export type MensajeControl =
  | { tipo: 'oferta'; datos: OfertaLote }
  | { tipo: 'respuesta'; datos: RespuestaLote }
  | { tipo: 'inicio-archivo'; datos: { id: string } }
  | { tipo: 'fin-archivo'; datos: { id: string } }
  | { tipo: 'fin-lote'; datos: { idLote: string } }
  | { tipo: 'cancelar'; datos: { motivo: string } }

export function armarMensajeJson(mensaje: MensajeControl): Buffer {
  const contenido = Buffer.from(JSON.stringify(mensaje), 'utf-8')
  return armarSobre(TIPO_JSON, contenido)
}

export function armarMensajeChunk(chunk: Buffer): Buffer {
  return armarSobre(TIPO_CHUNK, chunk)
}

function armarSobre(tipo: number, contenido: Buffer): Buffer {
  const cabecera = Buffer.alloc(TAMANO_CABECERA)
  cabecera.writeUInt8(tipo, 0)
  cabecera.writeUInt32BE(contenido.length, 1)
  return Buffer.concat([cabecera, contenido])
}

interface Eventos {
  alRecibirJson: (mensaje: MensajeControl) => void
  alRecibirChunk: (chunk: Buffer) => void
}

// TCP es un flujo continuo: un "data" puede traer medio sobre o tres juntos.
// Este lector va juntando bytes y solo avisa cuando tiene sobres completos.
export class LectorDeSobres {
  private pendiente: Buffer = Buffer.alloc(0)

  constructor(private eventos: Eventos) {}

  agregar(datos: Buffer): void {
    this.pendiente = Buffer.concat([this.pendiente, datos])

    while (this.hayUnSobreCompleto()) {
      const tipo = this.pendiente.readUInt8(0)
      const largo = this.pendiente.readUInt32BE(1)
      const contenido = recortar(this.pendiente, TAMANO_CABECERA, TAMANO_CABECERA + largo)
      this.pendiente = recortar(this.pendiente, TAMANO_CABECERA + largo, this.pendiente.length)

      this.procesarSobre(tipo, contenido)
    }
  }

  private hayUnSobreCompleto(): boolean {
    if (this.pendiente.length < TAMANO_CABECERA) return false
    const largo = this.pendiente.readUInt32BE(1)
    return this.pendiente.length >= TAMANO_CABECERA + largo
  }

  private procesarSobre(tipo: number, contenido: Buffer): void {
    if (tipo === TIPO_JSON) {
      this.eventos.alRecibirJson(JSON.parse(contenido.toString('utf-8')))
      return
    }
    if (tipo === TIPO_CHUNK) {
      this.eventos.alRecibirChunk(contenido)
    }
  }
}

// En React Native (polyfill "buffer"), subarray() devuelve un Uint8Array común,
// no un Buffer: pierde toString('utf-8') y readUInt32BE().
// Por eso siempre lo volvemos a envolver como Buffer (sin copiar los datos).
function recortar(datos: Buffer, desde: number, hasta: number): Buffer {
  const parte = datos.subarray(desde, hasta)
  return Buffer.from(parte.buffer, parte.byteOffset, parte.length)
}

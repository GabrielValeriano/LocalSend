import TcpSocket from 'react-native-tcp-socket'
import { File } from 'expo-file-system'
import { Buffer } from 'buffer'
import type { Dispositivo, OfertaLote, ProgresoTransferencia, Remitente, RespuestaLote } from '../compartido/tipos'
import { LectorDeSobres, armarMensajeChunk, armarMensajeJson } from '../compartido/protocolo'
import { generarId } from '../compartido/alias'
import { TAMANO_CHUNK, TIEMPO_ESPERA_RESPUESTA_MS, TIEMPO_INACTIVIDAD_MS } from '../config/constantes'
import { MedidorProgreso } from './progreso'

type Socket = ReturnType<typeof TcpSocket.createConnection>

export interface ArchivoElegido {
  uri: string
  nombre: string
  tamano: number
  tipoMime: string
}

interface DatosEnvio {
  archivos: ArchivoElegido[]
  destino: Dispositivo
  remitente: Remitente
  // Avisa el progreso de cada archivo, identificado por su uri
  alProgreso: (uri: string, progreso: ProgresoTransferencia) => void
}

// Envía VARIOS archivos por UNA sola conexión, con UNA sola oferta.
// Devuelve las uris que llegaron completas (para no reenviarlas si se reintenta).
export async function enviarLote({ archivos, destino, remitente, alProgreso }: DatosEnvio): Promise<Set<string>> {
  const idLote = generarId()
  const completados = new Set<string>()
  // El peso se mide de nuevo justo antes de enviar, leyendo el archivo real.
  // Así un archivo que quedó seleccionado de antes nunca viaja anunciado como "0 B".
  const preparados = archivos.map((archivo) => {
    const id = generarId()
    const tamano = pesoActual(archivo.uri)
    const medidor = new MedidorProgreso(
      { idTransferencia: id, idLote, nombre: archivo.nombre, direccion: 'envio', tamanoTotal: tamano ?? 0 },
      (progreso) => alProgreso(archivo.uri, progreso)
    )
    return { ...archivo, tamano: tamano ?? 0, id, medidor, disponible: tamano !== null }
  })

  // Si un archivo ya no existe (por ejemplo, se borró de la caché), avisamos y no lo ofrecemos
  preparados
    .filter((a) => !a.disponible)
    .forEach((a) => a.medidor.terminar('error', 'El archivo ya no está disponible. Volvé a elegirlo.'))
  const conId = preparados.filter((a) => a.disponible)
  if (conId.length === 0) return completados

  const oferta: OfertaLote = {
    idLote,
    remitente,
    archivos: conId.map(({ id, nombre, tamano, tipoMime }) => ({ id, nombre, tamano, tipoMime }))
  }

  let socket: Socket | null = null
  try {
    conId.forEach((a) => a.medidor.terminar('esperando'))
    socket = await conectar(destino)
    socket.write(armarMensajeJson({ tipo: 'oferta', datos: oferta }))

    // HANDSHAKE: no mandamos ni un byte hasta que el otro acepte.
    const respuesta = await esperarRespuesta(socket)
    const aceptados = new Set(respuesta.idsAceptados)

    // Desde acá los datos tienen que fluir: si pasan 10 s sin actividad, la conexión se cortó
    const conexion = socket
    conexion.setTimeout(TIEMPO_INACTIVIDAD_MS)
    conexion.once('timeout', () => conexion.destroy())

    for (const archivo of conId) {
      if (!aceptados.has(archivo.id)) {
        archivo.medidor.terminar('rechazado', respuesta.motivo ?? 'No aceptado')
        completados.add(archivo.uri) // no aceptado = no hay que reintentarlo
        continue
      }
      socket.write(armarMensajeJson({ tipo: 'inicio-archivo', datos: { id: archivo.id } }))
      await enviarPorChunks(socket, archivo.uri, archivo.medidor)
      socket.write(armarMensajeJson({ tipo: 'fin-archivo', datos: { id: archivo.id } }))
      archivo.medidor.terminar('completado')
      completados.add(archivo.uri)
    }

    socket.write(armarMensajeJson({ tipo: 'fin-lote', datos: { idLote } }))
    socket.end()
  } catch (error) {
    conId.forEach((a) => a.medidor.terminarSiSigueAbierto('error', (error as Error).message))
    socket?.destroy()
  }
  return completados
}

function conectar(destino: Dispositivo): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = TcpSocket.createConnection({ host: destino.ip, port: destino.puertoTcp }, () => resolve(socket))
    socket.once('error', () => reject(new Error(`No se pudo conectar con ${destino.alias}`)))
  })
}

function esperarRespuesta(socket: Socket): Promise<RespuestaLote> {
  return new Promise((resolve, reject) => {
    const limite = setTimeout(() => reject(new Error('El otro dispositivo no respondió')), TIEMPO_ESPERA_RESPUESTA_MS)

    const lector = new LectorDeSobres({
      alRecibirJson: (mensaje) => {
        if (mensaje.tipo !== 'respuesta') return
        clearTimeout(limite)
        socket.off('data', alRecibir)
        resolve(mensaje.datos)
      },
      alRecibirChunk: () => {}
    })
    const alRecibir = (datos: Buffer | string) => lector.agregar(Buffer.from(datos))

    socket.on('data', alRecibir)
    socket.once('close', () => {
      clearTimeout(limite)
      reject(new Error('Se cerró la conexión antes de responder'))
    })
  })
}

// CHUNKING: abrimos el archivo y leemos de a 64KB con readBytes().
// Nunca cargamos el archivo entero en memoria, pese lo que pese.
async function enviarPorChunks(socket: Socket, uri: string, medidor: MedidorProgreso): Promise<void> {
  const lectura = new File(uri).open()
  let seCorto = false
  const alCerrar = () => { seCorto = true }
  socket.once('close', alCerrar)

  try {
    while (true) {
      if (seCorto) throw new Error('Se perdió la conexión. Podés reintentar.')

      const bytes = lectura.readBytes(TAMANO_CHUNK)
      if (bytes.length === 0) break

      const hayLugar = socket.write(armarMensajeChunk(Buffer.from(bytes)))
      medidor.sumar(bytes.length)

      // Backpressure: si el buffer del socket está lleno, esperamos 'drain'.
      // Si no, cedemos un instante al hilo de JS para que la UI no se trabe.
      if (!hayLugar) await esperarDrain(socket)
      else await new Promise((r) => setTimeout(r, 0))
    }
  } finally {
    socket.off('close', alCerrar)
    lectura.close()
  }
}

function esperarDrain(socket: Socket): Promise<void> {
  return new Promise((resolve, reject) => {
    const alCerrar = () => reject(new Error('Se perdió la conexión. Podés reintentar.'))
    socket.once('close', alCerrar)
    socket.once('drain', () => {
      socket.off('close', alCerrar)
      resolve()
    })
  })
}

// Peso real del archivo en bytes, o null si ya no existe
function pesoActual(uri: string): number | null {
  try {
    const archivo = new File(uri)
    return archivo.exists ? archivo.size ?? 0 : null
  } catch {
    return null
  }
}

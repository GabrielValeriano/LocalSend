import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import type { ArchivoDeLote, Dispositivo, OfertaLote, ProgresoTransferencia, Remitente, RespuestaLote } from '../../compartido/tipos'
import { LectorDeSobres, armarMensajeChunk, armarMensajeJson } from '../../compartido/protocolo'
import { generarId } from '../../compartido/alias'
import { tipoMimePorNombre } from '../../compartido/tiposMime'
import { TAMANO_CHUNK, TIEMPO_ESPERA_RESPUESTA_MS, TIEMPO_INACTIVIDAD_MS } from '../config/constantes'
import { MedidorProgreso } from './progreso'

interface DatosEnvio {
  rutas: string[]
  destino: Dispositivo
  remitente: Remitente
  alProgreso: (progreso: ProgresoTransferencia) => void
}

interface ArchivoAEnviar extends ArchivoDeLote {
  ruta: string
  medidor: MedidorProgreso
}

// Envía VARIOS archivos por UNA sola conexión, con UNA sola oferta.
// El receptor ve un único diálogo y elige cuáles acepta.
export async function enviarLote({ rutas, destino, remitente, alProgreso }: DatosEnvio): Promise<void> {
  const idLote = generarId()
  const archivos = await prepararArchivos(rutas, idLote, alProgreso)
  const oferta: OfertaLote = {
    idLote,
    remitente,
    archivos: archivos.map(({ id, nombre, tamano, tipoMime }) => ({ id, nombre, tamano, tipoMime }))
  }

  archivos.forEach((a) => a.medidor.terminar('esperando'))

  let socket: net.Socket | null = null
  try {
    socket = await conectar(destino)
    socket.write(armarMensajeJson({ tipo: 'oferta', datos: oferta }))

    // HANDSHAKE: el envío se detiene acá hasta que el receptor acepte o rechace.
    const respuesta = await esperarRespuesta(socket)
    const aceptados = new Set(respuesta.idsAceptados)

    // Desde acá los datos tienen que fluir: si pasan 10 s sin actividad, la conexión se cortó
    vigilarInactividad(socket)

    for (const archivo of archivos) {
      if (!aceptados.has(archivo.id)) {
        archivo.medidor.terminar('rechazado', respuesta.motivo ?? 'No aceptado')
        continue
      }
      socket.write(armarMensajeJson({ tipo: 'inicio-archivo', datos: { id: archivo.id } }))
      await enviarPorChunks(socket, archivo.ruta, archivo.medidor)
      socket.write(armarMensajeJson({ tipo: 'fin-archivo', datos: { id: archivo.id } }))
      archivo.medidor.terminar('completado')
    }

    socket.write(armarMensajeJson({ tipo: 'fin-lote', datos: { idLote } }))
    socket.end()
  } catch (error) {
    // Los que no llegaron a completarse quedan en error
    archivos.forEach((a) => a.medidor.terminarSiSigueAbierto('error', (error as Error).message))
    socket?.destroy()
  }
}

async function prepararArchivos(
  rutas: string[],
  idLote: string,
  alProgreso: DatosEnvio['alProgreso']
): Promise<ArchivoAEnviar[]> {
  return Promise.all(
    rutas.map(async (ruta) => {
      const { size } = await fs.promises.stat(ruta)
      const id = generarId()
      const nombre = path.basename(ruta)
      return {
        id,
        ruta,
        nombre,
        tamano: size,
        tipoMime: tipoMimePorNombre(nombre),
        medidor: new MedidorProgreso({ idTransferencia: id, idLote, nombre, direccion: 'envio', tamanoTotal: size }, alProgreso)
      }
    })
  )
}

function conectar(destino: Dispositivo): Promise<net.Socket> {
  return new Promise((resolve, reject) => {
    const socket = net.connect(destino.puertoTcp, destino.ip, () => resolve(socket))
    socket.once('error', () => reject(new Error(`No se pudo conectar con ${destino.alias}`)))
  })
}

function esperarRespuesta(socket: net.Socket): Promise<RespuestaLote> {
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
    const alRecibir = (datos: Buffer): void => lector.agregar(datos)

    socket.on('data', alRecibir)
    socket.once('close', () => {
      clearTimeout(limite)
      reject(new Error('Se cerró la conexión antes de responder'))
    })
  })
}

// STREAMS: createReadStream lee el archivo de a 256KB.
// Aunque el archivo pese 10GB, en memoria solo hay un chunk por vez.
async function enviarPorChunks(socket: net.Socket, ruta: string, medidor: MedidorProgreso): Promise<void> {
  const lectura = fs.createReadStream(ruta, { highWaterMark: TAMANO_CHUNK })

  // Si el socket se cierra A MITAD del envío, cortamos con error.
  let avisarCorte: (error: Error) => void = () => {}
  const alCortarse = new Promise<never>((_, reject) => { avisarCorte = reject })
  alCortarse.catch(() => {}) // evita el "UnhandledPromiseRejection" si nadie la estaba esperando
  const alCerrar = () => avisarCorte(new Error('Se perdió la conexión. Volvé a enviar el archivo.'))
  socket.once('close', alCerrar)

  try {
    for await (const chunk of lectura) {
      if (socket.destroyed) throw new Error('Se perdió la conexión. Volvé a enviar el archivo.')
      const hayLugar = socket.write(armarMensajeChunk(chunk as Buffer))
      medidor.sumar((chunk as Buffer).length)

      // Backpressure: si la red va más lenta que el disco, esperamos a que se vacíe.
      if (!hayLugar) {
        await Promise.race([new Promise((r) => socket.once('drain', r)), alCortarse])
      }
    }
  } finally {
    // Terminado el envío, el cierre normal del socket ya NO es un error
    socket.off('close', alCerrar)
    lectura.destroy()
  }
}

// Si el socket pasa TIEMPO_INACTIVIDAD_MS sin enviar ni recibir nada, lo cerramos.
// Eso dispara 'close' y la transferencia termina en error (en vez de quedar congelada).
function vigilarInactividad(socket: net.Socket): void {
  socket.setTimeout(TIEMPO_INACTIVIDAD_MS)
  socket.on('error', () => {}) // el error ya se maneja por 'close'; esto evita que Node lo tome como error sin atender
  socket.once('timeout', () => socket.destroy(new Error('Se perdió la conexión con el otro dispositivo')))
}

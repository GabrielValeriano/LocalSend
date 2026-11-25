import type { Directory, File } from 'expo-file-system'
import { Buffer } from 'buffer'
import type TcpSocket from 'react-native-tcp-socket'
import type { ArchivoDeLote, OfertaLote, ProgresoTransferencia } from '../compartido/tipos'
import { LectorDeSobres, armarMensajeJson, type MensajeControl } from '../compartido/protocolo'
import { tipoMimeFinal } from '../compartido/tiposMime'
import { crearArchivoEnCarpeta } from '../services/carpetaRecibidos'
import { MedidorProgreso } from './progreso'
import { EscritorPorPartes } from './escritorPorPartes'

type Socket = ReturnType<typeof TcpSocket.createConnection>

export interface DecisionRecepcion {
  carpeta: Directory
  idsAceptados: string[]
}

export interface OpcionesRecepcion {
  // Devuelve carpeta + archivos aceptados, o null si el usuario rechaza todo
  preguntarAlUsuario: (oferta: OfertaLote) => Promise<DecisionRecepcion | null>
  alProgreso: (progreso: ProgresoTransferencia) => void
}

interface ArchivoEnCurso {
  datos: ArchivoDeLote
  archivo: File
  escritura: EscritorPorPartes
  medidor: MedidorProgreso
  bytesRecibidos: number
}

// Maneja UNA conexión entrante = UN lote de archivos.
export function atenderConexion(socket: Socket, opciones: OpcionesRecepcion): void {
  let oferta: OfertaLote | null = null
  let carpeta: Directory | null = null
  let actual: ArchivoEnCurso | null = null
  let loteTerminado = false

  const lector = new LectorDeSobres({
    alRecibirJson: (mensaje) => procesarControl(mensaje),
    alRecibirChunk: (chunk) => escribirChunk(chunk)
  })

  socket.on('data', (datos) => lector.agregar(Buffer.from(datos)))
  socket.on('close', () => alCortarse())
  socket.on('error', () => alCortarse())

  function procesarControl(mensaje: MensajeControl): void {
    if (mensaje.tipo === 'oferta') recibirOferta(mensaje.datos)
    if (mensaje.tipo === 'inicio-archivo') empezarArchivo(mensaje.datos.id)
    if (mensaje.tipo === 'fin-archivo') terminarArchivo()
    if (mensaje.tipo === 'fin-lote') terminarLote()
    if (mensaje.tipo === 'cancelar') fallarActual(mensaje.datos.motivo)
  }

  async function recibirOferta(datos: OfertaLote): Promise<void> {
    oferta = datos
    socket.pause()
    const decision = await opciones.preguntarAlUsuario(datos)
    socket.resume()

    carpeta = decision?.carpeta ?? null
    responder(decision?.idsAceptados ?? [])
  }

  function empezarArchivo(id: string): void {
    const datos = oferta?.archivos.find((a) => a.id === id)
    if (!oferta || !datos || !carpeta) return

    const medidor = new MedidorProgreso(
      { idTransferencia: id, idLote: oferta.idLote, nombre: datos.nombre, direccion: 'recepcion', tamanoTotal: datos.tamano },
      opciones.alProgreso
    )

    try {
      const nombre = limpiarNombre(datos.nombre)
      const archivo = crearArchivoEnCarpeta(carpeta, nombre, tipoMimeFinal(datos.tipoMime, nombre))
      actual = { datos, archivo, escritura: new EscritorPorPartes(archivo), medidor, bytesRecibidos: 0 }
    } catch (error) {
      medidor.terminar('error', `No se pudo crear el archivo: ${(error as Error).message}`)
      cortarLote('El receptor no pudo crear el archivo en su carpeta')
    }
  }

  // Los chunks se escriben en bloques de 1MB: en memoria nunca hay más que eso.
  function escribirChunk(chunk: Buffer): void {
    if (!actual) return
    try {
      actual.escritura.agregar(chunk)
    } catch (error) {
      fallarActual(`No se pudo escribir el archivo: ${(error as Error).message}`)
      return cortarLote('Error de escritura en el receptor')
    }
    actual.bytesRecibidos += chunk.length
    actual.medidor.sumar(chunk.length)
  }

  function terminarArchivo(): void {
    if (!actual) return
    const terminado = actual
    actual = null

    try {
      terminado.escritura.terminar() // escribe el último bloque que quedó en memoria
    } catch (error) {
      borrar(terminado.archivo)
      terminado.medidor.terminar('error', `No se pudo escribir el archivo: ${(error as Error).message}`)
      return
    }

    // Integridad: el tamaño recibido debe ser exactamente el anunciado.
    if (terminado.bytesRecibidos !== terminado.datos.tamano) {
      borrar(terminado.archivo)
      terminado.medidor.terminar('error', 'El archivo llegó incompleto')
      return
    }
    terminado.medidor.terminar('completado')
  }

  function terminarLote(): void {
    loteTerminado = true
    socket.end()
  }

  function responder(idsAceptados: string[]): void {
    if (!oferta) return
    const motivo = idsAceptados.length === 0 ? 'Rechazado por el usuario' : undefined
    socket.write(armarMensajeJson({ tipo: 'respuesta', datos: { idLote: oferta.idLote, idsAceptados, motivo } }))
    if (idsAceptados.length === 0) terminarLote()
  }

  function cortarLote(motivo: string): void {
    loteTerminado = true
    socket.write(armarMensajeJson({ tipo: 'cancelar', datos: { motivo } }))
    socket.destroy()
  }

  // Si se corta a mitad de un archivo, no dejamos ese archivo roto en la carpeta.
  function fallarActual(motivo: string): void {
    if (!actual) return
    const roto = actual
    actual = null
    borrar(roto.archivo)
    roto.medidor.terminar('error', motivo)
  }

  function alCortarse(): void {
    if (loteTerminado) return
    fallarActual('Se perdió la conexión. Pedí que te lo vuelvan a enviar.')
  }
}

function borrar(archivo: File): void {
  try {
    if (archivo.exists) archivo.delete()
  } catch {
    // si no se puede borrar, no rompemos la app por eso
  }
}

// Desde la PC (Windows) podría llegar "carpeta\\foto.jpg": nos quedamos solo con el nombre.
function limpiarNombre(nombre: string): string {
  return nombre.replace(/\\/g, '/').split('/').pop() || 'archivo'
}

import fs from 'node:fs'
import type net from 'node:net'
import type { AccionConflicto, ArchivoDeLote, OfertaLote, ProgresoTransferencia } from '../../compartido/tipos'
import { LectorDeSobres, armarMensajeJson, type MensajeControl } from '../../compartido/protocolo'
import { resolverConflicto, rutaDestinoSegura, yaExiste } from '../archivos/resolverConflicto'
import { MedidorProgreso } from './progreso'

export interface DecisionUsuario {
  idsAceptados: string[] // vacío = rechazar todo
  accionConflicto?: AccionConflicto // se aplica a todos los archivos que ya existan
}

export interface OpcionesRecepcion {
  carpetaDestino: () => string
  preguntarAlUsuario: (oferta: OfertaLote, idsExistentes: string[]) => Promise<DecisionUsuario>
  alProgreso: (progreso: ProgresoTransferencia) => void
}

interface ArchivoEnCurso {
  datos: ArchivoDeLote
  ruta: string
  escritura: fs.WriteStream
  medidor: MedidorProgreso
  bytesRecibidos: number
}

// Maneja UNA conexión entrante = UN lote de archivos.
export function atenderConexion(socket: net.Socket, opciones: OpcionesRecepcion): void {
  let oferta: OfertaLote | null = null
  let accionConflicto: AccionConflicto = 'renombrar'
  let actual: ArchivoEnCurso | null = null
  let loteTerminado = false

  const lector = new LectorDeSobres({
    alRecibirJson: (mensaje) => procesarControl(mensaje),
    alRecibirChunk: (chunk) => escribirChunk(chunk)
  })

  socket.on('data', (datos) => lector.agregar(datos))
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
    const carpeta = opciones.carpetaDestino()
    const idsExistentes = datos.archivos
      .filter((a) => yaExiste(rutaDestinoSegura(carpeta, a.nombre)))
      .map((a) => a.id)

    // Pausamos el socket mientras el usuario decide: no queremos datos todavía.
    socket.pause()
    const decision = await opciones.preguntarAlUsuario(datos, idsExistentes)
    socket.resume()

    accionConflicto = decision.accionConflicto ?? 'renombrar'
    // Si eligió "omitir", los que ya existen no se piden: el emisor ni los manda.
    const aceptados = decision.idsAceptados.filter(
      (id) => !(accionConflicto === 'omitir' && idsExistentes.includes(id))
    )
    responder(aceptados)
  }

  function empezarArchivo(id: string): void {
    const datos = oferta?.archivos.find((a) => a.id === id)
    if (!oferta || !datos) return

    // La ruta final se resuelve recién ahora, así dos archivos del mismo lote
    // con el mismo nombre no se pisan entre sí.
    const ruta = resolverConflicto(rutaDestinoSegura(opciones.carpetaDestino(), datos.nombre), accionConflicto)
      ?? rutaDestinoSegura(opciones.carpetaDestino(), datos.nombre)

    actual = {
      datos,
      ruta,
      // createWriteStream escribe por partes: nunca tenemos el archivo entero en RAM.
      escritura: fs.createWriteStream(ruta),
      medidor: new MedidorProgreso(
        { idTransferencia: id, idLote: oferta.idLote, nombre: datos.nombre, direccion: 'recepcion', tamanoTotal: datos.tamano },
        opciones.alProgreso
      ),
      bytesRecibidos: 0
    }
  }

  function escribirChunk(chunk: Buffer): void {
    if (!actual) return
    const enCurso = actual
    enCurso.bytesRecibidos += chunk.length
    enCurso.medidor.sumar(chunk.length)

    // Backpressure: si el disco va más lento que la red, write() devuelve false.
    // Pausamos el socket hasta que el disco se ponga al día ('drain').
    if (!enCurso.escritura.write(chunk)) {
      socket.pause()
      enCurso.escritura.once('drain', () => socket.resume())
    }
  }

  function terminarArchivo(): void {
    if (!actual) return
    const terminado = actual
    actual = null

    terminado.escritura.end(() => {
      // Prueba de integridad: el peso recibido tiene que ser exactamente el anunciado.
      if (terminado.bytesRecibidos !== terminado.datos.tamano) {
        fs.rm(terminado.ruta, { force: true }, () => {})
        terminado.medidor.terminar('error', 'El archivo llegó incompleto')
        return
      }
      terminado.medidor.terminar('completado')
    })
  }

  function terminarLote(): void {
    loteTerminado = true
    socket.end()
  }

  function responder(idsAceptados: string[]): void {
    if (!oferta) return
    const motivo = idsAceptados.length === 0 ? 'Rechazado por el usuario' : undefined
    socket.write(armarMensajeJson({ tipo: 'respuesta', datos: { idLote: oferta.idLote, idsAceptados, motivo } }))
    if (idsAceptados.length === 0) {
      loteTerminado = true
      socket.end()
    }
  }

  // Si se corta a mitad de un archivo, no dejamos ese archivo roto en la carpeta.
  function fallarActual(motivo: string): void {
    if (!actual) return
    const roto = actual
    actual = null
    roto.escritura.destroy()
    fs.rm(roto.ruta, { force: true }, () => {})
    roto.medidor.terminar('error', motivo)
  }

  function alCortarse(): void {
    if (loteTerminado) return
    fallarActual('Se perdió la conexión. Volvé a enviar el archivo.')
  }
}

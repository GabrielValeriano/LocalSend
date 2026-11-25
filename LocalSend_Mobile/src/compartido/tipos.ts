// Tipos compartidos entre la app de escritorio y la app móvil.
// Este archivo debe ser IDÉNTICO en ambos proyectos.

export type TipoDispositivo = 'pc' | 'laptop' | 'celular'

// Lo que cada dispositivo anuncia por UDP cada pocos segundos
export interface Beacon {
  id: string
  alias: string
  tipo: TipoDispositivo
  puertoTcp: number
}

// Un dispositivo encontrado en la red (beacon + datos que agregamos al recibirlo)
export interface Dispositivo extends Beacon {
  ip: string
  ultimaVez: number // timestamp del último beacon, para el TTL
}

export interface Remitente {
  id: string
  alias: string
}

// Datos de UN archivo dentro de un lote (se mandan ANTES de los chunks)
export interface ArchivoDeLote {
  id: string
  nombre: string
  tamano: number // en bytes
  tipoMime: string
}

// Un envío agrupa uno o más archivos y se acepta con UN SOLO diálogo
export interface OfertaLote {
  idLote: string
  remitente: Remitente
  archivos: ArchivoDeLote[]
}

export interface RespuestaLote {
  idLote: string
  idsAceptados: string[] // vacío = rechazado
  motivo?: string
}

export type AccionConflicto = 'reemplazar' | 'renombrar' | 'omitir'

export type EstadoTransferencia =
  | 'esperando'
  | 'enviando'
  | 'recibiendo'
  | 'completado'
  | 'rechazado'
  | 'error'

// Progreso de UN archivo (idTransferencia = id del archivo dentro del lote)
export interface ProgresoTransferencia {
  idTransferencia: string
  idLote: string
  nombre: string
  direccion: 'envio' | 'recepcion'
  bytesTransferidos: number
  tamanoTotal: number
  porcentaje: number
  velocidad: number // bytes por segundo
  segundosRestantes: number
  estado: EstadoTransferencia
  mensajeError?: string
}

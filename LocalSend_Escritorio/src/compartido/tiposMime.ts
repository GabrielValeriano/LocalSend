// Deduce el tipo de archivo (MIME) por la extensión.
// Sirve para que el otro dispositivo sepa si es una imagen, un PDF, etc.
// (por ejemplo, Android lo necesita para mostrar la foto en la Galería).
// Debe ser IDÉNTICO en escritorio y móvil.

const TIPOS: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', heic: 'image/heic', bmp: 'image/bmp', svg: 'image/svg+xml',
  mp4: 'video/mp4', mov: 'video/quicktime', mkv: 'video/x-matroska', avi: 'video/x-msvideo', webm: 'video/webm',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4',
  pdf: 'application/pdf', txt: 'text/plain', csv: 'text/csv', json: 'application/json',
  zip: 'application/zip', rar: 'application/vnd.rar', '7z': 'application/x-7z-compressed',
  apk: 'application/vnd.android.package-archive',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
}

export const TIPO_GENERICO = 'application/octet-stream'

export function tipoMimePorNombre(nombre: string): string {
  const extension = nombre.split('.').pop()?.toLowerCase() ?? ''
  return TIPOS[extension] ?? TIPO_GENERICO
}

// Si el que envía no supo el tipo, lo deducimos nosotros por el nombre.
export function tipoMimeFinal(tipoRecibido: string | undefined, nombre: string): string {
  if (tipoRecibido && tipoRecibido !== TIPO_GENERICO) return tipoRecibido
  return tipoMimePorNombre(nombre)
}

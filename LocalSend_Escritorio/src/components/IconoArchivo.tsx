import { File, FileArchive, FileAudio, FileImage, FileText, FileVideo, type LucideIcon } from 'lucide-react'
import { tipoMimePorNombre } from '../compartido/tiposMime'

// Elige el ícono según el tipo de archivo (mismos íconos que en el celular).
export function iconoPorTipo(tipoMime: string): LucideIcon {
  if (tipoMime.startsWith('image/')) return FileImage
  if (tipoMime.startsWith('video/')) return FileVideo
  if (tipoMime.startsWith('audio/')) return FileAudio
  if (tipoMime.startsWith('text/') || tipoMime === 'application/pdf') return FileText
  if (tipoMime.includes('zip') || tipoMime.includes('rar') || tipoMime.includes('7z')) return FileArchive
  return File
}

export function IconoArchivo({ tipoMime, nombre, tamano = 20 }: { tipoMime?: string; nombre?: string; tamano?: number }) {
  const Icono = iconoPorTipo(tipoMime ?? tipoMimePorNombre(nombre ?? ''))
  return <Icono size={tamano} />
}

import { File, FileArchive, FileAudio, FileImage, FileText, FileVideo, type LucideIcon } from 'lucide-react-native'
import { Icon } from '@/components/ui/icon'

// Elige el ícono según el tipo de archivo (mismos íconos que en el escritorio).
export function iconoPorTipo(tipoMime: string): LucideIcon {
  if (tipoMime.startsWith('image/')) return FileImage
  if (tipoMime.startsWith('video/')) return FileVideo
  if (tipoMime.startsWith('audio/')) return FileAudio
  if (tipoMime.startsWith('text/') || tipoMime === 'application/pdf') return FileText
  if (tipoMime.includes('zip') || tipoMime.includes('rar') || tipoMime.includes('7z')) return FileArchive
  return File
}

export function IconoArchivo({ tipoMime, tamano = 22, className = 'text-muted-foreground' }: {
  tipoMime: string
  tamano?: number
  className?: string
}) {
  return <Icon as={iconoPorTipo(tipoMime)} size={tamano} className={className} />
}

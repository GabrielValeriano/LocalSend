import { Image, Pressable, View } from 'react-native'
import { X } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import { Icon } from '@/components/ui/icon'
import type { ArchivoElegido } from '../transferencia/enviarArchivo'
import { formatearBytes } from '../utils/formato'
import { IconoArchivo } from './IconoArchivo'

export const esImagen = (archivo: Pick<ArchivoElegido, 'tipoMime'>) => archivo.tipoMime.startsWith('image/')

// Miniatura si es imagen; si no, ícono del tipo de archivo.
export function Miniatura({ archivo, tamano = 48 }: { archivo: ArchivoElegido; tamano?: number }) {
  if (esImagen(archivo)) {
    return <Image source={{ uri: archivo.uri }} style={{ width: tamano, height: tamano, borderRadius: 12 }} />
  }
  return (
    <View style={{ width: tamano, height: tamano }} className="items-center justify-center rounded-xl bg-secondary">
      <IconoArchivo tipoMime={archivo.tipoMime} tamano={tamano * 0.5} className="text-secondary-foreground" />
    </View>
  )
}

export function VistaArchivo({ archivo, alQuitar }: { archivo: ArchivoElegido; alQuitar?: (uri: string) => void }) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-card p-3">
      <Miniatura archivo={archivo} />
      <View className="flex-1">
        <Text numberOfLines={1} className="font-medium">{archivo.nombre}</Text>
        <Text className="text-xs text-muted-foreground">{formatearBytes(archivo.tamano)}</Text>
      </View>
      {alQuitar && (
        <Pressable onPress={() => alQuitar(archivo.uri)} hitSlop={10} className="p-1">
          <Icon as={X} size={20} className="text-muted-foreground" />
        </Pressable>
      )}
    </View>
  )
}

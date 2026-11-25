import { Pressable } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import { Icon } from '@/components/ui/icon'

interface Props {
  icono: LucideIcon
  texto: string
  alTocar: () => void
}

// Botón cuadrado de la sección "Selección" (Archivo, Multimedia...)
export function BotonOpcion({ icono, texto, alTocar }: Props) {
  return (
    <Pressable
      onPress={alTocar}
      className="h-24 flex-1 items-center justify-center gap-2 rounded-2xl bg-card active:bg-secondary"
    >
      <Icon as={icono} size={28} className="text-primary" />
      <Text className="text-sm font-medium">{texto}</Text>
    </Pressable>
  )
}

import { Pressable, View } from 'react-native'
import { Laptop, Monitor, Smartphone, type LucideIcon } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import { Icon } from '@/components/ui/icon'
import type { Dispositivo, TipoDispositivo } from '../compartido/tipos'

export const ICONO_DISPOSITIVO: Record<TipoDispositivo, LucideIcon> = {
  pc: Monitor,
  laptop: Laptop,
  celular: Smartphone
}

interface Props {
  dispositivo: Dispositivo
  habilitado: boolean
  alTocar: (dispositivo: Dispositivo) => void
}

export function TarjetaDispositivo({ dispositivo, habilitado, alTocar }: Props) {
  return (
    <Pressable
      disabled={!habilitado}
      onPress={() => alTocar(dispositivo)}
      className={`flex-row items-center gap-4 rounded-2xl bg-card p-4 active:opacity-70 ${habilitado ? '' : 'opacity-50'}`}
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <Icon as={ICONO_DISPOSITIVO[dispositivo.tipo] ?? Monitor} size={24} className="text-secondary-foreground" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold">{dispositivo.alias}</Text>
        <View className="mt-1 flex-row">
          <Text className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{dispositivo.ip}</Text>
        </View>
      </View>
    </Pressable>
  )
}

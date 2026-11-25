import { Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Send, Settings, Wifi, type LucideIcon } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import { Icon } from '@/components/ui/icon'

export type Seccion = 'recibir' | 'enviar' | 'ajustes'

// Las mismas 3 secciones (con los mismos íconos) que la barra lateral del escritorio
export const SECCIONES: { id: Seccion; texto: string; icono: LucideIcon }[] = [
  { id: 'recibir', texto: 'Recibir', icono: Wifi },
  { id: 'enviar', texto: 'Enviar', icono: Send },
  { id: 'ajustes', texto: 'Ajustes', icono: Settings }
]

interface Props {
  actual: Seccion
  alCambiar: (seccion: Seccion) => void
}

export function BarraPestanas({ actual, alCambiar }: Props) {
  const margenes = useSafeAreaInsets()

  return (
    <View style={{ paddingBottom: margenes.bottom + 8 }} className="flex-row gap-2 border-t border-border bg-card px-3 pt-2">
      {SECCIONES.map(({ id, texto, icono }) => {
        const activa = id === actual
        return (
          // Cada pestaña ocupa un tercio; la marcada se pinta entera (ícono + texto),
          // igual que el ítem activo de la barra lateral del escritorio.
          <Pressable
            key={id}
            onPress={() => alCambiar(id)}
            className={`flex-1 items-center gap-1 rounded-2xl py-2 ${activa ? 'bg-secondary' : 'active:bg-muted'}`}
          >
            <Icon as={icono} size={22} className={activa ? 'text-secondary-foreground' : 'text-muted-foreground'} />
            <Text className={`text-xs ${activa ? 'font-semibold text-secondary-foreground' : 'text-muted-foreground'}`}>
              {texto}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

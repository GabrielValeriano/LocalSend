import { useEffect, useState, type ReactNode } from 'react'
import { Pressable, ScrollView, TextInput, View } from 'react-native'
import { Check, FolderDown, Info, Monitor, Moon, Palette, Sun, User, type LucideIcon } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import type { ModoTema } from '../compartido/tema'
import { useServicios } from '../contexto/ServiciosProvider'
import { useTema } from '../hooks/useTema'
import { PUERTO_TCP, PUERTO_UDP } from '../config/constantes'

const OPCIONES_TEMA: { modo: ModoTema; texto: string; icono: LucideIcon }[] = [
  { modo: 'sistema', texto: 'Sistema', icono: Monitor },
  { modo: 'claro', texto: 'Claro', icono: Sun },
  { modo: 'oscuro', texto: 'Oscuro', icono: Moon }
]

export function Ajustes() {
  const { ajustes, cambiarAlias, carpetaRecibidos, cambiarCarpeta } = useServicios()
  const { modo, cambiarModo } = useTema()
  const [alias, setAlias] = useState('')
  const [guardado, setGuardado] = useState(false)

  useEffect(() => setAlias(ajustes?.alias ?? ''), [ajustes?.alias])

  // Guardamos y mostramos "Guardado" un par de segundos, así queda claro que funcionó
  async function guardarAlias(): Promise<void> {
    await cambiarAlias(alias)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2000)
  }

  return (
    <ScrollView contentContainerClassName="gap-4 p-5">
      <Seccion icono={User} titulo="Nombre del dispositivo">
        <View className="flex-row gap-2">
          <TextInput
            value={alias}
            onChangeText={setAlias}
            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-foreground"
          />
          <Button disabled={!alias.trim() || alias === ajustes?.alias} onPress={guardarAlias}>
            <Text>Guardar</Text>
          </Button>
        </View>
        {guardado && (
          <View className="flex-row items-center gap-1">
            <Icon as={Check} size={16} className="text-primary" />
            <Text className="text-sm text-primary">Guardado. Los demás dispositivos lo verán en unos segundos.</Text>
          </View>
        )}
      </Seccion>

      <Seccion icono={FolderDown} titulo="Carpeta de recibidos">
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 text-muted-foreground" numberOfLines={1}>{carpetaRecibidos}</Text>
          <Button variant="outline" onPress={cambiarCarpeta}>
            <Text>Cambiar</Text>
          </Button>
        </View>
      </Seccion>

      <Seccion icono={Palette} titulo="Tema">
        <View className="flex-row gap-2">
          {OPCIONES_TEMA.map((opcion) => {
            const elegida = opcion.modo === modo
            return (
              <Pressable
                key={opcion.modo}
                onPress={() => cambiarModo(opcion.modo)}
                className={`flex-1 items-center gap-1 rounded-xl py-3 ${elegida ? 'bg-secondary' : 'bg-background'}`}
              >
                <Icon as={opcion.icono} size={20} className={elegida ? 'text-secondary-foreground' : 'text-muted-foreground'} />
                <Text className={`text-sm ${elegida ? 'font-semibold' : 'text-muted-foreground'}`}>{opcion.texto}</Text>
              </Pressable>
            )
          })}
        </View>
      </Seccion>

      <Seccion icono={Info} titulo="Acerca de">
        <Text className="text-sm text-muted-foreground">LocalSend · versión 1.0.0</Text>
        <Text className="text-sm text-muted-foreground">Descubrimiento UDP {PUERTO_UDP} · Transferencia TCP {PUERTO_TCP}</Text>
      </Seccion>
    </ScrollView>
  )
}

function Seccion({ icono, titulo, children }: { icono: LucideIcon; titulo: string; children: ReactNode }) {
  return (
    <View className="gap-3 rounded-2xl bg-card p-4">
      <View className="flex-row items-center gap-2">
        <Icon as={icono} size={18} className="text-primary" />
        <Text className="font-semibold">{titulo}</Text>
      </View>
      {children}
    </View>
  )
}

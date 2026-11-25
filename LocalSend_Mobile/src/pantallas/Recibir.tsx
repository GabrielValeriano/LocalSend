import { Pressable, ScrollView, View } from 'react-native'
import { FolderDown } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import { Icon } from '@/components/ui/icon'
import { useServicios } from '../contexto/ServiciosProvider'
import { LogoAnimado } from '../components/LogoAnimado'
import { AvisoWifi } from '../components/AvisoWifi'
import { FilaProgreso } from '../components/FilaProgreso'

// Pantalla principal: quién sos en la red, si estás listo para recibir
// y el progreso de lo que te están mandando (lo que enviás se ve en la pantalla de envío).
export function Recibir() {
  const { ajustes, enWifi, servidorActivo, ip, carpetaRecibidos, recepciones, limpiarRecepciones } = useServicios()
  const listo = enWifi && servidorActivo

  return (
    <ScrollView contentContainerClassName="flex-grow items-center justify-center gap-2 p-6">
      <LogoAnimado activo={listo} />
      <Text className="text-3xl font-bold">{ajustes?.alias ?? '…'}</Text>

      <View className="mt-1 flex-row items-center gap-2">
        <View className={`h-2.5 w-2.5 rounded-full ${listo ? 'bg-primary' : 'bg-destructive'}`} />
        <Text className="text-muted-foreground">{listo ? 'Listo para recibir' : 'No disponible'}</Text>
        {/* Tu IP en la red, igual que en el escritorio: sirve para "Agregar por IP" desde el otro equipo */}
        {ip && (
          <Text className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{ip}</Text>
        )}
      </View>

      {!enWifi && <View className="mt-6 w-full"><AvisoWifi /></View>}

      <View className="mt-8 flex-row items-center gap-2 rounded-full bg-card px-4 py-2">
        <Icon as={FolderDown} size={16} className="text-muted-foreground" />
        <Text className="text-sm text-muted-foreground" numberOfLines={1}>{carpetaRecibidos}</Text>
      </View>

      {recepciones.length > 0 && (
        <View className="mt-6 w-full gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold">Recibiendo</Text>
            <Pressable onPress={limpiarRecepciones} hitSlop={8}>
              <Text className="text-sm font-medium text-primary">Limpiar terminadas</Text>
            </Pressable>
          </View>
          {recepciones.map((p) => <FilaProgreso key={p.idTransferencia} progreso={p} />)}
        </View>
      )}
    </ScrollView>
  )
}

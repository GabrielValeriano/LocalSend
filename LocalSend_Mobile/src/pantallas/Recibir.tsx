import { View } from 'react-native'
import { FolderDown } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import { Icon } from '@/components/ui/icon'
import { useServicios } from '../contexto/ServiciosProvider'
import { LogoAnimado } from '../components/LogoAnimado'
import { AvisoWifi } from '../components/AvisoWifi'

// Pantalla principal: muestra quién sos en la red y si estás listo para recibir.
export function Recibir() {
  const { ajustes, enWifi, servidorActivo, carpetaRecibidos } = useServicios()
  const listo = enWifi && servidorActivo

  return (
    <View className="flex-1 items-center justify-center gap-2 p-6">
      <LogoAnimado activo={listo} />
      <Text className="text-3xl font-bold">{ajustes?.alias ?? '…'}</Text>

      <View className="mt-1 flex-row items-center gap-2">
        <View className={`h-2.5 w-2.5 rounded-full ${listo ? 'bg-primary' : 'bg-destructive'}`} />
        <Text className="text-muted-foreground">{listo ? 'Listo para recibir' : 'No disponible'}</Text>
      </View>

      {!enWifi && <View className="mt-6 w-full"><AvisoWifi /></View>}

      <View className="mt-8 flex-row items-center gap-2 rounded-full bg-card px-4 py-2">
        <Icon as={FolderDown} size={16} className="text-muted-foreground" />
        <Text className="text-sm text-muted-foreground" numberOfLines={1}>{carpetaRecibidos}</Text>
      </View>
    </View>
  )
}

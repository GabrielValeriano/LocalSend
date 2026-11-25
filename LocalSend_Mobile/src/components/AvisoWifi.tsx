import { View } from 'react-native'
import { WifiOff } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import { Icon } from '@/components/ui/icon'

export function AvisoWifi() {
  return (
    <View className="items-center gap-2 rounded-2xl bg-card p-6">
      <Icon as={WifiOff} size={36} className="text-muted-foreground" />
      <Text className="text-center font-semibold">No estás conectado a una red Wi-Fi</Text>
      <Text className="text-center text-sm text-muted-foreground">
        Conectate a la misma red que el otro dispositivo. No buscamos por datos móviles.
      </Text>
    </View>
  )
}

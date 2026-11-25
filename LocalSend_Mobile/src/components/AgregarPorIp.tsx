import { useState } from 'react'
import { TextInput, View } from 'react-native'
import { Plus } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { esIpValida } from '../compartido/alias'
import { useServicios } from '../contexto/ServiciosProvider'

// Plan B del descubrimiento: si el otro equipo está en otra subred, el broadcast no le llega.
// Escribiendo su IP le mandamos el beacon directo y los dos se encuentran.
export function AgregarPorIp() {
  const { agregarIp } = useServicios()
  const [ip, setIp] = useState('')
  const [aviso, setAviso] = useState('')

  function agregar(): void {
    if (!esIpValida(ip)) {
      setAviso('Esa IP no es válida. Ejemplo: 10.56.2.36')
      return
    }
    agregarIp(ip.trim())
    setAviso(`Buscando ${ip.trim()}… debería aparecer en unos segundos.`)
    setIp('')
  }

  return (
    <View className="gap-2 rounded-2xl bg-card p-4">
      <Text className="text-sm text-muted-foreground">¿No aparece? Está en otra subred: agregalo por IP</Text>
      <View className="flex-row gap-2">
        <TextInput
          value={ip}
          onChangeText={setIp}
          placeholder="10.56.2.36"
          keyboardType="decimal-pad"
          onSubmitEditing={agregar}
          className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-foreground"
        />
        <Button disabled={!ip.trim()} onPress={agregar}>
          <Icon as={Plus} size={16} className="text-primary-foreground" />
          <Text>Agregar</Text>
        </Button>
      </View>
      {!!aviso && <Text className="text-sm text-muted-foreground">{aviso}</Text>}
    </View>
  )
}

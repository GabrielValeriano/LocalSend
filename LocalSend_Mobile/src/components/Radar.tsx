import { useEffect, useRef } from 'react'
import { Animated, Easing, View } from 'react-native'
import { Text } from '@/components/ui/text'

const CANTIDAD_ONDAS = 3
const DURACION_MS = 2400

// Animación de "escaneo": ondas que salen del centro mientras buscamos dispositivos.
export function Radar({ buscando }: { buscando: boolean }) {
  return (
    <View className="h-48 items-center justify-center">
      {buscando && Array.from({ length: CANTIDAD_ONDAS }, (_, i) => (
        <Onda key={i} retraso={(DURACION_MS / CANTIDAD_ONDAS) * i} />
      ))}
      <View className="h-16 w-16 items-center justify-center rounded-full bg-primary">
        <Text className="text-2xl">📡</Text>
      </View>
    </View>
  )
}

function Onda({ retraso }: { retraso: number }) {
  const avance = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.delay(retraso),
        Animated.timing(avance, { toValue: 1, duration: DURACION_MS, easing: Easing.out(Easing.ease), useNativeDriver: true })
      ])
    )
    animacion.start()
    return () => animacion.stop()
  }, [])

  return (
    <Animated.View
      className="absolute h-16 w-16 rounded-full border-2 border-primary"
      style={{
        opacity: avance.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
        transform: [{ scale: avance.interpolate({ inputRange: [0, 1], outputRange: [1, 3] }) }]
      }}
    />
  )
}

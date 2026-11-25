import { useEffect, useRef } from 'react'
import { Animated, Easing, View } from 'react-native'
import { useColorScheme } from 'nativewind'
import { Radio } from 'lucide-react-native'
import { Icon } from '@/components/ui/icon'
import { color } from '../compartido/tema'

// Mismos valores que la animación CSS del escritorio (@keyframes onda)
const CANTIDAD_ONDAS = 3
const DURACION_MS = 2400

interface Props {
  activo: boolean // con ondas = escuchando / buscando
  tamano?: number
}

// Círculo con ícono y ondas que salen del centro sin parar (igual que en el escritorio).
export function LogoAnimado({ activo, tamano = 100 }: Props) {
  const { colorScheme } = useColorScheme()
  const colorOnda = color('primary', colorScheme === 'dark')

  return (
    <View style={{ width: tamano * 2.5, height: tamano * 2.5, alignItems: 'center', justifyContent: 'center' }}>
      {activo && Array.from({ length: CANTIDAD_ONDAS }, (_, i) => (
        <Onda key={i} tamano={tamano} color={colorOnda} retraso={(DURACION_MS / CANTIDAD_ONDAS) * i} />
      ))}
      <View
        style={{ width: tamano, height: tamano }}
        className={`items-center justify-center rounded-full ${activo ? 'bg-primary' : 'bg-muted'}`}
      >
        <Icon as={Radio} size={tamano * 0.44} className={activo ? 'text-primary-foreground' : 'text-muted-foreground'} />
      </View>
    </View>
  )
}

function Onda({ tamano, color, retraso }: { tamano: number; color: string; retraso: number }) {
  const avance = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // El retraso va UNA sola vez al principio (como animation-delay en CSS).
    // Después cada onda repite su ciclo sin pausas, así siempre hay ondas saliendo.
    const ciclo = Animated.loop(
      Animated.timing(avance, {
        toValue: 1,
        duration: DURACION_MS,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true
      })
    )
    const espera = setTimeout(() => ciclo.start(), retraso)

    return () => {
      clearTimeout(espera)
      ciclo.stop()
    }
  }, [])

  // Estilos en "style" (no className): Animated.View con className puede perder la animación
  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: tamano,
        height: tamano,
        borderRadius: tamano / 2,
        borderWidth: 2,
        borderColor: color,
        opacity: avance.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
        transform: [{ scale: avance.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) }]
      }}
    />
  )
}

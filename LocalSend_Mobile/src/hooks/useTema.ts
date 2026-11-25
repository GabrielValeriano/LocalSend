import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useColorScheme } from 'nativewind'
import type { ModoTema } from '../compartido/tema'

const CLAVE = 'localsend:tema'
const A_NATIVEWIND = { sistema: 'system', claro: 'light', oscuro: 'dark' } as const

// Tema elegido por el usuario: Sistema (sigue al teléfono), Claro u Oscuro.
export function useTema() {
  const { colorScheme, setColorScheme } = useColorScheme()
  const [modo, setModo] = useState<ModoTema>('sistema')

  useEffect(() => {
    AsyncStorage.getItem(CLAVE).then((guardado) => {
      if (!guardado) return
      setModo(guardado as ModoTema)
      setColorScheme(A_NATIVEWIND[guardado as ModoTema])
    })
  }, [])

  async function cambiarModo(nuevo: ModoTema): Promise<void> {
    setModo(nuevo)
    setColorScheme(A_NATIVEWIND[nuevo])
    await AsyncStorage.setItem(CLAVE, nuevo)
  }

  return { modo, cambiarModo, esOscuro: colorScheme === 'dark' }
}

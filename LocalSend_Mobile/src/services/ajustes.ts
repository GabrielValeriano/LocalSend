import AsyncStorage from '@react-native-async-storage/async-storage'
import { generarAlias, generarId } from '../compartido/alias'

export interface Ajustes {
  idDispositivo: string
  alias: string
}

const CLAVE = 'localsend:ajustes'

// La primera vez generamos id y alias; después siempre recuperamos los mismos.
export async function cargarAjustes(): Promise<Ajustes> {
  const guardado = await AsyncStorage.getItem(CLAVE)
  if (guardado) return JSON.parse(guardado)

  const nuevos: Ajustes = { idDispositivo: generarId(), alias: generarAlias() }
  await AsyncStorage.setItem(CLAVE, JSON.stringify(nuevos))
  return nuevos
}

export async function guardarAlias(ajustes: Ajustes, alias: string): Promise<Ajustes> {
  const actualizados = { ...ajustes, alias: alias.trim() }
  await AsyncStorage.setItem(CLAVE, JSON.stringify(actualizados))
  return actualizados
}

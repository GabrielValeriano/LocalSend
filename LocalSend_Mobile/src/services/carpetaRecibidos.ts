import AsyncStorage from '@react-native-async-storage/async-storage'
import { Directory, type File } from 'expo-file-system'

// Carpeta PÚBLICA donde quedan los archivos recibidos (ej: Descargas/LocalSend).
// La elige el usuario con el selector de Android (SAF) y guardamos su dirección
// para no volver a preguntar cada vez.

const CLAVE = 'localsend:carpetaRecibidos'

export async function obtenerCarpetaGuardada(): Promise<Directory | null> {
  const uri = await AsyncStorage.getItem(CLAVE)
  if (!uri) return null

  try {
    const carpeta = new Directory(uri)
    return carpeta.exists ? carpeta : null
  } catch {
    return null // la carpeta se borró o se perdió el permiso: hay que elegir otra
  }
}

export async function elegirCarpeta(): Promise<Directory | null> {
  try {
    const carpeta = await Directory.pickDirectoryAsync()
    await AsyncStorage.setItem(CLAVE, carpeta.uri)
    return carpeta
  } catch {
    return null // el usuario cerró el selector sin elegir
  }
}

// Crea el archivo vacío DIRECTO en la carpeta pública, con su tipo correcto.
export function crearArchivoEnCarpeta(carpeta: Directory, nombre: string, tipoMime: string): File {
  const nombresExistentes = new Set(carpeta.list().map((elemento) => elemento.name))
  return carpeta.createFile(buscarNombreLibre(nombre, nombresExistentes), tipoMime)
}

// foto.jpg -> foto (1).jpg -> foto (2).jpg ...
function buscarNombreLibre(nombre: string, existentes: Set<string>): string {
  if (!existentes.has(nombre)) return nombre

  const punto = nombre.lastIndexOf('.')
  const base = punto > 0 ? nombre.slice(0, punto) : nombre
  const extension = punto > 0 ? nombre.slice(punto) : ''

  let numero = 1
  while (existentes.has(`${base} (${numero})${extension}`)) numero++
  return `${base} (${numero})${extension}`
}

export function nombreLegible(carpeta: Directory | null): string {
  if (!carpeta) return 'Sin elegir'
  // Las direcciones SAF vienen codificadas: ".../tree/primary%3ADownload%2FLocalSend"
  const decodificada = decodeURIComponent(carpeta.uri)
  return decodificada.split(':').pop()?.replace(/^primary/, '') || carpeta.name
}

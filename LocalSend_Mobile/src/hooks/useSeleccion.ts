import { useState } from 'react'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { File } from 'expo-file-system'
import type { ArchivoElegido } from '../transferencia/enviarArchivo'
import { pedirPermisoGaleria } from '../services/permisos'
import { tipoMimeFinal } from '../compartido/tiposMime'

// Los archivos elegidos viven acá, NO en la pantalla de envío:
// si se corta el Wi-Fi o entra una llamada, la selección no se pierde y se puede reintentar.
let seleccionGuardada: ArchivoElegido[] = []

export function useSeleccion() {
  const [archivos, setArchivosInterno] = useState<ArchivoElegido[]>(seleccionGuardada)

  function setArchivos(nuevos: ArchivoElegido[]): void {
    seleccionGuardada = nuevos
    setArchivosInterno(nuevos)
  }

  function agregar(nuevos: ArchivoElegido[]): void {
    const sinRepetidos = nuevos.filter((n) => !archivos.some((a) => a.uri === n.uri))
    setArchivos([...archivos, ...sinRepetidos])
  }

  async function elegirDocumentos(): Promise<void> {
    const resultado = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true })
    if (resultado.canceled) return

    agregar(resultado.assets.map((a) => ({
      uri: a.uri,
      nombre: a.name,
      tamano: pesoReal(a.uri, a.size),
      tipoMime: tipoMimeFinal(a.mimeType ?? undefined, a.name)
    })))
  }

  async function elegirDeGaleria(): Promise<void> {
    const tienePermiso = await pedirPermisoGaleria()
    if (!tienePermiso) return

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 1
    })
    if (resultado.canceled) return

    agregar(resultado.assets.map((a) => ({
      uri: a.uri,
      nombre: a.fileName ?? `archivo-${Date.now()}.jpg`,
      tamano: pesoReal(a.uri, a.fileSize),
      tipoMime: tipoMimeFinal(a.mimeType ?? undefined, a.fileName ?? '.jpg')
    })))
  }

  function quitar(uri: string): void {
    setArchivos(archivos.filter((a) => a.uri !== uri))
  }

  function limpiar(): void {
    setArchivos([])
  }

  return { archivos, elegirDocumentos, elegirDeGaleria, quitar, limpiar }
}

// Algunos selectores no informan el peso (o lo informan en 0). Si falta, lo leemos del archivo.
// Antes quedaba en 0 y la oferta decía "0 B": el otro no podía recibirlo.
function pesoReal(uri: string, informado?: number | null): number {
  if (informado) return informado
  try {
    return new File(uri).size ?? 0
  } catch {
    return 0
  }
}

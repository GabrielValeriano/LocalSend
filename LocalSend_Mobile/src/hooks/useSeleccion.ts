import { useState } from 'react'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
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
      tamano: a.size ?? 0,
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
      tamano: a.fileSize ?? 0,
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

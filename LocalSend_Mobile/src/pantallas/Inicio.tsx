import { Alert, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import type { Dispositivo } from '../compartido/tipos'
import { useServicios } from '../contexto/ServiciosProvider'
import { useSeleccion } from '../hooks/useSeleccion'
import { Radar } from '../components/Radar'
import { TarjetaDispositivo } from '../components/TarjetaDispositivo'
import { VistaArchivo } from '../components/VistaArchivo'
import { AvisoWifi } from '../components/AvisoWifi'
import { vibrarToque } from '../utils/vibracion'

// Regla de los 3 toques: 1) elegir archivo  2) tocar dispositivo  3) confirmar
export function Inicio() {
  const router = useRouter()
  const { ajustes, enWifi, dispositivos, carpetaRecibidos, cambiarCarpeta } = useServicios()
  const { archivos, elegirDocumentos, elegirDeGaleria, quitar } = useSeleccion()

  function confirmarEnvio(dispositivo: Dispositivo): void {
    vibrarToque()
    const cantidad = archivos.length === 1 ? archivos[0].nombre : `${archivos.length} archivos`

    Alert.alert('¿Enviar?', `${cantidad} a ${dispositivo.alias}`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Enviar', onPress: () => router.push({ pathname: '/envio', params: { idDestino: dispositivo.id } }) }
    ])
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 p-5">
      <View className="items-center">
        <Text className="text-sm text-muted-foreground">Tu nombre en la red</Text>
        <Text className="text-2xl font-bold">{ajustes?.alias ?? '…'}</Text>
      </View>

      <View className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3">
        <Text className="text-2xl">📂</Text>
        <View className="flex-1">
          <Text className="text-xs text-muted-foreground">Los archivos recibidos se guardan en</Text>
          <Text className="font-medium" numberOfLines={1}>{carpetaRecibidos}</Text>
        </View>
        <Button variant="outline" size="sm" onPress={cambiarCarpeta}>
          <Text>Cambiar</Text>
        </Button>
      </View>

      <View className="gap-3">
        <Text className="text-lg font-semibold">1. Elegí qué enviar</Text>
        <View className="flex-row gap-3">
          <Button variant="outline" className="flex-1" onPress={elegirDeGaleria}>
            <Text>🖼️ Galería</Text>
          </Button>
          <Button variant="outline" className="flex-1" onPress={elegirDocumentos}>
            <Text>📄 Archivos</Text>
          </Button>
        </View>
        {archivos.map((archivo) => <VistaArchivo key={archivo.uri} archivo={archivo} alQuitar={quitar} />)}
      </View>

      <View className="gap-3">
        <Text className="text-lg font-semibold">2. Tocá a quién enviar</Text>

        {!enWifi ? <AvisoWifi /> : (
          <>
            <Radar buscando={dispositivos.length === 0} />
            {dispositivos.length === 0 && (
              <Text className="text-center text-muted-foreground">Buscando dispositivos en la red…</Text>
            )}
            {dispositivos.map((d) => (
              <TarjetaDispositivo key={d.id} dispositivo={d} habilitado={archivos.length > 0} alTocar={confirmarEnvio} />
            ))}
            {dispositivos.length > 0 && archivos.length === 0 && (
              <Text className="text-center text-sm text-muted-foreground">Primero elegí al menos un archivo.</Text>
            )}
          </>
        )}
      </View>
    </ScrollView>
  )
}

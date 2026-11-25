import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { File, Images } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { Text } from '@/components/ui/text'
import { color } from '../compartido/tema'
import type { Dispositivo } from '../compartido/tipos'
import { useServicios } from '../contexto/ServiciosProvider'
import { useSeleccion } from '../hooks/useSeleccion'
import { BotonOpcion } from '../components/BotonOpcion'
import { VistaArchivo } from '../components/VistaArchivo'
import { TarjetaDispositivo } from '../components/TarjetaDispositivo'
import { AvisoWifi } from '../components/AvisoWifi'
import { formatearBytes } from '../utils/formato'
import { vibrarToque } from '../utils/vibracion'

// Regla de los 3 toques: 1) elegir archivo  2) tocar dispositivo  3) confirmar
export function Enviar() {
  const router = useRouter()
  const { enWifi, dispositivos } = useServicios()
  const { archivos, elegirDocumentos, elegirDeGaleria, quitar, limpiar } = useSeleccion()
  const total = archivos.reduce((suma, a) => suma + a.tamano, 0)
  const { colorScheme } = useColorScheme()

  function confirmarEnvio(dispositivo: Dispositivo): void {
    vibrarToque()
    const cantidad = archivos.length === 1 ? archivos[0].nombre : `${archivos.length} archivos`

    Alert.alert('¿Enviar?', `${cantidad} a ${dispositivo.alias}`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Enviar', onPress: () => router.push({ pathname: '/envio', params: { idDestino: dispositivo.id } }) }
    ])
  }

  return (
    <ScrollView contentContainerClassName="gap-6 p-5">
      <View className="gap-3">
        <Text className="text-lg font-semibold">Selección</Text>
        <View className="flex-row gap-3">
          <BotonOpcion icono={File} texto="Archivo" alTocar={elegirDocumentos} />
          <BotonOpcion icono={Images} texto="Multimedia" alTocar={elegirDeGaleria} />
        </View>
      </View>

      {archivos.length > 0 && (
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground">
              {archivos.length} {archivos.length === 1 ? 'archivo' : 'archivos'} · {formatearBytes(total)}
            </Text>
            <Pressable onPress={limpiar} hitSlop={8}>
              <Text className="text-sm font-medium text-primary">Limpiar</Text>
            </Pressable>
          </View>
          {archivos.map((archivo) => <VistaArchivo key={archivo.uri} archivo={archivo} alQuitar={quitar} />)}
        </View>
      )}

      <View className="gap-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-lg font-semibold">Dispositivos cercanos</Text>
          {enWifi && <ActivityIndicator size="small" color={color('primary', colorScheme === 'dark')} />}
        </View>

        {!enWifi && <AvisoWifi />}
        {enWifi && dispositivos.length === 0 && (
          <Text className="py-6 text-center text-muted-foreground">Buscando dispositivos en la red…</Text>
        )}
        {dispositivos.map((d) => (
          <TarjetaDispositivo key={d.id} dispositivo={d} habilitado={archivos.length > 0} alTocar={confirmarEnvio} />
        ))}
        {dispositivos.length > 0 && archivos.length === 0 && (
          <Text className="text-center text-sm text-muted-foreground">Primero elegí al menos un archivo.</Text>
        )}
      </View>
    </ScrollView>
  )
}

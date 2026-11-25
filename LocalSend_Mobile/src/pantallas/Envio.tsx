import { useEffect, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import type { ProgresoTransferencia } from '../compartido/tipos'
import { useServicios } from '../contexto/ServiciosProvider'
import { useSeleccion } from '../hooks/useSeleccion'
import { enviarLote } from '../transferencia/enviarArchivo'
import { MiniaturaProgreso } from '../components/MiniaturaProgreso'

type Etapa = 'enviando' | 'terminado' | 'fallo'

export function Envio() {
  const router = useRouter()
  const { idDestino } = useLocalSearchParams<{ idDestino: string }>()
  const { ajustes, dispositivos, actualizarProgreso } = useServicios()
  const { archivos, limpiar } = useSeleccion()

  const [progresos, setProgresos] = useState<Record<string, ProgresoTransferencia>>({}) // por uri
  const [etapa, setEtapa] = useState<Etapa>('enviando')
  const [intento, setIntento] = useState(0)
  const terminados = useRef(new Set<string>()) // al reintentar, no reenviamos lo que ya llegó

  const destino = dispositivos.find((d) => d.id === idDestino)

  useEffect(() => {
    if (!destino || !ajustes) {
      setEtapa('fallo')
      return
    }
    enviarPendientes()
  }, [intento])

  async function enviarPendientes(): Promise<void> {
    setEtapa('enviando')
    const pendientes = archivos.filter((a) => !terminados.current.has(a.uri))

    // UN solo lote con todos los archivos: el receptor ve un único diálogo
    const completados = await enviarLote({
      archivos: pendientes,
      destino: destino!,
      remitente: { id: ajustes!.idDispositivo, alias: ajustes!.alias },
      alProgreso: (uri, progreso) => {
        setProgresos((anteriores) => ({ ...anteriores, [uri]: progreso }))
        actualizarProgreso(progreso)
      }
    })

    completados.forEach((uri) => terminados.current.add(uri))
    setEtapa(terminados.current.size === archivos.length ? 'terminado' : 'fallo')
  }

  function terminar(): void {
    limpiar()
    router.back()
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-5">
      <Text className="text-xl font-bold">Enviando a {destino?.alias ?? 'dispositivo desconectado'}</Text>

      {archivos.map((archivo) => (
        <MiniaturaProgreso key={archivo.uri} archivo={archivo} progreso={progresos[archivo.uri] ?? null} />
      ))}

      {etapa === 'fallo' && (
        <View className="gap-3">
          <Text className="text-center text-muted-foreground">
            {destino
              ? 'Algunos archivos no llegaron. Tu selección sigue guardada, podés reintentar.'
              : 'El dispositivo ya no aparece en la red. Revisá que siga conectado al Wi-Fi.'}
          </Text>
          <Button disabled={!destino} onPress={() => setIntento((n) => n + 1)}>
            <Text>Reintentar</Text>
          </Button>
          <Button variant="outline" onPress={() => router.back()}>
            <Text>Volver</Text>
          </Button>
        </View>
      )}

      {etapa === 'terminado' && (
        <Button onPress={terminar}>
          <Text>Listo</Text>
        </Button>
      )}
    </ScrollView>
  )
}

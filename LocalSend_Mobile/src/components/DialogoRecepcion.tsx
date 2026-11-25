import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { Check, Inbox } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import type { ArchivoDeLote } from '../compartido/tipos'
import { useServicios } from '../contexto/ServiciosProvider'
import { formatearBytes } from '../utils/formato'
import { vibrarToque } from '../utils/vibracion'
import { IconoArchivo } from './IconoArchivo'

// UN solo diálogo para todo el lote: se puede destildar lo que no se quiere recibir.
export function DialogoRecepcion() {
  const { ofertaPendiente } = useServicios()
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())

  // Cada lote nuevo arranca con todos los archivos tildados
  useEffect(() => {
    setSeleccionados(new Set(ofertaPendiente?.oferta.archivos.map((a) => a.id) ?? []))
  }, [ofertaPendiente?.oferta.idLote])

  if (!ofertaPendiente) return null
  const { oferta, responder } = ofertaPendiente

  const cantidad = oferta.archivos.length
  const total = oferta.archivos.filter((a) => seleccionados.has(a.id)).reduce((s, a) => s + a.tamano, 0)

  function alternar(id: string): void {
    vibrarToque()
    setSeleccionados((anteriores) => {
      const nuevos = new Set(anteriores)
      if (nuevos.has(id)) nuevos.delete(id)
      else nuevos.add(id)
      return nuevos
    })
  }

  function decidir(ids: string[]): void {
    vibrarToque()
    responder(ids)
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={() => decidir([])}>
      <View className="flex-1 items-center justify-center bg-black/50 p-6">
        <View className="max-h-[80%] w-full gap-4 rounded-3xl bg-card p-6">
          <View className="items-center gap-2">
            <Icon as={Inbox} size={32} className="text-primary" />
            <Text className="text-center text-lg font-semibold">
              {oferta.remitente.alias} quiere enviarte {cantidad === 1 ? 'un archivo' : `${cantidad} archivos`}
            </Text>
          </View>

          <ScrollView className="max-h-72">
            {oferta.archivos.map((archivo) => (
              <FilaArchivo
                key={archivo.id}
                archivo={archivo}
                tildado={seleccionados.has(archivo.id)}
                alTocar={() => alternar(archivo.id)}
              />
            ))}
          </ScrollView>

          <Text className="text-center text-sm text-muted-foreground">Total: {formatearBytes(total)}</Text>

          <View className="flex-row gap-3">
            <Button variant="outline" className="flex-1" onPress={() => decidir([])}>
              <Text>Rechazar</Text>
            </Button>
            <Button className="flex-1" disabled={seleccionados.size === 0} onPress={() => decidir([...seleccionados])}>
              <Text>Aceptar</Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  )
}

function FilaArchivo({ archivo, tildado, alTocar }: { archivo: ArchivoDeLote; tildado: boolean; alTocar: () => void }) {
  return (
    <Pressable onPress={alTocar} className="flex-row items-center gap-3 py-2 active:opacity-70">
      <View className={`h-6 w-6 items-center justify-center rounded-md border-2 ${tildado ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
        {tildado && <Icon as={Check} size={14} className="text-primary-foreground" />}
      </View>
      <IconoArchivo tipoMime={archivo.tipoMime} />
      <View className="flex-1">
        <Text numberOfLines={1} className="font-medium">{archivo.nombre}</Text>
        <Text className="text-xs text-muted-foreground">{formatearBytes(archivo.tamano)}</Text>
      </View>
    </Pressable>
  )
}

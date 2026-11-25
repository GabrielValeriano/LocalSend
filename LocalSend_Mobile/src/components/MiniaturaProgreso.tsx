import { View } from 'react-native'
import { CircleCheck, CircleX, Clock, type LucideIcon } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import { Icon } from '@/components/ui/icon'
import { Progress } from '@/components/ui/progress'
import type { EstadoTransferencia, ProgresoTransferencia } from '../compartido/tipos'
import type { ArchivoElegido } from '../transferencia/enviarArchivo'
import { formatearBytes, formatearTiempo, formatearVelocidad } from '../utils/formato'
import { Miniatura } from './VistaArchivo'

const ESTADOS: Record<EstadoTransferencia, { texto: string; icono?: LucideIcon; color?: string }> = {
  esperando: { texto: 'Esperando que acepte', icono: Clock, color: 'text-muted-foreground' },
  enviando: { texto: 'Enviando' },
  recibiendo: { texto: 'Recibiendo' },
  completado: { texto: 'Listo', icono: CircleCheck, color: 'text-primary' },
  rechazado: { texto: 'No aceptado', icono: CircleX, color: 'text-muted-foreground' },
  error: { texto: 'Error', icono: CircleX, color: 'text-destructive' }
}

interface Props {
  archivo: ArchivoElegido
  progreso: ProgresoTransferencia | null
}

// Miniatura del archivo + barra de progreso, para saber de un vistazo qué se está enviando.
export function MiniaturaProgreso({ archivo, progreso }: Props) {
  const porcentaje = progreso?.porcentaje ?? 0
  const estado = ESTADOS[progreso?.estado ?? 'esperando']
  const enCurso = progreso?.estado === 'enviando' || progreso?.estado === 'recibiendo'

  return (
    <View className="gap-3 rounded-2xl bg-card p-4">
      <View className="flex-row items-center gap-3">
        <Miniatura archivo={archivo} tamano={52} />
        <View className="flex-1">
          <Text numberOfLines={1} className="font-semibold">{archivo.nombre}</Text>
          <View className="flex-row items-center gap-1">
            {estado.icono && <Icon as={estado.icono} size={14} className={estado.color} />}
            <Text className={`text-sm ${estado.color ?? 'text-muted-foreground'}`}>{estado.texto}</Text>
          </View>
        </View>
        <Text className="font-semibold">{porcentaje.toFixed(0)}%</Text>
      </View>

      <Progress value={porcentaje} />

      <View className="flex-row justify-between">
        <Text className="text-xs text-muted-foreground">
          {formatearBytes(progreso?.bytesTransferidos ?? 0)} de {formatearBytes(archivo.tamano)}
        </Text>
        {enCurso && progreso && (
          <Text className="text-xs text-muted-foreground">
            {formatearVelocidad(progreso.velocidad)} · {formatearTiempo(progreso.segundosRestantes)}
          </Text>
        )}
      </View>

      {progreso?.mensajeError && <Text className="text-sm text-destructive">{progreso.mensajeError}</Text>}
    </View>
  )
}

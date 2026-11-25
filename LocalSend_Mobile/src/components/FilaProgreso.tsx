import { View } from 'react-native'
import { CircleCheck, CircleX, type LucideIcon } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import { Icon } from '@/components/ui/icon'
import { Progress } from '@/components/ui/progress'
import type { ProgresoTransferencia } from '../compartido/tipos'
import { tipoMimePorNombre } from '../compartido/tiposMime'
import { formatearBytes, formatearTiempo, formatearVelocidad } from '../utils/formato'
import { IconoArchivo } from './IconoArchivo'

const FINALES: Partial<Record<ProgresoTransferencia['estado'], { texto: string; icono: LucideIcon; color: string }>> = {
  completado: { texto: 'Listo', icono: CircleCheck, color: 'text-primary' },
  rechazado: { texto: 'No aceptado', icono: CircleX, color: 'text-muted-foreground' },
  error: { texto: 'Interrumpido', icono: CircleX, color: 'text-destructive' }
}

const EN_CURSO: Partial<Record<ProgresoTransferencia['estado'], string>> = {
  esperando: 'Esperando que acepte',
  enviando: 'Enviando',
  recibiendo: 'Recibiendo'
}

// Una fila de progreso: se usa en "Recibir" (lo que llega) y en "Enviar" (lo que mandaste).
export function FilaProgreso({ progreso: p }: { progreso: ProgresoTransferencia }) {
  const final = FINALES[p.estado]
  const enCurso = p.estado === 'enviando' || p.estado === 'recibiendo'

  return (
    <View className="gap-2 rounded-2xl bg-card p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-secondary">
          <IconoArchivo tipoMime={tipoMimePorNombre(p.nombre)} className="text-secondary-foreground" />
        </View>
        <View className="flex-1">
          <Text numberOfLines={1} className="font-medium">{p.nombre}</Text>
          <View className="flex-row items-center gap-1">
            {final && <Icon as={final.icono} size={14} className={final.color} />}
            <Text className={`text-sm ${final?.color ?? 'text-muted-foreground'}`}>{final?.texto ?? EN_CURSO[p.estado]}</Text>
          </View>
        </View>
        <Text className="font-semibold">{p.porcentaje.toFixed(0)}%</Text>
      </View>

      <Progress value={p.porcentaje} />

      <View className="flex-row justify-between">
        <Text className="text-xs text-muted-foreground">
          {formatearBytes(p.bytesTransferidos)} de {formatearBytes(p.tamanoTotal)}
        </Text>
        {enCurso && (
          <Text className="text-xs text-muted-foreground">
            {formatearVelocidad(p.velocidad)} · {formatearTiempo(p.segundosRestantes)}
          </Text>
        )}
      </View>

      {p.mensajeError && <Text className="text-sm text-destructive">{p.mensajeError}</Text>}
    </View>
  )
}

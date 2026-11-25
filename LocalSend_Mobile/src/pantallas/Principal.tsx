import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BarraPestanas, type Seccion } from '../components/BarraPestanas'
import { useServicios } from '../contexto/ServiciosProvider'
import { Recibir } from './Recibir'
import { Enviar } from './Enviar'
import { Ajustes } from './Ajustes'

// Contenedor con las 3 secciones y la barra de pestañas abajo.
// (En el escritorio es lo mismo, pero con la barra a la izquierda.)
export function Principal() {
  const [seccion, setSeccion] = useState<Seccion>('recibir')
  const margenes = useSafeAreaInsets()
  const { loteRecibiendo } = useServicios()

  // Cuando empieza a llegar un lote, mostramos "Recibir", que es donde está su progreso
  useEffect(() => {
    if (loteRecibiendo) setSeccion('recibir')
  }, [loteRecibiendo])

  return (
    <View style={{ paddingTop: margenes.top }} className="flex-1 bg-background">
      <View className="flex-1">
        {seccion === 'recibir' && <Recibir />}
        {seccion === 'enviar' && <Enviar />}
        {seccion === 'ajustes' && <Ajustes />}
      </View>
      <BarraPestanas actual={seccion} alCambiar={setSeccion} />
    </View>
  )
}

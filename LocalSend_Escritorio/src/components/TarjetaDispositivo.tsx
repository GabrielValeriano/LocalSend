import { Laptop, Monitor, Smartphone, type LucideIcon } from 'lucide-react'
import type { Dispositivo, TipoDispositivo } from '../compartido/tipos'

const ICONOS: Record<TipoDispositivo, LucideIcon> = {
  pc: Monitor,
  laptop: Laptop,
  celular: Smartphone
}

interface Props {
  dispositivo: Dispositivo
  habilitado: boolean
  alElegir: (dispositivo: Dispositivo) => void
}

export function TarjetaDispositivo({ dispositivo, habilitado, alElegir }: Props) {
  const Icono = ICONOS[dispositivo.tipo] ?? Monitor

  return (
    <button className="tarjeta-dispositivo" disabled={!habilitado} onClick={() => alElegir(dispositivo)}>
      <span className="tarjeta-dispositivo__icono"><Icono size={24} /></span>
      <span className="tarjeta-dispositivo__datos">
        <span className="tarjeta-dispositivo__alias">{dispositivo.alias}</span>
        <span className="etiqueta">{dispositivo.ip}</span>
      </span>
    </button>
  )
}

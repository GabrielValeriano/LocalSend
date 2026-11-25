import { Send, Settings, Wifi, type LucideIcon } from 'lucide-react'

export type Seccion = 'recibir' | 'enviar' | 'ajustes'

// Las mismas 3 secciones (con los mismos íconos) que las pestañas del celular
const SECCIONES: { id: Seccion; texto: string; icono: LucideIcon }[] = [
  { id: 'recibir', texto: 'Recibir', icono: Wifi },
  { id: 'enviar', texto: 'Enviar', icono: Send },
  { id: 'ajustes', texto: 'Ajustes', icono: Settings }
]

interface Props {
  actual: Seccion
  alCambiar: (seccion: Seccion) => void
}

export function BarraLateral({ actual, alCambiar }: Props) {
  return (
    <nav className="barra-lateral">
      <div className="barra-lateral__marca">LocalSend</div>
      {SECCIONES.map(({ id, texto, icono: Icono }) => (
        <button
          key={id}
          className={`barra-lateral__item ${id === actual ? 'barra-lateral__item--activo' : ''}`}
          onClick={() => alCambiar(id)}
        >
          <Icono size={20} />
          <span>{texto}</span>
        </button>
      ))}
    </nav>
  )
}

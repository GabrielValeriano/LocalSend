import type { LucideIcon } from 'lucide-react'

interface Props {
  icono: LucideIcon
  texto: string
  alTocar: () => void
}

// Botón cuadrado de la sección "Selección" (igual que en el celular)
export function BotonOpcion({ icono: Icono, texto, alTocar }: Props) {
  return (
    <button className="boton-opcion" onClick={alTocar}>
      <Icono size={28} />
      <span>{texto}</span>
    </button>
  )
}

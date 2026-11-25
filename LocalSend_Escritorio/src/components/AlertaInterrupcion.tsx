import { TriangleAlert } from 'lucide-react'
import type { Interrupcion } from '../hooks/useTransferencias'

interface Props extends Interrupcion {
  alCerrar: () => void
}

// Aviso que aparece cuando una transferencia se corta a mitad de camino
// (por ejemplo, si alguien se desconecta del Wi-Fi). Así no queda la barra congelada sin explicación.
export function AlertaInterrupcion({ nombre, mensaje, alCerrar }: Props) {
  return (
    <div className="fondo-modal">
      <div className="modal">
        <TriangleAlert size={36} className="texto-error" />
        <h3>Se interrumpió la transferencia</h3>
        <p className="modal__nombre">{nombre}</p>
        <p className="texto-suave">{mensaje}</p>
        <p className="texto-suave">El archivo incompleto se borró. Volvé a enviarlo cuando la conexión vuelva.</p>
        <div className="modal__botones">
          <button onClick={alCerrar}>Entendido</button>
        </div>
      </div>
    </div>
  )
}

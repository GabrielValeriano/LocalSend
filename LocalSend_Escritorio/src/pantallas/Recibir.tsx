import { FolderDown } from 'lucide-react'
import type { ProgresoTransferencia } from '../compartido/tipos'
import { LogoAnimado } from '../components/LogoAnimado'
import { MonitorTransferencia } from '../components/MonitorTransferencia'

interface Props {
  alias: string
  ip: string
  servidorActivo: boolean
  carpeta: string
  transferencias: ProgresoTransferencia[] // solo lo que se está RECIBIENDO
  alLimpiarTransferencias: () => void
}

// Muestra quién sos en la red y si estás listo para recibir (igual que en el celular).
export function Recibir({ alias, ip, servidorActivo, carpeta, transferencias, alLimpiarTransferencias }: Props) {
  return (
    <div className="pantalla pantalla--centrada">
      <LogoAnimado activo={servidorActivo} />
      <h1 className="recibir__alias">{alias || '…'}</h1>

      <div className="recibir__estado">
        <span className={`led ${servidorActivo ? 'led--activo' : 'led--inactivo'}`} />
        <span className="texto-suave">{servidorActivo ? 'Listo para recibir' : 'No disponible'}</span>
        {ip && <span className="etiqueta">{ip}</span>}
      </div>

      <div className="pildora">
        <FolderDown size={16} />
        <span>{carpeta || 'Sin carpeta'}</span>
      </div>

      {/* El progreso de lo que llega se ve acá (lo que enviás se ve en "Enviar") */}
      <div className="recibir__monitor">
        <MonitorTransferencia titulo="Recibiendo" transferencias={transferencias} alLimpiar={alLimpiarTransferencias} />
      </div>
    </div>
  )
}

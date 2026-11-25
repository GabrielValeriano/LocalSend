import { X } from 'lucide-react'
import { IconoArchivo } from './IconoArchivo'

const nombreDe = (ruta: string) => ruta.split(/[\\/]/).pop() ?? ruta

export function VistaArchivo({ ruta, alQuitar }: { ruta: string; alQuitar: (ruta: string) => void }) {
  const nombre = nombreDe(ruta)

  return (
    <div className="vista-archivo">
      <span className="vista-archivo__icono"><IconoArchivo nombre={nombre} /></span>
      <span className="vista-archivo__nombre" title={ruta}>{nombre}</span>
      <button className="boton-icono" onClick={() => alQuitar(ruta)} title="Quitar">
        <X size={18} />
      </button>
    </div>
  )
}

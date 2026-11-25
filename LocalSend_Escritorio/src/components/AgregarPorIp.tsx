import { useState } from 'react'
import { Plus } from 'lucide-react'
import { esIpValida } from '../compartido/alias'
import { api } from '../services/api'

// Plan B del descubrimiento: si el otro equipo está en otra subred, el broadcast no le llega.
// Escribiendo su IP le mandamos el beacon directo y los dos se encuentran.
export function AgregarPorIp() {
  const [ip, setIp] = useState('')
  const [aviso, setAviso] = useState('')

  function agregar(): void {
    if (!esIpValida(ip)) {
      setAviso('Esa IP no es válida. Ejemplo: 10.56.5.72')
      return
    }
    api.agregarIp(ip.trim())
    setAviso(`Buscando ${ip.trim()}… debería aparecer en unos segundos.`)
    setIp('')
  }

  return (
    <div className="agregar-ip">
      <span className="texto-suave">¿No aparece? Está en otra subred: agregalo por IP</span>
      <div className="fila">
        <input
          value={ip}
          placeholder="10.56.5.72"
          onChange={(e) => setIp(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && agregar()}
        />
        <button className="boton-con-icono" disabled={!ip.trim()} onClick={agregar}>
          <Plus size={16} /> Agregar
        </button>
      </div>
      {aviso && <span className="texto-suave">{aviso}</span>}
    </div>
  )
}

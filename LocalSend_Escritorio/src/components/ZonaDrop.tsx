import { useRef, useState, type DragEvent, type ReactNode } from 'react'
import { Upload } from 'lucide-react'
import { api } from '../services/api'
import type { ArchivoSeleccionado } from '../services/seleccion'

interface Props {
  alSoltarArchivos: (archivos: ArchivoSeleccionado[]) => void
  children: ReactNode
}

// Toda la ventana funciona como zona de Drag & Drop.
export function ZonaDrop({ alSoltarArchivos, children }: Props) {
  const [arrastrando, setArrastrando] = useState(false)
  const contador = useRef(0) // dragenter/dragleave se disparan también en los hijos

  function alEntrar(e: DragEvent): void {
    e.preventDefault()
    contador.current++
    setArrastrando(true)
  }

  function alSalir(e: DragEvent): void {
    e.preventDefault()
    contador.current--
    if (contador.current === 0) setArrastrando(false)
  }

  function alSoltar(e: DragEvent): void {
    e.preventDefault()
    contador.current = 0
    setArrastrando(false)
    const soltados = [...e.dataTransfer.files].map((archivo) => ({
      ruta: api.rutaDeArchivo(archivo),
      tamano: archivo.size
    }))
    if (soltados.length) alSoltarArchivos(soltados)
  }

  return (
    <div
      className="zona-drop"
      onDragEnter={alEntrar}
      onDragLeave={alSalir}
      onDragOver={(e) => e.preventDefault()}
      onDrop={alSoltar}
    >
      {children}
      {arrastrando && (
        <div className="zona-drop__aviso">
          <Upload size={48} />
          <span>Soltá los archivos para enviarlos</span>
        </div>
      )}
    </div>
  )
}

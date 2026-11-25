import { useState } from 'react'
import { Check, Inbox } from 'lucide-react'
import type { AccionConflicto } from '../compartido/tipos'
import type { OfertaPendiente } from '../hooks/useOfertas'
import { formatearBytes } from '../utils/formato'
import { IconoArchivo } from './IconoArchivo'

interface Props extends OfertaPendiente {
  alResponder: (idLote: string, idsAceptados: string[], accion?: AccionConflicto) => void
}

const OPCIONES_CONFLICTO: { valor: AccionConflicto; texto: string }[] = [
  { valor: 'renombrar', texto: 'Mantener ambos' },
  { valor: 'reemplazar', texto: 'Reemplazar' },
  { valor: 'omitir', texto: 'Omitir' }
]

// UN solo diálogo para todo el lote: se puede destildar lo que no se quiere recibir.
export function DialogoRecepcion({ oferta, idsExistentes, alResponder }: Props) {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(() => new Set(oferta.archivos.map((a) => a.id)))
  const [accion, setAccion] = useState<AccionConflicto>('renombrar')

  const cantidad = oferta.archivos.length
  const total = oferta.archivos.filter((a) => seleccionados.has(a.id)).reduce((s, a) => s + a.tamano, 0)
  const hayRepetidos = idsExistentes.some((id) => seleccionados.has(id))

  function alternar(id: string): void {
    setSeleccionados((anteriores) => {
      const nuevos = new Set(anteriores)
      if (nuevos.has(id)) nuevos.delete(id)
      else nuevos.add(id)
      return nuevos
    })
  }

  return (
    <div className="fondo-modal">
      <div className="modal">
        <Inbox size={32} className="texto-primario" />
        <h3>{oferta.remitente.alias} quiere enviarte {cantidad === 1 ? 'un archivo' : `${cantidad} archivos`}</h3>

        <div className="modal__lista">
          {oferta.archivos.map((archivo) => {
            const tildado = seleccionados.has(archivo.id)
            return (
              <button key={archivo.id} className="modal__fila" onClick={() => alternar(archivo.id)}>
                <span className={`casilla ${tildado ? 'casilla--tildada' : ''}`}>{tildado && <Check size={14} />}</span>
                <span className="texto-suave"><IconoArchivo tipoMime={archivo.tipoMime} /></span>
                <span className="modal__nombre">
                  {archivo.nombre}
                  {idsExistentes.includes(archivo.id) && <span className="etiqueta etiqueta--aviso">Ya existe</span>}
                </span>
                <span className="texto-suave">{formatearBytes(archivo.tamano)}</span>
              </button>
            )
          })}
        </div>

        {hayRepetidos && (
          <div className="modal__conflicto">
            <span className="texto-suave">Si ya existe:</span>
            <div className="segmentos">
              {OPCIONES_CONFLICTO.map((o) => (
                <button
                  key={o.valor}
                  className={`segmentos__opcion ${accion === o.valor ? 'segmentos__opcion--elegida' : ''}`}
                  onClick={() => setAccion(o.valor)}
                >
                  {o.texto}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="texto-suave">Total: {formatearBytes(total)}</p>

        <div className="modal__botones">
          <button className="boton-secundario" onClick={() => alResponder(oferta.idLote, [])}>Rechazar</button>
          <button disabled={seleccionados.size === 0} onClick={() => alResponder(oferta.idLote, [...seleccionados], accion)}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

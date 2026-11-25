import { ArrowDown, ArrowUp, CircleCheck, CircleX, Clock, type LucideIcon } from 'lucide-react'
import type { EstadoTransferencia, ProgresoTransferencia } from '../compartido/tipos'
import { formatearBytes, formatearTiempo, formatearVelocidad } from '../utils/formato'
import { IconoArchivo } from './IconoArchivo'

// Mismos textos e íconos de estado que en el celular
const ESTADOS: Record<EstadoTransferencia, { texto: string; icono?: LucideIcon; clase?: string }> = {
  esperando: { texto: 'Esperando que acepte', icono: Clock, clase: 'texto-suave' },
  enviando: { texto: 'Enviando', icono: ArrowUp },
  recibiendo: { texto: 'Recibiendo', icono: ArrowDown },
  completado: { texto: 'Listo', icono: CircleCheck, clase: 'texto-primario' },
  rechazado: { texto: 'No aceptado', icono: CircleX, clase: 'texto-suave' },
  error: { texto: 'Error', icono: CircleX, clase: 'texto-error' }
}

interface Props {
  titulo: string
  transferencias: ProgresoTransferencia[]
  alLimpiar: () => void
}

export function MonitorTransferencia({ titulo, transferencias, alLimpiar }: Props) {
  if (transferencias.length === 0) return null

  return (
    <section className="seccion">
      <div className="seccion__titulo">
        <h2>{titulo}</h2>
        <button className="boton-texto" onClick={alLimpiar}>Limpiar terminadas</button>
      </div>
      <div className="lista">
        {transferencias.map((t) => <FilaTransferencia key={t.idTransferencia} transferencia={t} />)}
      </div>
    </section>
  )
}

function FilaTransferencia({ transferencia: t }: { transferencia: ProgresoTransferencia }) {
  const estado = ESTADOS[t.estado]
  const IconoEstado = estado.icono
  const enCurso = t.estado === 'enviando' || t.estado === 'recibiendo'

  return (
    <div className={`fila-transferencia fila-transferencia--${t.estado}`}>
      <div className="fila-transferencia__cabecera">
        <span className="vista-archivo__icono"><IconoArchivo nombre={t.nombre} /></span>
        <div className="fila-transferencia__textos">
          <span className="fila-transferencia__nombre">{t.nombre}</span>
          <span className={`fila-transferencia__estado ${estado.clase ?? 'texto-suave'}`}>
            {IconoEstado && <IconoEstado size={14} />} {estado.texto}
          </span>
        </div>
        <strong>{t.porcentaje.toFixed(0)}%</strong>
      </div>

      <div className="barra">
        <div className="barra__relleno" style={{ width: `${t.porcentaje.toFixed(1)}%` }} />
      </div>

      <div className="fila-transferencia__datos">
        <span>{formatearBytes(t.bytesTransferidos)} de {formatearBytes(t.tamanoTotal)}</span>
        {enCurso && <span>{formatearVelocidad(t.velocidad)} · faltan {formatearTiempo(t.segundosRestantes)}</span>}
      </div>

      {t.mensajeError && <p className="texto-error">{t.mensajeError}</p>}
    </div>
  )
}

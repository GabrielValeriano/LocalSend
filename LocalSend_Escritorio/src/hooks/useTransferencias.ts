import { useEffect, useRef, useState } from 'react'
import type { ProgresoTransferencia } from '../compartido/tipos'
import { api } from '../services/api'

export interface Interrupcion {
  nombre: string
  mensaje: string
}

const enCurso = (t: ProgresoTransferencia) =>
  t.estado === 'enviando' || t.estado === 'recibiendo' || t.estado === 'esperando'

// Guarda el último progreso de cada transferencia (por id) y separa enviados de recibidos.
// Además detecta:
// - un lote NUEVO que empieza a recibirse (para llevar al usuario a la pantalla "Recibir")
// - una transferencia que termina en error (para mostrar la alerta de interrupción)
export function useTransferencias() {
  const [transferencias, setTransferencias] = useState<Record<string, ProgresoTransferencia>>({})
  const [interrupcion, setInterrupcion] = useState<Interrupcion | null>(null)
  const [loteRecibiendo, setLoteRecibiendo] = useState<string | null>(null)
  const lotesAvisados = useRef(new Set<string>()) // una sola alerta por lote, aunque fallen varios archivos
  const lotesRecibidos = useRef(new Set<string>())

  useEffect(() => {
    return api.alCambiarProgreso((progreso) => {
      setTransferencias((anteriores) => ({ ...anteriores, [progreso.idTransferencia]: progreso }))

      if (progreso.direccion === 'recepcion' && !lotesRecibidos.current.has(progreso.idLote)) {
        lotesRecibidos.current.add(progreso.idLote)
        setLoteRecibiendo(progreso.idLote)
      }

      if (progreso.estado === 'error' && !lotesAvisados.current.has(progreso.idLote)) {
        lotesAvisados.current.add(progreso.idLote)
        setInterrupcion({ nombre: progreso.nombre, mensaje: progreso.mensajeError ?? 'Error desconocido' })
      }
    })
  }, [])

  // Cada pantalla limpia SOLO lo suyo: "Recibir" no borra lo enviado y al revés
  function limpiarTerminadas(direccion: ProgresoTransferencia['direccion']): void {
    setTransferencias((anteriores) =>
      Object.fromEntries(Object.entries(anteriores).filter(([, t]) => t.direccion !== direccion || enCurso(t)))
    )
  }

  const todas = Object.values(transferencias)

  return {
    enviados: todas.filter((t) => t.direccion === 'envio'),
    recibidos: todas.filter((t) => t.direccion === 'recepcion'),
    limpiarTerminadas,
    interrupcion,
    cerrarInterrupcion: () => setInterrupcion(null),
    loteRecibiendo
  }
}

import { useEffect, useState } from 'react'
import type { ProgresoTransferencia } from '../compartido/tipos'
import { api } from '../services/api'

// Guarda el último progreso de cada transferencia, por id.
export function useTransferencias() {
  const [transferencias, setTransferencias] = useState<Record<string, ProgresoTransferencia>>({})

  useEffect(() => {
    return api.alCambiarProgreso((progreso) =>
      setTransferencias((anteriores) => ({ ...anteriores, [progreso.idTransferencia]: progreso }))
    )
  }, [])

  function limpiarTerminadas(): void {
    setTransferencias((anteriores) =>
      Object.fromEntries(
        Object.entries(anteriores).filter(([, t]) => t.estado === 'enviando' || t.estado === 'recibiendo' || t.estado === 'esperando')
      )
    )
  }

  return { transferencias: Object.values(transferencias), limpiarTerminadas }
}

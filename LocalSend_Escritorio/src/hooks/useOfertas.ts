import { useEffect, useState } from 'react'
import type { AccionConflicto, OfertaLote } from '../compartido/tipos'
import { api } from '../services/api'

export interface OfertaPendiente {
  oferta: OfertaLote
  idsExistentes: string[] // archivos que ya existen en la carpeta de descargas
}

// Cola de lotes que otros quieren mandarnos y esperan nuestra respuesta.
export function useOfertas() {
  const [pendientes, setPendientes] = useState<OfertaPendiente[]>([])

  useEffect(() => {
    return api.alRecibirOferta((nueva) => setPendientes((anteriores) => [...anteriores, nueva]))
  }, [])

  function responder(idLote: string, idsAceptados: string[], accionConflicto?: AccionConflicto): void {
    api.responderOferta(idLote, { idsAceptados, accionConflicto })
    setPendientes((anteriores) => anteriores.filter((p) => p.oferta.idLote !== idLote))
  }

  return { ofertaActual: pendientes[0] ?? null, responder }
}

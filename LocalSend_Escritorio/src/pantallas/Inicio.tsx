import { useState } from 'react'
import type { Dispositivo } from '../compartido/tipos'
import { useEstado } from '../hooks/useEstado'
import { useTransferencias } from '../hooks/useTransferencias'
import { useOfertas } from '../hooks/useOfertas'
import { api } from '../services/api'
import { EstadoServidor } from '../components/EstadoServidor'
import { ZonaDrop } from '../components/ZonaDrop'
import { SelectorArchivos } from '../components/SelectorArchivos'
import { ListaDispositivos } from '../components/ListaDispositivos'
import { MonitorTransferencia } from '../components/MonitorTransferencia'
import { DialogoRecepcion } from '../components/DialogoRecepcion'

export function Inicio() {
  const { ajustes, servidorActivo, dispositivos, elegirCarpeta, cambiarAlias } = useEstado()
  const { transferencias, limpiarTerminadas } = useTransferencias()
  const { ofertaActual, responder } = useOfertas()
  const [archivos, setArchivos] = useState<string[]>([])

  function agregarArchivos(nuevos: string[]): void {
    setArchivos((anteriores) => [...new Set([...anteriores, ...nuevos])])
  }

  function quitarArchivo(ruta: string): void {
    setArchivos((anteriores) => anteriores.filter((r) => r !== ruta))
  }

  async function enviarA(dispositivo: Dispositivo): Promise<void> {
    await api.enviarArchivos(dispositivo.id, archivos)
    setArchivos([])
  }

  return (
    <ZonaDrop alSoltarArchivos={agregarArchivos}>
      <EstadoServidor
        activo={servidorActivo}
        alias={ajustes.alias}
        carpeta={ajustes.carpetaDescargas}
        alElegirCarpeta={elegirCarpeta}
        alCambiarAlias={cambiarAlias}
      />

      <main className="contenido">
        <SelectorArchivos rutas={archivos} alElegir={agregarArchivos} alQuitar={quitarArchivo} />
        <ListaDispositivos dispositivos={dispositivos} hayArchivos={archivos.length > 0} alElegir={enviarA} />
        <MonitorTransferencia transferencias={transferencias} alLimpiar={limpiarTerminadas} />
      </main>

      {ofertaActual && (
        <DialogoRecepcion key={ofertaActual.oferta.idLote} {...ofertaActual} alResponder={responder} />
      )}
    </ZonaDrop>
  )
}

import { useState } from 'react'
import type { Dispositivo } from './compartido/tipos'
import { useEstado } from './hooks/useEstado'
import { useTransferencias } from './hooks/useTransferencias'
import { useOfertas } from './hooks/useOfertas'
import { useTema } from './hooks/useTema'
import { api } from './services/api'
import { BarraLateral, type Seccion } from './components/BarraLateral'
import { ZonaDrop } from './components/ZonaDrop'
import { DialogoRecepcion } from './components/DialogoRecepcion'
import { Recibir } from './pantallas/Recibir'
import { Enviar } from './pantallas/Enviar'
import { Ajustes } from './pantallas/Ajustes'

// Barra lateral con las 3 secciones (en el celular es la barra de pestañas de abajo).
export default function App() {
  const [seccion, setSeccion] = useState<Seccion>('recibir')
  const [archivos, setArchivos] = useState<string[]>([])
  const estado = useEstado()
  const { transferencias, limpiarTerminadas } = useTransferencias()
  const { ofertaActual, responder } = useOfertas()
  const { modo, cambiarModo } = useTema()

  // Si arrastran archivos desde cualquier sección, los agregamos y vamos a "Enviar"
  function agregarArchivos(nuevos: string[]): void {
    setArchivos((anteriores) => [...new Set([...anteriores, ...nuevos])])
    setSeccion('enviar')
  }

  async function enviarA(dispositivo: Dispositivo): Promise<void> {
    await api.enviarArchivos(dispositivo.id, archivos)
    setArchivos([])
  }

  return (
    <ZonaDrop alSoltarArchivos={agregarArchivos}>
      <div className="app">
        <BarraLateral actual={seccion} alCambiar={setSeccion} />

        <main className="app__contenido">
          {seccion === 'recibir' && (
            <Recibir
              alias={estado.ajustes.alias}
              ip={estado.ip}
              servidorActivo={estado.servidorActivo}
              carpeta={estado.ajustes.carpetaDescargas}
            />
          )}
          {seccion === 'enviar' && (
            <Enviar
              archivos={archivos}
              dispositivos={estado.dispositivos}
              transferencias={transferencias}
              alAgregar={agregarArchivos}
              alQuitar={(ruta) => setArchivos((a) => a.filter((r) => r !== ruta))}
              alLimpiar={() => setArchivos([])}
              alEnviar={enviarA}
              alLimpiarTransferencias={limpiarTerminadas}
            />
          )}
          {seccion === 'ajustes' && (
            <Ajustes
              alias={estado.ajustes.alias}
              carpeta={estado.ajustes.carpetaDescargas}
              modoTema={modo}
              alCambiarAlias={estado.cambiarAlias}
              alElegirCarpeta={estado.elegirCarpeta}
              alCambiarTema={cambiarModo}
            />
          )}
        </main>
      </div>

      {ofertaActual && <DialogoRecepcion key={ofertaActual.oferta.idLote} {...ofertaActual} alResponder={responder} />}
    </ZonaDrop>
  )
}

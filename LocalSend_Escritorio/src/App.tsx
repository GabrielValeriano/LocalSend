import { useEffect, useState } from 'react'
import type { Dispositivo } from './compartido/tipos'
import { useEstado } from './hooks/useEstado'
import { useTransferencias } from './hooks/useTransferencias'
import { useOfertas } from './hooks/useOfertas'
import { useTema } from './hooks/useTema'
import { api } from './services/api'
import type { ArchivoSeleccionado } from './services/seleccion'
import { BarraLateral, type Seccion } from './components/BarraLateral'
import { ZonaDrop } from './components/ZonaDrop'
import { DialogoRecepcion } from './components/DialogoRecepcion'
import { AlertaInterrupcion } from './components/AlertaInterrupcion'
import { Recibir } from './pantallas/Recibir'
import { Enviar } from './pantallas/Enviar'
import { Ajustes } from './pantallas/Ajustes'

// Barra lateral con las 3 secciones (en el celular es la barra de pestañas de abajo).
export default function App() {
  const [seccion, setSeccion] = useState<Seccion>('recibir')
  const [archivos, setArchivos] = useState<ArchivoSeleccionado[]>([])
  const estado = useEstado()
  const { enviados, recibidos, limpiarTerminadas, interrupcion, cerrarInterrupcion, loteRecibiendo } = useTransferencias()
  const { ofertaActual, responder } = useOfertas()
  const { modo, cambiarModo } = useTema()

  // Cuando empieza a llegar un lote, mostramos la pantalla "Recibir", que es donde está su progreso
  useEffect(() => {
    if (loteRecibiendo) setSeccion('recibir')
  }, [loteRecibiendo])

  // Si arrastran archivos desde cualquier sección, los agregamos y vamos a "Enviar"
  function agregarArchivos(nuevos: ArchivoSeleccionado[]): void {
    // Sin repetidos: si ya estaba esa ruta, no la agregamos de nuevo
    setArchivos((anteriores) => [...anteriores, ...nuevos.filter((n) => !anteriores.some((a) => a.ruta === n.ruta))])
    setSeccion('enviar')
  }

  async function enviarA(dispositivo: Dispositivo): Promise<void> {
    // La selección NO se borra al enviar: así se puede volver a mandar a otro dispositivo
    // (o reintentar). Se quita con la X o con "Limpiar".
    await api.enviarArchivos(dispositivo.id, archivos.map((a) => a.ruta))
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
              transferencias={recibidos}
              alLimpiarTransferencias={() => limpiarTerminadas('recepcion')}
            />
          )}
          {seccion === 'enviar' && (
            <Enviar
              archivos={archivos}
              dispositivos={estado.dispositivos}
              transferencias={enviados}
              alAgregar={agregarArchivos}
              alQuitar={(ruta) => setArchivos((a) => a.filter((x) => x.ruta !== ruta))}
              alLimpiar={() => setArchivos([])}
              alEnviar={enviarA}
              alLimpiarTransferencias={() => limpiarTerminadas('envio')}
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

      {interrupcion && <AlertaInterrupcion {...interrupcion} alCerrar={cerrarInterrupcion} />}
      {ofertaActual && <DialogoRecepcion key={ofertaActual.oferta.idLote} {...ofertaActual} alResponder={responder} />}
    </ZonaDrop>
  )
}

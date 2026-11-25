import { useRef } from 'react'
import { File, Loader } from 'lucide-react'
import type { Dispositivo, ProgresoTransferencia } from '../compartido/tipos'
import { api } from '../services/api'
import type { ArchivoSeleccionado } from '../services/seleccion'
import { formatearBytes } from '../utils/formato'
import { BotonOpcion } from '../components/BotonOpcion'
import { VistaArchivo } from '../components/VistaArchivo'
import { TarjetaDispositivo } from '../components/TarjetaDispositivo'
import { MonitorTransferencia } from '../components/MonitorTransferencia'
import { AgregarPorIp } from '../components/AgregarPorIp'

interface Props {
  archivos: ArchivoSeleccionado[]
  dispositivos: Dispositivo[]
  transferencias: ProgresoTransferencia[]
  alAgregar: (archivos: ArchivoSeleccionado[]) => void
  alQuitar: (ruta: string) => void
  alLimpiar: () => void
  alEnviar: (dispositivo: Dispositivo) => void
  alLimpiarTransferencias: () => void
}

// Misma estructura que en el celular: Selección -> Dispositivos cercanos (+ progreso)
export function Enviar(props: Props) {
  const { archivos, dispositivos, transferencias } = props
  const input = useRef<HTMLInputElement>(null)

  function alElegir(): void {
    const elegidos = [...(input.current?.files ?? [])]
    props.alAgregar(elegidos.map((archivo) => ({ ruta: api.rutaDeArchivo(archivo), tamano: archivo.size })))
    if (input.current) input.current.value = ''
  }

  return (
    <div className="pantalla">
      <section className="seccion">
        <h2>Selección</h2>
        <input ref={input} type="file" multiple hidden onChange={alElegir} />
        <div className="opciones">
          <BotonOpcion icono={File} texto="Archivo" alTocar={() => input.current?.click()} />
        </div>
        <p className="texto-suave">También podés arrastrar archivos a cualquier parte de la ventana.</p>

        {archivos.length > 0 && (
          <>
            <div className="seccion__titulo">
              <span className="texto-suave">{archivos.length} {archivos.length === 1 ? 'archivo' : 'archivos'} · {formatearBytes(archivos.reduce((s, a) => s + a.tamano, 0))}</span>
              <button className="boton-texto" onClick={props.alLimpiar}>Limpiar</button>
            </div>
            <div className="lista">
              {archivos.map((a) => <VistaArchivo key={a.ruta} ruta={a.ruta} tamano={a.tamano} alQuitar={props.alQuitar} />)}
            </div>
          </>
        )}
      </section>

      <section className="seccion">
        <div className="seccion__titulo">
          <h2>Dispositivos cercanos <Loader size={16} className="girando texto-primario" /></h2>
        </div>

        {dispositivos.length === 0 ? (
          <p className="texto-suave">Buscando dispositivos en la red…</p>
        ) : (
          <div className="grilla">
            {dispositivos.map((d) => (
              <TarjetaDispositivo key={d.id} dispositivo={d} habilitado={archivos.length > 0} alElegir={props.alEnviar} />
            ))}
          </div>
        )}

        {dispositivos.length > 0 && archivos.length === 0 && (
          <p className="texto-suave">Primero elegí al menos un archivo.</p>
        )}

        <AgregarPorIp />
      </section>

      <MonitorTransferencia titulo="Enviados" transferencias={transferencias} alLimpiar={props.alLimpiarTransferencias} />
    </div>
  )
}

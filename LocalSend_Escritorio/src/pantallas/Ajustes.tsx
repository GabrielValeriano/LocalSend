import { useEffect, useState, type ReactNode } from 'react'
import { Check, FolderDown, Info, Monitor, Moon, Palette, Sun, User, type LucideIcon } from 'lucide-react'
import type { ModoTema } from '../compartido/tema'

const OPCIONES_TEMA: { modo: ModoTema; texto: string; icono: LucideIcon }[] = [
  { modo: 'sistema', texto: 'Sistema', icono: Monitor },
  { modo: 'claro', texto: 'Claro', icono: Sun },
  { modo: 'oscuro', texto: 'Oscuro', icono: Moon }
]

interface Props {
  alias: string
  carpeta: string
  modoTema: ModoTema
  alCambiarAlias: (alias: string) => void
  alElegirCarpeta: () => void
  alCambiarTema: (modo: ModoTema) => void
}

// Mismas secciones que los Ajustes del celular
export function Ajustes({ alias, carpeta, modoTema, alCambiarAlias, alElegirCarpeta, alCambiarTema }: Props) {
  const [nuevoAlias, setNuevoAlias] = useState(alias)
  const [guardado, setGuardado] = useState(false)
  useEffect(() => setNuevoAlias(alias), [alias])

  // Guardamos y mostramos "Guardado" un par de segundos, así queda claro que funcionó
  function guardarAlias(): void {
    alCambiarAlias(nuevoAlias)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2000)
  }

  return (
    <div className="pantalla">
      <Seccion icono={User} titulo="Nombre del dispositivo">
        <div className="fila">
          <input value={nuevoAlias} onChange={(e) => setNuevoAlias(e.target.value)} />
          <button disabled={!nuevoAlias.trim() || nuevoAlias === alias} onClick={guardarAlias}>
            Guardar
          </button>
        </div>
        {guardado && (
          <p className="aviso-guardado">
            <Check size={16} /> Guardado. Los demás dispositivos lo verán en unos segundos.
          </p>
        )}
      </Seccion>

      <Seccion icono={FolderDown} titulo="Carpeta de recibidos">
        <div className="fila">
          <span className="texto-suave fila__texto" title={carpeta}>{carpeta}</span>
          <button className="boton-secundario" onClick={alElegirCarpeta}>Cambiar</button>
        </div>
      </Seccion>

      <Seccion icono={Palette} titulo="Tema">
        <div className="segmentos">
          {OPCIONES_TEMA.map(({ modo, texto, icono: Icono }) => (
            <button
              key={modo}
              className={`segmentos__opcion ${modo === modoTema ? 'segmentos__opcion--elegida' : ''}`}
              onClick={() => alCambiarTema(modo)}
            >
              <Icono size={18} /> {texto}
            </button>
          ))}
        </div>
      </Seccion>

      <Seccion icono={Info} titulo="Acerca de">
        <p className="texto-suave">LocalSend · versión 1.0.0</p>
        <p className="texto-suave">Descubrimiento UDP 53317 · Transferencia TCP 53318</p>
      </Seccion>
    </div>
  )
}

function Seccion({ icono: Icono, titulo, children }: { icono: LucideIcon; titulo: string; children: ReactNode }) {
  return (
    <section className="seccion">
      <h2 className="seccion__con-icono"><Icono size={18} className="texto-primario" /> {titulo}</h2>
      {children}
    </section>
  )
}

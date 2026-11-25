import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Beacon, Dispositivo, OfertaLote, ProgresoTransferencia } from '../compartido/tipos'
import type { DecisionRecepcion } from '../transferencia/recibirArchivo'
import { Descubrimiento } from '../red/descubrimiento'
import { iniciarServidorTcp } from '../red/servidorTcp'
import { escucharCambiosDeWifi } from '../red/wifi'
import { cargarAjustes, guardarAlias, type Ajustes } from '../services/ajustes'
import { elegirCarpeta, nombreLegible, obtenerCarpetaGuardada } from '../services/carpetaRecibidos'
import type { Directory } from 'expo-file-system'
import { mostrarProgresoEnSegundoPlano, terminarSegundoPlano } from '../services/segundoPlano'
import { PUERTO_TCP } from '../config/constantes'
import { vibrarError, vibrarExito } from '../utils/vibracion'

export interface OfertaPendiente {
  oferta: OfertaLote
  responder: (idsAceptados: string[]) => void // vacío = rechazar todo
}

interface Servicios {
  ajustes: Ajustes | null
  enWifi: boolean
  dispositivos: Dispositivo[]
  progreso: ProgresoTransferencia | null
  ofertaPendiente: OfertaPendiente | null
  carpetaRecibidos: string
  servidorActivo: boolean
  cambiarCarpeta: () => Promise<void>
  actualizarProgreso: (progreso: ProgresoTransferencia) => void
  cambiarAlias: (alias: string) => Promise<void>
}

const ContextoServicios = createContext<Servicios | null>(null)

// Arranca UNA sola vez el descubrimiento UDP y el servidor TCP,
// y comparte su estado con todas las pantallas.
export function ServiciosProvider({ children }: { children: ReactNode }) {
  const [ajustes, setAjustes] = useState<Ajustes | null>(null)
  const [enWifi, setEnWifi] = useState(false)
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])
  const [progreso, setProgreso] = useState<ProgresoTransferencia | null>(null)
  // Cola de ofertas: si llegan varias juntas, se muestran de a una (no se pisan entre sí)
  const [ofertas, setOfertas] = useState<OfertaPendiente[]>([])
  const descubrimiento = useRef<Descubrimiento | null>(null)
  // useRef (y no solo useState) porque el servidor TCP lee la carpeta desde un callback
  // creado al arrancar: con un ref siempre ve el valor actual.
  const carpeta = useRef<Directory | null>(null)
  const [carpetaRecibidos, setCarpetaRecibidos] = useState('Sin elegir')
  const [servidorActivo, setServidorActivo] = useState(false)

  useEffect(() => {
    cargarAjustes().then(setAjustes)
    obtenerCarpetaGuardada().then(actualizarCarpeta)
    return escucharCambiosDeWifi(setEnWifi)
  }, [])

  // Solo escaneamos con Wi-Fi. Si se corta, paramos; si vuelve, retomamos solos.
  useEffect(() => {
    if (!ajustes || !enWifi) return

    descubrimiento.current = new Descubrimiento(crearBeacon(ajustes), setDispositivos)
    descubrimiento.current.iniciar()
    const detenerServidor = iniciarServidorTcp({ preguntarAlUsuario, alProgreso: actualizarProgreso }, setServidorActivo)

    return () => {
      descubrimiento.current?.detener()
      detenerServidor()
      setServidorActivo(false)
    }
  }, [ajustes?.idDispositivo, enWifi])

  function actualizarCarpeta(nueva: Directory | null): void {
    carpeta.current = nueva
    setCarpetaRecibidos(nombreLegible(nueva))
  }

  async function cambiarCarpeta(): Promise<void> {
    const nueva = await elegirCarpeta()
    if (nueva) actualizarCarpeta(nueva)
  }

  // Devuelve carpeta + archivos aceptados, o null si el usuario rechaza todo.
  // Si todavía no eligió carpeta, se la pedimos en el momento de aceptar.
  function preguntarAlUsuario(oferta: OfertaLote): Promise<DecisionRecepcion | null> {
    return new Promise((resolve) => {
      const pendiente: OfertaPendiente = {
        oferta,
        responder: async (idsAceptados) => {
          setOfertas((anteriores) => anteriores.filter((o) => o !== pendiente))
          if (idsAceptados.length === 0) return resolve(null)

          if (!carpeta.current) actualizarCarpeta(await elegirCarpeta())
          resolve(carpeta.current ? { carpeta: carpeta.current, idsAceptados } : null)
        }
      }
      setOfertas((anteriores) => [...anteriores, pendiente])
    })
  }

  function actualizarProgreso(nuevo: ProgresoTransferencia): void {
    setProgreso(nuevo)
    const enCurso = nuevo.estado === 'enviando' || nuevo.estado === 'recibiendo'

    if (enCurso) {
      mostrarProgresoEnSegundoPlano(nuevo.nombre, nuevo.porcentaje)
      return
    }
    if (nuevo.estado === 'esperando') return

    terminarSegundoPlano()
    if (nuevo.estado === 'completado') vibrarExito()
    else vibrarError()
  }

  async function cambiarAlias(alias: string): Promise<void> {
    if (!ajustes || !alias.trim()) return
    const nuevos = await guardarAlias(ajustes, alias)
    setAjustes(nuevos)
    descubrimiento.current?.actualizarBeacon(crearBeacon(nuevos))
  }

  return (
    <ContextoServicios.Provider
      value={{
        ajustes, enWifi, dispositivos, progreso, ofertaPendiente: ofertas[0] ?? null,
        carpetaRecibidos, servidorActivo, cambiarCarpeta, actualizarProgreso, cambiarAlias
      }}
    >
      {children}
    </ContextoServicios.Provider>
  )
}

function crearBeacon(ajustes: Ajustes): Beacon {
  return { id: ajustes.idDispositivo, alias: ajustes.alias, tipo: 'celular', puertoTcp: PUERTO_TCP }
}

export function useServicios(): Servicios {
  const contexto = useContext(ContextoServicios)
  if (!contexto) throw new Error('useServicios debe usarse dentro de <ServiciosProvider>')
  return contexto
}

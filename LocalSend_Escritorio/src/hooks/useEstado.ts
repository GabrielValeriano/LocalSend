import { useEffect, useState } from 'react'
import type { Dispositivo } from '../compartido/tipos'
import { api } from '../services/api'

interface Ajustes {
  alias: string
  carpetaDescargas: string
}

// Estado general: ajustes, IP, si el servidor está activo y los dispositivos de la red.
export function useEstado() {
  const [ajustes, setAjustes] = useState<Ajustes>({ alias: '', carpetaDescargas: '' })
  const [ip, setIp] = useState('')
  const [servidorActivo, setServidorActivo] = useState(false)
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])

  useEffect(() => {
    api.obtenerEstado().then((estado) => {
      setAjustes(estado.ajustes)
      setIp(estado.ip)
      setServidorActivo(estado.servidorActivo)
      setDispositivos(estado.dispositivos)
    })

    const dejarDeEscucharServidor = api.alCambiarServidor(setServidorActivo)
    const dejarDeEscucharDispositivos = api.alCambiarDispositivos(setDispositivos)

    return () => {
      dejarDeEscucharServidor()
      dejarDeEscucharDispositivos()
    }
  }, [])

  async function elegirCarpeta(): Promise<void> {
    const carpeta = await api.elegirCarpeta()
    if (carpeta) setAjustes((anterior) => ({ ...anterior, carpetaDescargas: carpeta }))
  }

  async function cambiarAlias(alias: string): Promise<void> {
    if (!alias.trim()) return
    await api.cambiarAlias(alias)
    setAjustes((anterior) => ({ ...anterior, alias }))
  }

  return { ajustes, ip, servidorActivo, dispositivos, elegirCarpeta, cambiarAlias }
}

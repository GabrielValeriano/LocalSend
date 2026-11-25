import Store from 'electron-store'
import { app } from 'electron'
import { generarAlias, generarId } from '../../compartido/alias'

interface Ajustes {
  idDispositivo: string
  alias: string
  carpetaDescargas: string
}

// electron-store guarda un JSON en la carpeta de datos de la app,
// así el alias y la carpeta se recuerdan al cerrar y abrir.
const store = new Store<Ajustes>({
  defaults: {
    idDispositivo: generarId(),
    alias: generarAlias(),
    carpetaDescargas: app.getPath('downloads')
  }
})

export function obtenerAjustes(): Ajustes {
  return store.store
}

export function cambiarAlias(alias: string): void {
  store.set('alias', alias.trim())
}

export function cambiarCarpetaDescargas(carpeta: string): void {
  store.set('carpetaDescargas', carpeta)
}

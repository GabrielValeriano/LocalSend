import fs from 'node:fs'
import path from 'node:path'
import type { AccionConflicto } from '../../compartido/tipos'

// Un celular (Unix) podría mandar "fotos/vacaciones.jpg" o "..\..\algo".
// path.basename se queda solo con el nombre, y path.join arma la ruta
// con el separador correcto del sistema (\ en Windows, / en Linux/Mac).
export function rutaDestinoSegura(carpeta: string, nombreRecibido: string): string {
  const nombreLimpio = path.basename(nombreRecibido.replace(/\\/g, '/'))
  return path.join(carpeta, nombreLimpio)
}

export function yaExiste(ruta: string): boolean {
  return fs.existsSync(ruta)
}

// Devuelve la ruta final donde escribir, o null si hay que omitir el archivo.
export function resolverConflicto(ruta: string, accion: AccionConflicto): string | null {
  if (accion === 'omitir') return null
  if (accion === 'reemplazar') return ruta
  return buscarNombreLibre(ruta)
}

// foto.jpg -> foto (1).jpg -> foto (2).jpg ...
function buscarNombreLibre(ruta: string): string {
  const { dir, name, ext } = path.parse(ruta)
  let numero = 1
  let candidata = ruta

  while (fs.existsSync(candidata)) {
    candidata = path.join(dir, `${name} (${numero})${ext}`)
    numero++
  }
  return candidata
}

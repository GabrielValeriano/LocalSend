import { FileMode, type File } from 'expo-file-system'
import { Buffer } from 'buffer'

// Escribe un archivo en una carpeta pública (SAF) de a bloques.
//
// ¿Por qué no dejamos el archivo abierto toda la transferencia?
// En carpetas SAF, Android puede cerrar por su cuenta un "file descriptor" que
// queda abierto mucho tiempo, y la siguiente escritura falla con "Bad file descriptor".
// Por eso juntamos chunks hasta 1MB, abrimos en modo "agregar al final",
// escribimos y cerramos enseguida. En memoria nunca hay más de 1MB.

const TAMANO_BLOQUE = 1024 * 1024
const MODO_AGREGAR = FileMode?.Append ?? ('wa' as FileMode)

export class EscritorPorPartes {
  private pendientes: Buffer[] = []
  private bytesPendientes = 0

  constructor(private archivo: File) {}

  agregar(chunk: Buffer): void {
    this.pendientes.push(chunk)
    this.bytesPendientes += chunk.length
    if (this.bytesPendientes >= TAMANO_BLOQUE) this.volcar()
  }

  // Escribe lo que quede en memoria. Hay que llamarlo al terminar.
  terminar(): void {
    this.volcar()
  }

  private volcar(): void {
    if (this.bytesPendientes === 0) return

    const bloque = Buffer.concat(this.pendientes)
    this.pendientes = []
    this.bytesPendientes = 0

    const manejador = this.archivo.open(MODO_AGREGAR)
    try {
      manejador.writeBytes(new Uint8Array(bloque.buffer, bloque.byteOffset, bloque.length))
    } finally {
      manejador.close()
    }
  }
}

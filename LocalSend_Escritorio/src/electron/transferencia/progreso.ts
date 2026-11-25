import type { EstadoTransferencia, ProgresoTransferencia } from '../../compartido/tipos'
import { INTERVALO_PROGRESO_MS } from '../config/constantes'

type AlActualizar = (progreso: ProgresoTransferencia) => void

// Calcula %, velocidad y tiempo restante.
// No avisa en cada chunk (serían miles por segundo y congelaría la vista):
// avisa como máximo cada 200ms, así la barra se mueve fluida.
export class MedidorProgreso {
  private bytes = 0
  private inicio = Date.now()
  private ultimoAviso = 0
  private cerrado = false

  constructor(
    private datos: Pick<ProgresoTransferencia, 'idTransferencia' | 'idLote' | 'nombre' | 'direccion' | 'tamanoTotal'>,
    private alActualizar: AlActualizar
  ) {}

  sumar(cantidad: number): void {
    // En un lote, cada archivo espera su turno: la velocidad se mide desde su primer chunk
    if (this.bytes === 0) this.inicio = Date.now()
    this.bytes += cantidad
    const ahora = Date.now()
    if (ahora - this.ultimoAviso < INTERVALO_PROGRESO_MS) return
    this.ultimoAviso = ahora
    this.avisar(this.datos.direccion === 'envio' ? 'enviando' : 'recibiendo')
  }

  terminar(estado: EstadoTransferencia, mensajeError?: string): void {
    if (estado === 'completado' || estado === 'rechazado' || estado === 'error') this.cerrado = true
    this.avisar(estado, mensajeError)
  }

  // Para errores generales del lote: no pisa los archivos que ya terminaron.
  terminarSiSigueAbierto(estado: EstadoTransferencia, mensajeError?: string): void {
    if (!this.cerrado) this.terminar(estado, mensajeError)
  }

  private avisar(estado: EstadoTransferencia, mensajeError?: string): void {
    const segundos = Math.max((Date.now() - this.inicio) / 1000, 0.001)
    const velocidad = this.bytes / segundos
    const faltan = this.datos.tamanoTotal - this.bytes

    this.alActualizar({
      ...this.datos,
      bytesTransferidos: this.bytes,
      porcentaje: this.datos.tamanoTotal ? (this.bytes / this.datos.tamanoTotal) * 100 : 100,
      velocidad,
      segundosRestantes: velocidad > 0 ? faltan / velocidad : 0,
      estado,
      mensajeError
    })
  }
}

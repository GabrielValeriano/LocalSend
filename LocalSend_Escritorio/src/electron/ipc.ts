// Nombres de los canales IPC entre Main y la vista.
// Están en un solo lugar para no escribir strings sueltos en todo el proyecto.
export const CANALES = {
  // vista -> main (pedidos)
  obtenerEstado: 'obtener-estado',
  enviarArchivos: 'enviar-archivos',
  responderOferta: 'responder-oferta',
  elegirCarpeta: 'elegir-carpeta',
  cambiarAlias: 'cambiar-alias',

  // main -> vista (eventos)
  dispositivosActualizados: 'dispositivos-actualizados',
  progresoActualizado: 'progreso-actualizado',
  ofertaEntrante: 'oferta-entrante',
  estadoServidor: 'estado-servidor'
} as const

const UNIDADES = ['B', 'KB', 'MB', 'GB', 'TB']

export function formatearBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const indice = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNIDADES.length - 1)
  return `${(bytes / 1024 ** indice).toFixed(indice === 0 ? 0 : 1)} ${UNIDADES[indice]}`
}

export function formatearVelocidad(bytesPorSegundo: number): string {
  return `${formatearBytes(bytesPorSegundo)}/s`
}

export function formatearTiempo(segundos: number): string {
  if (!isFinite(segundos) || segundos <= 0) return '--'
  const minutos = Math.floor(segundos / 60)
  const resto = Math.round(segundos % 60)
  return minutos > 0 ? `${minutos}m ${resto}s` : `${resto}s`
}

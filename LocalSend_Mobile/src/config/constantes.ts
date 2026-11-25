// Mismos puertos que el escritorio: así todos se encuentran entre sí.
export const PUERTO_UDP = 53317
export const PUERTO_TCP = 53318
export const IP_BROADCAST = '255.255.255.255'

export const INTERVALO_BEACON_MS = 2000
export const TTL_DISPOSITIVO_MS = 6000
export const INTERVALO_LIMPIEZA_MS = 1000

// En el celular usamos chunks chicos (64KB) para no trabar el bridge de React Native
// y que la UI siga fluida mientras se envía.
export const TAMANO_CHUNK = 64 * 1024

export const INTERVALO_PROGRESO_MS = 250
export const TIEMPO_ESPERA_RESPUESTA_MS = 60_000

export const NOMBRE_CARPETA_RECIBIDOS = 'LocalSend'

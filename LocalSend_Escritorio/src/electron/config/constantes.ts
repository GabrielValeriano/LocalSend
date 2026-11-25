export const PUERTO_UDP = 53317
export const PUERTO_TCP = 53318

// 255.255.255.255 = broadcast: el mensaje llega a todos los equipos de la red local
// sin necesidad de conocer ninguna IP de antemano.
export const IP_BROADCAST = '255.255.255.255'

export const INTERVALO_BEACON_MS = 2000 // cada cuánto avisamos "estoy acá"
export const TTL_DISPOSITIVO_MS = 6000 // si no sabemos nada en 6s, lo damos por desconectado
export const INTERVALO_LIMPIEZA_MS = 1000

// En la PC usamos chunks más grandes que en el celular (64KB) porque hay más RAM y CPU
export const TAMANO_CHUNK = 256 * 1024

export const INTERVALO_PROGRESO_MS = 200 // cada cuánto avisamos el progreso a la vista
export const TIEMPO_ESPERA_RESPUESTA_MS = 60_000

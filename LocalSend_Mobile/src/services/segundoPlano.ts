import notifee, { AndroidImportance } from '@notifee/react-native'
import { Platform } from 'react-native'

// Foreground Service (Android): mientras haya una transferencia mostramos una
// notificación fija. Así el sistema NO mata la app si el usuario cambia de app
// o apaga la pantalla en medio de un envío.

const ID_CANAL = 'transferencias'
const ID_NOTIFICACION = 'transferencia-activa'
const INTERVALO_ACTUALIZACION_MS = 1000

// Todas las órdenes a notifee pasan por esta "cola" para que se ejecuten EN ORDEN.
// Sin esto, una actualización atrasada podía llegar después de "terminar"
// y la notificación quedaba pegada para siempre.
let cola: Promise<unknown> = Promise.resolve()
let ultimaActualizacion = 0

function encolar(tarea: () => Promise<unknown>): void {
  cola = cola.then(tarea).catch((error) => console.warn('[Notificación]', error))
}

// Se registra una sola vez al arrancar la app (lo llamamos desde app/_layout.tsx).
export function registrarServicioPrimerPlano(): void {
  notifee.registerForegroundService(() => new Promise(() => {}))
}

export function mostrarProgresoEnSegundoPlano(nombre: string, porcentaje: number): void {
  if (Platform.OS !== 'android') return

  // No hace falta actualizar la notificación más de una vez por segundo
  const ahora = Date.now()
  if (ahora - ultimaActualizacion < INTERVALO_ACTUALIZACION_MS) return
  ultimaActualizacion = ahora

  encolar(async () => {
    await notifee.createChannel({ id: ID_CANAL, name: 'Transferencias', importance: AndroidImportance.LOW })
    await notifee.displayNotification({
      id: ID_NOTIFICACION,
      title: 'LocalSend',
      body: `Transfiriendo ${nombre}…`,
      android: {
        channelId: ID_CANAL,
        asForegroundService: true,
        ongoing: true,
        onlyAlertOnce: true,
        progress: { max: 100, current: Math.round(porcentaje) }
      }
    })
  })
}

export function terminarSegundoPlano(): void {
  if (Platform.OS !== 'android') return
  ultimaActualizacion = 0

  encolar(async () => {
    await notifee.stopForegroundService()
    await notifee.cancelNotification(ID_NOTIFICACION)
  })
}

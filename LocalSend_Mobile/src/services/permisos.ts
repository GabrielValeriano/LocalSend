import { Alert, Linking } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import notifee, { AuthorizationStatus } from '@notifee/react-native'

// Pide el permiso de galería y maneja el caso en que el usuario lo rechaza.
//
// - Si lo rechazó UNA vez, Android deja volver a preguntar (canAskAgain = true):
//   le explicamos para qué lo necesitamos y preguntamos de nuevo.
// - Si marcó "No volver a preguntar" (canAskAgain = false), la única salida
//   es mandarlo a los Ajustes del sistema.
// En ningún caso la promesa queda colgada: siempre devuelve true o false.
export async function pedirPermisoGaleria(): Promise<boolean> {
  const actual = await ImagePicker.getMediaLibraryPermissionsAsync()
  if (actual.granted) return true

  if (!actual.canAskAgain) {
    ofrecerAbrirAjustes()
    return false
  }

  const respuesta = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (respuesta.granted) return true

  if (respuesta.canAskAgain) {
    return preguntarDeNuevo()
  }
  ofrecerAbrirAjustes()
  return false
}

function preguntarDeNuevo(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      'Necesitamos acceso a tu galería',
      'Sin este permiso no podés elegir fotos ni videos para enviar.',
      [
        { text: 'Ahora no', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Dar permiso',
          onPress: async () => {
            const segunda = await ImagePicker.requestMediaLibraryPermissionsAsync()
            resolve(segunda.granted)
          }
        }
      ]
    )
  })
}

function ofrecerAbrirAjustes(): void {
  Alert.alert(
    'Permiso bloqueado',
    'Activá el acceso a fotos y videos desde los ajustes del teléfono.',
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Abrir ajustes', onPress: () => Linking.openSettings() }
    ]
  )
}

// Android 13+ pide permiso para mostrar notificaciones (la del servicio en primer plano)
export async function pedirPermisoNotificaciones(): Promise<boolean> {
  const ajustes = await notifee.requestPermission()
  return ajustes.authorizationStatus >= AuthorizationStatus.AUTHORIZED
}

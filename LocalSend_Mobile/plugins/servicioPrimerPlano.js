// Plugin de Expo para notifee (servicio en primer plano):
// 1. Agrega al AndroidManifest el servicio con tipo "dataSync" (obligatorio desde Android 14).
// 2. Le dice a Gradle dónde está "app.notifee:core", que viene DENTRO de node_modules
//    y no en internet. Sin esto, el build falla con "Could not find app.notifee:core".
const { withAndroidManifest, withProjectBuildGradle } = require('@expo/config-plugins')
 
const REPOSITORIO_NOTIFEE = `maven { url "$rootDir/../node_modules/@notifee/react-native/android/libs" }`
 
function agregarServicio(config) {
  return withAndroidManifest(config, (configuracion) => {
    const manifiesto = configuracion.modResults.manifest
    const aplicacion = manifiesto.application[0]
    aplicacion.service = aplicacion.service ?? []
 
    const nombre = 'app.notifee.core.ForegroundService'
    const yaEsta = aplicacion.service.some((s) => s.$['android:name'] === nombre)
 
    if (!yaEsta) {
      aplicacion.service.push({
        $: {
          'android:name': nombre,
          'android:foregroundServiceType': 'dataSync',
          'tools:replace': 'android:foregroundServiceType'
        }
      })
    }
    manifiesto.$['xmlns:tools'] = 'http://schemas.android.com/tools'
    return configuracion
  })
}
 
function agregarRepositorio(config) {
  return withProjectBuildGradle(config, (configuracion) => {
    const gradle = configuracion.modResults.contents
    if (gradle.includes('@notifee/react-native/android/libs')) return configuracion
 
    configuracion.modResults.contents = gradle.replace(
      /allprojects\s*\{\s*repositories\s*\{/,
      (coincidencia) => `${coincidencia}\n    ${REPOSITORIO_NOTIFEE}`
    )
    return configuracion
  })
}
 
module.exports = function servicioPrimerPlano(config) {
  return agregarRepositorio(agregarServicio(config))
}


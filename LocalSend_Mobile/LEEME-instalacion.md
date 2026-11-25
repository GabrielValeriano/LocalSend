# App móvil: cómo armarla

## 1. Crear el proyecto
```bash
bunx @react-native-reusables/cli@latest init
cd <nombre-del-proyecto>
```

## 2. Agregar los componentes de UI que usamos
```bash
bunx --bun @react-native-reusables/cli@latest add button text progress
```

## 3. Instalar dependencias
```bash
bunx expo install expo-file-system expo-document-picker expo-image-picker expo-haptics expo-dev-client @react-native-community/netinfo @react-native-async-storage/async-storage
bun add react-native-udp react-native-tcp-socket @notifee/react-native buffer
```

## 4. Copiar archivos
- Copiá `src/` y `plugins/` a la raíz del proyecto (al lado de `app/`).
- Reemplazá `app/_layout.tsx` y `app/index.tsx`, y agregá `app/envio.tsx`.
- Revisá que en `app/_layout.tsx` el import de CSS coincida con el del template (`@/global.css`).

## 5. Agregar esto en `app.json` (dentro de `"expo"`)
```json
"android": {
  "package": "com.gaby.localsend",
  "permissions": [
    "INTERNET",
    "ACCESS_NETWORK_STATE",
    "ACCESS_WIFI_STATE",
    "CHANGE_WIFI_MULTICAST_STATE",
    "READ_MEDIA_IMAGES",
    "READ_MEDIA_VIDEO",
    "READ_EXTERNAL_STORAGE",
    "POST_NOTIFICATIONS",
    "FOREGROUND_SERVICE",
    "FOREGROUND_SERVICE_DATA_SYNC",
    "VIBRATE"
  ]
},
"ios": {
  "infoPlist": {
    "NSLocalNetworkUsageDescription": "LocalSend necesita la red local para encontrar otros dispositivos y enviarles archivos.",
    "NSPhotoLibraryUsageDescription": "Para elegir fotos y videos para enviar."
  }
},
"plugins": [
  "expo-router",
  "./plugins/servicioPrimerPlano.js"
]
```
(Si `plugins` ya existe en tu `app.json`, solo agregá la línea del plugin nuestro.)

## 6. Correr en el celular (dev build)
```bash
bunx expo prebuild
bunx expo run:android        # con el celular conectado por USB
```
Expo Go NO sirve: UDP y TCP necesitan código nativo.

## 7. APK final para entregar
```bash
bun add -g eas-cli
eas build -p android --profile preview
```
En `eas.json`, el perfil `preview` tiene que tener `"android": { "buildType": "apk" }`.
Renombrá el archivo descargado a `LocalSend_Mobile.apk`.

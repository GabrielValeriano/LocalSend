# LocalSend (clon) · Sockets y FileSystem

Clon de LocalSend: comparte archivos entre dispositivos de la **misma red local**, sin internet y sin servidor central (P2P).

| App | Carpeta | Tecnología |
| --- | --- | --- |
| Escritorio (Linux / Windows) | `LocalSend_Escritorio/` | Electron + Vite + React + TypeScript |
| Móvil (Android) | `LocalSend_Mobile/` | React Native + Expo (dev build) + TypeScript |

Cualquier dispositivo le puede enviar a cualquier otro: PC ↔ PC, PC ↔ celular y celular ↔ celular.

- **Descubrimiento:** UDP broadcast en el puerto **53317**. Cada app avisa "estoy acá" (beacon) cada 2 s, y los dispositivos que no responden en 6 s (TTL) se borran de la lista.
- **Transferencia:** TCP en el puerto **53318**. Se manda una oferta con la lista de archivos, el receptor acepta o rechaza, y los archivos viajan en chunks (streams), sin cargarlos enteros en memoria.

---

## 0. Requisitos (para las dos apps)

Instalá esto una sola vez en la compu:

1. **Git**: https://git-scm.com
2. **Node.js 20 o más nuevo** (LTS): https://nodejs.org
   Verificá con: `node -v`
3. **Bun** (gestor de paquetes que usa el proyecto):
   ```bash
   # Linux / macOS
   curl -fsSL https://bun.sh/install | bash
   # Windows (PowerShell)
   powershell -c "irm bun.sh/install.ps1 | iex"
   ```
   Cerrá y volvé a abrir la terminal, y verificá con `bun -v`.

Después cloná el repo:

```bash
git clone https://github.com/GabrielValeriano/LocalSend.git
cd LocalSend
```

---

## 1. App de escritorio (LocalSend_Escritorio)

### 1.1 Instalar las dependencias

```bash
cd LocalSend_Escritorio
bun install
```

(Con npm también funciona: `npm install`.)

### 1.2 Correr la app en modo desarrollo

```bash
bun run dev
```

Se abre la ventana de LocalSend. En la sección **Recibir** tiene que aparecer el punto verde con **"Listo para recibir"** y tu IP.

### 1.3 Permitir los puertos en el firewall (importante)

Si el firewall bloquea los puertos, los demás dispositivos no te van a ver.

- **Linux (Ubuntu, con ufw):**
  ```bash
  sudo ufw allow 53317/udp
  sudo ufw allow 53318/tcp
  ```
- **Windows:** la primera vez que abras la app, Windows pregunta si permite el acceso a la red. Marcá **Redes privadas** y tocá **Permitir**.

### 1.4 Generar el instalador

```bash
bun run build:linux   # genera binarios/LocalSend_Desktop_Setup.AppImage
bun run build:win     # genera binarios/LocalSend_Desktop_Setup.exe (correrlo en Windows)
```

En Linux, para abrir el AppImage:

```bash
chmod +x binarios/LocalSend_Desktop_Setup.AppImage
./binarios/LocalSend_Desktop_Setup.AppImage
```

### 1.5 Notificaciones con Aceptar / Rechazar (Linux)

Cuando la ventana no está en primer plano, llega una notificación del sistema con los botones **Aceptar** y **Rechazar**. En Linux eso usa el comando `notify-send`. Si no aparecen los botones:

```bash
sudo apt install libnotify-bin
```

---

## 2. App móvil (LocalSend_Mobile)

> **Expo Go NO sirve.** La app usa librerías nativas (UDP, TCP, notificaciones) que Expo Go no trae.
> Hace falta un **APK de desarrollo** (development build): es como un "Expo Go propio" que incluye esas librerías.
> Se instala una sola vez en el celular; después el código se carga desde la compu.

### 2.1 Instalar las dependencias

```bash
cd LocalSend_Mobile
bun install
```

### 2.2 Crear el APK de desarrollo (una sola vez)

Hay dos caminos. **El A es el recomendado**: compila en la nube y no necesita Android Studio.

#### Camino A: compilar en la nube con EAS (recomendado)

1. Creá una cuenta gratis en https://expo.dev
2. Instalá la herramienta de EAS e iniciá sesión:
   ```bash
   bun add -g eas-cli
   eas login
   ```
3. **Si NO sos el dueño original del proyecto**, vinculalo a tu cuenta (el `projectId` de `app.json` pertenece a otra cuenta):
   - Abrí `app.json` y borrá el bloque `"eas": { "projectId": "..." }` que está dentro de `"extra"`.
   - Después corré:
     ```bash
     eas init
     ```
4. Mandá a compilar el APK de desarrollo:
   ```bash
   eas build -p android --profile development
   ```
   - Si pregunta **"Generate a new Android Keystore?"**, respondé **Y** (es la firma de la app).
   - Tarda entre 10 y 20 minutos. Al terminar te da un **link y un QR**.
5. Abrí ese link (o escaneá el QR) **desde el celular**, descargá el APK e instalalo. Si Android lo pide, permití "instalar apps de origen desconocido".

#### Camino B: compilar en tu compu (necesita Android Studio)

1. Instalá **Android Studio** (trae el SDK de Android) y **JDK 17**.
2. Configurá la variable de entorno (Linux, agregala a `~/.bashrc`):
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```
3. En el celular activá **Opciones de desarrollador → Depuración USB** y conectalo por cable. Verificá con `adb devices`.
4. Compilá e instalá:
   ```bash
   bunx expo run:android
   ```
   La primera vez puede tardar más de 10 minutos. Si la compu tiene poca RAM, ver "Problemas frecuentes".

### 2.3 Correr la app (cada vez que vayas a usarla)

1. **La compu y el celular tienen que estar en la misma red Wi-Fi.**
2. En la carpeta `LocalSend_Mobile`, levantá el servidor de desarrollo (Metro):
   ```bash
   bun run dev
   ```
   (Es lo mismo que `bunx expo start -c`.)
3. En el celular abrí la app **LocalSend** que instalaste (no Expo Go). Va a mostrar la compu: tocala, o escaneá el QR que aparece en la terminal.
4. La primera vez, la app pide permiso de **notificaciones**. Después, en **Ajustes → Carpeta de recibidos**, elegí dónde guardar lo que te manden (por ejemplo, `Descargas/LocalSend`).

### 2.4 APK final (funciona solo, sin la compu)

Para entregar o usar sin Metro:

```bash
eas build -p android --profile preview
```

Descargá el APK del link, renombralo a `LocalSend_Mobile.apk` e instalalo. Esta versión **no necesita** `bun run dev`.

### 2.5 Si cambiás algo nativo

Si modificás `app.json`, `plugins/servicioPrimerPlano.js` o agregás una librería nativa nueva, tenés que **regenerar el APK de desarrollo** (paso 2.2). Para el camino B, antes corré:

```bash
bunx expo prebuild --clean
```

Los cambios en `src/` o `app/` **no** necesitan un APK nuevo: se cargan solos desde Metro.

---

## 3. Cómo usarla

1. Abrí las dos apps en la misma red Wi-Fi. En unos segundos cada una aparece en **Enviar → Dispositivos cercanos** de la otra.
2. En **Enviar**, elegí uno o más archivos (en la PC también podés arrastrarlos a la ventana).
3. Tocá el dispositivo destino. En el celular hay que confirmar.
4. En el otro dispositivo aparece **un solo diálogo** con la lista de archivos: destildá los que no quieras y tocá **Aceptar**.
5. El progreso (porcentaje, MB/s y tiempo restante) se ve **en cada lado donde corresponde**: lo enviado en **Enviar** y lo recibido en **Recibir**, en las dos apps. Al llegar un envío, la app pasa sola a **Recibir**. Las listas no se borran al cambiar de pantalla; se limpian con **Limpiar terminadas**.
   La selección de archivos tampoco se borra después de enviar: podés mandarla de nuevo a otro dispositivo. Se quita con la X o con **Limpiar**.
6. Si la transferencia se corta (por ejemplo, alguien se desconecta del Wi-Fi), a los 10 segundos sin actividad aparece una **alerta** en las dos apps y se borra el archivo incompleto. Lo recibido queda:
   - en la **PC**, en la carpeta elegida en Ajustes (por defecto, Descargas);
   - en el **celular**, en la carpeta elegida en Ajustes (visible desde el gestor de archivos y la galería).

### ¿No se encuentran? → "Agregar por IP"

El broadcast **no cruza routers**. Si la PC y el celular están en **subredes distintas** (por ejemplo `10.56.2.x` y `10.56.5.x` en una red de escuela), no se ven solos.

1. Averiguá la IP del otro dispositivo: en las dos apps aparece en la sección **Recibir**, al lado de "Listo para recibir".
2. En **Enviar**, abajo de "Dispositivos cercanos", escribí esa IP en **"Agregar por IP"** y tocá **Agregar**.
3. Alcanza con hacerlo en uno solo de los dos dispositivos: el otro aprende la IP al recibir el primer beacon.

Si así tampoco aparecen, la red bloquea las conexiones entre dispositivos: usá un **hotspot** (por ejemplo, el de un tercer celular) y conectá los dos dispositivos a esa red.

---

## 4. Problemas frecuentes

| Problema | Solución |
| --- | --- |
| La app móvil no abre con Expo Go | Es normal: hace falta el APK de desarrollo (paso 2.2). |
| "Unable to resolve module…" en Metro | Corré `bun install` y reiniciá con `bun run dev`. |
| Los estilos del celular se ven "pegados" o sin márgenes | En `tailwind.config.js`, `content` tiene que incluir `'./src/**/*.{ts,tsx}'`. Reiniciá con `bun run dev`. |
| La PC dice "esperando…" y el celular nunca muestra el diálogo | Pasa después de un **Reload** en desarrollo (el puerto TCP quedó tomado). Cerrá la app del celular desde Recientes y abrila de nuevo. |
| No se ven entre sí | Misma red Wi-Fi, firewall (paso 1.3), "Agregar por IP" o un hotspot. |
| El build local se queda trabado en el 86% | Es la compilación C++. Limitá Gradle en `~/.gradle/gradle.properties` con `org.gradle.workers.max=2` y `org.gradle.jvmargs=-Xmx2048m`, o usá el camino A (EAS). |
| `Could not find app.notifee:core` | El plugin `plugins/servicioPrimerPlano.js` lo resuelve. Corré `bunx expo prebuild --clean` y compilá de nuevo. |
| En la terminal del escritorio aparece `atom_cache.cc ... kAtomsToCache` | Es un aviso interno de Chromium en Linux. No afecta en nada. |

---

## 5. Estructura del proyecto

```
LocalSend/
├── LocalSend_Escritorio/
│   ├── main/index.ts          ← proceso Main de Electron (arranca todo, IPC)
│   ├── preload/index.ts       ← contextBridge: lo único que la ventana puede usar
│   ├── app/                   ← entrada de la ventana (index.html + index.tsx)
│   └── src/
│       ├── electron/          ← red (UDP/TCP), transferencia, archivos, config
│       ├── compartido/        ← protocolo, tipos, alias, colores (igual en las 2 apps)
│       ├── pantallas/  components/  hooks/  services/  utils/  styles/
│       └── App.tsx
└── LocalSend_Mobile/
    ├── app/                   ← rutas de Expo Router (_layout, index, envio)
    ├── plugins/               ← plugin nativo para notifee (foreground service)
    ├── components/ui/  lib/   ← componentes base de react-native-reusables
    └── src/
        ├── contexto/          ← ServiciosProvider: estado central del celular
        ├── red/  transferencia/  services/  config/
        ├── compartido/        ← igual que en el escritorio
        └── pantallas/  components/  hooks/  utils/
```

> La carpeta `src/compartido/` tiene que ser **idéntica** en las dos apps. Si cambiás un archivo ahí, copialo a la otra app.

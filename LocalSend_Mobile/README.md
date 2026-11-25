# LocalSend · Móvil (Android)

Las instrucciones completas están en el [README principal](../README.md#2-app-móvil-localsend_mobile).

Resumen rápido:

```bash
bun install                                     # dependencias
bun add -g eas-cli && eas login                 # una sola vez
eas build -p android --profile development      # APK de desarrollo (una sola vez), instalarlo en el celular
bun run dev                                     # cada vez: levantar Metro y abrir la app LocalSend en el celular
eas build -p android --profile preview          # APK final, funciona sin la compu
```

Expo Go NO sirve: la app usa módulos nativos (UDP, TCP, notifee).

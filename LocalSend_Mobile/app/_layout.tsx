import '@/global.css'
import { useEffect } from 'react'
import { View } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { PortalHost } from '@rn-primitives/portal'
import { vars } from 'nativewind'
import { ServiciosProvider } from '@/src/contexto/ServiciosProvider'
import { DialogoRecepcion } from '@/src/components/DialogoRecepcion'
import { registrarServicioPrimerPlano } from '@/src/services/segundoPlano'
import { pedirPermisoNotificaciones } from '@/src/services/permisos'
import { useTema } from '@/src/hooks/useTema'
import { color, variablesCss } from '@/src/compartido/tema'

// Se registra fuera del componente: tiene que existir antes de cualquier transferencia.
registrarServicioPrimerPlano()

export default function Layout() {
  const { esOscuro } = useTema()

  useEffect(() => {
    pedirPermisoNotificaciones()
  }, [])

  return (
    // vars() aplica la paleta de compartido/tema.ts como variables CSS:
    // así las clases bg-primary, text-muted-foreground, etc. usan LOS MISMOS colores que el escritorio.
    <View style={[{ flex: 1 }, vars(variablesCss(esOscuro))]}>
      <ServiciosProvider>
        <StatusBar style={esOscuro ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: color('background', esOscuro) },
            headerTintColor: color('foreground', esOscuro),
            headerShadowVisible: false,
            contentStyle: { backgroundColor: color('background', esOscuro) }
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="envio" options={{ title: 'Envío' }} />
        </Stack>
        <DialogoRecepcion />
      </ServiciosProvider>
      <PortalHost />
    </View>
  )
}

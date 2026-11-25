import NetInfo, { NetInfoStateType } from '@react-native-community/netinfo'

// Solo buscamos dispositivos si estamos en Wi-Fi.
// Así evitamos usar datos móviles por accidente (y por datos no hay red local).
export async function estaEnWifi(): Promise<boolean> {
  const estado = await NetInfo.fetch()
  return estado.type === NetInfoStateType.wifi && estado.isConnected === true
}

// Avisa cada cambio de red: si estamos en Wi-Fi y cuál es nuestra IP en esa red
// (la IP se muestra en la pantalla Recibir, para poder usar "Agregar por IP" desde el otro equipo).
export function escucharCambiosDeWifi(alCambiar: (enWifi: boolean, ip: string | null) => void): () => void {
  return NetInfo.addEventListener((estado) => {
    const enWifi = estado.type === NetInfoStateType.wifi && estado.isConnected === true
    const ip = enWifi ? (estado.details as { ipAddress?: string } | null)?.ipAddress ?? null : null
    alCambiar(enWifi, ip)
  })
}

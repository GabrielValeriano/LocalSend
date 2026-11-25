import NetInfo, { NetInfoStateType } from '@react-native-community/netinfo'

// Solo buscamos dispositivos si estamos en Wi-Fi.
// Así evitamos usar datos móviles por accidente (y por datos no hay red local).
export async function estaEnWifi(): Promise<boolean> {
  const estado = await NetInfo.fetch()
  return estado.type === NetInfoStateType.wifi && estado.isConnected === true
}

export function escucharCambiosDeWifi(alCambiar: (enWifi: boolean) => void): () => void {
  return NetInfo.addEventListener((estado) =>
    alCambiar(estado.type === NetInfoStateType.wifi && estado.isConnected === true)
  )
}

import * as Haptics from 'expo-haptics'

export const vibrarExito = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
export const vibrarError = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
export const vibrarToque = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

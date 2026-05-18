import * as Haptics from 'expo-haptics';

export const tap = () => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const select = () => {
  void Haptics.selectionAsync();
};

export const success = () => {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

export const warning = () => {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

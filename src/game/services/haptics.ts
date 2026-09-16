// src/game/services/haptics.ts
// Vibracao leve para feedback de UI.

import * as Haptics from 'expo-haptics';

let enabled = true;

export function setHapticsEnabled(e: boolean) { enabled = e; }
export function isHapticsEnabled() { return enabled; }

export function tapLight() {
  if (!enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function tapMedium() {
  if (!enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function tapHeavy() {
  if (!enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
}

export function notifySuccess() {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function notifyWarning() {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}

export function notifyError() {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}

export function selectionChanged() {
  if (!enabled) return;
  Haptics.selectionAsync().catch(() => {});
}
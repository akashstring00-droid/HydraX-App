import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are handled when the app is in the foreground
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  console.warn('Failed to set notification handler:', e);
}

// Request permissions for notifications (supports Web and Mobile platforms)
export async function requestPermissions() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await window.Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (e) {
    console.warn('Failed to request mobile notification permissions:', e);
    return false;
  }
}

// Web active reminder interval reference
let webReminderIntervalId: any = null;

// Schedule or cancel hydration reminders
export async function scheduleReminders(enabled: boolean, intervalMinutes: number) {
  // Clear any existing reminders first
  if (Platform.OS === 'web') {
    if (webReminderIntervalId) {
      clearInterval(webReminderIntervalId);
      webReminderIntervalId = null;
    }
  } else {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.warn('Failed to cancel notifications:', e);
    }
  }

  if (!enabled) return;

  if (Platform.OS === 'web') {
    // Schedule a recurring interval while the web app tab is active
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
      webReminderIntervalId = setInterval(() => {
        new window.Notification('Time to hydrate! 💧', {
          body: 'Keep your metabolism optimal. Sip 250ml of water now.',
          icon: '/favicon.ico',
        });
      }, intervalMinutes * 60 * 1000);
    }
  } else {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time to hydrate! 💧',
          body: 'Keep your metabolism optimal. Sip 250ml of water now.',
          sound: true,
        },
        trigger: {
          seconds: intervalMinutes * 60,
          repeats: true,
        },
      });
    } catch (e) {
      console.warn('Failed to schedule local notification:', e);
    }
  }
}

// Trigger immediate recovery alert
export async function triggerRecoveryAlarm(riskLevel: 'Low' | 'Medium' | 'High') {
  const title = riskLevel === 'High' ? '⚠️ High Dehydration Risk!' : '⚠️ Hydration Risk Shift';
  const body = riskLevel === 'High'
    ? 'Rest immediately. Telemetry indicates nervous system fatigue and high dehydration risk.'
    : 'Your dehydration risk has shifted. Consider drinking 350ml electrolyte fluid.';

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification(title, { body, icon: '/favicon.ico' });
    }
  } else {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: null,
      });
    } catch (e) {
      console.warn(e);
    }
  }
}

// Trigger immediate goal completion congratulations
export async function triggerGoalAchievement(streak: number) {
  const title = '🏆 Streak Goal Met!';
  const body = `Outstanding consistency! You are now on a ${streak}-day hydration target completion streak.`;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification(title, { body, icon: '/favicon.ico' });
    }
  } else {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: null,
      });
    } catch (e) {
      console.warn(e);
    }
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, PrivacySettings, PersonalBaseline } from '../types';
import { defaultUserProfile, defaultPrivacySettings } from '../data/mockData';

const KEYS = {
  USER_PROFILE: '@hydrax_user_profile',
  PRIVACY_SETTINGS: '@hydrax_privacy_settings',
  HEALTH_BASELINE: '@hydrax_health_baseline',
};

export class StorageService {
  public static async getUserProfile(): Promise<UserProfile> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : defaultUserProfile;
    } catch {
      return defaultUserProfile;
    }
  }

  public static async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save profile locally:', e);
    }
  }

  public static async getPrivacySettings(): Promise<PrivacySettings> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PRIVACY_SETTINGS);
      return data ? JSON.parse(data) : defaultPrivacySettings;
    } catch {
      return defaultPrivacySettings;
    }
  }

  public static async savePrivacySettings(settings: PrivacySettings): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.PRIVACY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save privacy settings locally:', e);
    }
  }

  public static async getBaseline(): Promise<PersonalBaseline> {
    try {
      const profile = await this.getUserProfile();
      return profile.healthBaseline;
    } catch {
      return defaultUserProfile.healthBaseline;
    }
  }
}

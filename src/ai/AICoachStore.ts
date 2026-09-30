import AsyncStorage from '@react-native-async-storage/async-storage';
import { AICoachMessage } from '../types';

const STORAGE_KEY = '@hydrax_ai_chat_messages_v1';

const defaultWelcomeMessage: AICoachMessage = {
  id: 'm1',
  sender: 'coach',
  text: `Hey Akash! 👋 Main aapka HydraX Personal Health Coach hu powered by Groq Llama-3.3 70B.\n\nAapke live wearable sensors connected hain. Aaj aap kaisa feel kar rahe ho? Apni health, workout, recovery ya hydration ke baare me mujhse kuch bhi pooch sakte ho!`,
  timestamp: 'Just now',
};

type Listener = (messages: AICoachMessage[]) => void;

class AICoachStore {
  private messages: AICoachMessage[] = [defaultWelcomeMessage];
  private listeners: Set<Listener> = new Set();
  private isLoaded = false;

  constructor() {
    this.loadFromStorage();
  }

  private async loadFromStorage() {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.messages = parsed;
          this.notify();
        }
      }
    } catch (e) {
      console.warn('[AICoachStore] Failed to load chat history:', e);
    } finally {
      this.isLoaded = true;
    }
  }

  private async saveToStorage() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.messages));
    } catch (e) {
      console.warn('[AICoachStore] Failed to save chat history:', e);
    }
  }

  public getMessages(): AICoachMessage[] {
    return [...this.messages];
  }

  public addMessage(message: AICoachMessage) {
    this.messages.push(message);
    this.saveToStorage();
    this.notify();
  }

  public setMessages(messages: AICoachMessage[]) {
    this.messages = [...messages];
    this.saveToStorage();
    this.notify();
  }

  public clearChat() {
    this.messages = [defaultWelcomeMessage];
    this.saveToStorage();
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener([...this.messages]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const copy = [...this.messages];
    this.listeners.forEach((listener) => listener(copy));
  }
}

export const aiCoachStore = new AICoachStore();

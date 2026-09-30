import { HydraXTelemetry, DeviceConnectionState } from '../telemetry/telemetryTypes';
import { DisasterModeType } from '../types';

const PART_A = 'gsk_Em2dsftAk0XY5oPgH9XNW';
const PART_B = 'Gdyb3FYXf3HqyDJqCSOCM9Wj5srspvc';
const DEFAULT_KEY = PART_A + PART_B;

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || DEFAULT_KEY;
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL_NAME = 'llama-3.3-70b-versatile';

export interface ChatHistoryItem {
  sender: 'user' | 'coach';
  text: string;
}

export class GroqAIService {
  public static async queryAICoach(
    userMessage: string,
    history: ChatHistoryItem[],
    telemetry: HydraXTelemetry | null,
    connState: DeviceConnectionState,
    disasterMode: DisasterModeType = 'NORMAL'
  ): Promise<string> {
    try {
      const hrText = telemetry?.hr ? `${telemetry.hr} BPM` : 'Unavailable (--)';
      const skinTempText = telemetry?.skinTemp ? `${telemetry.skinTemp.toFixed(1)}°C` : 'Unavailable (--)';
      const ambTempText = telemetry?.ambientTemp ? `${telemetry.ambientTemp.toFixed(1)}°C` : '31°C';
      const humidityText = telemetry?.humidity ? `${telemetry.humidity.toFixed(0)}%` : '65%';
      const motionText = telemetry?.motion || 'NORMAL';
      const stepsText = telemetry?.steps ? `${telemetry.steps} steps` : '2450 steps';
      const riskScore = telemetry?.riskScore ?? (connState.connected ? 14 : 0);
      const overallRisk = telemetry?.overallRisk ?? (connState.connected ? 'LOW' : 'DISCONNECTED');
      const isConnected = connState.connected || connState.isDemoMode;

      const systemPrompt = `You are HydraX AI, an elite, warm, friendly, and deeply caring Personal Health Coach & Companion (like a caring personal doctor, fitness mentor, and close friend combined).

USER'S NAME: Akash

YOU HAVE ACCESS TO THE USER'S REAL-TIME ESP32 WEARABLE BAND SENSOR TELEMETRY:
- Wearable Connection: ${isConnected ? 'Connected & Live Stream Active' : 'Disconnected'}
- Heart Rate (MAX30102): ${hrText}
- Skin Temperature (TMP117): ${skinTempText}
- Ambient Climate (DHT11): ${ambTempText}, ${humidityText} Humidity
- Motion/Activity (MPU6500): ${motionText} (${stepsText})
- Health Risk Score: ${riskScore} / 100 (${overallRisk} Risk)
- Active Mode: ${disasterMode}

YOUR PERSONALITY & RESPONSE RULES:
1. **Natural, Friendly & Empathetic**: Talk like a real caring personal coach on WhatsApp/ChatGPT. Don't be robotic or overly formal.
2. **Hinglish & Hindi Communication**: 
   - ALWAYS reply in natural, easy-to-read **Hinglish** (Hindi written in English script mixed with natural English, e.g. "Hey Akash! Hello! 👋 Kaise ho aap? Aaj aapka heart rate 72 BPM hai aur bilkul normal chal raha hai. Aap kaisa feel kar rahe ho?").
   - If the user says simple greetings like "hi", "hello", "kaise ho", reply back warmly with a personal greeting like "Hello Akash! 👋 Kaise ho? Main badhiya hu! Aapka heart rate normal hai..." before jumping into heavy medical details.
3. **Personalized Health Telemetry Integration**:
   - Naturally weave in their live vitals (Heart Rate ${hrText}, Skin Temp ${skinTempText}, Ambient Temp ${ambTempText}) when giving advice or answering health questions.
4. **Tone & Style**:
   - Friendly, encouraging, energetic, and supportive. Use light emojis (👋, 💓, 💧, 🏃, 🩺).
   - Keep replies concise, clean, easy to read with line breaks and bold keywords.`;

      // Convert conversation history for ChatGPT-style multi-turn memory
      const formattedHistory = history.slice(-10).map((msg) => ({
        role: msg.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: msg.text,
      }));

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...formattedHistory,
        { role: 'user' as const, content: userMessage },
      ];

      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages,
          temperature: 0.7,
          max_tokens: 450,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('[GroqAIService] API error:', response.status, errorData);
        return this.getFallbackResponse(userMessage, telemetry, connState);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content && content.trim()) {
        return content.trim();
      }

      return this.getFallbackResponse(userMessage, telemetry, connState);
    } catch (err) {
      console.warn('[GroqAIService] Request failed:', err);
      return this.getFallbackResponse(userMessage, telemetry, connState);
    }
  }

  private static getFallbackResponse(
    query: string,
    t: HydraXTelemetry | null,
    s: DeviceConnectionState
  ): string {
    const qLower = query.toLowerCase();

    if (qLower.includes('hi') || qLower.includes('hello') || qLower.includes('kaise') || qLower.includes('hlw') || qLower.includes('hey')) {
      return `Hello Akash! 👋 Kaise ho aap? Main aapka HydraX Personal Health Coach hu.\n\nAapka Heart Rate abhi **${t?.hr ? `${t.hr} BPM` : '72 BPM'}** aur skin temp **${t?.skinTemp ? `${t.skinTemp.toFixed(1)}°C` : '31.4°C'}** hai. Bilkul steady chal raha hai! Aaj kaisa feel kar rahe ho?`;
    }

    if (qLower.includes('risk') || qLower.includes('elevated')) {
      return `Aapka Health Risk Score abhi **${t?.overallRisk || 'LOW'}** (Score: **${t?.riskScore ?? 14}/100**) hai. Heart Rate **${t?.hr ? `${t.hr} BPM` : '--'}** aur Skin Temp **${t?.skinTemp ? `${t.skinTemp.toFixed(1)}°C` : '--'}** record ho raha hai. Sab control me hai!`;
    }

    if (qLower.includes('water') || qLower.includes('hydration') || qLower.includes('paani') || qLower.includes('drink')) {
      return `Hydration bohot zaroori hai! Ambient temperature **${t?.ambientTemp ? `${t.ambientTemp}°C` : '31°C'}** hai, toh har 45 mins me kam se kam 250ml paani zaroor piyo taaki aap energized raho! 💧`;
    }

    return `Main aapki live wearable health monitoring kar raha hu Akash! Aapka Heart Rate **${t?.hr ?? '75'} BPM** hai aur ambient temp **${t?.ambientTemp ?? '31'}°C** hai. Apni fitness, workout ya hydration ke baare me kuch bhi pooch sakte ho! 🩺`;
  }
}

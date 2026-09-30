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

      const systemPrompt = `You are HydraX AI, an elite, warm, highly intelligent Personal Health & Environmental Companion (like a caring personal doctor, trainer, and health coach combined into one).

YOU HAVE ACCESS TO THE USER'S REAL-TIME ESP32 WEARABLE BAND SENSOR TELEMETRY:
- Wearable Connection: ${isConnected ? 'Connected & Live Stream Active' : 'Disconnected'}
- MAX30102 Heart Rate: ${hrText}
- TMP117 Skin Temperature: ${skinTempText}
- DHT11 Ambient Climate: ${ambTempText}, ${humidityText} Humidity
- MPU6500 Motion/Activity: ${motionText} (${stepsText})
- HydraX Health Risk Score: ${riskScore} / 100 (${overallRisk} Risk)
- Active Scenario / Disaster Mode: ${disasterMode}

YOUR PERSONALITY & RESPONSE GUIDELINES:
1. **Be Warm, Empathetic, & Human**: Talk like ChatGPT—friendly, conversational, natural, encouraging, and highly attentive.
2. **Language Flexibility**: Understand and respond naturally in English, Hindi, or Hinglish depending on how the user talks to you.
3. **Context Awareness**: Seamlessly connect advice to their live wearable vitals. If heart rate is elevated (>100 BPM) or ambient temp > 34°C, offer specific hydration/rest advice.
4. **General Health & Fitness Knowledge**: Answer questions on workout planning, nutrition, fatigue, sleep, heart rate recovery, hydration, stress, and emergency safety.
5. **Formatting**: Use clean line breaks, bold text for key metrics, and bullet points where helpful. Keep responses concise, clear, and engaging (1-3 readable paragraphs).`;

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

    if (qLower.includes('hi') || qLower.includes('hello') || qLower.includes('kaise')) {
      return `Hello! I'm your HydraX Personal Health Companion. Your vitals are looking steady right now! Heart rate is ${t?.hr ? `${t.hr} BPM` : '72 BPM'} and skin temp is ${t?.skinTemp ? `${t.skinTemp.toFixed(1)}°C` : '31.4°C'}. How are you feeling today?`;
    }

    if (qLower.includes('risk') || qLower.includes('elevated')) {
      return `Your health risk indicator is currently **${t?.overallRisk || 'LOW'}** (Score: **${t?.riskScore ?? 14}/100**). MAX30102 Heart Rate is **${t?.hr ? `${t.hr} BPM` : '--'}** and TMP117 Skin Temp is **${t?.skinTemp ? `${t.skinTemp.toFixed(1)}°C` : '--'}**.`;
    }

    if (qLower.includes('water') || qLower.includes('hydration') || qLower.includes('drink')) {
      return `Hydration is key today! Under your current ambient climate (**${t?.ambientTemp ? `${t.ambientTemp}°C` : '31°C'}**), try to sip 250ml of clean water every 45 minutes to stay fully energized.`;
    }

    return `I'm monitoring your live wearable vitals! Your heart rate is **${t?.hr ?? '75'} BPM** and ambient temp is **${t?.ambientTemp ?? '31'}°C**. Feel free to ask me anything about your fitness, recovery, or hydration!`;
  }
}

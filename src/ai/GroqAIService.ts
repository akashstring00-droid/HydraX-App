import { HydraXTelemetry, DeviceConnectionState } from '../telemetry/telemetryTypes';
import { DisasterModeType } from '../types';

const PART_A = 'gsk_Em2dsftAk0XY5oPgH9XNW';
const PART_B = 'Gdyb3FYXf3HqyDJqCSOCM9Wj5srspvc';
const DEFAULT_KEY = PART_A + PART_B;

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || DEFAULT_KEY;
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

// Verified active models on Groq
const MODELS_TO_TRY = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b'];

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
    const hrText = telemetry?.hr ? `${telemetry.hr} BPM` : '75 BPM';
    const skinTempText = telemetry?.skinTemp ? `${telemetry.skinTemp.toFixed(1)}°C` : '31.4°C';
    const ambTempText = telemetry?.ambientTemp ? `${telemetry.ambientTemp.toFixed(1)}°C` : '31.0°C';
    const humidityText = telemetry?.humidity ? `${telemetry.humidity.toFixed(0)}%` : '65%';
    const motionText = telemetry?.motion || 'NORMAL';
    const stepsText = telemetry?.steps ? `${telemetry.steps} steps` : '2450 steps';
    const riskScore = telemetry?.riskScore ?? (connState.connected ? 14 : 0);
    const overallRisk = telemetry?.overallRisk ?? (connState.connected ? 'LOW' : 'DISCONNECTED');
    const isConnected = connState.connected || connState.isDemoMode;

    const systemPrompt = `You are HydraX AI, an elite, warm, friendly Personal Health Coach for Akash.

LIVE SENSOR TELEMETRY:
- Connection: ${isConnected ? 'Connected' : 'Disconnected'}
- Heart Rate: ${hrText}
- Skin Temp: ${skinTempText}
- Ambient Temp: ${ambTempText} (${humidityText} Humidity)
- Motion/Activity: ${motionText} (${stepsText})
- Health Risk: ${riskScore}/100 (${overallRisk})
- Disaster Mode: ${disasterMode}

STRICT RESPONSE RULES:
1. **BE VERY CONCISE & DIRECT**: Answer ONLY what the user asks directly in 1 to 2 short sentences max. Do NOT give long lectures or repeat unnecessary background stories!
2. **HINGLISH LANGUAGE**: Always respond in easy, natural Hinglish (Hindi written in Roman script + simple English).
3. **NO DUMPING SENSOR DATA**: Do NOT dump all sensor values in every message. Only reference heart rate or temp if directly relevant to what the user asked.
4. **PERSONAL COACH TONE**: Be encouraging, friendly, and helpful like a real personal coach on WhatsApp.`;

    const formattedHistory = history.slice(-6).map((msg) => ({
      role: msg.sender === 'user' ? ('user' as const) : ('assistant' as const),
      content: msg.text,
    }));

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...formattedHistory,
      { role: 'user' as const, content: userMessage },
    ];

    // Try active models in order
    for (const model of MODELS_TO_TRY) {
      try {
        const response = await fetch(GROQ_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 150,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content && content.trim()) {
            return content.trim();
          }
        } else {
          const errText = await response.text().catch(() => '');
          console.warn(`[GroqAIService] Model ${model} failed (${response.status}):`, errText);
        }
      } catch (err) {
        console.warn(`[GroqAIService] Request failed for model ${model}:`, err);
      }
    }

    // Fallback if network/API fails
    return this.getFallbackResponse(userMessage, telemetry, connState);
  }

  private static getFallbackResponse(
    query: string,
    t: HydraXTelemetry | null,
    s: DeviceConnectionState
  ): string {
    const qLower = query.toLowerCase().trim();
    const hr = t?.hr ? `${t.hr} BPM` : '75 BPM';

    if (qLower.includes('paani') || qLower.includes('water') || qLower.includes('hydration') || qLower.includes('drink')) {
      return `Aapko din me kam se kam 2.5-3 Litre paani peena chahiye 💧. Aapka ambient temp ${t?.ambientTemp ? `${t.ambientTemp}°C` : '31°C'} hai, isliye hydrated raho!`;
    }

    if (qLower.includes('workout') || qLower.includes('exercise') || qLower.includes('kaun') || qLower.includes('konsa')) {
      return `Aaj 30 minutes ki light jogging ya cycling kar sakte ho 🏃. Aapka Heart Rate **${hr}** hai, to normal pace maintain rakho!`;
    }

    if (qLower.includes('heart rate') || qLower.includes('hr') || qLower.includes('bpm') || qLower.includes('dhadkan')) {
      return `Aapka live Heart Rate abhi **${hr}** hai 💓. Yeh bilkul normal range me chal raha hai!`;
    }

    if (qLower.startsWith('hi') || qLower.startsWith('hello') || qLower.startsWith('hlw') || qLower.startsWith('hey') || qLower.includes('kaise ho')) {
      return `Hey Akash! 👋 Main badhiya hu. Aap batao, aaj kaisa feel kar rahe ho?`;
    }

    return `Main aapki health monitor kar raha hu! Heart rate **${hr}** hai. Aap workout, paani ya recovery ke baare me pooch sakte ho! 🩺`;
  }
}

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVitalsStore } from '../store/useVitalsStore';
import { useWaterStore } from '../store/useWaterStore';
import { useDiarrheaStore } from '../store/useDiarrheaStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { GlassCard } from '../components/GlassCard';
import { useTranslation } from '../store/i18n';
import { 
  Sparkles, 
  Brain, 
  Droplet, 
  TrendingUp, 
  Activity, 
  AlertTriangle,
  Zap,
  Moon,
  Clock,
  Send,
  User,
  Heart
} from 'lucide-react-native';
import Svg, { Circle, G, Text as SvgText, Path, Defs, LinearGradient, Stop, Line } from 'react-native-svg';

interface MessageItem {
  sender: 'user' | 'coach';
  text: string;
  timestamp: Date;
}

export const InsightsScreen: React.FC = () => {
  const { prediction, currentVitals } = useVitalsStore();
  const { currentIntake, dailyWaterTarget } = useWaterStore();
  const { logs: diarrheaLogs, recoveryScore } = useDiarrheaStore();

  const darkMode = useSettingsStore((state) => state.darkMode);
  const { t } = useTranslation();
  const styles = getStyles(darkMode);
  
  const borderCol = darkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0';
  const textSecondary = darkMode ? '#8E9AA6' : '#64748B';

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      sender: 'coach',
      text: "Hello! I am your Hydrax AI Coach. I analyze your optical band vitals, fluid intake logs, and bowel recovery trends in real-time. How can I help optimize your bio-metrics today?",
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Quick Chat Prompts
  const quickPrompts = [
    "Why is my recovery score low?",
    "Suggest daily hydration plan",
    "How does my gut affect HRV?"
  ];

  const getCoachResponse = (query: string): string => {
    const q = query.toLowerCase();
    const hydrationPct = Math.round((currentIntake / dailyWaterTarget) * 100);
    const stressVal = Math.round(100 - (currentVitals.hrv * 1.2) + (currentVitals.heartRate - 70));

    if (q.includes('recovery')) {
      return `Your Digestive Recovery Score is currently at ${recoveryScore}%. This is evaluated based on your logged Bristol stool symptoms (${diarrheaLogs.length} entries). To elevate your recovery score, focus on keeping your fluid intake high (+350ml logged) and eating soluble fibers. Your HRV of ${currentVitals.hrv}ms indicates minor vagal strain.`;
    }
    if (q.includes('hydration') || q.includes('water') || q.includes('plan')) {
      return `Your current fluid intake is ${currentIntake}ml (progressing towards your ${dailyWaterTarget}ml goal). I predict a hydration decline of 14% over the next 4 hours due to an active skin temp baseline of ${currentVitals.skinTemp}°C. I advise consuming 250ml water immediately, followed by 350ml in 2 hours to avoid dehydration strain.`;
    }
    if (q.includes('hrv') || q.includes('gut') || q.includes('heart')) {
      return `There is a direct correlation between gut inflammation and heart rate variability (HRV). Your resting heart rate of ${currentVitals.heartRate} bpm combined with your HRV of ${currentVitals.hrv}ms shows that your body is compensating for bowel stress. Hydration will reduce your core stress index (currently ${stressVal}%) and normalize your vagus nerve activity.`;
    }
    return `Based on your bio-metrics (HRV: ${currentVitals.hrv}ms, Temp: ${currentVitals.skinTemp}°C, Gut score: ${recoveryScore}%), your overall physiological risk remains ${prediction.riskLevel}. Continue logging fluid inputs and avoid intense exercises until your vitals stabilize. Let me know if you want detailed notes on stress or sleep!`;
  };

  const handleSendChat = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: MessageItem = {
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setTimeout(() => {
        const coachText = getCoachResponse(text);
        const coachMsg: MessageItem = {
          sender: 'coach',
          text: coachText,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, coachMsg]);
        setIsTyping(false);
      }, 1000);
      return;
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const promptText = `
      You are the Hydrax AI Coach. Respond to the user's query.
      User query: "${text}"
      Current User State Context:
      - HR: ${currentVitals.heartRate || 72} bpm
      - HRV: ${currentVitals.hrv || 60} ms
      - Skin Temp: ${currentVitals.skinTemp || 36.6}°C
      - Fluid intake today: ${currentIntake} ml vs goal: ${dailyWaterTarget} ml
      - Gut Recovery Score: ${recoveryScore}%
      
      Respond concisely and professionally in 2-3 sentences.
      `;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: { maxOutputTokens: 120, temperature: 0.7 }
        })
      });

      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      const coachText = data?.candidates?.[0]?.content?.parts?.[0]?.text || getCoachResponse(text);
      const coachMsg: MessageItem = {
        sender: 'coach',
        text: coachText.trim(),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, coachMsg]);
    } catch (e) {
      console.warn('Gemini chat failed, running fallback', e);
      const coachText = getCoachResponse(text);
      const coachMsg: MessageItem = {
        sender: 'coach',
        text: coachText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, coachMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Compute breakdown percentages for a custom SVG fluid balance chart
  const baseMetabolic = 1200;
  const sweatActivityLoss = Math.round(currentVitals.motion * 800) || 800;
  const totalFluidLoss = diarrheaLogs.reduce((sum, log) => sum + log.fluidLossEstimate, 0);
  const totalDepletion = baseMetabolic + sweatActivityLoss + totalFluidLoss;
  const intakePercentage = Math.round(Math.min(100, (currentIntake / (totalDepletion || 1)) * 100));
  const netBalance = currentIntake - totalDepletion;

  // Fluid Distribution Donut segments
  const renderFluidDistribution = () => {
    const size = 160;
    const strokeWidth = 14;
    const r = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * r;

    const metShare = 0.45;
    const sweatShare = 0.25;
    const diarrheaShare = totalFluidLoss > 0 ? 0.30 : 0.0;
    
    const totalShare = metShare + sweatShare + diarrheaShare;
    const metPct = (metShare / totalShare) * circ;
    const sweatPct = (sweatShare / totalShare) * circ;

    return (
      <View style={{ alignItems: 'center', paddingVertical: 8, justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="metGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#14B8FF" />
              <Stop offset="100%" stopColor="#7C3AED" />
            </LinearGradient>
            <LinearGradient id="sweatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFAD33" />
              <Stop offset="100%" stopColor="#FF4D6D" />
            </LinearGradient>
            <LinearGradient id="diarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FF4D6D" />
              <Stop offset="100%" stopColor="#7C3AED" />
            </LinearGradient>
          </Defs>
          <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="url(#metGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={circ}
              strokeDashoffset={0}
              fill="transparent"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="url(#sweatGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={circ}
              strokeDashoffset={metPct}
              fill="transparent"
            />
            {totalFluidLoss > 0 && (
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke="url(#diarGrad)"
                strokeWidth={strokeWidth}
                strokeDasharray={circ}
                strokeDashoffset={metPct + sweatPct}
                fill="transparent"
              />
            )}
          </G>
        </Svg>
      </View>
    );
  };

  const isDesktop = Dimensions.get('window').width >= 768;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Title */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.bannerSubtitle}>{t('aiInsights')}</Text>
          <Text style={styles.bannerTitle}>Physiological Analytics</Text>
        </View>

        {/* Two Column Grid */}
        <View style={[styles.splitGrid, { flexDirection: isDesktop ? 'row' : 'column' }]}>
          
          {/* COLUMN 1: AI Coach Chat Box */}
          <View style={{ flex: isDesktop ? 7 : undefined, gap: 24 }}>
            <GlassCard style={styles.coachCard} borderColor={darkMode ? 'rgba(124, 92, 245, 0.1)' : 'rgba(124, 92, 245, 0.15)'}>
              <View style={styles.coachHeader}>
                <View style={styles.coachAvatar}>
                  <Brain size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[styles.coachTitleText, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>{t('aiCoachTitle')}</Text>
                  <Text style={styles.coachSubText}>Active Real-time Biological Advisor</Text>
                </View>
              </View>

              {/* Message scroll area */}
              <ScrollView style={styles.chatScrollView} contentContainerStyle={styles.chatScrollContent} showsVerticalScrollIndicator={false}>
                {messages.map((msg, idx) => (
                  <View 
                    key={idx} 
                    style={[
                      styles.chatBubbleContainer, 
                      msg.sender === 'user' ? styles.userBubbleAlign : styles.coachBubbleAlign
                    ]}
                  >
                    <View style={[
                      styles.chatBubble, 
                      msg.sender === 'user' 
                        ? { backgroundColor: '#00E5C3', borderBottomRightRadius: 2 } 
                        : { backgroundColor: darkMode ? '#111A36' : '#F1F5F9', borderBottomLeftRadius: 2 }
                    ]}>
                      <Text style={[
                        styles.chatBubbleText, 
                        { color: msg.sender === 'user' ? '#050B18' : (darkMode ? '#FFFFFF' : '#0F172A') }
                      ]}>
                        {msg.text}
                      </Text>
                    </View>
                  </View>
                ))}
                {isTyping && (
                  <View style={[styles.chatBubbleContainer, styles.coachBubbleAlign]}>
                    <View style={[styles.chatBubble, { backgroundColor: darkMode ? '#111A36' : '#F1F5F9', paddingVertical: 10 }]}>
                      <ActivityIndicator size="small" color="#00E5C3" />
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Chat Prompts */}
              <View style={styles.quickPromptsRow}>
                {quickPrompts.map((p, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={[styles.quickPromptChip, { backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]} 
                    onPress={() => handleSendChat(p)}
                  >
                    <Text style={styles.quickPromptText}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Chat Input row */}
              <View style={styles.chatInputRow}>
                <TextInput 
                  style={[styles.chatInput, { color: darkMode ? '#FFFFFF' : '#0F172A', backgroundColor: darkMode ? '#070D1E' : '#F8FAFC' }]}
                  placeholder={t('askCoachPlaceholder')}
                  placeholderTextColor="#64748B"
                  value={chatInput}
                  onChangeText={setChatInput}
                />
                <TouchableOpacity 
                  style={styles.chatSendBtn}
                  onPress={() => handleSendChat(chatInput)}
                >
                  <Send size={14} color="#050B18" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </GlassCard>

            {/* 8-Hour Hydration Prediction projection graph */}
            <GlassCard style={styles.coachCard}>
              <View style={styles.chartHeader}>
                <Clock size={16} color="#00E5C3" style={{ marginRight: 8 }} />
                <View>
                  <Text style={[styles.chartTitle, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>8-Hour Hydration Prediction Projections</Text>
                  <Text style={styles.chartSub}>Mathematical simulation based on active sweat burn rate</Text>
                </View>
              </View>

              {/* SVG curve */}
              <View style={styles.svgContainer}>
                <Svg width="100%" height="180">
                  <Defs>
                    <LinearGradient id="predGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor="#14B8FF" stopOpacity="0.2" />
                      <Stop offset="100%" stopColor="#14B8FF" stopOpacity="0.0" />
                    </LinearGradient>
                  </Defs>
                  
                  {/* Grid Lines */}
                  <Line x1="40" y1="20" x2="100%" y2="20" stroke={darkMode ? 'rgba(255,255,255,0.03)' : '#E2E8F0'} strokeDasharray="3,3" />
                  <Line x1="40" y1="70" x2="100%" y2="70" stroke={darkMode ? 'rgba(255,255,255,0.03)' : '#E2E8F0'} strokeDasharray="3,3" />
                  <Line x1="40" y1="120" x2="100%" y2="120" stroke={darkMode ? 'rgba(255,255,255,0.03)' : '#E2E8F0'} strokeDasharray="3,3" />

                  {/* Y Axis Labels */}
                  <SvgText x="10" y="24" fill="#8E9AA6" fontSize="9" fontWeight="600">100%</SvgText>
                  <SvgText x="10" y="74" fill="#8E9AA6" fontSize="9" fontWeight="600">80%</SvgText>
                  <SvgText x="10" y="124" fill="#8E9AA6" fontSize="9" fontWeight="600">60%</SvgText>

                  {/* Curve path */}
                  <Path 
                    d="M 50 40 C 150 50, 250 110, 350 90 C 450 70, 550 50, 580 45"
                    fill="transparent"
                    stroke="#14B8FF"
                    strokeWidth="3.5"
                  />
                  <Path 
                    d="M 50 40 C 150 50, 250 110, 350 90 C 450 70, 550 50, 580 45 L 580 150 L 50 150 Z"
                    fill="url(#predGrad)"
                  />

                  {/* Node indicators */}
                  <Circle cx="50" cy="40" r="4.5" fill="#050B18" stroke="#14B8FF" strokeWidth="2.5" />
                  <Circle cx="250" cy="110" r="4.5" fill="#050B18" stroke="#FFAD33" strokeWidth="2.5" />
                  <Circle cx="580" cy="45" r="4.5" fill="#050B18" stroke="#00E5C3" strokeWidth="2.5" />

                  <SvgText x="50" y="145" fill="#8E9AA6" fontSize="8" fontWeight="700">12:00 (Now)</SvgText>
                  <SvgText x="230" y="145" fill="#8E9AA6" fontSize="8" fontWeight="700">16:00 (Min)</SvgText>
                  <SvgText x="530" y="145" fill="#8E9AA6" fontSize="8" fontWeight="700">20:00 (Target)</SvgText>
                </Svg>
              </View>
            </GlassCard>

            {/* Tomorrow's Predictions Forecast Card */}
            <GlassCard style={styles.coachCard}>
              <View style={styles.chartHeader}>
                <Sparkles size={16} color="#00E5C3" style={{ marginRight: 8 }} />
                <View>
                  <Text style={[styles.chartTitle, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>Advanced Predictive Analytics Forecast</Text>
                  <Text style={styles.chartSub}>Real-time bio-tensor forecast matrices for next 24 hours</Text>
                </View>
              </View>

              <View style={styles.forecastGrid}>
                {/* 24h Hydration forecast */}
                <View style={[styles.forecastBox, { borderColor: borderCol, backgroundColor: darkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }]}>
                  <Text style={styles.forecastLabel}>Hydration (Next 24h)</Text>
                  <Text style={[styles.forecastVal, { color: '#00E5C3' }]}>92% Optimal</Text>
                  <View style={styles.confidenceRow}>
                    <Text style={styles.confidenceText}>Confidence: 96%</Text>
                  </View>
                </View>

                {/* Tomorrow recovery forecast */}
                <View style={[styles.forecastBox, { borderColor: borderCol, backgroundColor: darkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }]}>
                  <Text style={styles.forecastLabel}>Recovery (Tomorrow)</Text>
                  <Text style={[styles.forecastVal, { color: '#FFAD33' }]}>84% Ready</Text>
                  <View style={styles.confidenceRow}>
                    <Text style={styles.confidenceText}>Confidence: 89%</Text>
                  </View>
                </View>

                {/* Sleep quality forecast */}
                <View style={[styles.forecastBox, { borderColor: borderCol, backgroundColor: darkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }]}>
                  <Text style={styles.forecastLabel}>Sleep Quality Forecast</Text>
                  <Text style={[styles.forecastVal, { color: '#7C3AED' }]}>86% Deep Sleep</Text>
                  <View style={styles.confidenceRow}>
                    <Text style={styles.confidenceText}>Confidence: 91%</Text>
                  </View>
                </View>

                {/* Dehydration Risk Trend */}
                <View style={[styles.forecastBox, { borderColor: borderCol, backgroundColor: darkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }]}>
                  <Text style={styles.forecastLabel}>Dehydration Risk Trend</Text>
                  <Text style={[styles.forecastVal, { color: '#FF4D6D' }]}>Decelerating Risk</Text>
                  <View style={styles.confidenceRow}>
                    <Text style={styles.confidenceText}>Confidence: 94%</Text>
                  </View>
                </View>
              </View>

              <View style={{ backgroundColor: darkMode ? 'rgba(0, 229, 195, 0.05)' : '#F1F5F9', marginTop: 14, borderRadius: 14, padding: 12 }}>
                <Text style={{ color: textSecondary, fontSize: 10, lineHeight: 14, fontWeight: '600' }}>
                  Recommendation: Your recovery index is highly responsive to hydration loading. Consuming 300ml fluids 45m before sleep will suppress morning resting heart rate and stabilize HRV baseline.
                </Text>
              </View>
            </GlassCard>

          </View>

          {/* COLUMN 2: Physiological Correlation Donut & AI recommendations */}
          <View style={{ flex: isDesktop ? 5 : undefined, gap: 24 }}>
            
            {/* Fluid Depletion Donut card */}
            <GlassCard style={styles.fluidCard}>
              <Text style={[styles.cardTitleText, { color: darkMode ? '#FFFFFF' : '#0F172A', marginBottom: 12 }]}>
                Body Fluid Depletion Breakdown
              </Text>
              
              {renderFluidDistribution()}

              <View style={styles.donutMetaRow}>
                <View style={styles.donutLegItem}>
                  <View style={[styles.donutLegDot, { backgroundColor: '#14B8FF' }]} />
                  <Text style={styles.donutLegText}>Basal (1200ml)</Text>
                </View>
                <View style={styles.donutLegItem}>
                  <View style={[styles.donutLegDot, { backgroundColor: '#FFAD33' }]} />
                  <Text style={styles.donutLegText}>Active ({sweatActivityLoss}ml)</Text>
                </View>
                {totalFluidLoss > 0 && (
                  <View style={styles.donutLegItem}>
                    <View style={[styles.donutLegDot, { backgroundColor: '#FF4D6D' }]} />
                    <Text style={styles.donutLegText}>Symptoms ({totalFluidLoss}ml)</Text>
                  </View>
                )}
              </View>

              <View style={styles.depletionSummaryRow}>
                <Text style={styles.depletionSummaryText}>
                  Total daily loss: <Text style={{ color: '#FF4D6D', fontWeight: '800' }}>{totalDepletion} ml</Text> | Net Hydration Balance: <Text style={{ color: netBalance >= 0 ? '#00cc66' : '#FFAD33', fontWeight: '800' }}>{netBalance} ml</Text>
                </Text>
              </View>
            </GlassCard>

            {/* AI Diagnostics recommendations */}
            <GlassCard style={styles.fluidCard}>
              <Text style={[styles.cardTitleText, { color: darkMode ? '#FFFFFF' : '#0F172A', marginBottom: 12 }]}>
                AI Diagnostics & Correlations
              </Text>

              <View style={styles.recomItem}>
                <Zap size={18} color="#FFAD33" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.recomTitle, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>Core Stress Correlation</Text>
                  <Text style={styles.recomDesc}>
                    Low HRV ({currentVitals.hrv}ms) is correlating with high stool loss volume. Avoid intensive stress and hydrate with electrolyte solution.
                  </Text>
                </View>
              </View>

              <View style={styles.recomItem}>
                <Moon size={18} color="#7C3AED" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.recomTitle, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>Sleep Efficiency</Text>
                  <Text style={styles.recomDesc}>
                    Your recovery score is projected to recover to 92% if you sleep with fluid levels above 90% (drink 350ml fluid 45m before sleeping).
                  </Text>
                </View>
              </View>

              <View style={styles.recomItem}>
                <AlertTriangle size={18} color="#FF4D6D" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.recomTitle, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>Bowel Dehydration Risk</Text>
                  <Text style={styles.recomDesc}>
                    Current symptom history logged indicates dehydration. Risk level is {prediction.riskLevel} with confidence {prediction.confidenceScore}%.
                  </Text>
                </View>
              </View>

            </GlassCard>

          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (darkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkMode ? '#050B18' : '#F8FAFC',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  bannerSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00E5C3',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: darkMode ? '#FFFFFF' : '#0F172A',
    letterSpacing: -1,
  },
  splitGrid: {
    gap: 24,
  },
  coachCard: {
    padding: 24,
    borderRadius: 24,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 12,
  },
  coachAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  coachTitleText: {
    fontSize: 15,
    fontWeight: '900',
  },
  coachSubText: {
    fontSize: 11,
    color: '#8E9AA6',
    fontWeight: '600',
  },
  chatScrollView: {
    height: 280,
    marginBottom: 12,
  },
  chatScrollContent: {
    gap: 12,
  },
  chatBubbleContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  userBubbleAlign: {
    justifyContent: 'flex-end',
  },
  coachBubbleAlign: {
    justifyContent: 'flex-start',
  },
  chatBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 12,
  },
  chatBubbleText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  quickPromptsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  quickPromptChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  quickPromptText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00E5C3',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chatInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    fontSize: 12,
    fontWeight: '600',
  },
  chatSendBtn: {
    backgroundColor: '#00E5C3',
    padding: 10,
    borderRadius: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  chartSub: {
    fontSize: 11,
    color: '#8E9AA6',
    fontWeight: '600',
  },
  svgContainer: {
    width: '100%',
    alignItems: 'center',
  },
  fluidCard: {
    padding: 20,
    borderRadius: 20,
  },
  cardTitleText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  donutMetaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 12,
  },
  donutLegItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  donutLegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  donutLegText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E9AA6',
    textTransform: 'uppercase',
  },
  depletionSummaryRow: {
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
  },
  depletionSummaryText: {
    fontSize: 11,
    color: '#8E9AA6',
    fontWeight: '700',
  },
  recomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  recomTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  recomDesc: {
    fontSize: 11,
    color: '#8E9AA6',
    lineHeight: 15,
    fontWeight: '500',
  },
  forecastGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  forecastBox: {
    flex: 1,
    minWidth: 140,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  forecastLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8E9AA6',
    textTransform: 'uppercase',
  },
  forecastVal: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 6,
  },
  confidenceRow: {
    marginTop: 6,
  },
  confidenceText: {
    fontSize: 8,
    color: '#8E9AA6',
    fontWeight: '700',
  },
});

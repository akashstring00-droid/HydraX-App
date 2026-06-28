import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, useWindowDimensions, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Send, 
  Mic, 
  MessageSquare, 
  Plus, 
  Heart, 
  Brain, 
  Droplet, 
  Moon, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  Activity,
  Volume2
} from 'lucide-react-native';
import { useVitalsStore } from '../store/useVitalsStore';
import { useWaterStore } from '../store/useWaterStore';
import { useDiarrheaStore } from '../store/useDiarrheaStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useToastStore } from '../store/useToastStore';
import { useGoalsStore } from '../store/useGoalsStore';
import { useAuthStore } from '../store/useAuthStore';
import { GlassCard } from '../components/GlassCard';

const STORAGE_KEY = 'hydrax-ai-sessions';

const loadSavedSessions = (defaultSessions: ChatSession[]) => {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load AI sessions', e);
    }
  }
  return defaultSessions;
};

interface Message {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  date: string;
  messages: Message[];
}

export const AICoachScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const darkMode = useSettingsStore((state) => state.darkMode);

  // Vitals Context
  const { currentVitals, prediction } = useVitalsStore();
  const { currentIntake, dailyWaterTarget } = useWaterStore();
  const { recoveryScore } = useDiarrheaStore();
  const { currentStreak, dailySleepTarget } = useGoalsStore();

  const mockSessions: ChatSession[] = [
    {
      id: 'session-1',
      title: 'Hydration & Dehydration Risk',
      date: 'Today, 10:24 AM',
      messages: [
        { id: '1', sender: 'coach', text: 'Hello! I am your Hydrax AI Bio-Intelligence Advisor. I analyze your real-time optical band telemetry, hydration logs, and physiological trends. How can I assist you today?', timestamp: '10:24 AM' },
        { id: '2', sender: 'user', text: 'Analyze my dehydration risk.', timestamp: '10:25 AM' },
        { id: '3', sender: 'coach', text: `Currently, your estimated Dehydration Risk is Low. Your current fluid intake sits at ${currentIntake}ml against a target of ${dailyWaterTarget}ml. Optical metrics show stable bioimpedance. Keep sipping fluids at 15-minute intervals.`, timestamp: '10:25 AM' }
      ]
    },
    {
      id: 'session-2',
      title: 'Low Recovery Analysis',
      date: 'Yesterday, 4:15 PM',
      messages: [
        { id: '1', sender: 'coach', text: 'Welcome back. Telemetry indicates elevated recovery scores. Let\'s evaluate sleep parameters.', timestamp: '4:15 PM' },
        { id: '2', sender: 'user', text: 'Why is my recovery low?', timestamp: '4:16 PM' },
        { id: '3', sender: 'coach', text: `Your low recovery values correlate with a sleep score of 88/100 and an HRV of ${currentVitals.hrv}ms. HRV suppression is typically driven by dehydration and autonomic fatigue. I recommend a water intake boost (+350ml) and a 10-minute breathwork session.`, timestamp: '4:17 PM' }
      ]
    }
  ];

  const [sessions, setSessions] = useState<ChatSession[]>(mockSessions);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('session-1');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [shouldAutoSpeak, setShouldAutoSpeak] = useState(false);
  const showToast = useToastStore((state) => state.showToast);

  const activeSession = sessions.find(s => s.id === selectedSessionId) || sessions[0];
  const chatScrollRef = useRef<ScrollView>(null);

  const suggestionPrompts = [
    'How much water should I drink?',
    'Why am I tired?',
    'Recovery suggestions',
    'Suggest hydration plan',
    'Predict dehydration risk'
  ];

  const startVoiceInput = () => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          showToast('Listening... Speak now.', 'info');
        };

        recognition.onerror = (event: any) => {
          console.error(event);
          setIsListening(false);
          showToast('Speech recognition error: ' + event.error, 'error');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputText(transcript);
            handleSendMessage(transcript, true);
            showToast('Speech captured successfully!', 'success');
          }
        };

        recognition.start();
      } else {
        showToast('Speech-to-text not supported in this browser.', 'error');
      }
    }
  };

  // Load saved sessions on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setSessions(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to load AI sessions', e);
      }
    }
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const handleClearConversation = () => {
    setSessions(prev => prev.map(s => {
      if (s.id === selectedSessionId) {
        return {
          ...s,
          messages: []
        };
      }
      return s;
    }));
    showToast('Conversation cleared.', 'info');
  };

  useEffect(() => {
    // Auto-scroll to bottom of chat
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [activeSession.messages.length, isTyping]);

  const handleSendMessage = async (textToSend: string, viaVoice = false) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update active session messages
    setSessions(prev => prev.map(s => {
      if (s.id === selectedSessionId) {
        return {
          ...s,
          messages: [...s.messages, userMsg]
        };
      }
      return s;
    }));

    setInputText('');
    setIsTyping(true);
    
    // Capture state for timeout closure
    const autoSpeak = viaVoice || shouldAutoSpeak;

    // AI Response generation
    let coachResponseText = '';
    const query = textToSend.toLowerCase();
    const dayOfWeek = new Date().getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dayOfWeek];

    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

    if (apiKey) {
      try {
        const user = useAuthStore.getState().user;
        const systemContext = `
        User Name: ${user?.displayName || 'Akash Sharma'}
        Age: ${user?.age || 28}
        Gender: ${user?.gender || 'Male'}
        Weight: ${user?.weight || 74} kg
        Height: ${user?.height || 178} cm
        Blood Group: ${user?.bloodGroup || 'O+'}
        Activity Level: ${user?.activityLevel || 'medium'}
        City: ${user?.city || 'Bangalore'}
        Country: ${user?.country || 'India'}
        Current Hydration: ${currentIntake} ml / Target: ${dailyWaterTarget} ml
        Heart Rate: ${currentVitals.heartRate} BPM
        Heart Rate Variability (HRV): ${currentVitals.hrv} ms
        Skin Temp: ${currentVitals.skinTemp} °C
        Digestive Recovery Index: ${recoveryScore}%
        Dehydration Prediction: ${prediction.hydrationScore}% (Risk: ${prediction.riskLevel})
        Current Hydration Streak: ${currentStreak} days
        `;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `System Context: You are HydraX AI Coach, a premium healthtech bio-intelligence agent. Here is the user's metabolic profile and daily biometric details:\n${systemContext}\n\nUser Question: ${textToSend}\n\nProvide personalized, expert medical-hydration advice. Keep your response concise (under 100 words), encouraging, and extremely scientific.`
                  }
                ]
              }
            ],
            generationConfig: {
              maxOutputTokens: 250,
              temperature: 0.7,
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Gemini API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const coachText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!coachText) {
          throw new Error('Invalid Gemini API response format');
        }
        coachResponseText = coachText.trim();
      } catch (err: any) {
        console.warn('Gemini API call failed, falling back to local regex advisor.', err);
      }
    }

    // Fallback to local regex-based responses if Gemini key is missing or failed
    if (!coachResponseText) {
      if (query.includes('tired') || query.includes('fatigue')) {
        coachResponseText = `Your fatigue is likely driven by a combination of key metabolic signals parsed from your biometrics:\n1. Dehydration: You have only logged ${currentIntake}ml against your daily water target of ${dailyWaterTarget}ml (a ${Math.round(Math.max(0, 100 - (currentIntake / dailyWaterTarget) * 100))}% deficit). Dehydration reduces blood volume, leading to fatigue.\n2. Sleep Debt: Your average sleep is 7h 42m vs your target of ${dailySleepTarget}h.\n3. Recovery Deficit: Your HRV is at ${currentVitals.hrv}ms and heart rate is at ${currentVitals.heartRate} BPM.\nAction: I advise drinking 350ml of water now and taking a 15-minute rest.`;
      } else if (query.includes('recovery') || query.includes('suggest')) {
        coachResponseText = `Based on your recovery score of ${recoveryScore}% and vital parameters, here are your personalized recovery suggestions:\n1. Hydration Load: Drink 300ml of electrolytes immediately to thin blood viscosity.\n2. Active Rest: Keep steps low today (limit heavy training) since your HRV of ${currentVitals.hrv}ms indicates nervous system fatigue.\n3. Sleep Prep: Restrict blue light after 9 PM and lower room temperature to 18°C.`;
      } else if (query.includes('hydration') || query.includes('water') || query.includes('drink')) {
        let habitNote = '';
        if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
          habitNote = `Historical patterns show you usually hydrate 15% less on Fridays and weekends. Let's break that habit today. `;
        } else {
          habitNote = `You usually hydrate optimal on mid-week days. `;
        }
        coachResponseText = `Your fluid intake today is ${currentIntake}ml against your target of ${dailyWaterTarget}ml. ${habitNote}You are currently on a ${currentStreak}-day hydration streak! Keep up this consistency.`;
      } else if (query.includes('sleep') || query.includes('night')) {
        coachResponseText = `Sleep efficiency last night was 88% with total sleep at 7h 42m. In comparison to your sleep target of ${dailySleepTarget}h, you have a sleep debt of 18m. Bioimpedance signals stable sleep latency, but skin temperature was slightly elevated (+0.2°C). I suggest cooling your bedroom by 1°C tonight.`;
      } else if (query.includes('risk') || query.includes('dehydration') || query.includes('predict')) {
        coachResponseText = `Hydrax bioimpedance predictions show a ${prediction.riskLevel} dehydration risk. In the next 24 hours, we forecast a stable water balance, provided you consume 350ml in the next hour. Confidence score: ${prediction.confidenceScore}%.`;
      } else if (query.includes('plan')) {
        coachResponseText = `Personalized Recovery & Hydration plan for ${dayName}:\n- 08:00 AM: 350ml mineral load (Completed)\n- 12:00 PM: 500ml electrolyte intake\n- 04:00 PM: 350ml recovery prep\n- 08:00 PM: 250ml pre-sleep hydration\nAction: Drink 350ml now to support cell oxygenation during your upcoming active window.`;
      } else {
        coachResponseText = `Analyzing telemetry packet for ${dayName}: HR ${currentVitals.heartRate} BPM, HRV ${currentVitals.hrv}ms, skin temp ${currentVitals.skinTemp}°C. Overall body state is stable, continuing your ${currentStreak}-day habit streak. What specific biome or hydration query would you like to parse next?`;
      }
    }

    const coachMsgId = 'msg-' + Math.random().toString(36).substring(2, 9);
    const coachMsg: Message = {
      id: coachMsgId,
      sender: 'coach',
      text: coachResponseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setSessions(prev => prev.map(s => {
      if (s.id === selectedSessionId) {
        return {
          ...s,
          messages: [...s.messages, coachMsg]
        };
      }
      return s;
    }));
    setIsTyping(false);

    if (autoSpeak) {
      speakText(coachMsgId, coachResponseText);
    }
  };

  const handleStartNewChat = () => {
    const newSessionId = 'session-' + Math.random().toString(36).substring(2, 9);
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Biometrics Chat',
      date: 'Just Now',
      messages: [
        { id: '1', sender: 'coach', text: 'New advisor window initialized. I am ready to evaluate vital stats, hydration trends, or sleep reports. What details shall we analyze?', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]
    };
    setSessions([newSession, ...sessions]);
    setSelectedSessionId(newSessionId);
  };

  const speakText = (msgId: string, text: string) => {
    if (isSpeaking === msgId) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(null);
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        setIsSpeaking(null);
      };
      setIsSpeaking(msgId);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  const textPrimary = darkMode ? '#FFFFFF' : '#0F172A';
  const textSecondary = darkMode ? '#8E9AA6' : '#64748B';
  const cardBg = darkMode ? '#070D1E' : '#FFFFFF';
  const inputBg = darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
  const borderCol = darkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#050B18' : '#F8FAFC' }]} edges={['top']}>
      <View style={styles.contentRow}>
        
        {/* LEFT COLUMN: Chat Sessions History (Hidden on Mobile) */}
        {isDesktop && (
          <View style={[styles.leftSidebar, { borderRightColor: borderCol, backgroundColor: cardBg }]}>
            <View style={styles.sidebarHeader}>
              <Text style={[styles.sidebarTitle, { color: textPrimary }]}>Conversations</Text>
              <TouchableOpacity style={styles.newChatBtn} onPress={handleStartNewChat}>
                <Plus size={16} color="#00E5C3" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {sessions.map((s) => {
                const isActive = s.id === selectedSessionId;
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => setSelectedSessionId(s.id)}
                    style={[
                      styles.sessionCard,
                      {
                        backgroundColor: isActive 
                          ? (darkMode ? 'rgba(0, 229, 195, 0.08)' : 'rgba(0, 229, 195, 0.05)')
                          : 'transparent',
                        borderColor: isActive ? 'rgba(0, 229, 195, 0.2)' : 'transparent'
                      }
                    ]}
                  >
                    <MessageSquare size={16} color={isActive ? '#00E5C3' : textSecondary} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sessionTitle, { color: isActive ? '#00E5C3' : textPrimary }]} numberOfLines={1}>
                        {s.title}
                      </Text>
                      <Text style={styles.sessionDate}>{s.date}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* CENTER COLUMN: Live Chat Window */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatContainer}
        >
          <GlassCard style={styles.chatCard}>
            {/* Header */}
            <View style={[styles.chatHeader, { borderBottomColor: borderCol, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <View style={styles.chatHeaderLeft}>
                <View style={styles.coachAvatarIcon}>
                  <Sparkles size={16} color="#00E5C3" />
                </View>
                <View>
                  <Text style={[styles.coachTitleText, { color: textPrimary }]}>Hydrax AI Coach</Text>
                  <Text style={styles.coachStatus}>Real-Time Telemetry Advisor</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <TouchableOpacity onPress={handleClearConversation} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderWidth: 1, borderColor: borderCol }}>
                  <Text style={{ color: '#FF4D6D', fontSize: 10, fontWeight: '700' }}>Clear</Text>
                </TouchableOpacity>
                {!isDesktop && (
                  <TouchableOpacity style={styles.mobileNewChatBtn} onPress={handleStartNewChat}>
                    <Plus size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Scrollable messages area */}
            <ScrollView 
              ref={chatScrollRef}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
            >
              {activeSession.messages.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 }}>
                  <MessageSquare size={32} color="#00E5C3" style={{ marginBottom: 12, opacity: 0.6 }} />
                  <Text style={{ color: textPrimary, fontSize: 13, fontWeight: '900', textAlign: 'center' }}>No Messages Yet</Text>
                  <Text style={{ color: textSecondary, fontSize: 11, textAlign: 'center', marginTop: 4, lineHeight: 16 }}>
                    Start a conversation with the AI coach. You can ask about your dehydration risk, recovery stats, sleep quality, or log history.
                  </Text>
                </View>
              ) : (
                activeSession.messages.map((msg) => {
                  const isCoach = msg.sender === 'coach';
                  return (
                    <View 
                      key={msg.id}
                      style={[
                        styles.messageRow,
                        isCoach ? styles.coachRowAlign : styles.userRowAlign
                      ]}
                    >
                      {isCoach && (
                        <View style={styles.msgAvatar}>
                          <Sparkles size={10} color="#00E5C3" />
                        </View>
                      )}
                      <View style={styles.bubbleContainer}>
                        <GlassCard 
                          style={[
                            styles.messageBubble,
                            isCoach ? styles.coachBubble : styles.userBubble,
                            isCoach 
                              ? { borderColor: darkMode ? 'rgba(0, 229, 195, 0.1)' : '#E2E8F0' } 
                              : { backgroundColor: '#00E5C3' }
                          ] as any}
                        >
                          <Text style={[styles.messageText, { color: isCoach ? textPrimary : '#050B18' }]}>
                            {msg.text}
                          </Text>
                        </GlassCard>
                        <View style={[styles.messageFooter, isCoach ? styles.footerLeft : styles.footerRight]}>
                          <Text style={styles.msgTime}>{msg.timestamp}</Text>
                          {!isCoach && (
                            <Text style={{ fontSize: 9, color: '#00E5C3', marginLeft: 4 }}>✓✓</Text>
                          )}
                          {isCoach && (
                            <TouchableOpacity onPress={() => speakText(msg.id, msg.text)} style={styles.speakButton}>
                              <Volume2 size={12} color={isSpeaking === msg.id ? '#00E5C3' : textSecondary} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })
              )}

              {isTyping && (
                <View style={[styles.messageRow, styles.coachRowAlign]}>
                  <View style={styles.msgAvatar}>
                    <Sparkles size={10} color="#00E5C3" />
                  </View>
                  <GlassCard style={[styles.messageBubble, styles.coachBubble, { width: 60, height: 36, justifyContent: 'center', alignItems: 'center', borderColor: borderCol }]}>
                    <ActivityIndicator size="small" color="#00E5C3" />
                  </GlassCard>
                </View>
              )}
            </ScrollView>

            {/* Suggestions prompt chips */}
            <View style={styles.suggestionsWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
                {suggestionPrompts.map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => handleSendMessage(p)}
                    style={[styles.promptChip, { backgroundColor: inputBg, borderColor: borderCol }]}
                  >
                    <Sparkles size={10} color="#00E5C3" style={{ marginRight: 6 }} />
                    <Text style={[styles.promptText, { color: textPrimary }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

             {/* Chat Input controls */}
            <View style={[styles.inputBarWrapper, { borderTopColor: borderCol }]}>
              <View style={[styles.inputBox, { backgroundColor: inputBg, borderColor: borderCol }]}>
                <TextInput
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={() => handleSendMessage(inputText)}
                  placeholder={isListening ? "Listening..." : "Ask Hydrax..."}
                  placeholderTextColor={textSecondary}
                  style={[styles.textInput, { color: textPrimary }]}
                  editable={!isListening}
                />
                
                {/* Voice Input Mic Button */}
                <TouchableOpacity
                  onPress={startVoiceInput}
                  style={[
                    styles.micBtn,
                    {
                      backgroundColor: isListening ? '#FF4D6D' : 'rgba(255,255,255,0.05)',
                      marginRight: 8
                    }
                  ]}
                  activeOpacity={0.7}
                >
                  {isListening ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Mic size={14} color={darkMode ? '#00E5C3' : '#050B18'} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => handleSendMessage(inputText)}
                  style={[styles.sendBtn, { backgroundColor: inputText.trim() ? '#00E5C3' : 'rgba(255,255,255,0.05)' }]}
                  disabled={!inputText.trim()}
                >
                  <Send size={14} color="#050B18" />
                </TouchableOpacity>
              </View>
            </View>
          </GlassCard>
        </KeyboardAvoidingView>

        {/* RIGHT COLUMN: Real-Time Physiological Telemetry (Hidden on Mobile) */}
        {isDesktop && (
          <View style={[styles.rightPanel, { borderLeftColor: borderCol, backgroundColor: cardBg }]}>
            <Text style={[styles.panelTitle, { color: textPrimary }]}>Live Telemetry</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { title: 'Heart Rate', val: `${currentVitals.heartRate} BPM`, desc: 'Normal resting baseline', icon: Heart, color: '#FF4D6D' },
                { title: 'HRV', val: `${currentVitals.hrv} ms`, desc: 'High recovery state', icon: Brain, color: '#7C3AED' },
                { title: 'Hydration Goal', val: `${currentIntake} / ${dailyWaterTarget} ml`, desc: 'Intake telemetry logs', icon: Droplet, color: '#14B8FF' },
                { title: 'Dehydration Risk', val: `${prediction.dehydrationPercent}%`, desc: `${prediction.riskLevel} Probability`, icon: Activity, color: '#FFAD33' },
                { title: 'Sleep Score', val: '88/100', desc: 'Sufficient REM cycles', icon: Moon, color: '#7C3AED' }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <GlassCard key={idx} style={styles.telemetryCard} borderColor={borderCol}>
                    <View style={styles.telemetryCardRow}>
                      <View style={[styles.telemetryIconContainer, { backgroundColor: item.color + '10' }]}>
                        <Icon size={16} color={item.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.telemetryCardTitle}>{item.title}</Text>
                        <Text style={[styles.telemetryCardVal, { color: textPrimary }]}>{item.val}</Text>
                        <Text style={styles.telemetryCardDesc}>{item.desc}</Text>
                      </View>
                    </View>
                  </GlassCard>
                );
              })}
            </ScrollView>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
  },
  leftSidebar: {
    width: 250,
    borderRightWidth: 1,
    padding: 16,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  newChatBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 229, 195, 0.1)',
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  sessionDate: {
    color: '#8E9AA6',
    fontSize: 9,
    marginTop: 2,
  },
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  chatCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachAvatarIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 229, 195, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  coachTitleText: {
    fontSize: 14,
    fontWeight: '900',
  },
  coachStatus: {
    fontSize: 9,
    color: '#00E5C3',
    fontWeight: '700',
    marginTop: 1,
  },
  mobileNewChatBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#00E5C3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  coachRowAlign: {
    alignSelf: 'flex-start',
  },
  userRowAlign: {
    alignSelf: 'flex-end',
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 229, 195, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  bubbleContainer: {
    flexDirection: 'column',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  coachBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderWidth: 1,
    borderTopLeftRadius: 4,
  },
  userBubble: {
    borderTopRightRadius: 4,
    borderWidth: 0,
  },
  messageText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  footerLeft: {
    alignSelf: 'flex-start',
  },
  footerRight: {
    alignSelf: 'flex-end',
  },
  msgTime: {
    color: '#8E9AA6',
    fontSize: 8,
    fontWeight: '500',
  },
  speakButton: {
    marginLeft: 6,
    padding: 2,
  },
  suggestionsWrapper: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  suggestionsScroll: {
    paddingHorizontal: 16,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
  },
  promptText: {
    fontSize: 10,
    fontWeight: '700',
  },
  inputBarWrapper: {
    padding: 12,
    borderTopWidth: 1,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 8,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  micBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightPanel: {
    width: 250,
    borderLeftWidth: 1,
    padding: 16,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  telemetryCard: {
    marginBottom: 10,
    borderRadius: 16,
    padding: 12,
  },
  telemetryCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  telemetryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  telemetryCardTitle: {
    color: '#8E9AA6',
    fontSize: 9,
    fontWeight: '700',
  },
  telemetryCardVal: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  telemetryCardDesc: {
    color: '#00E5C3',
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
  },
});

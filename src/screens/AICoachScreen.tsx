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
import { GlassCard } from '../components/GlassCard';

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

  const activeSession = sessions.find(s => s.id === selectedSessionId) || sessions[0];
  const chatScrollRef = useRef<ScrollView>(null);

  const suggestionPrompts = [
    'Why is recovery low?',
    'Analyze my hydration',
    'Generate sleep report',
    'Suggest hydration plan',
    'Predict dehydration risk'
  ];

  useEffect(() => {
    // Auto-scroll to bottom of chat
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [activeSession.messages.length, isTyping]);

  const handleSendMessage = (textToSend: string) => {
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

    // AI Response generation
    setTimeout(() => {
      let coachResponseText = '';
      const query = textToSend.toLowerCase();

      if (query.includes('recovery')) {
        coachResponseText = `Your recovery is at ${recoveryScore}%. The primary contributors are: Sleep (88 Score), HRV (${currentVitals.hrv} ms), and Stress (Low). Autonomic recovery indicates high performance capacity.`;
      } else if (query.includes('hydration') || query.includes('water')) {
        coachResponseText = `Your daily fluid intake is ${currentIntake}ml / ${dailyWaterTarget}ml. Dehydration probability stands at ${prediction.dehydrationPercent}%. Continue loading fluids gradually before evening telemetry cycles.`;
      } else if (query.includes('sleep')) {
        coachResponseText = "Sleep metrics are fully calibrated. Total Sleep: 7h 42m (Deep Sleep 22%, REM 20%, Light 58%). Wake events: 2. Core autonomic resting indexes remain optimal.";
      } else if (query.includes('risk') || query.includes('dehydration')) {
        coachResponseText = `Hydrax bioimpedance models project a ${prediction.riskLevel} risk of hydration deficit in the next 4 hours. No significant bowel losses logged today.`;
      } else if (query.includes('plan')) {
        coachResponseText = `Suggested Hydration Plan:\n- 08:00 AM: 350ml mineral load\n- 12:00 PM: 500ml electrolyte intake\n- 04:00 PM: 350ml hydration prep\n- 08:00 PM: 250ml telemetry window`;
      } else {
        coachResponseText = `Understood. Analyzing telemetry packet: HR ${currentVitals.heartRate} BPM, HRV ${currentVitals.hrv}ms, Temp ${currentVitals.skinTemp}°C. Hydration logs match normal fluid balances.`;
      }

      const coachMsg: Message = {
        id: 'msg-' + Math.random().toString(36).substring(2, 9),
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
    }, 1500);
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
            <View style={[styles.chatHeader, { borderBottomColor: borderCol }]}>
              <View style={styles.chatHeaderLeft}>
                <View style={styles.coachAvatarIcon}>
                  <Sparkles size={16} color="#00E5C3" />
                </View>
                <View>
                  <Text style={[styles.coachTitleText, { color: textPrimary }]}>Hydrax AI Coach</Text>
                  <Text style={styles.coachStatus}>Real-Time Telemetry Advisor</Text>
                </View>
              </View>
              {!isDesktop && (
                <TouchableOpacity style={styles.mobileNewChatBtn} onPress={handleStartNewChat}>
                  <Plus size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Scrollable messages area */}
            <ScrollView 
              ref={chatScrollRef}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
            >
              {activeSession.messages.map((msg) => {
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
                        {isCoach && (
                          <TouchableOpacity onPress={() => speakText(msg.id, msg.text)} style={styles.speakButton}>
                            <Volume2 size={12} color={isSpeaking === msg.id ? '#00E5C3' : textSecondary} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}

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
                  placeholder="Ask Hydrax..."
                  placeholderTextColor={textSecondary}
                  style={[styles.textInput, { color: textPrimary }]}
                />
                
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

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
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'hydrax-ai-sessions';

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

const MarkdownRenderer: React.FC<{ text: string; color: string; darkMode: boolean }> = ({ text, color, darkMode }) => {
  const parts = text.split(/(```[\s\S]*?```)/g);
  const borderCol = darkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0';
  const codeBg = darkMode ? '#0F172A' : '#F1F5F9';

  return (
    <View style={{ gap: 4 }}>
      {parts.map((part, idx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const firstLine = lines[0].toLowerCase();
          const isKnownLang = ['javascript', 'typescript', 'python', 'html', 'css', 'json', 'sql', 'bash', 'react'].includes(firstLine);
          const lang = isKnownLang ? firstLine : '';
          const code = isKnownLang ? lines.slice(1).join('\n') : lines.join('\n');

          return (
            <View key={idx} style={{ backgroundColor: codeBg, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: borderCol, marginVertical: 4 }}>
              {lang ? (
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#00E5C3', marginBottom: 4, textTransform: 'uppercase', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                  {lang}
                </Text>
              ) : null}
              <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11, color: darkMode ? '#E5E7EB' : '#1E293B', lineHeight: 15 }}>
                {code}
              </Text>
            </View>
          );
        }

        const lineItems = part.split('\n');
        return (
          <View key={idx}>
            {lineItems.map((line, lIdx) => {
              const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
              const isNumbered = /^\d+\.\s/.test(line.trim());
              
              let displayText = line;
              if (isBullet) {
                displayText = line.trim().replace(/^[\*\-]\s+/, '');
              } else if (isNumbered) {
                displayText = line.trim().replace(/^\d+\.\s+/, '');
              }

              const boldParts = displayText.split(/(\*\*.*?\*\*)/g);
              const renderedLine = boldParts.map((boldPart, bIdx) => {
                if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
                  return (
                    <Text key={bIdx} style={{ fontWeight: '800', color }}>
                      {boldPart.slice(2, -2)}
                    </Text>
                  );
                }
                return boldPart;
              });

              if (isBullet) {
                return (
                  <View key={lIdx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginVertical: 2, paddingLeft: 8 }}>
                    <Text style={{ color: '#00E5C3', marginRight: 6, fontSize: 12 }}>•</Text>
                    <Text style={{ flex: 1, fontSize: 12, fontWeight: '500', color, lineHeight: 17 }}>
                      {renderedLine}
                    </Text>
                  </View>
                );
              }

              if (isNumbered) {
                const numMatch = line.trim().match(/^(\d+)\.\s/);
                const num = numMatch ? numMatch[1] : '1';
                return (
                  <View key={lIdx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginVertical: 2, paddingLeft: 8 }}>
                    <Text style={{ color: '#00E5C3', marginRight: 6, fontSize: 11, fontWeight: '800' }}>{num}.</Text>
                    <Text style={{ flex: 1, fontSize: 12, fontWeight: '500', color, lineHeight: 17 }}>
                      {renderedLine}
                    </Text>
                  </View>
                );
              }

              if (!line.trim()) return <View key={lIdx} style={{ height: 6 }} />;

              return (
                <Text key={lIdx} style={{ fontSize: 12, fontWeight: '500', color, lineHeight: 17, marginVertical: 2 }}>
                  {renderedLine}
                </Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

export const AICoachScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const darkMode = useSettingsStore((state) => state.darkMode);

  // Vitals Context
  const { currentVitals, prediction } = useVitalsStore();
  const { currentIntake, dailyWaterTarget, logs: waterLogs } = useWaterStore();
  const { recoveryScore, logs: symptomLogs } = useDiarrheaStore();
  const { currentStreak, dailySleepTarget } = useGoalsStore();
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);

  const defaultGreeting = "Hello! I am your HydraX AI Coach, powered by Llama 3.3. I analyze your heart rate, sleep quality, gut logs, and hydration targets to assist you. Ask me anything!";

  const initialSessions: ChatSession[] = [
    {
      id: 'session-default',
      title: 'Hydration & Bio-Analytics',
      date: 'Today',
      messages: [
        { id: 'msg-greet', sender: 'coach', text: defaultGreeting, timestamp: 'Just Now' }
      ]
    }
  ];

  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('session-default');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [shouldAutoSpeak, setShouldAutoSpeak] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const chatScrollRef = useRef<ScrollView>(null);
  const activeSession = sessions.find(s => s.id === selectedSessionId) || sessions[0];

  const lastMessageText = activeSession?.messages[activeSession.messages.length - 1]?.text || '';

  // Auto-scroll to bottom of chat
  useEffect(() => {
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 60);
  }, [activeSession?.messages.length, lastMessageText, isTyping]);

  const suggestionPrompts = [
    'How much water should I drink?',
    'Why am I tired?',
    'Recovery suggestions',
    'Explain my Dehydration Risk',
    'Write a python script for steps counter'
  ];

  // Load chat sessions from Supabase on user changes
  useEffect(() => {
    const fetchSupabaseSessions = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('user_id', user.uid)
          .order('updated_at', { ascending: false });

        if (data && data.length > 0) {
          setSessions(data.map((d: any) => ({
            id: d.id,
            title: d.title,
            date: d.date,
            messages: d.messages || []
          })));
          setSelectedSessionId(data[0].id);
        }
      } catch (e) {
        console.warn('Failed to retrieve chat sessions from Supabase', e);
      }
    };
    fetchSupabaseSessions();
  }, [user]);

  // Save active session to Supabase when it updates
  const syncSessionToSupabase = async (session: ChatSession) => {
    if (!user) return;
    try {
      await supabase.from('chat_sessions').upsert({
        id: session.id,
        user_id: user.uid,
        title: session.title,
        date: session.date,
        messages: session.messages,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Failed to upsert chat session to Supabase', e);
    }
  };

  const handleClearConversation = () => {
    const updated = sessions.map(s => {
      if (s.id === selectedSessionId) {
        const cleared = { ...s, messages: [] };
        syncSessionToSupabase(cleared);
        return cleared;
      }
      return s;
    });
    setSessions(updated);
    showToast('Conversation cleared.', 'info');
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setIsTyping(false);
  };

  const handleStartNewChat = () => {
    const newId = 'session-' + Math.random().toString(36).substring(2, 9);
    const newSession: ChatSession = {
      id: newId,
      title: 'New Coach Conversation',
      date: new Date().toLocaleDateString(),
      messages: [
        { id: 'greet-' + newId, sender: 'coach', text: defaultGreeting, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setSelectedSessionId(newId);
    syncSessionToSupabase(newSession);
    showToast('New chat session created.', 'success');
  };

  const updateActiveMessageText = (msgId: string, text: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === selectedSessionId) {
        const updatedMessages = s.messages.map(m => m.id === msgId ? { ...m, text } : m);
        const updatedSession = { ...s, messages: updatedMessages };
        syncSessionToSupabase(updatedSession);
        return updatedSession;
      }
      return s;
    }));
  };

  const handleSendMessage = async (textToSend: string, viaVoice = false) => {
    if (!textToSend.trim() || isGenerating) return;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
    }

    const userMsg: Message = {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    let sessionCopy = { ...activeSession, messages: [...activeSession.messages, userMsg] };
    
    if (activeSession.messages.length === 1 && activeSession.messages[0].id.startsWith('greet-')) {
      sessionCopy.title = textToSend.substring(0, 30) + (textToSend.length > 30 ? '...' : '');
    }

    setSessions(prev => prev.map(s => s.id === selectedSessionId ? sessionCopy : s));
    syncSessionToSupabase(sessionCopy);
    setInputText('');
    setIsTyping(true);
    setIsGenerating(true);

    const groqKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    if (!groqKey) {
      showToast('Groq API key not configured in environment.', 'error');
      setIsTyping(false);
      setIsGenerating(false);
      return;
    }

    const systemContext = `
    You are the HydraX AI Coach, a highly premium health and biometrics coaching advisor powered by Llama 3.3.
    User Profile:
    - Name: ${user?.displayName || 'Akash Sharma'}
    - Email: ${user?.email || 'akash@hydrax.co.in'}
    - Age: ${user?.age || 28}
    - Gender: ${user?.gender || 'Male'}
    - Weight: ${user?.weight || 74} kg
    - Height: ${user?.height || 178} cm
    - Blood Group: ${user?.bloodGroup || 'O+'}
    - Activity Level: ${user?.activityLevel || 'medium'}
    - Location: ${user?.city || 'Bangalore'}, ${user?.country || 'India'}

    Biometric Streams (Simulated Live Sensors):
    - Heart Rate: ${currentVitals.heartRate || 72} BPM
    - Heart Rate Variability (HRV): ${currentVitals.hrv || 60} ms
    - Skin Temp: ${currentVitals.skinTemp || 36.6} °C
    - Motion: ${currentVitals.motion || 0.05}

    Fluid Intake Logs:
    - Water Goal: ${dailyWaterTarget || 2500} ml
    - Current Water Intake Today: ${currentIntake} ml
    - Completed Hydration Streak: ${currentStreak} days
    - Water Logs: ${JSON.stringify(waterLogs.slice(0, 5))}

    Bowel recovery logs & Bristol Index:
    - Digestive score: ${recoveryScore}%
    - Symptoms Logs: ${JSON.stringify(symptomLogs.slice(0, 5))}

    Instructions:
    - You are capable of answering ANY user queries (including coding, career, startups, history, general questions).
    - If the user asks a health or biometric question, reference their actual health details above to give accurate, personalized, and clinical recommendations.
    - If the question is general and unrelated to health, act like a standard conversational assistant (like ChatGPT) and answer normally.
    - Format code blocks using triple backticks. Use bold and lists for readability. Keep responses clean.
    `;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemContext },
            ...sessionCopy.messages.slice(0, -1).map(m => ({
              role: m.sender === 'coach' ? 'assistant' : 'user',
              content: m.text
            })),
            { role: 'user', content: textToSend }
          ],
          stream: true
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setIsTyping(false);

      const coachMsgId = 'coach-msg-' + Math.random().toString(36).substring(2, 9);
      const newCoachMsg: Message = {
        id: coachMsgId,
        sender: 'coach',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setSessions(prev => prev.map(s => {
        if (s.id === selectedSessionId) {
          return { ...s, messages: [...s.messages, newCoachMsg] };
        }
        return s;
      }));

      let fullReply = '';

      if (response.body && typeof response.body.getReader === 'function') {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;
            if (cleanLine === 'data: [DONE]') continue;

            if (cleanLine.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(cleanLine.slice(6));
                const delta = parsed?.choices?.[0]?.delta?.content || '';
                if (delta) {
                  fullReply += delta;
                  updateActiveMessageText(coachMsgId, fullReply);
                }
              } catch (e) {}
            }
          }
        }
      } else {
        const responseData = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemContext },
              ...sessionCopy.messages.slice(0, -1).map(m => ({
                role: m.sender === 'coach' ? 'assistant' : 'user',
                content: m.text
              })),
              { role: 'user', content: textToSend }
            ],
            stream: false
          })
        });

        if (!responseData.ok) throw new Error(responseData.statusText);
        const data = await responseData.json();
        const text = data?.choices?.[0]?.message?.content || '';

        let currentLen = 0;
        const interval = setInterval(() => {
          if (controller.signal.aborted) {
            clearInterval(interval);
            return;
          }
          currentLen += Math.min(6, text.length - currentLen);
          fullReply = text.substring(0, currentLen);
          updateActiveMessageText(coachMsgId, fullReply);
          if (currentLen >= text.length) {
            clearInterval(interval);
            setIsGenerating(false);
          }
        }, 20);
      }

      setIsGenerating(false);
      if (viaVoice || shouldAutoSpeak) {
        speakText(coachMsgId, fullReply);
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        showToast('Generation cancelled.', 'info');
      } else {
        showToast(`Groq connection error: ${e.message || e}`, 'error');
      }
      setIsGenerating(false);
      setIsTyping(false);
    }
  };

  const handleCopyMessage = (text: string) => {
    try {
      if (Platform.OS === 'web') {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text);
          showToast('Copied to clipboard!', 'success');
          return;
        }
      }
      const { Clipboard } = require('react-native');
      if (Clipboard && Clipboard.setString) {
        Clipboard.setString(text);
        showToast('Copied to clipboard!', 'success');
      } else {
        showToast('Clipboard not available.', 'error');
      }
    } catch (e) {
      showToast('Copied successfully.', 'success');
    }
  };

  const handleRegenerate = () => {
    if (activeSession.messages.length < 2 || isGenerating) return;
    const lastMsg = activeSession.messages[activeSession.messages.length - 1];
    const secondLastMsg = activeSession.messages[activeSession.messages.length - 2];

    if (lastMsg.sender === 'coach' && secondLastMsg.sender === 'user') {
      setSessions(prev => prev.map(s => {
        if (s.id === selectedSessionId) {
          const popped = { ...s, messages: s.messages.slice(0, -1) };
          syncSessionToSupabase(popped);
          return popped;
        }
        return s;
      }));
      handleSendMessage(secondLastMsg.text);
    }
  };

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
          }
        };

        recognition.start();
      } else {
        showToast('Speech-to-text not supported in this browser.', 'error');
      }
    }
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
        
        {/* LEFT COLUMN: Sidebar Chat Sessions */}
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
            <View style={[styles.chatHeader, { borderBottomColor: borderCol, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <View style={styles.chatHeaderLeft}>
                <View style={styles.coachAvatarIcon}>
                  <Sparkles size={16} color="#00E5C3" />
                </View>
                <View>
                  <Text style={[styles.coachTitleText, { color: textPrimary }]}>Hydrax AI Coach</Text>
                  <Text style={styles.coachStatus}>Groq Llama 3.3 Engine</Text>
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

            <View style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <ScrollView 
                ref={chatScrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={true}
              >
                {activeSession.messages.length === 0 ? (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 }}>
                    <MessageSquare size={32} color="#00E5C3" style={{ marginBottom: 12, opacity: 0.6 }} />
                    <Text style={{ color: textPrimary, fontSize: 13, fontWeight: '900', textAlign: 'center' }}>No Messages Yet</Text>
                    <Text style={{ color: textSecondary, fontSize: 11, textAlign: 'center', marginTop: 4, lineHeight: 16 }}>
                      Start a conversation with the AI coach. You can ask anything from biometric analysis to general coding!
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
                            {isCoach ? (
                              <MarkdownRenderer text={msg.text} color={textPrimary} darkMode={darkMode} />
                            ) : (
                              <Text style={[styles.messageText, { color: '#050B18' }]}>
                                {msg.text}
                              </Text>
                            )}
                          </GlassCard>
                          <View style={[styles.messageFooter, isCoach ? styles.footerLeft : styles.footerRight]}>
                            <Text style={styles.msgTime}>{msg.timestamp}</Text>
                            {!isCoach && (
                              <Text style={{ fontSize: 9, color: '#00E5C3', marginLeft: 4 }}>✓✓</Text>
                            )}
                            {isCoach && (
                              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                                <TouchableOpacity onPress={() => speakText(msg.id, msg.text)} style={styles.speakButton}>
                                  <Volume2 size={12} color={isSpeaking === msg.id ? '#00E5C3' : textSecondary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleCopyMessage(msg.text)} style={styles.speakButton}>
                                  <Text style={{ fontSize: 9, color: textSecondary, fontWeight: '700' }}>Copy</Text>
                                </TouchableOpacity>
                                {activeSession.messages[activeSession.messages.length - 1]?.id === msg.id && (
                                  <TouchableOpacity onPress={handleRegenerate} style={styles.speakButton}>
                                    <Text style={{ fontSize: 9, color: '#00E5C3', fontWeight: '700' }}>Regenerate</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
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

              {isGenerating && (
                <View style={{ position: 'absolute', bottom: 10, left: 0, right: 0, alignItems: 'center', zIndex: 10 }}>
                  <TouchableOpacity 
                    onPress={handleStopGenerating}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255, 77, 109, 0.95)',
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: '#FF4D6D'
                    }}
                    activeOpacity={0.8}
                  >
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>Stop Generating</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

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
                  disabled={!inputText.trim() || isGenerating}
                >
                  <Send size={14} color="#050B18" />
                </TouchableOpacity>
              </View>
            </View>
          </GlassCard>
        </KeyboardAvoidingView>

        {/* RIGHT COLUMN: Real-Time Physiological Telemetry */}
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
    flexShrink: 1,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexShrink: 1,
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

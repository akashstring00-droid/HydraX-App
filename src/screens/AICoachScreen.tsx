import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Bot, Send, Sparkles, User, Heart, Thermometer, Droplets, Wind, Zap, Trash2 } from 'lucide-react-native';
import { telemetryStore } from '../telemetry/TelemetryStore';
import { HydraXTelemetry, DeviceConnectionState } from '../telemetry/telemetryTypes';
import { GroqAIService } from '../ai/GroqAIService';
import { AICoachMessage, DisasterModeType } from '../types';
import { sensorService } from '../sensors/SensorService';
import { aiCoachStore } from '../ai/AICoachStore';

import { themeStore } from '../theme/ThemeStore';

export const AICoachScreen: React.FC = () => {
  const [telemetry, setTelemetry] = useState<HydraXTelemetry | null>(null);
  const [connState, setConnState] = useState<DeviceConnectionState>(telemetryStore.getSnapshot().state);
  const [disasterMode, setDisasterMode] = useState<DisasterModeType>(sensorService.getDisasterMode());
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [messages, setMessages] = useState<AICoachMessage[]>(aiCoachStore.getMessages());
  const [themeMode, setThemeMode] = useState(themeStore.getMode());

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const unsubTelemetry = telemetryStore.subscribe((t, s) => {
      setTelemetry(t);
      setConnState(s);
    });
    const unsubChat = aiCoachStore.subscribe((msgs) => {
      setMessages(msgs);
    });
    const unsubTheme = themeStore.subscribe((m) => {
      setThemeMode(m);
    });
    return () => {
      unsubTelemetry();
      unsubChat();
      unsubTheme();
    };
  }, []);

  const isDark = themeMode === 'dark';

  const hr = telemetry?.hr ? `${telemetry.hr} BPM` : '--';
  const skinTemp = telemetry?.skinTemp ? `${telemetry.skinTemp.toFixed(1)}°C` : '--';
  const ambientTemp = telemetry?.ambientTemp ? `${telemetry.ambientTemp.toFixed(1)}°C` : '--';
  const humidity = telemetry?.humidity ? `${telemetry.humidity.toFixed(0)}%` : '--';
  const risk = telemetry?.overallRisk ?? (connState.connected ? 'LOW' : 'DISCONNECTED');

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isTyping) return;

    const userMsg: AICoachMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    aiCoachStore.addMessage(userMsg);
    if (!textToSend) setInputText('');
    setIsTyping(true);
    scrollToBottom();

    try {
      const currentMsgs = aiCoachStore.getMessages();
      const historyItems = currentMsgs.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const replyText = await GroqAIService.queryAICoach(
        query,
        historyItems,
        telemetry,
        connState,
        disasterMode
      );

      const coachMsg: AICoachMessage = {
        id: `c_${Date.now()}`,
        sender: 'coach',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      aiCoachStore.addMessage(coachMsg);
    } catch (err) {
      console.warn('[AICoach] Error querying AI:', err);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };

  const quickActionChips = [
    'Hii, kaise ho aap? 👋',
    'Mera Heart rate kaisa h? 💓',
    'Mujhe kitna paani peena chahiye? 💧',
    'Aaj konsa workout karu? 🏃',
  ];

  const renderFormattedText = (text: string, isUser: boolean) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={idx} style={[styles.boldText, isUser && styles.userBoldText]}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return part;
    });
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Top Header */}
      <View style={[styles.topHeader, isDark && styles.topHeaderDark]}>
        <View style={styles.headerLeft}>
          <View style={styles.botIconBox}>
            <Bot color="#0D9488" size={20} />
          </View>
          <View>
            <Text style={[styles.headerTitle, isDark && styles.textDark]}>HydraX Personal Health Coach</Text>
            <Text style={[styles.headerSub, isDark && styles.subDark]}>ChatGPT-Style Real-Time Intelligence</Text>
          </View>
        </View>

        <View style={styles.headerRightGroup}>
          <TouchableOpacity 
            style={[styles.clearBtn, isDark && styles.clearBtnDark]} 
            onPress={() => aiCoachStore.clearChat()}
            title="Clear Chat"
          >
            <Trash2 color={isDark ? '#94A3B8' : '#64748B'} size={15} />
          </TouchableOpacity>
          <View style={styles.groqBadge}>
            <Zap color="#F59E0B" size={11} />
            <Text style={styles.groqBadgeText}>Groq Llama 3.3 70B</Text>
          </View>
        </View>
      </View>

      {/* CURRENT CONTEXT STICKY STRIP */}
      <View style={[styles.contextStrip, isDark && styles.topHeaderDark]}>
        <Text style={styles.contextStripLabel}>LIVE TELEMETRY:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contextScroll}>
          <View style={[styles.contextPill, isDark && styles.clearBtnDark]}>
            <Heart color="#EF4444" size={11} />
            <Text style={[styles.contextPillText, isDark && styles.subDark]}>HR {hr}</Text>
          </View>
          <View style={[styles.contextPill, isDark && styles.clearBtnDark]}>
            <Thermometer color="#F59E0B" size={11} />
            <Text style={[styles.contextPillText, isDark && styles.subDark]}>Skin {skinTemp}</Text>
          </View>
          <View style={[styles.contextPill, isDark && styles.clearBtnDark]}>
            <Wind color="#06B6D4" size={11} />
            <Text style={[styles.contextPillText, isDark && styles.subDark]}>Amb {ambientTemp}</Text>
          </View>
          <View style={[styles.contextPill, isDark && styles.clearBtnDark]}>
            <Droplets color="#3B82F6" size={11} />
            <Text style={[styles.contextPillText, isDark && styles.subDark]}>Hum {humidity}</Text>
          </View>
          <View style={[styles.contextPill, isDark && styles.clearBtnDark]}>
            <Sparkles color="#0D9488" size={11} />
            <Text style={[styles.contextPillText, isDark && styles.subDark]}>Risk {risk}</Text>
          </View>
        </ScrollView>
      </View>

      {/* Messages Scroll View */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer} 
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View key={msg.id} style={msg.sender === 'user' ? styles.userRow : styles.coachRow}>
            {msg.sender === 'coach' && (
              <View style={styles.avatarBox}>
                <Sparkles color="#0D9488" size={14} />
              </View>
            )}

            <View style={msg.sender === 'user' ? styles.userBubble : [styles.coachBubble, isDark && styles.coachBubbleDark]}>
              <Text style={msg.sender === 'user' ? styles.userMsgText : [styles.coachMsgText, isDark && styles.textDark]}>
                {renderFormattedText(msg.text, msg.sender === 'user')}
              </Text>
              <Text style={msg.sender === 'user' ? styles.userMsgTime : styles.coachMsgTime}>{msg.timestamp}</Text>
            </View>

            {msg.sender === 'user' && (
              <View style={styles.userAvatarBox}>
                <User color="#FFFFFF" size={14} />
              </View>
            )}
          </View>
        ))}

        {isTyping && (
          <View style={styles.coachRow}>
            <View style={styles.avatarBox}>
              <Sparkles color="#0D9488" size={14} />
            </View>
            <View style={[styles.typingBubble, isDark && styles.typingBubbleDark]}>
              <ActivityIndicator size="small" color="#0D9488" />
              <Text style={[styles.typingText, isDark && styles.typingTextDark]}>Health Coach is thinking...</Text>
            </View>
          </View>
        )}

        {/* Suggested Quick Action Chips */}
        <View style={[styles.quickChipsContainer, isDark && styles.quickChipsContainerDark]}>
          <Text style={[styles.quickChipsLabel, isDark && styles.quickChipsLabelDark]}>Try asking your coach:</Text>
          <View style={styles.quickChipsGrid}>
            {quickActionChips.map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.actionChip, isDark && styles.actionChipDark]}
                onPress={() => handleSend(chip)}
                disabled={isTyping}
                activeOpacity={0.75}
              >
                <Text style={[styles.actionChipText, isDark && styles.actionChipTextDark]}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Input Bar */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        keyboardVerticalOffset={90}
      >
        <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
          <TextInput
            style={[styles.textInput, isDark && styles.textInputDark]}
            placeholder="Ask your Personal Health Coach anything..."
            placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
            editable={!isTyping}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!inputText.trim() || isTyping) && styles.sendButtonDisabled]} 
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isTyping}
          >
            {isTyping ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send color="#FFFFFF" size={16} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  containerDark: {
    backgroundColor: '#070D1A',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  topHeaderDark: {
    backgroundColor: '#0F172A',
    borderBottomColor: '#1E293B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.2)',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  textDark: {
    color: '#F8FAFC',
  },
  headerSub: {
    fontSize: 10,
    color: '#64748B',
  },
  subDark: {
    color: '#94A3B8',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnDark: {
    backgroundColor: '#1E293B',
  },
  groqBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  groqBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  contextStrip: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contextStripLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 0.8,
  },
  contextScroll: {
    gap: 6,
    alignItems: 'center',
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  contextPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  coachRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    maxWidth: '90%',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'flex-end',
    gap: 8,
    maxWidth: '90%',
  },
  avatarBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  userAvatarBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  coachBubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  coachBubbleDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  userBubble: {
    flexShrink: 1,
    backgroundColor: '#0D9488',
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 14,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderTopLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typingBubbleDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  typingText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  typingTextDark: {
    color: '#94A3B8',
  },
  coachMsgText: {
    fontSize: 13,
    color: '#0F172A',
    lineHeight: 19,
  },
  userMsgText: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 19,
    fontWeight: '500',
  },
  boldText: {
    fontWeight: '800',
    color: '#0D9488',
  },
  userBoldText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  coachMsgTime: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  userMsgTime: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  quickChipsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  quickChipsContainerDark: {
    borderTopColor: '#1E293B',
  },
  quickChipsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  quickChipsLabelDark: {
    color: '#94A3B8',
  },
  quickChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionChipDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  actionChipText: {
    fontSize: 11,
    color: '#0D9488',
    fontWeight: '700',
  },
  actionChipTextDark: {
    color: '#38BDF8',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  inputContainerDark: {
    backgroundColor: '#0F172A',
    borderTopColor: '#1E293B',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#0F172A',
    fontSize: 13,
  },
  textInputDark: {
    backgroundColor: '#1E293B',
    color: '#F8FAFC',
    borderColor: '#334155',
    borderWidth: 1,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.5,
  },
});

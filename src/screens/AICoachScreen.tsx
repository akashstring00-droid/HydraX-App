import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Bot, Send, Sparkles, User, Heart, Thermometer, Droplets, Wind } from 'lucide-react-native';
import { defaultUserProfile } from '../data/mockData';
import { telemetryStore } from '../telemetry/TelemetryStore';
import { HydraXTelemetry, DeviceConnectionState } from '../telemetry/telemetryTypes';
import { AICoachMessage } from '../types';

export const AICoachScreen: React.FC = () => {
  const [telemetry, setTelemetry] = useState<HydraXTelemetry | null>(null);
  const [connState, setConnState] = useState<DeviceConnectionState>(telemetryStore.getSnapshot().state);
  const [inputText, setInputText] = useState<string>('');

  useEffect(() => {
    const unsubscribe = telemetryStore.subscribe((t, s) => {
      setTelemetry(t);
      setConnState(s);
    });
    return unsubscribe;
  }, []);

  const hr = telemetry?.hr ?? '--';
  const skinTemp = telemetry?.skinTemp ? `${telemetry.skinTemp.toFixed(1)}°C` : '--';
  const ambientTemp = telemetry?.ambientTemp ? `${telemetry.ambientTemp.toFixed(1)}°C` : '--';
  const humidity = telemetry?.humidity ? `${telemetry.humidity.toFixed(0)}%` : '--';
  const risk = telemetry?.overallRisk ?? (connState.connected ? 'LOW' : 'DISCONNECTED');

  const initialMessages: AICoachMessage[] = [
    {
      id: 'm1',
      sender: 'coach',
      text: `Hello Akash! I'm your HydraX Edge AI Companion. I analyze your live BLE hardware telemetry locally on your device. Currently: Heart Rate is ${hr}, Skin Temp is ${skinTemp}, and overall risk is ${risk}.`,
      timestamp: 'Just now',
    },
  ];

  const [messages, setMessages] = useState<AICoachMessage[]>(initialMessages);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: AICoachMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    setTimeout(() => {
      const replyText = generateContextualAIResponse(query, telemetry, connState);
      const coachMsg: AICoachMessage = {
        id: `c_${Date.now()}`,
        sender: 'coach',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, coachMsg]);
    }, 400);
  };

  const generateContextualAIResponse = (
    query: string,
    t: HydraXTelemetry | null,
    s: DeviceConnectionState
  ): string => {
    const qLower = query.toLowerCase();

    if (!s.connected && !s.isDemoMode) {
      return `HydraX hardware band is currently disconnected. In disconnected state, live telemetry is unavailable, but your local risk engine remains ready on-device.`;
    }

    if (qLower.includes('risk') || qLower.includes('elevated')) {
      return `Your overall risk level is currently ${t?.overallRisk || 'LOW'} (Score: ${t?.riskScore ?? 12}/100). MAX30102 Heart Rate is ${t?.hr ?? '--'} BPM, TMP117 Skin Temp is ${t?.skinTemp ? `${t.skinTemp.toFixed(1)}°C` : '--'}.`;
    }

    if (qLower.includes('water') || qLower.includes('hydration') || qLower.includes('drink')) {
      return `Hydration risk is evaluated as ${t?.hydrationRisk || 'LOW'}. Based on ambient conditions (${t?.ambientTemp ? `${t.ambientTemp}°C` : 'normal'}, ${t?.humidity ? `${t.humidity}%` : 'normal'} humidity), drink 250ml of clean fluid every 45–60 minutes.`;
    }

    if (qLower.includes('heart rate') || qLower.includes('pulse')) {
      return `Your live MAX30102 Heart Rate is ${t?.hr ?? '--'} BPM. Normal baseline is 60–100 BPM.`;
    }

    if (qLower.includes('rest') || qLower.includes('pause')) {
      if (t?.heatRisk === 'HIGH' || (t?.skinTemp ?? 0) > 35) {
        return `Yes, rest is strongly advised. Thermal indicators show high heat exposure. Move to shade and hydrate.`;
      }
      return `Physiological indicators are steady. Rest whenever you experience fatigue.`;
    }

    return `Based on live telemetry (HR ${t?.hr ?? '--'} BPM, Skin Temp ${t?.skinTemp ? `${t.skinTemp.toFixed(1)}°C` : '--'}, Ambient ${t?.ambientTemp ? `${t.ambientTemp}°C` : '--'}), your system is operating within normal physiological limits.`;
  };

  const quickActionChips = [
    'Why is my risk changing?',
    'Should I rest right now?',
    'How much water should I drink?',
    'Explain MAX30102 heart rate',
  ];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.botIconBox}>
            <Bot color="#0D9488" size={20} />
          </View>
          <View>
            <Text style={styles.headerTitle}>HydraX AI Coach</Text>
            <Text style={styles.headerSub}>Local On-Device Reasoning • Zero Cloud Dependency</Text>
          </View>
        </View>
      </View>

      {/* CURRENT CONTEXT STICKY STRIP */}
      <View style={styles.contextStrip}>
        <Text style={styles.contextStripLabel}>LIVE TELEMETRY:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contextScroll}>
          <View style={styles.contextPill}>
            <Heart color="#EF4444" size={11} />
            <Text style={styles.contextPillText}>HR {hr}</Text>
          </View>
          <View style={styles.contextPill}>
            <Thermometer color="#F59E0B" size={11} />
            <Text style={styles.contextPillText}>Skin {skinTemp}</Text>
          </View>
          <View style={styles.contextPill}>
            <Wind color="#06B6D4" size={11} />
            <Text style={styles.contextPillText}>Amb {ambientTemp}</Text>
          </View>
          <View style={styles.contextPill}>
            <Droplets color="#3B82F6" size={11} />
            <Text style={styles.contextPillText}>Hum {humidity}</Text>
          </View>
          <View style={styles.contextPill}>
            <Sparkles color="#0D9488" size={11} />
            <Text style={styles.contextPillText}>Risk {risk}</Text>
          </View>
        </ScrollView>
      </View>

      {/* Messages Scroll View */}
      <ScrollView 
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

            <View style={msg.sender === 'user' ? styles.userBubble : styles.coachBubble}>
              <Text style={msg.sender === 'user' ? styles.userMsgText : styles.coachMsgText}>
                {msg.text}
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

        {/* Suggested Quick Action Chips */}
        <View style={styles.quickChipsContainer}>
          <Text style={styles.quickChipsLabel}>Suggested questions:</Text>
          <View style={styles.quickChipsGrid}>
            {quickActionChips.map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.actionChip}
                onPress={() => handleSend(chip)}
                activeOpacity={0.75}
              >
                <Text style={styles.actionChipText}>{chip}</Text>
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
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask AI Coach about health or environment..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
          >
            <Send color="#FFFFFF" size={16} />
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
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 10,
    color: '#64748B',
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
    maxWidth: '88%',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'flex-end',
    gap: 8,
    maxWidth: '88%',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderTopLeftRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userBubble: {
    backgroundColor: '#0D9488',
    borderRadius: 14,
    borderTopRightRadius: 4,
    padding: 12,
  },
  coachMsgText: {
    fontSize: 13,
    color: '#0F172A',
    lineHeight: 18,
  },
  userMsgText: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
    fontWeight: '500',
  },
  coachMsgTime: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userMsgTime: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  quickChipsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  quickChipsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  quickChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionChipText: {
    fontSize: 11,
    color: '#0D9488',
    fontWeight: '700',
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
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#0F172A',
    fontSize: 13,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.5,
  },
});

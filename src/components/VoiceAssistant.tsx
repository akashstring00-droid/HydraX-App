import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TextInput, Platform, ActivityIndicator } from 'react-native';
import { Mic, MicOff, X, Sparkles, Volume2, Send } from 'lucide-react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { useVitalsStore } from '../store/useVitalsStore';
import { useWaterStore } from '../store/useWaterStore';
import { GlassCard } from './GlassCard';

interface VoiceAssistantProps {
  onNavigate?: (tab: any) => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onNavigate }) => {
  const darkMode = useSettingsStore((state) => state.darkMode);
  const setActiveTab = useSettingsStore((state) => state.setActiveTab);

  // Vitals stats context
  const { currentVitals, prediction } = useVitalsStore();
  const { currentIntake, dailyWaterTarget } = useWaterStore();

  const [isOpen, setIsOpen] = useState(false);
  const [statusText, setStatusText] = useState('Click micro to speak...');
  const [typedCommand, setTypedCommand] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Animation refs
  const waveAnim1 = useRef(new Animated.Value(1)).current;
  const waveAnim2 = useRef(new Animated.Value(1)).current;
  const waveAnim3 = useRef(new Animated.Value(1)).current;

  // Speech recognition instance ref
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech Recognition if on web browser
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setStatusText('Listening for command...');
          startWaveAnimations();
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event);
          setIsListening(false);
          setStatusText('Error capturing speech. Try typing instead.');
          stopWaveAnimations();
        };

        recognition.onend = () => {
          setIsListening(false);
          stopWaveAnimations();
        };

        recognition.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          setStatusText(`Transcribed: "${resultText}"`);
          processVoiceCommand(resultText);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const startWaveAnimations = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim1, { toValue: 1.8, duration: 400, useNativeDriver: true }),
        Animated.timing(waveAnim1, { toValue: 1, duration: 400, useNativeDriver: true })
      ])
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim2, { toValue: 2.2, duration: 500, useNativeDriver: true }),
          Animated.timing(waveAnim2, { toValue: 1, duration: 500, useNativeDriver: true })
        ])
      ).start();
    }, 150);

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim3, { toValue: 1.5, duration: 450, useNativeDriver: true }),
          Animated.timing(waveAnim3, { toValue: 1, duration: 450, useNativeDriver: true })
        ])
      ).start();
    }, 300);
  };

  const stopWaveAnimations = () => {
    waveAnim1.stopAnimation();
    waveAnim2.stopAnimation();
    waveAnim3.stopAnimation();
    waveAnim1.setValue(1);
    waveAnim2.setValue(1);
    waveAnim3.setValue(1);
  };

  const toggleSpeechListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error(e);
        }
      } else {
        setStatusText("Speech Recognition not supported. Type your command below.");
      }
    }
  };

  const processVoiceCommand = (command: string) => {
    const cmd = command.toLowerCase().trim();
    setStatusText(`Processing: "${command}"...`);

    let speakResponse = '';

    if (cmd.includes('hydration') || cmd.includes('water') || cmd.includes('drink')) {
      if (cmd.includes('planner') || cmd.includes('show') || cmd.includes('open')) {
        setActiveTab('hydrationPlanner');
        speakResponse = "Opening hydration planner screen.";
        setTimeout(() => setIsOpen(false), 800);
      } else {
        speakResponse = `Your current hydration score is ${100 - prediction.dehydrationPercent}%. Daily intake logged is ${currentIntake} ml against a target of ${dailyWaterTarget} ml.`;
      }
    } else if (cmd.includes('recovery')) {
      setActiveTab('recoveryPlanner');
      speakResponse = "Navigating to recovery planner dashboard.";
      setTimeout(() => setIsOpen(false), 800);
    } else if (cmd.includes('report') || cmd.includes('weekly')) {
      setActiveTab('weeklyReports');
      speakResponse = "Opening Weekly Report Center.";
      setTimeout(() => setIsOpen(false), 800);
    } else if (cmd.includes('settings')) {
      setActiveTab('settings');
      speakResponse = "Opening System Settings.";
      setTimeout(() => setIsOpen(false), 800);
    } else if (cmd.includes('profile')) {
      setActiveTab('profile');
      speakResponse = "Opening Profile Dossier.";
      setTimeout(() => setIsOpen(false), 800);
    } else if (cmd.includes('band') || cmd.includes('manager') || cmd.includes('device')) {
      setActiveTab('device');
      speakResponse = "Opening band connection settings.";
      setTimeout(() => setIsOpen(false), 800);
    } else if (cmd.includes('coach')) {
      setActiveTab('aiCoach');
      speakResponse = "Opening AI Coach chat interface.";
      setTimeout(() => setIsOpen(false), 800);
    } else if (cmd.includes('dashboard') || cmd.includes('home')) {
      setActiveTab('dashboard');
      speakResponse = "Returning to main dashboard.";
      setTimeout(() => setIsOpen(false), 800);
    } else if (cmd.includes('how am i') || cmd.includes('status')) {
      speakResponse = `You are doing well today. Heart rate is stable at ${currentVitals.heartRate} BPM, and dehydration risk is low at ${prediction.dehydrationPercent}% probability.`;
    } else {
      speakResponse = `I received command: "${command}". I can navigate to hydration, recovery, report center, coach, or settings.`;
    }

    setStatusText(speakResponse);
    speakBack(speakResponse);
  };

  const speakBack = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleTextSubmit = () => {
    if (typedCommand.trim()) {
      processVoiceCommand(typedCommand);
      setTypedCommand('');
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    recognitionRef.current?.stop();
    stopWaveAnimations();
    setIsListening(false);
    setIsSpeaking(false);
    setIsOpen(false);
  };

  const textPrimary = darkMode ? '#FFFFFF' : '#0F172A';
  const textSecondary = darkMode ? '#8E9AA6' : '#64748B';
  const inputBg = darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
  const borderCol = darkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0';

  return (
    <>
      {/* FLOATING ACTION MICROPHONE BUTTON */}
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        style={styles.floatingMicBtn}
        activeOpacity={0.8}
      >
        <View style={styles.btnGlow} />
        <Mic size={20} color="#050B18" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* OVERLAY ASSISTANT DIALOGUE */}
      {isOpen && (
        <View style={styles.overlay} pointerEvents="auto">
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
          
          <GlassCard style={styles.assistantCard} borderColor={borderCol}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={styles.headerTitleRow}>
                <Sparkles size={16} color="#00E5C3" style={{ marginRight: 8 }} />
                <Text style={[styles.cardTitle, { color: textPrimary }]}>Hydrax Voice Assistant</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <X size={16} color={textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Listening Wave Animations */}
            <View style={styles.wavesContainer}>
              <Animated.View style={[styles.waveCircle, { transform: [{ scale: waveAnim1 }], opacity: isListening ? 0.3 : 0.05 }]} />
              <Animated.View style={[styles.waveCircle, styles.waveCircleMid, { transform: [{ scale: waveAnim2 }], opacity: isListening ? 0.2 : 0.03 }]} />
              <Animated.View style={[styles.waveCircle, styles.waveCircleOuter, { transform: [{ scale: waveAnim3 }], opacity: isListening ? 0.15 : 0.02 }]} />
              
              <TouchableOpacity
                onPress={toggleSpeechListening}
                style={[
                  styles.centerMicBtn,
                  { backgroundColor: isListening ? '#FF4D6D' : '#00E5C3' }
                ]}
              >
                {isListening ? (
                  <MicOff size={24} color="#FFFFFF" />
                ) : (
                  <Mic size={24} color="#050B18" />
                )}
              </TouchableOpacity>
            </View>

            {/* Subtitle Status */}
            <Text style={[styles.statusText, { color: isListening ? '#FF4D6D' : textPrimary }]}>
              {statusText}
            </Text>
            {isSpeaking && (
              <View style={styles.ttsIndicator}>
                <Volume2 size={12} color="#00E5C3" style={{ marginRight: 6 }} />
                <Text style={styles.ttsText}>Speaking Response...</Text>
              </View>
            )}

            <Text style={styles.commandsHelper}>
              Try saying: "open recovery planner" | "how am I today?" | "open settings"
            </Text>

            {/* Fallback Keyboard input */}
            <View style={[styles.inputWrapper, { borderTopColor: borderCol }]}>
              <TextInput
                value={typedCommand}
                onChangeText={setTypedCommand}
                placeholder="Type command fallback..."
                placeholderTextColor={textSecondary}
                onSubmitEditing={handleTextSubmit}
                style={[styles.textInput, { color: textPrimary, backgroundColor: inputBg, borderColor: borderCol }]}
              />
              <TouchableOpacity
                onPress={handleTextSubmit}
                style={styles.sendBtn}
                activeOpacity={0.7}
              >
                <Send size={14} color="#050B18" />
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  floatingMicBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00E5C3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E5C3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 9999, // Ensure mic sits on top of everything
  },
  btnGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00E5C3',
    opacity: 0.2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 10000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 11, 24, 0.85)',
  },
  assistantCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  closeBtn: {
    padding: 6,
  },
  wavesContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  waveCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00E5C3',
  },
  waveCircleMid: {
    backgroundColor: '#14B8FF',
  },
  waveCircleOuter: {
    backgroundColor: '#7C3AED',
  },
  centerMicBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 10,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  ttsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ttsText: {
    color: '#00E5C3',
    fontSize: 9,
    fontWeight: '700',
  },
  commandsHelper: {
    color: '#8E9AA6',
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  inputWrapper: {
    width: '100%',
    borderTopWidth: 1,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 11,
    fontWeight: '600',
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#00E5C3',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

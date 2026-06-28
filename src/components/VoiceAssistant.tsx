import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TextInput, Platform, ActivityIndicator } from 'react-native';
import { Mic, MicOff, X, Sparkles, Volume2, Send, Radio, Headphones } from 'lucide-react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { useVitalsStore } from '../store/useVitalsStore';
import { useWaterStore } from '../store/useWaterStore';
import { useDiarrheaStore } from '../store/useDiarrheaStore';
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
  const { recoveryScore } = useDiarrheaStore();

  const [isOpen, setIsOpen] = useState(false);
  const [statusText, setStatusText] = useState('Click micro to speak...');
  const [typedCommand, setTypedCommand] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [handsFreeMode, setHandsFreeMode] = useState(false);

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
  }, [handsFreeMode, isOpen]); // Rebind to access updated handsFreeMode in speech hooks if needed

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

    // Advanced Command Parsers
    if (cmd.includes('how hydrated') || cmd.includes('hydration score') || cmd === 'how hydrated am i') {
      speakResponse = `You are currently ${100 - prediction.dehydrationPercent}% hydrated. Your total water intake today is ${currentIntake} ml against your goal of ${dailyWaterTarget} ml. Dehydration risk is ${prediction.riskLevel}.`;
    } else if (cmd.includes('create recovery') || cmd.includes('recovery plan') || cmd.includes('plan recovery')) {
      setActiveTab('recoveryPlanner');
      speakResponse = `Navigating to recovery planner. I am analyzing your HRV baseline of ${currentVitals.hrv} milliseconds to generate your recovery plan.`;
      setTimeout(() => handleClose(), 2500);
    } else if (cmd.includes('generate report') || cmd.includes('create report') || cmd.includes('weekly report')) {
      setActiveTab('weeklyReports');
      speakResponse = `Opening weekly report center. Fetching your optical telemetry biometrics to generate your weekly wellness audit.`;
      setTimeout(() => handleClose(), 2500);
    } else if (cmd.includes('hydration') || cmd.includes('water') || cmd.includes('drink')) {
      if (cmd.includes('planner') || cmd.includes('show') || cmd.includes('open')) {
        setActiveTab('hydrationPlanner');
        speakResponse = "Opening hydration planner screen.";
        setTimeout(() => handleClose(), 2000);
      } else {
        speakResponse = `Your daily fluid intake is ${currentIntake} ml against a target of ${dailyWaterTarget} ml. Dehydration probability stands at ${prediction.dehydrationPercent}%.`;
      }
    } else if (cmd.includes('recovery')) {
      setActiveTab('recoveryPlanner');
      speakResponse = `Navigating to recovery planner dashboard. Your current gut recovery index is ${recoveryScore} percent.`;
      setTimeout(() => handleClose(), 2000);
    } else if (cmd.includes('report') || cmd.includes('weekly')) {
      setActiveTab('weeklyReports');
      speakResponse = "Opening Weekly Report Center.";
      setTimeout(() => handleClose(), 2000);
    } else if (cmd.includes('settings')) {
      setActiveTab('settings');
      speakResponse = "Opening System Settings.";
      setTimeout(() => handleClose(), 2000);
    } else if (cmd.includes('profile')) {
      setActiveTab('profile');
      speakResponse = "Opening Profile Setup.";
      setTimeout(() => handleClose(), 2000);
    } else if (cmd.includes('band') || cmd.includes('manager') || cmd.includes('device')) {
      setActiveTab('device');
      speakResponse = "Opening band connection settings.";
      setTimeout(() => handleClose(), 2000);
    } else if (cmd.includes('coach')) {
      setActiveTab('aiCoach');
      speakResponse = "Opening AI Coach chat interface.";
      setTimeout(() => handleClose(), 2000);
    } else if (cmd.includes('timeline') || cmd.includes('history') || cmd.includes('logs')) {
      setActiveTab('timeline');
      speakResponse = "Opening Health Timeline chronological logs.";
      setTimeout(() => handleClose(), 2000);
    } else if (cmd.includes('export') || cmd.includes('center')) {
      setActiveTab('exportCenter');
      speakResponse = "Opening Export Center compiler.";
      setTimeout(() => handleClose(), 2000);
    } else if (cmd.includes('emergency') || cmd.includes('sos')) {
      setActiveTab('emergencyMode');
      speakResponse = "Entering Emergency Safety Mode.";
      setTimeout(() => handleClose(), 2000);
    } else if (cmd.includes('dashboard') || cmd.includes('home')) {
      setActiveTab('dashboard');
      speakResponse = "Returning to main dashboard.";
      setTimeout(() => handleClose(), 2000);
    } else if (cmd.includes('how am i') || cmd.includes('status')) {
      speakResponse = `You are doing well today. Heart rate is stable at ${currentVitals.heartRate} BPM, and dehydration risk is low at ${prediction.dehydrationPercent}% probability.`;
    } else {
      speakResponse = `Understood. Processing command: "${command}". How else can I assist your health OS?`;
    }

    setStatusText(speakResponse);
    speakBack(speakResponse);
  };

  const speakBack = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        startWaveAnimations();
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        stopWaveAnimations();
        
        // Auto-listening hands-free mechanism
        if (handsFreeMode && isOpen) {
          setTimeout(() => {
            if (recognitionRef.current && !isListening) {
              recognitionRef.current.start();
            }
          }, 600);
        }
      };
      
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

  // Dynamic wave color mapping
  const waveColor = isListening 
    ? '#FF4D6D' // Red Alert Listening
    : (isSpeaking ? '#00E5C3' : '#14B8FF'); // Green Speaking / Blue Idle

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

            {/* Hands-Free Toggle Mode */}
            <View style={styles.handsFreeRow}>
              <View style={styles.handsFreeLeft}>
                <Headphones size={14} color={handsFreeMode ? '#00E5C3' : textSecondary} style={{ marginRight: 8 }} />
                <Text style={[styles.handsFreeLabel, { color: textPrimary }]}>Hands-Free Auto-Listening</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setHandsFreeMode(!handsFreeMode);
                  setStatusText(!handsFreeMode ? 'Hands-Free active. Speak your command...' : 'Hands-Free disabled.');
                }}
                style={[
                  styles.handsFreeSwitch,
                  { backgroundColor: handsFreeMode ? '#00E5C3' : (darkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0') }
                ]}
              >
                <View style={[styles.switchKnob, { alignSelf: handsFreeMode ? 'flex-end' : 'flex-start' }]} />
              </TouchableOpacity>
            </View>

            {/* Listening Wave Animations */}
            <View style={styles.wavesContainer}>
              <Animated.View style={[styles.waveCircle, { transform: [{ scale: waveAnim1 }], opacity: (isListening || isSpeaking) ? 0.3 : 0.05, backgroundColor: waveColor }]} />
              <Animated.View style={[styles.waveCircle, styles.waveCircleMid, { transform: [{ scale: waveAnim2 }], opacity: (isListening || isSpeaking) ? 0.2 : 0.03, backgroundColor: waveColor }]} />
              <Animated.View style={[styles.waveCircle, styles.waveCircleOuter, { transform: [{ scale: waveAnim3 }], opacity: (isListening || isSpeaking) ? 0.15 : 0.02, backgroundColor: waveColor }]} />
              
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

            {/* Open Coach Chat button */}
            <TouchableOpacity 
              onPress={() => {
                setActiveTab('aiCoach');
                setIsOpen(false);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: 'rgba(0, 229, 195, 0.1)',
                borderWidth: 1,
                borderColor: 'rgba(0, 229, 195, 0.25)',
                marginVertical: 12,
                width: '100%'
              }}
              activeOpacity={0.7}
            >
              <Sparkles size={14} color="#00E5C3" style={{ marginRight: 6 }} />
              <Text style={{ color: '#00E5C3', fontSize: 11, fontWeight: '800' }}>Open AI Coach Chat Interface</Text>
            </TouchableOpacity>

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
    marginBottom: 10,
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
  handsFreeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  handsFreeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  handsFreeLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  handsFreeSwitch: {
    width: 34,
    height: 18,
    borderRadius: 9,
    padding: 2,
    justifyContent: 'center',
  },
  switchKnob: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
  },
  wavesContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 14,
  },
  waveCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  waveCircleMid: {
    // scale offset is managed by animations
  },
  waveCircleOuter: {
    // scale offset is managed by animations
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
    marginVertical: 6,
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
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  inputWrapper: {
    width: '100%',
    borderTopWidth: 1,
    paddingTop: 14,
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

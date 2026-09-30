import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { AlertTriangle, ShieldCheck, PhoneCall, Check } from 'lucide-react-native';

interface FallDetectionModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirmHelp: () => void;
}

export const FallDetectionModal: React.FC<FallDetectionModalProps> = ({
  visible,
  onCancel,
  onConfirmHelp,
}) => {
  const [countdown, setCountdown] = useState<number>(10);

  useEffect(() => {
    let timer: any;
    if (visible) {
      setCountdown(10);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onConfirmHelp(); // Trigger help flow on 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconRing}>
            <AlertTriangle color="#EF4444" size={36} />
          </View>

          <Text style={styles.alertTitle}>FALL / IMPACT DETECTED</Text>
          <Text style={styles.alertDesc}>
            BMI160 edge accelerometer detected a high g-force deceleration followed by user immobility.
          </Text>

          <View style={styles.timerCircle}>
            <Text style={styles.timerNumber}>{countdown}</Text>
            <Text style={styles.timerLabel}>SECONDS</Text>
          </View>

          <Text style={styles.autoDispatchText}>
            Emergency SOS alert will trigger automatically when timer expires.
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Check color="#FFFFFF" size={16} />
              <Text style={styles.cancelBtnText}>I'M OK</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.helpBtn} 
              onPress={onConfirmHelp}
              activeOpacity={0.8}
            >
              <PhoneCall color="#FFFFFF" size={16} />
              <Text style={styles.helpBtnText}>CALL FOR HELP</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.demoNotice}>
            * Hackathon Simulation Mode: No live 112 emergency calls will be dispatched.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 19, 43, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#131C35',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  alertDesc: {
    fontSize: 12,
    color: '#CBD5E1',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
  timerCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 18,
    borderWidth: 4,
    borderColor: '#EF4444',
  },
  timerNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#F8FAFC',
    lineHeight: 36,
  },
  timerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 1,
  },
  autoDispatchText: {
    fontSize: 11,
    color: '#F59E0B',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  helpBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
  },
  helpBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  demoNotice: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 14,
    textAlign: 'center',
  },
});

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { AlertOctagon } from 'lucide-react-native';

interface EmergencyButtonProps {
  onPress: () => void;
  compact?: boolean;
}

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({ onPress, compact = false }) => {
  if (compact) {
    return (
      <TouchableOpacity style={styles.compactButton} onPress={onPress} activeOpacity={0.8}>
        <AlertOctagon color="#FFFFFF" size={16} />
        <Text style={styles.compactText}>SOS Emergency</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.fullButton} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.iconCircle}>
        <AlertOctagon color="#EF4444" size={20} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.fullTitle}>EMERGENCY SOS OVERLAY</Text>
        <Text style={styles.fullSubtitle}>Instant dispatch demo & MPU6500 fall alert</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  compactText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  fullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginTop: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  textContainer: {
    flex: 1,
  },
  fullTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B',
    letterSpacing: 0.5,
  },
  fullSubtitle: {
    fontSize: 11,
    color: '#7F1D1D',
    marginTop: 2,
  },
});

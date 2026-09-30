import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { X, ShieldCheck, Cpu, WifiOff, CheckCircle2 } from 'lucide-react-native';

interface EdgeAISheetModalProps {
  visible: boolean;
  onClose: () => void;
  isOffline: boolean;
  onToggleOffline: () => void;
}

export const EdgeAISheetModal: React.FC<EdgeAISheetModalProps> = ({
  visible,
  onClose,
  isOffline,
  onToggleOffline,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleGroup}>
              <View style={styles.iconBox}>
                <Cpu color="#0D9488" size={18} />
              </View>
              <View>
                <Text style={styles.title}>HYDRAX EDGE AI</Text>
                <Text style={styles.subtitle}>Privacy-preserving local inference engine</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="#94A3B8" size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.checkRow}>
              <CheckCircle2 color="#059669" size={16} />
              <Text style={styles.checkLabel}>Health data:</Text>
              <Text style={styles.checkVal}>Processed locally ✓</Text>
            </View>

            <View style={styles.checkRow}>
              <CheckCircle2 color="#059669" size={16} />
              <Text style={styles.checkLabel}>Risk analysis:</Text>
              <Text style={styles.checkVal}>Processed locally ✓</Text>
            </View>

            <View style={styles.checkRow}>
              <CheckCircle2 color="#059669" size={16} />
              <Text style={styles.checkLabel}>Internet connection:</Text>
              <Text style={styles.checkVal}>Optional</Text>
            </View>

            <View style={styles.checkRow}>
              <CheckCircle2 color="#059669" size={16} />
              <Text style={styles.checkLabel}>Data sharing:</Text>
              <Text style={styles.checkVal}>Controlled by you</Text>
            </View>

            <View style={styles.quoteBox}>
              <ShieldCheck color="#0D9488" size={16} />
              <Text style={styles.quoteText}>
                "HydraX continues working and monitoring your health even when network connectivity is unavailable."
              </Text>
            </View>

            {/* Offline Toggle Bar */}
            <TouchableOpacity 
              style={[styles.offlineToggleRow, isOffline && styles.offlineToggleActive]} 
              onPress={onToggleOffline}
              activeOpacity={0.8}
            >
              <WifiOff color={isOffline ? '#D97706' : '#64748B'} size={16} />
              <Text style={[styles.offlineToggleText, isOffline && { color: '#D97706', fontWeight: '800' }]}>
                {isOffline ? 'Network Outage Mode: ACTIVE (Offline Monitoring)' : 'Simulate Network Outage (Offline Mode)'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    marginTop: 14,
    gap: 10,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  checkLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    flex: 1,
  },
  checkVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  quoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(13, 148, 136, 0.08)',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  quoteText: {
    fontSize: 11,
    color: '#0D9488',
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 15,
  },
  offlineToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  offlineToggleActive: {
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  offlineToggleText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
});

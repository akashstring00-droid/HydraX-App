import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react-native';
import { useToastStore, ToastMessage } from '../store/useToastStore';
import { useSettingsStore } from '../store/useSettingsStore';

export const Toast: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts);
  const hideToast = useToastStore((state) => state.hideToast);
  const darkMode = useSettingsStore((state) => state.darkMode);

  if (toasts.length === 0) return null;

  const getToastStyle = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return {
          bg: darkMode ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
          border: '#10B981',
          icon: '#10B981',
        };
      case 'error':
        return {
          bg: darkMode ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
          border: '#EF4444',
          icon: '#EF4444',
        };
      case 'warning':
        return {
          bg: darkMode ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB',
          border: '#F59E0B',
          icon: '#F59E0B',
        };
      case 'info':
      default:
        return {
          bg: darkMode ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF',
          border: '#3B82F6',
          icon: '#3B82F6',
        };
    }
  };

  const renderIcon = (type: ToastMessage['type'], color: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} color={color} />;
      case 'error':
        return <AlertCircle size={16} color={color} />;
      case 'warning':
        return <AlertTriangle size={16} color={color} />;
      case 'info':
      default:
        return <Info size={16} color={color} />;
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => {
        const colors = getToastStyle(toast.type);
        return (
          <View
            key={toast.id}
            style={[
              styles.toastCard,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                borderLeftWidth: 4,
              },
            ]}
          >
            <View style={styles.toastContent}>
              {renderIcon(toast.type, colors.icon)}
              <Text style={[styles.toastText, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>
                {toast.message}
              </Text>
            </View>
            <TouchableOpacity onPress={() => hideToast(toast.id)} style={styles.closeBtn}>
              <X size={14} color={darkMode ? '#8E9AA6' : '#64748B'} />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 24 : 60,
    right: Platform.OS === 'web' ? 24 : 16,
    left: Platform.OS === 'web' ? undefined : 16,
    width: Platform.OS === 'web' ? 340 : undefined,
    zIndex: 100000,
    gap: 8,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  toastText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 10,
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
});

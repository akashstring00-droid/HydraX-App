import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { ShieldAlert, RefreshCw, Trash2, Code } from 'lucide-react-native';
import { errorTracker } from '../lib/errorTracker';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Log to our custom error tracker
    errorTracker.logError(
      error.message || 'React render crash',
      error.stack || errorInfo.componentStack || undefined,
      'ReactErrorBoundary'
    );
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleResetWipe = () => {
    if (typeof window !== 'undefined') {
      const confirmWipe = window.confirm(
        "Wipe system profile caches and reset application state? This will clear all data and attempt a hot reload."
      );
      if (confirmWipe) {
        window.localStorage.clear();
        window.location.reload();
      }
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.alertIconBg}>
                <ShieldAlert size={28} color="#FF4D6D" />
              </View>
              <Text style={styles.title}>HydraX System Fault Catcher</Text>
              <Text style={styles.subtitle}>
                An unhandled runtime exception has been intercepted by the Bio-Intelligence kernel.
              </Text>
            </View>

            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {this.state.error?.name || 'Error'}: {this.state.error?.message || 'Unknown Exception'}
              </Text>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.btnPrimary} onPress={this.handleReload} activeOpacity={0.8}>
                <RefreshCw size={14} color="#050B18" style={{ marginRight: 6 }} />
                <Text style={styles.btnTextPrimary}>Reload Console</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.btnSecondary} onPress={this.handleResetWipe} activeOpacity={0.8}>
                <Trash2 size={14} color="#FF4D6D" style={{ marginRight: 6 }} />
                <Text style={styles.btnTextSecondary}>Wipe & Reset</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.detailsToggle} 
              onPress={() => this.setState({ showDetails: !this.state.showDetails })}
              activeOpacity={0.7}
            >
              <Code size={12} color="#00E5C3" style={{ marginRight: 6 }} />
              <Text style={styles.detailsToggleText}>
                {this.state.showDetails ? 'Hide Stack Trace' : 'View Core Dump Stack'}
              </Text>
            </TouchableOpacity>

            {this.state.showDetails && (
              <ScrollView style={styles.detailsScroll} contentContainerStyle={styles.detailsContent}>
                <Text style={styles.detailsText}>
                  {this.state.error?.stack || 'No stack trace details compiled.'}
                </Text>
                {this.state.errorInfo?.componentStack && (
                  <Text style={[styles.detailsText, { marginTop: 12 }]}>
                    Component Stack:
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050B18',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: 'rgba(7, 13, 30, 0.85)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.2)',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#FF4D6D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  alertIconBg: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 77, 109, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.3)',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    color: '#8E9AA6',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
  errorBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 77, 109, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.25)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF8A9E',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00E5C3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  btnTextPrimary: {
    color: '#050B18',
    fontSize: 11,
    fontWeight: '800',
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 109, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  btnTextSecondary: {
    color: '#FF4D6D',
    fontSize: 11,
    fontWeight: '800',
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 8,
  },
  detailsToggleText: {
    color: '#00E5C3',
    fontSize: 10,
    fontWeight: '800',
  },
  detailsScroll: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#03070E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
  },
  detailsContent: {
    paddingBottom: 16,
  },
  detailsText: {
    color: '#8E9AA6',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 9,
    lineHeight: 14,
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../config/theme';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error using our logger
    import('../../src/utils/logger').then(({ logger }) => {
      logger.error('ErrorBoundary caught an error:', error, {
        componentStack: errorInfo?.componentStack,
        component: 'ErrorBoundary',
      });
    }).catch(err => {
      console.error('Logger import failed:', err);
      console.error('Original error:', error, errorInfo);
    });

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send to error tracking service (Sentry)
    // Sentry.captureException(error, {
    //   extra: errorInfo,
    //   tags: {
    //     component: 'ErrorBoundary',
    //   },
    // });
  }

  handleReset() {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="alert-circle-outline" size={80} color="#FF6B6B" />

            <Text style={styles.title}>Что-то пошло не так</Text>
            <Text style={styles.subtitle}>
              Извините, произошла ошибка. Мы уже работаем над ее исправлением.
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={this.handleReset}
            >
              <Text style={styles.buttonText}>Попробовать снова</Text>
            </TouchableOpacity>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Детали ошибки (только в dev mode):</Text>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorStack}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#FF69B4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  errorDetails: {
    maxHeight: 200,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    width: '100%',
  },
  errorTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#333',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Courier',
    color: '#d32f2f',
    marginBottom: 10,
  },
  errorStack: {
    fontSize: 10,
    fontFamily: 'Courier',
    color: '#666',
  },
});

export default ErrorBoundary;

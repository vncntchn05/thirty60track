import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '@/constants/theme';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message} numberOfLines={4}>
            {this.state.error.message}
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => this.setState({ error: null })}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...typography.heading3,
    color: colors.textPrimaryDark,
    textAlign: 'center',
  },
  message: {
    ...typography.bodySmall,
    color: colors.textSecondaryDark,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  btnText: {
    ...typography.body,
    color: colors.textInverse,
    fontWeight: '700',
  },
});

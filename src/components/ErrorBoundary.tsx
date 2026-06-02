import { Component, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * App-wide error boundary so a thrown render in one screen doesn't take
 * down the whole tree. Shows a friendly Glean-styled fallback with a
 * 'Try again' button that clears the error and re-renders children.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    // Surface to Metro logs in dev; in prod this is a no-op.
    if (__DEV__) console.error('[ErrorBoundary]', error);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>{this.state.error.message || 'An unexpected error occurred.'}</Text>
        <Pressable onPress={this.reset} style={styles.btn}>
          <Text style={styles.btnText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 32,
  },
  title: { ...typography.title, color: colors.textPrimary, marginBottom: 8 },
  body: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  btn: { backgroundColor: colors.primary, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 999 },
  btnText: { color: colors.surface, fontWeight: '700', fontSize: 15 },
});

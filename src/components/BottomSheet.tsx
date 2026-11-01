import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function BottomSheet({ visible, title, onClose, children }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.backdrop }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Chiudi"
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            style={[
              styles.sheet,
              { backgroundColor: theme.surface, paddingBottom: Math.max(insets.bottom, 16) },
            ]}
            accessibilityViewIsModal
          >
            <View style={[styles.grabber, { backgroundColor: theme.border }]} />
            <Text style={[styles.title, { color: theme.text }]} accessibilityRole="header">
              {title}
            </Text>
            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 16,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3 },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
});

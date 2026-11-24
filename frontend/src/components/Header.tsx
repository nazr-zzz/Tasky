import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type HeaderProps = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export default function Header({ title, onBack, right }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <View style={styles.side}>
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.backBtn}
            >
              <Text style={styles.backText}>‹ Kembali</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={[styles.side, styles.sideRight]}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dddddd',
  },
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  side: { width: 90 },
  sideRight: { alignItems: 'flex-end' },
  backBtn: { minHeight: 44, minWidth: 44, justifyContent: 'center' },
  backText: { fontSize: 16, color: '#007AFF' },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#0F2A38',
  },
});
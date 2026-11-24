import {
  TabList,
  TabListProps,
  Tabs,
  TabTrigger,
} from 'expo-router/ui';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';

export function TabButton({ children, isFocused, ...props }: any) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View
        style={[
          styles.tabButtonView,
          isFocused && styles.tabButtonActive,
        ]}>
        <Text
          numberOfLines={1}
          style={[
            styles.tabLabel,
            isFocused && styles.tabLabelActive,
          ]}>
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View
      {...props}
      style={[
        styles.tabListContainer,
        {
          paddingTop: Math.max(insets.top, 12),
          backgroundColor: colors.background,
        },
      ]}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          Tasky
        </ThemedText>
        <ThemedView type="backgroundElement" style={styles.buttonContainer}>
          {props.children}
        </ThemedView>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  innerContainer: {
    flex: 1,
    padding: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  brandText: {
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabButtonView: {
    minHeight: 40,
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#EBF3FC',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  tabLabelActive: {
    fontWeight: '700',
    color: '#0B4A9E',
  },
  pressed: {
    opacity: 0.75,
  },
});
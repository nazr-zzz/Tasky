import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Href } from "expo-router";

type Props = {
  label?: string;
  fallback?: Href;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export default function BackButton({
  label = "Kembali",
  fallback = "/",
  color = "#1F2937",
  style,
}: Props) {
  const router = useRouter();

  const handlePress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.6}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={[styles.button, style]}
      accessibilityRole="button"
      accessibilityLabel="Kembali"
    >
      <Ionicons name="arrow-back" size={24} color={color} />
      {label ? <Text style={[styles.label, { color }]}>{label}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginTop: Platform.OS === "android" ? 8 : 0,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
}); 
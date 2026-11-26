import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export type ScreenHeaderProps = {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onPress?: () => void;
  initial?: string;
  label?: string;
  rightComponent?: React.ReactNode;
};

export default function BackButton({
  title,
  subtitle,
  onBack,
  onPress,
  initial,
  label = "← Kembali",
  rightComponent,
}: ScreenHeaderProps) {
  const router = useRouter();

  const handlePress = () => {
    // 1. Prioritaskan handler onBack/onPress dari parent (mengembalikan ke Beranda)
    if (onBack) {
      onBack();
      return;
    }
    if (onPress) {
      onPress();
      return;
    }
    // 2. Jika tidak ada handler kustom, gunakan navigasi router
    if (router.canGoBack()) {
      router.back();
    } else {
      // Jangan pernah kembali ke "/" (login) kecuali logout
      router.replace("/dashboard");
    }
  };

  // JIKA TITLE DIBERIKAN: Render Header Lengkap Sesuai Figma
  if (title) {
    const avatarLetter = (initial || "?").charAt(0).toUpperCase();

    return (
      <View style={styles.headerBar}>
        {/* Tombol Kembali dengan area sentuh nyaman */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handlePress}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 16 }}
          accessibilityRole="button"
          accessibilityLabel="Kembali ke Beranda"
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {/* Judul & Subtitle di Tengah */}
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Avatar Profil di Kanan */}
        <View style={styles.rightContainer}>
          {rightComponent ? (
            rightComponent
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // JIKA TANPA TITLE: Render Tombol Kembali Standar (misal di stack header _layout)
  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={handlePress}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

export { BackButton as ScreenHeader };

const styles = StyleSheet.create({
  // Style untuk Header Lengkap sesuai Figma
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    minHeight: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 22,
    color: "#0F172A",
    fontWeight: "bold",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 1,
    textAlign: "center",
  },
  rightContainer: {
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EEF4FF",
    borderWidth: 1.5,
    borderColor: "#BAE0FD",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0047BA",
  },

  // Style untuk Tombol Kembali Standar
  btn: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0047BA",
  },
});

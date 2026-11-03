import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
} from "react-native";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

export default function SplashScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EBF5FF" />

      <View style={styles.content}>
        {/* TOP BADGE: RUANG BELAJAR DIGITAL */}
        <View style={styles.topBadge}>
          <View style={styles.dot} />
          <Text style={styles.topBadgeText}>RUANG BELAJAR DIGITAL</Text>
        </View>

        {/* LOGO DENGAN CHECKMARK BADGE SESUAI FIGMA */}
        <View style={styles.logoWrapper}>
          <View style={styles.logoBox}>
            <View style={styles.logoInner}>
              <Text style={styles.logoLetter}>T</Text>
            </View>
          </View>
          <View style={styles.checkBadge}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
        </View>

        {/* JUDUL DAN TAGLINE */}
        <Text style={styles.brandTitle}>Tasky</Text>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeIcon}>🎓</Text>
          <Text style={styles.categoryBadgeText}>
            Aplikasi Tugas Kelas Mahasiswa
          </Text>
        </View>

        <Text style={styles.tagline}>
          Catat tugas kelas, tak ada lagi yang{"\n"}terlewat.
        </Text>

        {/* TIPS SANTAI CARD SESUAI FIGMA */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsIconBox}>
            <Text style={styles.tipsIcon}>💡</Text>
          </View>
          <View style={styles.tipsContent}>
            <Text style={styles.tipsLabel}>TIPS SANTAI</Text>
            <Text style={styles.tipsText}>Fokus 1 tugas per sesi belajar!</Text>
          </View>
        </View>

        {/* SLIDER DOTS INDICATOR */}
        <View style={styles.dotsRow}>
          <View style={styles.dotInactive} />
          <View style={styles.dotActive} />
          <View style={styles.dotInactive} />
        </View>

        {/* TOMBOL LANJUT KE LOGIN */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.replace("/")}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Mulai Gunakan Tasky →</Text>
        </TouchableOpacity>

        {/* FOOTER VERSI */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>
            v1.0.0 • Kolaborasi Kelas Jadi Mudah
          </Text>
          <Text style={styles.madeWithText}>
            ❤️ Dibuat untuk pejuang semester
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F8FF",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  topBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0EFFE",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 36,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0284C7",
    marginRight: 8,
  },
  topBadgeText: {
    color: "#0369A1",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  logoWrapper: {
    position: "relative",
    marginBottom: 20,
  },
  logoBox: {
    width: 100,
    height: 100,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: "#E0F2FE",
  },
  logoInner: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: "#F0F9FF",
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    fontSize: 44,
    fontWeight: "900",
    color: "#0369A1",
  },
  checkBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0369A1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  checkIcon: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#102A36",
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F2FE",
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  categoryBadgeIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: "#0284C7",
    fontWeight: "700",
  },
  tagline: {
    fontSize: 14,
    color: "#475467",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  tipsCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E0ECF8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  tipsIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  tipsIcon: {
    fontSize: 20,
  },
  tipsContent: {
    flex: 1,
  },
  tipsLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#102A36",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tipsText: {
    fontSize: 13,
    color: "#475467",
    fontWeight: "500",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 26,
  },
  dotInactive: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#CBD5E1",
  },
  dotActive: {
    width: 22,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#0369A1",
  },
  startButton: {
    width: "100%",
    backgroundColor: "#073B82",
    borderRadius: 14,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#073B82",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  footer: {
    alignItems: "center",
  },
  versionText: {
    fontSize: 11,
    color: "#94A3B8",
    marginBottom: 4,
  },
  madeWithText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
});


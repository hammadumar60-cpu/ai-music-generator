import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, ActivityIndicator, Alert, Platform, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Purchases from "react-native-purchases";
import { useSubscription } from "../App";

const BENEFITS = [
  { icon: "music-note-plus", label: "Unlimited song generations", free: false },
  { icon: "clock-time-five", label: "Up to 5-minute tracks", free: false },
  { icon: "quality-high", label: "High-quality 320kbps MP3", free: false },
  { icon: "waveform", label: "Advanced genre & mood controls", free: false },
  { icon: "download-circle", label: "Offline library & bulk download", free: false },
  { icon: "music-circle", label: "3 songs/day, up to 1 minute", free: true },
  { icon: "headphones", label: "Standard quality playback", free: true },
];

export default function PaywallScreen({ navigation }) {
  const { isPremium, refreshSubscription } = useSubscription();
  const [offerings, setOfferings] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("annual");
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchOfferings();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.00, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const fetchOfferings = async () => {
    try {
      const result = await Purchases.getOfferings();
      if (result.current) setOfferings(result.current);
    } catch (e) {
      console.warn("Offerings fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!offerings) return;
    setPurchasing(true);
    try {
      const pkg = selectedPlan === "annual" ? offerings.annual : offerings.monthly;
      if (!pkg) {
        Alert.alert("Unavailable", "This plan is not available in your region.");
        return;
      }
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      await refreshSubscription();
      if (customerInfo.entitlements.active["premium"]) {
        Alert.alert("Welcome to Premium!", "Enjoy unlimited music generation.", [
          { text: "Start Creating!", onPress: () => navigation.goBack?.() },
        ]);
      }
    } catch (e) {
      if (!e.userCancelled) Alert.alert("Purchase Failed", e.message || "Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const info = await Purchases.restorePurchases();
      await refreshSubscription();
      if (info.entitlements.active["premium"]) {
        Alert.alert("Restored!", "Your Premium subscription is active.");
      } else {
        Alert.alert("No Purchase Found", "No previous subscription found for this account.");
      }
    } catch (e) {
      Alert.alert("Restore Failed", e.message || "Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  const getPrice = (type) => {
    if (!offerings) return type === "monthly" ? "$14.99" : "$99.99";
    const pkg = type === "annual" ? offerings.annual : offerings.monthly;
    return pkg?.product?.localizedPriceString ?? (type === "monthly" ? "$14.99" : "$99.99");
  };

  if (isPremium) {
    return (
      <SafeAreaView style={s.root}>
        <LinearGradient colors={["#0A0A0F", "#0D1A0A"]} style={StyleSheet.absoluteFill} />
        <View style={s.alreadyPremium}>
          <Ionicons name="checkmark-circle" size={72} color="#4ADE80" />
          <Text style={s.apTitle}>You're Premium 🎶</Text>
          <Text style={s.apSub}>Unlimited music generation is active!</Text>
          <TouchableOpacity style={s.apBtn} onPress={() => navigation.goBack?.()}>
            <Text style={s.apBtnText}>Start Creating</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={["#0A0A0F", "#0E0820", "#0A0A0F"]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {navigation.canGoBack?.() && (
          <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={22} color="#888" />
          </TouchableOpacity>
        )}

        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={s.header}>
            <View style={s.badge}>
              <MaterialCommunityIcons name="crown" size={13} color="#0A0A0F" />
              <Text style={s.badgeText}>PREMIUM</Text>
            </View>
            <Text style={s.headline}>Unlock Your{"\n"}Full Creative Sound</Text>
            <Text style={s.subheadline}>Generate full-length tracks with unlimited ideas. Cancel anytime.</Text>
          </View>

          <View style={s.planRow}>
            <TouchableOpacity style={[s.planCard, selectedPlan === "monthly" && s.planCardSelected]} onPress={() => setSelectedPlan("monthly")} activeOpacity={0.85}>
              <Text style={s.planName}>Monthly</Text>
              <Text style={s.planPrice}>{loading ? "…" : getPrice("monthly")}</Text>
              <Text style={s.planPer}>per month</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[s.planCard, s.planCardAnnual, selectedPlan === "annual" && s.planCardSelected]} onPress={() => setSelectedPlan("annual")} activeOpacity={0.85}>
              <View style={s.saveBadge}>
                <Text style={s.saveBadgeText}>BEST VALUE</Text>
              </View>
              <Text style={s.planName}>Annual</Text>
              <Text style={[s.planPrice, { color: "#E8C547" }]}>{loading ? "…" : getPrice("annual")}</Text>
              <Text style={s.planPer}>~$8.33/mo · billed yearly</Text>
            </TouchableOpacity>
          </View>

          <View style={s.benefitsBox}>
            <Text style={s.benefitsTitle}>What you get</Text>
            {BENEFITS.map((b, i) => (
              <View key={i} style={s.benefitRow}>
                <MaterialCommunityIcons name={b.free ? "check-circle-outline" : "star-circle"} size={20} color={b.free ? "#555" : "#E8C547"} style={{ marginRight: 10 }} />
                <Text style={[s.benefitText, b.free && s.benefitTextDim]}>{b.label}</Text>
                {!b.free && (
                  <View style={s.proBadge}>
                    <Text style={s.proBadgeText}>PRO</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity style={s.ctaBtn} onPress={handlePurchase} disabled={purchasing || loading} activeOpacity={0.9}>
              <LinearGradient colors={["#F5D76E", "#E8C547", "#C9A227"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaGradient}>
                {purchasing ? (
                  <ActivityIndicator color="#0A0A0F" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="crown" size={18} color="#0A0A0F" style={{ marginRight: 8 }} />
                    <Text style={s.ctaText}>
                      {selectedPlan === "annual" ? "Start Annual Plan — $99.99/yr" : "Start Monthly — $14.99/mo"}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity style={s.restoreBtn} onPress={handleRestore} disabled={restoring}>
            {restoring ? <ActivityIndicator color="#888" size="small" /> : <Text style={s.restoreText}>Restore Purchase</Text>}
          </TouchableOpacity>

          <Text style={s.legalText}>
            Subscriptions auto-renew unless cancelled 24 hours before renewal. Manage in your {Platform.OS === "ios" ? "App Store" : "Google Play"} account.{"\n"}
            <Text style={s.legalLink}>Privacy Policy</Text>{"  ·  "}
            <Text style={s.legalLink}>Terms of Service</Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A0F" },
  scroll: { paddingHorizontal: 22, paddingBottom: 48, paddingTop: 20 },
  closeBtn: { alignSelf: "flex-end", backgroundColor: "#1A1A2E", borderRadius: 20, padding: 6, marginBottom: 8 },
  alreadyPremium: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  apTitle: { fontSize: 28, fontWeight: "bold", color: "#FFF", marginTop: 20, textAlign: "center" },
  apSub: { fontSize: 16, color: "#888", marginTop: 12, textAlign: "center", lineHeight: 24 },
  apBtn: { marginTop: 32, backgroundColor: "#E8C547", paddingHorizontal: 36, paddingVertical: 14, borderRadius: 30 },
  apBtnText: { fontSize: 16, fontWeight: "bold", color: "#0A0A0F" },
  header: { alignItems: "center", marginBottom: 28, marginTop: 8 },
  badge: { flexDirection: "row", alignItems: "center", backgroundColor: "#E8C547", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, gap: 5, marginBottom: 16 },
  badgeText: { fontSize: 11, fontWeight: "bold", color: "#0A0A0F", letterSpacing: 1.5 },
  headline: { fontSize: 32, fontWeight: "bold", color: "#FFF", textAlign: "center", lineHeight: 40 },
  subheadline: { fontSize: 15, color: "#888", textAlign: "center", marginTop: 12, lineHeight: 22 },
  planRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  planCard: { flex: 1, backgroundColor: "#12121F", borderRadius: 18, padding: 18, borderWidth: 1.5, borderColor: "#1E1E35", alignItems: "center", position: "relative" },
  planCardAnnual: { borderColor: "#2E2E1A" },
  planCardSelected: { borderColor: "#E8C547", backgroundColor: "#16160A" },
  saveBadge: { position: "absolute", top: -12, alignSelf: "center", backgroundColor: "#E8C547", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  saveBadgeText: { fontSize: 9, fontWeight: "bold", color: "#0A0A0F", letterSpacing: 1 },
  planName: { fontSize: 16, fontWeight: "bold", color: "#FFF", marginTop: 10 },
  planPrice: { fontSize: 26, fontWeight: "bold", color: "#FFF", marginTop: 6 },
  planPer: { fontSize: 11, color: "#666", marginTop: 4, textAlign: "center" },
  benefitsBox: { backgroundColor: "#0F0F1C", borderRadius: 20, padding: 20, marginBottom: 28, borderWidth: 1, borderColor: "#1A1A2E" },
  benefitsTitle: { fontSize: 14, color: "#888", letterSpacing: 1.2, marginBottom: 16, textTransform: "uppercase" },
  benefitRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  benefitText: { fontSize: 14, color: "#DDD", flex: 1 },
  benefitTextDim: { color: "#555" },
  proBadge: { backgroundColor: "#E8C54722", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
  proBadgeText: { fontSize: 9, fontWeight: "bold", color: "#E8C547", letterSpacing: 0.8 },
  ctaBtn: { borderRadius: 30, overflow: "hidden", marginBottom: 16 },
  ctaGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 17, paddingHorizontal: 32 },
  ctaText: { fontSize: 16, fontWeight: "bold", color: "#0A0A0F" },
  restoreBtn: { alignItems: "center", paddingVertical: 12, marginBottom: 8 },
  restoreText: { fontSize: 14, color: "#666" },
  legalText: { fontSize: 11, color: "#444", textAlign: "center", lineHeight: 18, paddingHorizontal: 8 },
  legalLink: { color: "#666", textDecorationLine: "underline" },
});

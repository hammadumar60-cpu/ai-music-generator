import React from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSubscription } from "../App";

export default function HomeScreen() {
  const navigation = useNavigation();
  const { isPremium, dailyGenerations } = useSubscription();

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={["#0A0A0F", "#0A0A0F"]} style={StyleSheet.absoluteFill} />
      <View style={s.content}>
        <Text style={s.greeting}>Good vibes,{"\n"}let's create. 🎵</Text>

        <View style={s.statRow}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{dailyGenerations}</Text>
            <Text style={s.statLabel}>Today's tracks</Text>
          </View>
          <View style={[s.statCard, { borderColor: isPremium ? "#E8C547" : "#1A1A2E" }]}>
            <MaterialCommunityIcons
              name={isPremium ? "crown" : "lock"}
              size={22}
              color={isPremium ? "#E8C547" : "#555"}
            />
            <Text style={s.statLabel}>{isPremium ? "Premium" : "Free Tier"}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={s.quickBtn}
          onPress={() => navigation.navigate("Generator")}
        >
          <LinearGradient colors={["#E8C547", "#C9A227"]} style={s.quickGrad}>
            <MaterialCommunityIcons name="music-note-plus" size={20} color="#0A0A0F" />
            <Text style={s.quickText}>Generate a Track</Text>
          </LinearGradient>
        </TouchableOpacity>

        {!isPremium && (
          <TouchableOpacity
            style={s.upgradeRow}
            onPress={() => navigation.navigate("Paywall")}
          >
            <Text style={s.upgradeText}>
              ⭐ Upgrade to Premium — $14.99/month{"\n"}
              Unlimited tracks up to 5 minutes!
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A0F" },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  greeting: {
    fontFamily: "Syne-Bold",
    fontSize: 34,
    color: "#FFF",
    lineHeight: 44,
    marginBottom: 32,
  },
  statRow: { flexDirection: "row", gap: 12, marginBottom: 32 },
  statCard: {
    flex: 1,
    backgroundColor: "#0F0F1C",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#1A1A2E",
  },
  statValue: { fontFamily: "Syne-Bold", fontSize: 28, color: "#FFF" },
  statLabel: {
    fontFamily: "DMSans-Regular",
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  quickBtn: { borderRadius: 28, overflow: "hidden", marginBottom: 16 },
  quickGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  quickText: { fontFamily: "Syne-Bold", fontSize: 16, color: "#0A0A0F" },
  upgradeRow: {
    backgroundColor: "#E8C54715",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8C54730",
  },
  upgradeText: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    color: "#E8C547",
    textAlign: "center",
    lineHeight: 22,
  },
});

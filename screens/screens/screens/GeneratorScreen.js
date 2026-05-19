import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, SafeAreaView, Platform } from "react-native";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSubscription } from "../App";
import { useNavigation } from "@react-navigation/native";

const API_BASE_URL = "https://your-backend-api.com";
const FREE_DAILY_LIMIT = 3;
const GENRES = ["Pop", "Hip-Hop", "Lo-Fi", "Cinematic", "Electronic", "Jazz", "Ambient", "Rock"];
const MOODS = ["Happy", "Melancholic", "Energetic", "Calm", "Dark", "Romantic", "Epic", "Playful"];
const DURATION_OPTIONS = [
  { label: "30s", value: 30, premium: false },
  { label: "1 min", value: 60, premium: false },
  { label: "2 min", value: 120, premium: true },
  { label: "3 min", value: 180, premium: true },
  { label: "5 min", value: 300, premium: true },
];

export default function GeneratorScreen() {
  const navigation = useNavigation();
  const { isPremium, dailyGenerations, incrementDailyGenerations } = useSubscription();
  const [prompt, setPrompt] = useState("");
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [trackTitle, setTrackTitle] = useState(null);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const soundRef = useRef(null);

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  const handleDurationSelect = (option) => {
    if (option.premium && !isPremium) {
      Alert.alert(
        "Premium Required",
        "Tracks longer than 1 minute require Premium ($14.99/month).",
        [
          { text: "Not Now", style: "cancel" },
          { text: "Upgrade Now", onPress: () => navigation.navigate("Paywall") },
        ]
      );
      return;
    }
    setSelectedDuration(option.value);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert("Enter a description", "Tell the AI what kind of music to make.");
      return;
    }
    if (!isPremium && dailyGenerations >= FREE_DAILY_LIMIT) {
      Alert.alert(
        "Daily Limit Reached",
        "Free users get 3 songs/day. Upgrade for unlimited!",
        [
          { text: "Later" },
          { text: "Go Premium", onPress: () => navigation.navigate("Paywall") },
        ]
      );
      return;
    }
    try {
      setGenerating(true);
      setError(null);
      setAudioUrl(null);
      await soundRef.current?.unloadAsync();

      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Tier": isPremium ? "premium" : "free",
          "Authorization": "Bearer YOUR_AUTH_TOKEN",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          genre: selectedGenre,
          mood: selectedMood,
          duration: isPremium ? selectedDuration : Math.min(selectedDuration, 60),
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Error: ${response.status}`);
      }

      const data = await response.json();
      setAudioUrl(data.audioUrl);
      setTrackTitle(data.title ?? "Generated Track");
      incrementDailyGenerations();

      setAudioLoading(true);
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: data.audioUrl },
        { shouldPlay: true },
        (status) => { if (status.isLoaded) setIsPlaying(status.isPlaying); }
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } catch (e) {
      setError(e.message || "Generation failed. Please try again.");
    } finally {
      setGenerating(false);
      setAudioLoading(false);
    }
  };

  const togglePlayPause = async () => {
    if (!soundRef.current) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  };

  const remainingGenerations = Math.max(0, FREE_DAILY_LIMIT - dailyGenerations);

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>AI Composer</Text>
          {isPremium ? (
            <View style={s.premiumPill}>
              <MaterialCommunityIcons name="crown" size={11} color="#0A0A0F" />
              <Text style={s.premiumPillText}>PRO</Text>
            </View>
          ) : (
            <TouchableOpacity style={s.freePill} onPress={() => navigation.navigate("Paywall")}>
              <Text style={s.freePillText}>{remainingGenerations} left · Upgrade $14.99/mo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={s.inputCard}>
          <Text style={s.inputLabel}>Describe your track</Text>
          <TextInput
            style={s.textInput}
            placeholder="e.g. Chill lo-fi beats with a rainy window vibe..."
            placeholderTextColor="#444"
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={3}
            maxLength={400}
          />
          <Text style={s.charCount}>{prompt.length}/400</Text>
        </View>

        <Text style={s.sectionLabel}>Genre</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
          {GENRES.map((g) => (
            <TouchableOpacity key={g} style={[s.chip, selectedGenre === g && s.chipActive]} onPress={() => setSelectedGenre(selectedGenre === g ? null : g)}>
              <Text style={[s.chipText, selectedGenre === g && s.chipTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={s.sectionLabel}>Mood</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
          {MOODS.map((m) => (
            <TouchableOpacity key={m} style={[s.chip, selectedMood === m && s.chipActiveMood]} onPress={() => setSelectedMood(selectedMood === m ? null : m)}>
              <Text style={[s.chipText, selectedMood === m && s.chipTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={s.sectionLabel}>Duration</Text>
        <View style={s.durationRow}>
          {DURATION_OPTIONS.map((opt) => {
            const locked = opt.premium && !isPremium;
            const active = selectedDuration === opt.value && !locked;
            return (
              <TouchableOpacity key={opt.value} style={[s.durationChip, active && s.durationChipActive, locked && s.durationChipLocked]} onPress={() => handleDurationSelect(opt)}>
                {locked && <Ionicons name="lock-closed" size={9} color="#666" style={{ marginRight: 3 }} />}
                <Text style={[s.durationText, active && s.durationTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {!isPremium && (
          <Text style={s.durationHint}>
            🔒 2-5 min tracks need{" "}
            <Text style={{ color: "#E8C547" }} onPress={() => navigation.navigate("Paywall")}>Premium $14.99/mo</Text>
          </Text>
        )}

        <TouchableOpacity style={[s.generateBtn, generating && { opacity: 0.7 }]} onPress={handleGenerate} disabled={generating} activeOpacity={0.85}>
          <LinearGradient colors={generating ? ["#2A2A3E", "#1A1A2E"] : ["#E8C547", "#C9A227"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.generateGradient}>
            {generating ? (
              <><ActivityIndicator color="#888" size="small" style={{ marginRight: 8 }} /><Text style={[s.generateText, { color: "#666" }]}>Composing…</Text></>
            ) : (
              <><MaterialCommunityIcons name="music-note-plus" size={20} color="#0A0A0F" style={{ marginRight: 8 }} /><Text style={s.generateText}>Generate Track</Text></>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {error && (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {audioUrl && (
          <View style={s.playerCard}>
            <View style={s.playerHeader}>
              <View style={s.albumArt}>
                <MaterialCommunityIcons name="music-circle" size={32} color="#E8C547" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={s.trackTitle} numberOfLines={1}>{trackTitle}</Text>
                <Text style={s.trackMeta}>{selectedGenre ?? "AI Generated"} · {selectedMood ?? "Original"}</Text>
              </View>
            </View>
            {audioLoading ? (
              <ActivityIndicator color="#E8C547" style={{ marginVertical: 20 }} />
            ) : (
              <View style={s.controls}>
                <TouchableOpacity style={s.playBtn} onPress={togglePlayPause}>
                  <LinearGradient colors={["#E8C547", "#C9A227"]} style={s.playBtnGradient}>
                    <Ionicons name={isPlaying ? "pause" : "play"} size={26} color="#0A0A0F" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A0F" },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  pageHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  pageTitle: { fontSize: 26, fontWeight: "bold", color: "#FFF" },
  premiumPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#E8C547", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  premiumPillText: { fontSize: 11, fontWeight: "bold", color: "#0A0A0F" },
  freePill: { backgroundColor: "#1A1A2E", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: "#2A2A3E" },
  freePillText: { fontSize: 11, color: "#888" },
  inputCard: { backgroundColor: "#0F0F1C", borderRadius: 18, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: "#1A1A2E" },
  inputLabel: { fontSize: 12, color: "#666", letterSpacing: 0.8, marginBottom: 10, textTransform: "uppercase" },
  textInput: { fontSize: 15, color: "#DDD", minHeight: 80, textAlignVertical: "top", lineHeight: 22 },
  charCount: { fontSize: 11, color: "#444", textAlign: "right", marginTop: 6 },
  sectionLabel: { fontSize: 12, color: "#666", letterSpacing: 0.8, marginBottom: 10, textTransform: "uppercase" },
  chipScroll: { marginBottom: 22 },
  chip: { backgroundColor: "#0F0F1C", borderRadius: 30, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: "#1A1A2E" },
  chipActive: { backgroundColor: "#E8C547", borderColor: "#E8C547" },
  chipActiveMood: { backgroundColor: "#4A2E8A", borderColor: "#7B5FCA" },
  chipText: { fontSize: 13, color: "#888" },
  chipTextActive: { color: "#0A0A0F", fontWeight: "600" },
  durationRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  durationChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#0F0F1C", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#1A1A2E" },
  durationChipActive: { backgroundColor: "#16160A", borderColor: "#E8C547" },
  durationChipLocked: { opacity: 0.5 },
  durationText: { fontSize: 13, color: "#888" },
  durationTextActive: { color: "#E8C547", fontWeight: "600" },
  durationHint: { fontSize: 12, color: "#555", marginBottom: 22 },
  generateBtn: { borderRadius: 28, overflow: "hidden", marginTop: 4, marginBottom: 16 },
  generateGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 17 },
  generateText: { fontSize: 16, fontWeight: "bold", color: "#0A0A0F" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FF6B6B18", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#FF6B6B30", marginBottom: 16 },
  errorText: { fontSize: 13, color: "#FF6B6B", flex: 1 },
  playerCard: { backgroundColor: "#0F0F1C", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#1A1A2E", marginTop: 8 },
  playerHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  albumArt: { width: 52, height: 52, borderRadius: 14, backgroundColor: "#1A1A2E", alignItems: "center", justifyContent: "center" },
  trackTitle: { fontSize: 16, fontWeight: "bold", color: "#FFF" },
  trackMeta: { fontSize: 12, color: "#666", marginTop: 3 },
  controls: { alignItems: "center" },
  playBtn: { borderRadius: 40, overflow: "hidden" },
  playBtnGradient: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
});

import React from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const MOCK_TRACKS = [
  { id: "1", title: "Rainy Lo-Fi Session", duration: "1:00", genre: "Lo-Fi" },
  { id: "2", title: "Epic Cinematic Build", duration: "0:45", genre: "Cinematic" },
  { id: "3", title: "Chill Summer Beats", duration: "0:55", genre: "Pop" },
];

export default function LibraryScreen() {
  const renderTrack = ({ item }) => (
    <View style={s.trackRow}>
      <View style={s.trackIcon}>
        <MaterialCommunityIcons name="music-circle" size={26} color="#E8C547" />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={s.trackTitle}>{item.title}</Text>
        <Text style={s.trackMeta}>{item.genre} · {item.duration}</Text>
      </View>
      <TouchableOpacity>
        <MaterialCommunityIcons name="play-circle-outline" size={28} color="#555" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.root}>
      <Text style={s.header}>My Library</Text>
      <FlatList
        data={MOCK_TRACKS}
        keyExtractor={(t) => t.id}
        renderItem={renderTrack}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <MaterialCommunityIcons name="music-off" size={48} color="#2A2A3E" />
            <Text style={s.emptyText}>No tracks yet. Generate your first one!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A0F" },
  header: { fontSize: 26, fontWeight: "bold", color: "#FFF", paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  trackRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#0F0F1C", borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#1A1A2E" },
  trackIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: "#1A1A2E", alignItems: "center", justifyContent: "center" },
  trackTitle: { fontSize: 15, fontWeight: "600", color: "#FFF" },
  trackMeta: { fontSize: 12, color: "#666", marginTop: 3 },
  empty: { alignItems: "center", marginTop: 80, gap: 14 },
  emptyText: { fontSize: 15, color: "#444", textAlign: "center" },
});

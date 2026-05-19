import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Alert
} from 'react-native';

export default function PaywallScreen({ navigation }) {
  const handleSubscribe = () => {
    Alert.alert('Success!', 'Welcome to Premium! 🎵');
    navigation.navigate('Home');
  };

  const handleSkip = () => {
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎵</Text>
      <Text style={styles.title}>Go Premium</Text>
      <Text style={styles.subtitle}>Unlock unlimited AI music generation</Text>

      <View style={styles.featuresBox}>
        <Text style={styles.feature}>✅ Unlimited music generation</Text>
        <Text style={styles.feature}>✅ High quality audio</Text>
        <Text style={styles.feature}>✅ No ads</Text>
        <Text style={styles.feature}>✅ Download songs</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubscribe}>
        <Text style={styles.buttonText}>Subscribe $4.99/month</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 60, marginBottom: 10 },
  title: { fontSize: 32, color: '#fff', fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#aaa', textAlign: 'center', marginBottom: 30 },
  featuresBox: { backgroundColor: '#1a1a1a', padding: 20, borderRadius: 15, width: '100%', marginBottom: 30 },
  feature: { color: '#fff', fontSize: 16, marginBottom: 10 },
  button: { backgroundColor: '#6c63ff', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 15 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  skipButton: { padding: 10 },
  skipText: { color: '#aaa', fontSize: 16 },
});

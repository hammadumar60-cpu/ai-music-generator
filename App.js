import React, { useEffect, useState, createContext, useContext } from "react";
import { StatusBar, View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "./screens/HomeScreen";
import GeneratorScreen from "./screens/GeneratorScreen";
import LibraryScreen from "./screens/LibraryScreen";
import PaywallScreen from "./screens/PaywallScreen";

export const REVENUECAT_API_KEY_IOS = "appl_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
export const REVENUECAT_API_KEY_ANDROID = "goog_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
export const ENTITLEMENT_ID = "premium";

export const SubscriptionContext = createContext({
  isPremium: false,
  customerInfo: null,
  dailyGenerations: 0,
  incrementDailyGenerations: () => {},
  refreshSubscription: async () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const { isPremium } = useSubscription();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0D0D18",
          borderTopColor: "#1A1A2E",
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: "#E8C547",
        tabBarInactiveTintColor: "#555",
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Home: focused ? "home" : "home-outline",
            Generator: focused ? "musical-notes" : "musical-notes-outline",
            Library: focused ? "library" : "library-outline",
            Premium: focused ? "star" : "star-outline",
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Generator" component={GeneratorScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen
        name="Premium"
        component={PaywallScreen}
        options={{ tabBarLabel: isPremium ? "Pro ✓" : "Upgrade" }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ presentation: "modal" }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [dailyGenerations, setDailyGenerations] = useState(0);
  const [lastGenerationDate, setLastGenerationDate] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        await Purchases.configure({
          apiKey: Platform.OS === "ios"
            ? REVENUECAT_API_KEY_IOS
            : REVENUECAT_API_KEY_ANDROID,
        });
        await refreshSubscription();
        setLastGenerationDate(new Date().toDateString());
      } catch (e) {
        console.warn("App bootstrap error:", e);
      } finally {
        setAppReady(true);
      }
    })();
  }, []);

  const refreshSubscription = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      setIsPremium(info.entitlements.active[ENTITLEMENT_ID] !== undefined);
    } catch (e) {
      console.warn("Subscription refresh error:", e);
    }
  };

  const incrementDailyGenerations = () => {
    const today = new Date().toDateString();
    if (lastGenerationDate !== today) {
      setDailyGenerations(1);
      setLastGenerationDate(today);
    } else {
      setDailyGenerations((prev) => prev + 1);
    }
  };

  if (!appReady) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0F", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#E8C547" />
      </View>
    );
  }

  return (
    <SubscriptionContext.Provider
      value={{ isPremium, customerInfo, dailyGenerations, incrementDailyGenerations, refreshSubscription }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SubscriptionContext.Provider>
  );
                                     }

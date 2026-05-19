"use strict";
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const axios = require("axios");
const { v4: uuid } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3001;

const FREE_MAX_DURATION_SEC = 60;
const PREMIUM_MAX_DURATION_SEC = 300;
const FREE_DAILY_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT) || 3;
const REVENUECAT_API_BASE = "https://api.revenuecat.com/v1";
const REVENUECAT_SECRET_KEY = process.env.REVENUECAT_SECRET_KEY;
const MUSIC_AI_API_KEY = process.env.MUSIC_AI_API_KEY;
const MUSIC_AI_BASE_URL = process.env.MUSIC_AI_BASE_URL;

const dailyCountStore = new Map();

app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "1mb" }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Too many requests. Please try again later." },
});
app.use(globalLimiter);

async function checkRevenueCatEntitlement(appUserId, entitlementId = "premium") {
  if (!REVENUECAT_SECRET_KEY) return false;
  try {
    const response = await axios.get(
      `${REVENUECAT_API_BASE}/subscribers/${encodeURIComponent(appUserId)}`,
      {
        headers: {
          Authorization: `Bearer ${REVENUECAT_SECRET_KEY}`,
          Accept: "application/json",
        },
        timeout: 6000,
      }
    );
    const entitlements = response.data?.subscriber?.entitlements ?? {};
    const entitlement = entitlements[entitlementId];
    if (!entitlement) return false;
    const expiresDate = entitlement.expires_date;
    if (!expiresDate) return true;
    return new Date(expiresDate) > new Date();
  } catch (err) {
    if (err.response?.status === 404) return false;
    return false;
  }
}

async function resolveSubscriptionTier(req, res, next) {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(401).json({ error: "Missing X-User-ID header." });
  try {
    const isPremium = await checkRevenueCatEntitlement(userId);
    req.user = {
      id: userId,
      isPremium,
      maxDuration: isPremium ? PREMIUM_MAX_DURATION_SEC : FREE_MAX_DURATION_SEC,
    };
    next();
  } catch (err) {
    req.user = { id: userId, isPremium: false, maxDuration: FREE_MAX_DURATION_SEC };
    next();
  }
}

function enforceDailyLimit(req, res, next) {
  if (req.user.isPremium) return next();
  const userId = req.user.id;
  const now = new Date();
  const todayKey = `${userId}_${now.toISOString().slice(0, 10)}`;
  const entry = dailyCountStore.get(todayKey) ?? { count: 0 };
  if (entry.count >= FREE_DAILY_LIMIT) {
    return res.status(429).json({
      error: "Daily generation limit reached.",
      detail: `Free users can generate ${FREE_DAILY_LIMIT} songs per day.`,
      isPremiumRequired: true,
    });
  }
  req.incrementUsage = () => {
    const current = dailyCountStore.get(todayKey) ?? { count: 0 };
    dailyCountStore.set(todayKey, { count: current.count + 1 });
  };
  next();
}

app.post(
  "/api/generate",
  resolveSubscriptionTier,
  enforceDailyLimit,
  async (req, res) => {
    const { prompt, genre, mood, duration } = req.body;
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 5) {
      return res.status(400).json({ error: "A prompt of at least 5 characters is required." });
    }
    const requestedDuration = parseInt(duration) || FREE_MAX_DURATION_SEC;
    const clampedDuration = Math.min(
      Math.max(requestedDuration, 10),
      req.user.maxDuration
    );
    const enrichedPrompt = [
      genre ? `Genre: ${genre}.` : null,
      mood  ? `Mood: ${mood}.`  : null,
      prompt.trim(),
    ].filter(Boolean).join(" ");

    try {
      let aiResponse;
      if (!MUSIC_AI_BASE_URL || !MUSIC_AI_API_KEY) {
        await new Promise((r) => setTimeout(r, 1200));
        aiResponse = {
          audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          title: "AI Generated Track",
        };
      } else {
        const response = await axios.post(
          `${MUSIC_AI_BASE_URL}/generate`,
          {
            prompt: enrichedPrompt,
            duration: clampedDuration,
            quality: req.user.isPremium ? "high" : "standard",
            format: "mp3",
            bitrate: req.user.isPremium ? 320 : 128,
          },
          {
            headers: {
              Authorization: `Bearer ${MUSIC_AI_API_KEY}`,
              "Content-Type": "application/json",
            },
            timeout: 120000,
          }
        );
        aiResponse = response.data;
      }
      req.incrementUsage?.();
      return res.json({
        success: true,
        requestId: uuid(),
        title: aiResponse.title ?? prompt.split(" ").slice(0, 4).join(" "),
        audioUrl: aiResponse.audio_url,
        duration: clampedDuration,
        quality: req.user.isPremium ? "320kbps" : "128kbps",
        tier: req.user.isPremium ? "premium" : "free",
      });
    } catch (err) {
      return res.status(502).json({
        error: "Music generation failed.",
        detail: err.message,
      });
    }
  }
);

app.get("/api/subscription/status", resolveSubscriptionTier, (req, res) => {
  res.json({
    userId: req.user.id,
    isPremium: req.user.isPremium,
    maxDuration: req.user.maxDuration,
    dailyLimit: req.user.isPremium ? null : FREE_DAILY_LIMIT,
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`AI Music API running on port ${PORT}`);
  console.log(`Free: max ${FREE_MAX_DURATION_SEC}s, ${FREE_DAILY_LIMIT}/day`);
  console.log(`Premium: max ${PREMIUM_MAX_DURATION_SEC}s, unlimited`);
});

module.exports = app;

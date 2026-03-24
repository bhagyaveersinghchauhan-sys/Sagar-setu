const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs/promises");
const { GoogleGenAI, Type } = require("@google/genai");

dotenv.config();

const app = express();
const port = 3000;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const mockRedditPath = path.join(__dirname, "mock-reddit.json");

const summarySchema = {
  type: Type.OBJECT,
  properties: {
    summaryOriginal: {
      type: Type.STRING,
      description: "A concise 2 sentence summary in the original language of the report."
    },
    summaryEnglish: {
      type: Type.STRING,
      description: "The same summary translated into English."
    },
    summaryHindi: {
      type: Type.STRING,
      description: "The same summary translated into Hindi."
    },
    sourceLanguage: {
      type: Type.STRING,
      description: "The detected source language code of the original report, for example en, hi, ta, bn."
    }
  },
  required: ["summaryOriginal", "summaryEnglish", "summaryHindi", "sourceLanguage"],
  propertyOrdering: ["summaryOriginal", "summaryEnglish", "summaryHindi", "sourceLanguage"]
};

const hazardRadarSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      hazard_type: {
        type: Type.STRING,
        description: "Short hazard category such as chemical spill, building collapse, fire, accident, flood."
      },
      description: {
        type: Type.STRING,
        description: "A concise summary of the emergency or hazard event."
      },
      location_clues: {
        type: Type.STRING,
        description: "Mentioned streets, neighborhoods, or landmarks that help place the event."
      }
    },
    required: ["hazard_type", "description", "location_clues"],
    propertyOrdering: ["hazard_type", "description", "location_clues"]
  }
};

app.use(cors());
app.use(express.json());

function ensureGeminiApiKey(res) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_api_key_here") {
    res.status(500).json({ error: "GEMINI_API_KEY is missing in backend/.env." });
    return false;
  }

  return true;
}

function stripJsonMarkdown(text) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

async function loadRedditSource(mode) {
  if (mode === "demo") {
    const fileContents = await fs.readFile(mockRedditPath, "utf8");
    return JSON.parse(fileContents);
  }

  const response = await fetch("https://www.reddit.com/r/jaipur/new.json?limit=10&raw_json=1", {
    headers: {
      "User-Agent": "GeoNetra/1.0 (Social Media Radar)"
    }
  });

  if (!response.ok) {
    throw new Error(`Reddit fetch failed with status ${response.status}`);
  }

  return response.json();
}

function buildPostsText(children) {
  return children
    .map((child, index) => {
      const post = child?.data || {};
      const title = post.title || "Untitled";
      const selftext = post.selftext || "";
      const url = post.url || "";

      return [
        `Post ${index + 1}`,
        `Title: ${title}`,
        `Body: ${selftext}`,
        `URL: ${url}`
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

app.post("/api/generate-summary", async (req, res) => {
  const rawText = typeof req.body?.rawText === "string" ? req.body.rawText.trim() : "";

  if (!rawText) {
    return res.status(400).json({ error: "rawText is required." });
  }

  if (!ensureGeminiApiKey(res)) {
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents:
        `Analyze this hazard report:\n${rawText}\n\n` +
        "Return a structured JSON response. Do not invent details. " +
        "summaryOriginal must be exactly 2 short sentences in the original language. " +
        "summaryEnglish must be the English translation. " +
        "summaryHindi must be the Hindi translation. " +
        "sourceLanguage must be the detected language code.",
      config: {
        responseMimeType: "application/json",
        responseSchema: summarySchema
      }
    });

    const parsed = JSON.parse(response.text);

    if (!parsed.summaryOriginal || !parsed.summaryEnglish || !parsed.summaryHindi) {
      throw new Error("Gemini returned incomplete summary data.");
    }

    return res.json(parsed);
  } catch (error) {
    console.error("Gemini summary error:", error);
    return res.status(500).json({ error: "Failed to generate summary." });
  }
});

app.get("/api/scan-reddit", async (req, res) => {
  try {
    if (!ensureGeminiApiKey(res)) {
      return;
    }

    const redditPayload = await loadRedditSource(req.query.mode);
    const children = redditPayload?.data?.children;

    if (!Array.isArray(children) || children.length === 0) {
      return res.json([]);
    }

    const combinedPosts = buildPostsText(children);
    if (!combinedPosts.trim()) {
      return res.json([]);
    }

    const prompt =
      "You are an AI hazard detection system. Read the following recent social media posts from Jaipur. " +
      "Identify any posts that describe a physical hazard, disaster, or emergency (like fires, accidents, gas leaks, bombings, or extreme weather). " +
      "Ignore general chatter, memes, or non-emergencies. Return a strict JSON array of objects. Each object must have: " +
      "'hazard_type' (string), 'description' (string summary of the event), and 'location_clues' (string, any mentioned streets or areas). " +
      "If no hazards are found, return an empty array []. Do not include markdown formatting like ```json, just the raw array.\n\n" +
      combinedPosts;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: hazardRadarSchema
      }
    });

    const rawText = typeof response.text === "string" ? response.text : "[]";
    const parsed = JSON.parse(stripJsonMarkdown(rawText));

    return res.json(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.error("Social Media Radar error:", error);
    return res.status(500).json({ error: "Failed to scan Reddit for hazards." });
  }
});

app.listen(port, () => {
  console.log(`GeoNetra backend is running at http://localhost:${port}`);
});

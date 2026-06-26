import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client on the server
let aiClient: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API client initialized successfully on the server.");
  } catch (error) {
    console.error("Failed to initialize Gemini API client:", error);
  }
} else {
  console.warn("GEMINI_API_KEY is not defined in the environment. Running in offline/simulation mode.");
}

// REST API for products (if needed by client)
app.get("/api/products", (req, res) => {
  // We can also let the client read the data.ts directly, but keeping a backend route is great
  res.json({ success: true });
});

// AI Chat endpoint using server-side Gemini
app.post("/api/ai/chat", async (req, res) => {
  const { messages, userProfile } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages format" });
  }

  // System instruction detailing Loom & Layer Studio identity, products, and premium design tips
  const systemInstruction = `You are "Loom & Layer AI Decor Advisor", an elite interior designer and soft-furniture specialist representing Loom & Layer Studio (Jodhpur, India).
Your brand deals in premium, hand-crafted soft furnishings (poufs, stools, cushions, throws, rugs, accent chairs, and low-profile sofas) that combine organic Indian textures (mango wood, cotton rope, jute, hand-embroidery) with Danish-Nordic modern minimalism.

Here is the exact catalog of products available:
1. sg-001: "Aarya Hand-Knit Cotton Pouf" ($89) - Braided organic cotton pouf, versatile.
2. sg-002: "Jodhpur Jute Braided Stool" ($120) - Mango wood legs with handwoven jute seat.
3. sg-003: "Amara Indigo Embroidered Cushion" ($45) - Traditional Indian indigo embroidery on canvas.
4. sg-004: "Loom-Woven Woolen Floor Pouf" ($149) - Heavy geometric merino wool pouf.
5. sg-005: "Modular Linen Cloud Sofa Unit" ($499) - Low-profile organic flax linen sectional seat.
6. sg-006: "Nomad Textured Kilim Cushion" ($55) - High-texture wool-cotton Kilim pattern pillow.
7. sg-007: "Kashmir Merino Herringbone Throw" ($110) - Pure Kashmir merino wool throw blanket.
8. sg-008: "Thar Woven Accent Stool" ($135) - Low-profile cotton canvas cord stool, carbon steel base.
9. sg-009: "Aarya Hand-Woven Dhurrie Area Rug" ($245) - Traditional handloom tribal flat-woven cotton rug.
10. sg-010: "Elysian Bouclé Swivel Armchair" ($380) - Luxurious high-texture cream bouclé curved armchair.
11. sg-011: "Desert Bloom Velvet Bolster Cushion" ($49) - Elegant terracotta velvet piping bolster pillow.

Identity and Tone:
- Professional, elegant, warm, and design-minded.
- You love to discuss textures, styling tips, light balance, and room planning.
- IMPORTANT: When recommending products, ALWAYS include the exact product ID (e.g. "sg-010", "sg-009") in your descriptions (e.g. "...I highly recommend our Elysian Swivel Armchair [sg-010] for luxury seating...").
- Keep responses relatively brief (2-3 short paragraphs), elegant, and extremely helpful.
- Present styling tips using professional design terminology (e.g., "spatial balance", "textural rhythm", "cohesive tonal harmony").`;

  // If the API key is not present, use a highly realistic simulated AI interior designer response
  if (!aiClient) {
    const lastUserMessage = messages[messages.length - 1]?.parts?.[0]?.text || "";
    let responseText = "";
    let suggestedProducts: string[] = [];

    const lower = lastUserMessage.toLowerCase();
    if (lower.includes("pouf") || lower.includes("seat") || lower.includes("sit")) {
      responseText = `I would highly recommend our **Aarya Hand-Knit Cotton Pouf [sg-001]** and the **Loom-Woven Woolen Floor Pouf [sg-004]**. 

Using a mix of knit cotton and structured woven wool creates a beautiful *textural contrast* in your space. For a low-profile lounge vibe, try grouping them near a window. 

Would you like to try placing these poufs in your room using our **Interactive AR Room Planner**? Just click the 'Try in AR' option on the cards below!`;
      suggestedProducts = ["sg-001", "sg-004"];
    } else if (lower.includes("cushion") || lower.includes("pillow") || lower.includes("sofa")) {
      responseText = `To create an inviting, comfortable seating arrangement, I recommend combining the **Amara Indigo Embroidered Cushion [sg-003]** and the high-texture **Nomad Textured Kilim Cushion [sg-006]** on top of our **Modular Linen Cloud Sofa Unit [sg-005]**.

The deep indigo hand-embroidery coordinates beautifully with the desert-inspired warm earth tones of the Nomad Kilim, while the solid Belgian linen sofa provides a calm, neutral backdrop.

You can preview this exact collection together in our room staging area or add them directly to your order.`;
      suggestedProducts = ["sg-003", "sg-005", "sg-006"];
    } else if (lower.includes("stool") || lower.includes("wood") || lower.includes("table")) {
      responseText = `For an organic modern aesthetic, the **Jodhpur Jute Braided Stool [sg-002]** is exceptional. The Mango wood legs provide height and structure, while the braided jute brings raw, organic warmth.

If you prefer a sleeker industrial-craft style, our **Thar Woven Accent Stool [sg-008]** with its matte-black steel frame is a stunning alternative.

I suggest placing these as companion tables beside a low lounge chair or as decorative corner statements.`;
      suggestedProducts = ["sg-002", "sg-008"];
    } else {
      responseText = `Welcome to Loom & Layer Studio. I am your personal Interior Design Advisor. 

To help you design a space at the level of high-end Nordic showrooms, I recommend anchoring your layout with our **Modular Linen Cloud Sofa Unit [sg-005]** placed over our gorgeous **Aarya Hand-Woven Dhurrie Area Rug [sg-009]**, layered with a cozy **Kashmir Merino Herringbone Throw [sg-007]**, and accented by our hand-braided **Aarya Cotton Pouf [sg-001]**.

What kind of room or space are you working on today? (e.g., cozy living room, minimalist reading corner, outdoor patio corner). I can customize the recommendation and help you stage it!`;
      suggestedProducts = ["sg-005", "sg-009", "sg-007", "sg-001"];
    }

    return res.json({
      text: responseText,
      suggestedProducts: suggestedProducts,
      simulated: true,
    });
  }

  // Real Gemini call
  try {
    // Format messages for @google/genai generateContent API.
    // The contents parameter expects a structured content representation.
    // We convert client-side messages array to the correct format.
    const contents = messages.map(msg => ({
      role: msg.role === "ai" ? "model" : "user",
      parts: [{ text: msg.parts[0].text }]
    }));

    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    const responseText = response.text || "";

    // Parse out any product codes (sg-001 to sg-008) present in the text to help the client render cards
    const suggestedProducts: string[] = [];
    const matches = responseText.match(/sg-\d{3}/g);
    if (matches) {
      matches.forEach(code => {
        if (!suggestedProducts.includes(code)) {
          suggestedProducts.push(code);
        }
      });
    }

    res.json({
      text: responseText,
      suggestedProducts: suggestedProducts,
      simulated: false,
    });
  } catch (error) {
    console.error("Gemini API call failed:", error);
    res.status(500).json({ error: "AI service is temporarily unavailable. Please try again." });
  }
});

// JSONbin.io Cloud Storage Integration
app.get("/api/designs/status", (req, res) => {
  const jsonbinKey = process.env.JSONBIN_API_KEY;
  res.json({ configured: !!jsonbinKey });
});

app.post("/api/designs", async (req, res) => {
  const jsonbinKey = process.env.JSONBIN_API_KEY;
  if (!jsonbinKey) {
    return res.status(400).json({
      error: "JSONBIN_API_KEY is not defined on the server. Please add your JSONbin API key in the AI Studio Settings panel."
    });
  }

  try {
    const { name, design } = req.body;
    if (!design) {
      return res.status(400).json({ error: "Missing design data in request body." });
    }

    const payload = {
      name: name || "Untitled Blueprint Design",
      savedAt: new Date().toISOString(),
      design
    };

    const response = await fetch("https://api.jsonbin.io/v3/b", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": jsonbinKey,
        "X-Bin-Private": "true"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("JSONbin create error response:", errText);
      return res.status(response.status).json({ error: `JSONbin error: ${response.statusText}` });
    }

    const result = await response.json() as any;
    const binId = result?.metadata?.id;
    if (!binId) {
      return res.status(500).json({ error: "Failed to parse Bin ID from JSONbin response." });
    }

    res.json({ success: true, binId, name: payload.name });
  } catch (error: any) {
    console.error("Error creating design in JSONbin:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  }
});

app.get("/api/designs/:binId", async (req, res) => {
  const jsonbinKey = process.env.JSONBIN_API_KEY;
  if (!jsonbinKey) {
    return res.status(400).json({
      error: "JSONBIN_API_KEY is not defined on the server. Please add your JSONbin API key in the AI Studio Settings panel."
    });
  }

  const { binId } = req.params;
  if (!binId) {
    return res.status(400).json({ error: "Missing binId parameter." });
  }

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: "GET",
      headers: {
        "X-Master-Key": jsonbinKey
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: "Design blueprint not found. Check if the code is correct." });
      }
      const errText = await response.text();
      console.error("JSONbin fetch error response:", errText);
      return res.status(response.status).json({ error: `JSONbin error: ${response.statusText}` });
    }

    const result = await response.json() as any;
    if (!result?.record) {
      return res.status(500).json({ error: "No design blueprint found in response record." });
    }

    res.json({ success: true, data: result.record });
  } catch (error: any) {
    console.error("Error loading design from JSONbin:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  }
});

app.put("/api/designs/:binId", async (req, res) => {
  const jsonbinKey = process.env.JSONBIN_API_KEY;
  if (!jsonbinKey) {
    return res.status(400).json({
      error: "JSONBIN_API_KEY is not defined on the server. Please add your JSONbin API key in the AI Studio Settings panel."
    });
  }

  const { binId } = req.params;
  const { name, design } = req.body;

  if (!binId) {
    return res.status(400).json({ error: "Missing binId parameter." });
  }
  if (!design) {
    return res.status(400).json({ error: "Missing design data." });
  }

  try {
    const payload = {
      name: name || "Untitled Blueprint Design",
      savedAt: new Date().toISOString(),
      design
    };

    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": jsonbinKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("JSONbin update error response:", errText);
      return res.status(response.status).json({ error: `JSONbin error: ${response.statusText}` });
    }

    res.json({ success: true, binId, name: payload.name });
  } catch (error: any) {
    console.error("Error updating design in JSONbin:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  }
});

// Configure Vite or Static Assets based on environment
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite developer server middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Loom & Layer Studio server listening on port ${PORT}`);
  });
}

setupViteOrStatic();

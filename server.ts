import express from 'express';
import path from 'path';
import multer from 'multer';
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;
const upload = multer({ storage: multer.memoryStorage() });

// AI Client Setup
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json());

// API route for document extraction
app.post('/api/ai/extract', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { buffer, mimetype } = req.file;
    const base64Data = buffer.toString('base64');

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimetype,
              }
            },
            {
              text: "Extract delivery and supplier details from this document. Focus on: Supplier Name, Client Name (usually Liliprovisions), Invoice/Delivery Note Reference, Date, and a list of items with their descriptions, quantities, and weights if available. Format the output as JSON."
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clientName: { type: Type.STRING },
            id: { type: Type.STRING, description: "Invoice or Delivery Note Reference Number" },
            issueDate: { type: Type.STRING, description: "ISO date format YYYY-MM-DD" },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  price: { type: Type.NUMBER },
                  supplyWeight: { type: Type.NUMBER },
                  deliveryWeight: { type: Type.NUMBER }
                },
                required: ["description"]
              }
            },
            notes: { type: Type.STRING },
            supplierName: { type: Type.STRING }
          }
        }
      }
    });

    const extraction = JSON.parse(response.text);
    res.json(extraction);
  } catch (error: any) {
    console.error('Extraction Error:', error);
    res.status(500).json({ error: error.message || 'Failed to extract data' });
  }
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.all('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI with your key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { action, text, language } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ success: false, error: "No text provided" });
    }

    let systemPrompt = "";
    let userPrompt = "";

    // --- 1. DEFINE PROMPTS BASED ON ACTION ---
    switch (action) {
      case 'summary':
        systemPrompt = "You are a helpful assistant. Summarize the following text concisely in 2-3 sentences. Capture the main tone and intent.";
        userPrompt = `Text to summarize:\n"${text}"`;
        break;
      
      case 'tags':
        systemPrompt = "You are a categorization bot. Read the text and generate 3-5 relevant hashtags or keywords. Return ONLY a raw JSON array of strings (e.g. [\"work\", \"ideas\"]). Do not include markdown formatting.";
        userPrompt = `Generate tags for:\n"${text}"`;
        break;

    //   case 'glossary':
    //     systemPrompt = "You are a glossary generator. Identify complex terms, technical jargon, or key entities in the text. Return a raw JSON array of objects with 'term' and 'definition' keys. Example: [{\"term\": \"React\", \"definition\": \"A JS library\"}]. If no complex terms exist, return an empty array []. Do not use markdown.";
    //     userPrompt = `Create glossary for:\n"${text}"`;
    //     break;

      case 'translate':
        systemPrompt = `You are a professional translator. Translate the text into ${language}. Preserve the original tone. Return only the translated text.`;
        userPrompt = `Translate this:\n"${text}"`;
        break;

      case 'grammar':
        systemPrompt = "You are a grammar editor. Check the text for errors. Return a raw JSON object with two keys: 'corrected' (the full fixed text) and 'issues' (an array of objects: { original, suggestion, type }). If no errors, 'issues' should be empty. Do not use markdown.";
        userPrompt = `Check grammar for:\n"${text}"`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // --- 2. CALL OPENAI API ---
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast, smart, and cheap model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
    });

    const aiOutput = response.choices[0].message.content || "";

    // --- 3. PARSE RESPONSE ---
    let finalData;

    // For actions that require JSON (tags, glossary, grammar), we parse the string
    if (['tags', 'glossary', 'grammar'].includes(action)) {
      try {
        // Remove any Markdown code blocks if AI added them (```json ... ```)
        const cleanJson = aiOutput.replace(/```json|```/g, '').trim();
        finalData = JSON.parse(cleanJson);
      } catch (e) {
        console.error("JSON Parse Error:", e);
        // Fallback for parsing errors
        finalData = action === 'grammar' ? { issues: [] } : []; 
      }
    } else {
      // For summary/translation, just return the text string
      finalData = aiOutput;
    }

    return NextResponse.json({ success: true, data: finalData });

  } catch (error) {
    console.error("OpenAI API Error:", error);
    return NextResponse.json({ success: false, error: "AI Service Failed" }, { status: 500 });
  }
}
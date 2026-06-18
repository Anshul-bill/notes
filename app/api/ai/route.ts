import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// NVIDIA NIM is OpenAI-compatible, so we keep the OpenAI client and just point it
// at the NVIDIA API Catalog endpoint. Get a free key at https://build.nvidia.com
const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const MODEL = 'meta/llama-3.3-70b-instruct'; // swap for any model id from build.nvidia.com

export async function POST(req: Request) {
  try {
    if (!process.env.NVIDIA_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'NVIDIA_API_KEY is not set in .env.local' },
        { status: 500 }
      );
    }

    const { action, text, language, question } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'No text provided' });
    }
    if (action === 'ask' && (!question || !question.trim())) {
      return NextResponse.json({ success: false, error: 'No question provided' });
    }

    let systemPrompt = '';
    let userPrompt = '';

    // --- 1. DEFINE PROMPTS BASED ON ACTION ---
    switch (action) {
      case 'summary':
        systemPrompt = 'You are a helpful assistant. Summarize the following text concisely in 2-3 sentences. Capture the main tone and intent.';
        userPrompt = `Text to summarize:\n"${text}"`;
        break;

      case 'tags':
        systemPrompt = 'You are a categorization bot. Read the text and generate 3-5 relevant hashtags or keywords. Return ONLY a raw JSON array of strings (e.g. ["work", "ideas"]). Do not include markdown formatting.';
        userPrompt = `Generate tags for:\n"${text}"`;
        break;

      case 'translate':
        systemPrompt = `You are a professional translator. Translate the text into ${language}. Preserve the original tone. Return only the translated text.`;
        userPrompt = `Translate this:\n"${text}"`;
        break;

      case 'grammar':
        systemPrompt = "You are a grammar editor. Check the text for errors. Return a raw JSON object with two keys: 'corrected' (the full fixed text) and 'issues' (an array of objects: { original, suggestion }). If no errors, 'issues' should be empty. Do not use markdown.";
        userPrompt = `Check grammar for:\n"${text}"`;
        break;

      case 'title':
        systemPrompt = 'You generate titles. Read the note and return a short, descriptive title of 3-7 words. Return ONLY the title text — no quotes, no trailing punctuation, no markdown.';
        userPrompt = `Title this note:\n"${text}"`;
        break;

      case 'improve':
        systemPrompt = 'You are an editor. Rewrite the text to improve clarity, flow, and grammar while preserving its meaning, tone, and language. Return ONLY the rewritten text — no preamble, no markdown.';
        userPrompt = `Improve this:\n"${text}"`;
        break;

      case 'continue':
        systemPrompt = 'You are a writing assistant. Continue the text naturally from where it ends, matching its style and tone. Return ONLY the continuation — do NOT repeat the existing text, no preamble, no markdown.';
        userPrompt = `Continue this:\n"${text}"`;
        break;

      case 'ask':
        systemPrompt = "You are a helpful assistant. Answer the user's question using the note below as context. Be concise and direct.";
        userPrompt = `Note:\n"${text}"\n\nQuestion: ${question}`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // --- 2. CALL THE MODEL ---
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    });

    const aiOutput = response.choices[0].message.content || '';

    // --- 3. PARSE RESPONSE ---
    let finalData;

    // tags/grammar return JSON; everything else returns plain text
    if (['tags', 'grammar'].includes(action)) {
      try {
        // Strip markdown code fences if the model added them (```json ... ```)
        const cleanJson = aiOutput.replace(/```json|```/g, '').trim();
        finalData = JSON.parse(cleanJson);
      } catch (e) {
        console.error('JSON Parse Error:', e);
        finalData = action === 'grammar' ? { issues: [] } : [];
      }
    } else {
      finalData = aiOutput.trim();
    }

    return NextResponse.json({ success: true, data: finalData });
  } catch (error) {
    console.error('NVIDIA NIM API Error:', error);
    return NextResponse.json({ success: false, error: 'AI Service Failed' }, { status: 500 });
  }
}

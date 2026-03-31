const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
import { supabase } from '../lib/supabase';

// Using a highly generous, un-rate-limited free model from OpenRouter
const DEFAULT_MODEL = "google/gemini-2.0-flash-lite-preview-02-05:free";

async function callOpenRouter(prompt: string, isJson: boolean = false) {
  if (!OPENROUTER_API_KEY) {
    console.warn('OpenRouter API key is not configured.');
    return null;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "unrot",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": DEFAULT_MODEL,
        "messages": [
          {
            "role": "user",
            "content": prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API Error:', errorData);
      return null;
    }

    const data = await response.json();
    console.log('OpenRouter Response:', data);
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('Error calling OpenRouter:', error);
    return null;
  }
}

function extractJson(text: string) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (e) {
    console.error('JSON Extraction failed:', e);
    return null;
  }
}

export async function generateSessionSummary(topics: string[], sessionId?: string) {
  // Check if summary already exists in Supabase
  if (sessionId) {
    const { data: session } = await supabase
      .from('sessions')
      .select('ai_summary')
      .eq('id', sessionId)
      .single();
    
    if (session?.ai_summary) {
      return session.ai_summary;
    }
  }

  const prompt = `
    The user just completed a deep-focus learning session on a platform called "unrot".
    Their "Knowledge Path" consisted of the following topics in order:
    ${topics.join(' -> ')}

    Based on this path, provide a concise, high-level "Focus Analysis" (about 3-4 sentences).
    Synthesize how these topics connect and what the overarching theme of their journey was.
    Use a professional, slightly philosophical, and encouraging tone.
    Format the output as plain text.
  `;

  const summary = await callOpenRouter(prompt);

  // Save to Supabase if we have a session ID
  if (summary && sessionId) {
    await supabase
      .from('sessions')
      .update({ ai_summary: summary })
      .eq('id', sessionId);
  }

  return summary;
}

export async function generateTopicInsights(topicTitle: string, content: string, topicId?: string) {
  // Check if insights already exist in Supabase
  if (topicId) {
    const { data: topic } = await supabase
      .from('topics')
      .select('ai_insights')
      .eq('id', topicId)
      .single();
    
    if (topic?.ai_insights && Array.isArray(topic.ai_insights)) {
      return topic.ai_insights;
    }
  }

  const prompt = `
    Topic: ${topicTitle}
    Content: ${content}

    Provide 3 "Pro Insights" for this topic. These should be deep, non-obvious takeaways that go beyond the provided text.
    Format the output as a JSON array of strings.
    Example: ["Insight 1", "Insight 2", "Insight 3"]
  `;

  const result = await callOpenRouter(prompt, true);
  try {
    const insights = extractJson(result || '[]') || [];
    
    // Save to Supabase if we have a topic ID
    if (insights.length > 0 && topicId) {
      await supabase
        .from('topics')
        .update({ ai_insights: insights })
        .eq('id', topicId);
    }

    return insights;
  } catch (e) {
    console.error('Failed to parse AI insights:', e);
    return [];
  }
}

export async function generateMagicTopic(title: string, wikiSummary: string, existingTopics: {id: string, title: string}[]) {
  const topicsList = existingTopics.map(t => `${t.id} (${t.title})`).join(", ");

  const prompt = `
    You are an expert curriculum designer for an "anti-brain-rot" deep-learning platform.
    Write an incredibly engaging, deeply fascinating, and extensive Markdown article about "${title}".
    
    Here is a factual baseline summary from Wikipedia to anchor your knowledge:
    "${wikiSummary}"

    Requirements for the Markdown:
    - Must be extremely detailed and long (at least 1500 words, sprawling 8-10 paragraphs).
    - Make it profoundly interesting, connecting it to philosophy, science, or mind-blowing facts.
    - Emphasize formatting: Use blockquotes, bold text, bullet points. Include at least 2 relevant images using Markdown syntax \`![image description](URL)\`. You can use placeholder URLs like Unsplash source (e.g. \`https://source.unsplash.com/800x600/?${encodeURIComponent(title)}\`) or wikimedia commons.
    - If there are relevant mathematical or chemical formulas, include them using LaTeX format wrapped in $$ (e.g., $$ E = mc^2 $$).
    - Include real-world examples.
    - Do NOT include a main title # heading, just start with the body text.

    Requirements for metadata:
    - Generate a clean, URL-safe 'slug' for this topic (e.g. quantum-mechanics). Ensure it is highly relevant to "${title}".
    - Generate a powerful, one-sentence 'hook' description.
    - Analyze this list of existing topics: [${topicsList}]. You MUST select 1 to 3 IDs that are highly related to "${title}" and return them in 'related_ids'.
    - Select a 'category' from: Science, Math, Philosophy, Technology, History, Art.
    - If you know a spectacularly good, highly-relevant educational YouTube video explaining this, provide its URL (e.g., a Kurzgesagt, Veritasium, or closely related video URL). Otherwise leave null.

    Output pure JSON matching this exact structure:
    {
      "id": "string",
      "description": "string",
      "content": "string",
      "category": "string",
      "related_ids": ["string"],
      "video_url": "string | null"
    }
  `;

  const result = await callOpenRouter(prompt, true);
  try {
    return extractJson(result || '{}');
  } catch (e) {
    console.error('Failed to parse AI generated topic:', e);
    return null;
  }
}

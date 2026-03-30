const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
import { supabase } from '../lib/supabase';

// Using the requested free model from OpenRouter
const DEFAULT_MODEL = "/arcee-ai/trinity-large-preview:free";

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
    const insights = JSON.parse(result || '[]');
    
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

import { corsHeaders } from '../_shared/cors.ts';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

interface TrendPayload {
  headline: string;
  trends: { title: string; description: string }[];
  tip_of_day: string;
  sources_note: string;
}

function parseJsonFromText(text: string): TrendPayload {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced
    ? fenced[1]
    : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  return JSON.parse(raw.trim()) as TrendPayload;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { date } = await req.json() as { date: string };

    const systemPrompt = `You are a fitness and health trends analyst. Return ONLY a JSON object (no markdown, no preamble) with this exact shape:
{
  "headline": "string — punchy 6-10 word summary of today's top theme",
  "trends": [
    { "title": "string", "description": "string — 1-2 sentences", "url": "string — a real, working URL to a relevant article or study" },
    { "title": "string", "description": "string — 1-2 sentences", "url": "string — a real, working URL to a relevant article or study" },
    { "title": "string", "description": "string — 1-2 sentences", "url": "string — a real, working URL to a relevant article or study" }
  ],
  "tip_of_day": "string — one actionable tip",
  "sources_note": "string — brief citation of sources used"
}`;

    const userPrompt = `Search the web for the top fitness, nutrition, and health trends as of ${date}. Return the JSON object described.`;

    // Agentic loop to handle tool_use
    const messages: { role: string; content: unknown }[] = [
      { role: 'user', content: userPrompt },
    ];

    let finalText = '';
    let iterations = 0;

    while (iterations < 5) {
      iterations++;

      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'web-search-2025-03-05',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 1024,
          system: systemPrompt,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Anthropic API error ${response.status}: ${errText}`);
      }

      const result = await response.json() as {
        stop_reason: string;
        content: { type: string; text?: string; id?: string; name?: string; input?: unknown; tool_use_id?: string; content?: unknown }[];
      };

      messages.push({ role: 'assistant', content: result.content });

      if (result.stop_reason === 'end_turn') {
        const textBlock = result.content.find((b) => b.type === 'text');
        if (textBlock?.text) {
          finalText = textBlock.text;
        }
        break;
      }

      // Handle tool_use blocks
      if (result.stop_reason === 'tool_use') {
        const toolResults: { type: string; tool_use_id: string; content: unknown }[] = [];

        for (const block of result.content) {
          if (block.type === 'tool_use' && block.id) {
            // The SDK handles web_search internally — pass result back as empty to continue
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: block.name === 'web_search' ? [] : [],
            });
          }
        }

        if (toolResults.length > 0) {
          messages.push({ role: 'user', content: toolResults });
        }
      }
    }

    if (!finalText) {
      throw new Error('No text response from Anthropic after agentic loop');
    }

    const payload = parseJsonFromText(finalText);

    return new Response(
      JSON.stringify({ ...payload, date }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

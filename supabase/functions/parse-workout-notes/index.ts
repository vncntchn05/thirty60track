import { corsHeaders } from '../_shared/cors.ts';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

interface ParsedSet {
  reps: number | null;
  amount: string;
  unit: 'lbs' | 'kg' | 'secs';
  notes: string;
}

interface ParsedExercise {
  exercise_name: string;
  sets: ParsedSet[];
}

function parseJsonFromText(text: string): { exercises: ParsedExercise[] } {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced
    ? fenced[1]
    : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  return JSON.parse(raw.trim()) as { exercises: ParsedExercise[] };
}

const SYSTEM_PROMPT = `You are a fitness data parser. Convert free-form workout notes into structured JSON.

Return ONLY a JSON object with this exact shape (no markdown, no preamble):
{
  "exercises": [
    {
      "exercise_name": "Clean exercise name (proper case, no set/rep info)",
      "sets": [
        {
          "reps": number or null,
          "amount": "numeric string only — weight or duration value, empty string if absent",
          "unit": "lbs" | "kg" | "secs",
          "notes": "any set-specific note the user wrote, empty string if none"
        }
      ]
    }
  ]
}

Rules:
- Expand set counts: "3x8 @ 185lbs" → 3 separate set objects each with reps:8, amount:"185", unit:"lbs"
- Default unit is "lbs" unless the user wrote kg, kgs, kg, sec, secs, s, or min/minutes
- For time-based exercises (plank, hold, carry) use unit "secs"; convert minutes to seconds
- If weight/duration is absent, use amount: ""
- Clean exercise names: proper case, strip any embedded "3x8" or "@185lbs" from the name
- Preserve per-set notes if the user wrote any (e.g. "felt heavy", "paused reps")`;

Deno.serve(async (req) => {
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

    const { notes } = await req.json() as { notes: string };
    if (!notes?.trim()) {
      return new Response(
        JSON.stringify({ exercises: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: notes }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${errText}`);
    }

    const result = await response.json() as {
      content: { type: string; text?: string }[];
    };

    const textBlock = result.content.find((b) => b.type === 'text');
    if (!textBlock?.text) throw new Error('No text response from model');

    const parsed = parseJsonFromText(textBlock.text);

    return new Response(
      JSON.stringify({ exercises: parsed.exercises ?? [] }),
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

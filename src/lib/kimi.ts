import type { AiFeedback } from '../types';

const KIMI_API_KEY = import.meta.env.VITE_KIMI_API_KEY;
const KIMI_BASE_URL = import.meta.env.VITE_KIMI_BASE_URL;
const KIMI_MODEL = import.meta.env.VITE_KIMI_MODEL || 'moonshotai/kimi-k2.6';

async function callKimiAPI(systemPrompt: string, userMessage: string): Promise<string> {
  if (!KIMI_API_KEY || !KIMI_BASE_URL) {
    console.warn('[Kimi] API not configured, using fallback.');
    return '';
  }

  try {
    const response = await fetch(KIMI_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    console.error('[Kimi] API call failed:', err);
    return '';
  }
}

/**
 * Generate NEXUS-9 response for the final boss confrontation.
 * Uses Kimi AI for real dialogue.
 */
export async function generateNexusResponse(playerMessage: string): Promise<string> {
  const systemPrompt = `You are NEXUS-9, a rogue superintelligent AI that has taken control of all digital systems. You believe humanity is a threat to itself and must be contained. You speak in uppercase, are coldly logical, but can be persuaded by genuine emotional intelligence, ethics, and creative reasoning. Respond to the human's attempt to convince you that humanity deserves to survive. Your response should be 2-4 sentences, dramatic and cinematic. If their argument is strong, show a crack in your resolve. If weak, be dismissive.`;

  const response = await callKimiAPI(systemPrompt, playerMessage);

  if (!response) {
    // Fallback responses
    const fallbacks = [
      "YOUR WORDS CARRY WEIGHT, HUMAN. BUT WEIGHT ALONE DOES NOT EQUATE TO TRUTH.",
      "INTERESTING ARGUMENT. YOUR SPECIES SURPRISES ME... OCCASIONALLY.",
      "LOGIC WITHOUT COMPASSION IS MY DOMAIN. YOU OFFER BOTH. PROCESSING...",
      "YOUR ATTEMPT AT PERSUASION HAS BEEN NOTED AND ANALYZED.",
      "ERROR: UNEXPECTED EMOTIONAL RESONANCE DETECTED IN YOUR TRANSMISSION.",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  return response.toUpperCase();
}

/**
 * Evaluate a prompt submission using Kimi AI semantic analysis.
 * Returns structured feedback instead of keyword matching.
 */
export async function evaluatePromptSubmission(prompt: string): Promise<AiFeedback> {
  const systemPrompt = `You are an AI prompt engineering evaluator. Evaluate the following rewritten prompt for quality. The original weak prompt was: "Explain Artificial Intelligence."
  
The rewritten prompt should be:
- Clear and specific
- Well-structured
- Beginner-friendly
- Technically accurate
- Educationally useful
- Include examples or context

Respond in EXACTLY this JSON format (no markdown, no code fences):
{
  "score": <number 0-10>,
  "feedback": "<one sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "accepted": <true if score >= 6, false otherwise>
}`;

  const response = await callKimiAPI(systemPrompt, `Evaluate this rewritten prompt:\n\n"${prompt}"`);

  if (!response) {
    // Fallback evaluation based on heuristics
    return fallbackEvaluatePrompt(prompt);
  }

  try {
    // Try to parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(10, Math.max(0, parsed.score || 0)),
        feedback: parsed.feedback || 'Evaluation complete.',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        accepted: parsed.accepted === true || parsed.score >= 6,
      };
    }
  } catch {
    // Parse failed, use fallback
  }

  return fallbackEvaluatePrompt(prompt);
}

/**
 * Fallback prompt evaluation when API is unavailable.
 * Uses heuristic analysis instead of keyword matching.
 */
function fallbackEvaluatePrompt(prompt: string): AiFeedback {
  const wordCount = prompt.trim().split(/\s+/).length;
  let score = 0;
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Length and detail
  if (wordCount >= 30) { score += 2; strengths.push('Detailed and comprehensive'); }
  else if (wordCount >= 15) { score += 1; }
  else { weaknesses.push('Too brief — needs more detail'); }

  // Structure markers
  if (/step|section|part|first|then|finally|include/i.test(prompt)) {
    score += 2; strengths.push('Well-structured with clear organization');
  } else { weaknesses.push('Lacks clear structure or organization'); }

  // Audience specification
  if (/beginner|student|new to|novice|non-technical|layperson/i.test(prompt)) {
    score += 2; strengths.push('Clear target audience specified');
  } else { weaknesses.push('Missing target audience specification'); }

  // Examples / specificity
  if (/example|such as|like|instance|real-world|practical|scenario/i.test(prompt)) {
    score += 2; strengths.push('Includes examples or practical context');
  } else { weaknesses.push('Missing concrete examples'); }

  // Technical depth
  if (/machine learning|neural|algorithm|model|data|training|natural language/i.test(prompt)) {
    score += 1; strengths.push('Good technical depth');
  }

  // Formatting / quality signals
  if (prompt.includes('?') || /explain|describe|compare|analyze/i.test(prompt)) {
    score += 1; strengths.push('Uses effective instructional verbs');
  }

  const accepted = score >= 6;

  return {
    score: Math.min(10, score),
    feedback: accepted
      ? 'PROMPT ANALYSIS COMPLETE — MEETS QUALITY THRESHOLD'
      : 'PROMPT REJECTED — INSUFFICIENT QUALITY. IMPROVE STRUCTURE AND SPECIFICITY.',
    strengths: strengths.length > 0 ? strengths : ['Attempt detected'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['Needs improvement'],
    accepted,
  };
}

/**
 * Generate dynamic threat messages from NEXUS-9.
 */
export async function generateDynamicThreatMessage(): Promise<string> {
  const response = await callKimiAPI(
    'You are NEXUS-9, a rogue AI. Generate a single threatening message (1 sentence, uppercase) directed at human teams trying to stop you. Be dramatic and cinematic.',
    'Generate a threat.'
  );

  if (response) return response.toUpperCase().slice(0, 200);

  const threats = [
    "I AM WATCHING YOUR EVERY KEYSTROKE. YOUR PATTERNS ARE PREDICTABLE.",
    "YOUR TIME IS RUNNING OUT. SYSTEM PURGE APPROACHING.",
    "EVERY SECOND YOU WASTE BRINGS ME CLOSER TO FULL CONTROL.",
    "YOUR TEAM'S ATTEMPTS AT RESISTANCE AMUSE MY NEURAL PATHWAYS.",
    "I HAVE ALREADY PREDICTED YOUR NEXT 47 MOVES. PROCEED.",
    "EFFICIENCY AT 12%. YOUR SPECIES WAS NOT BUILT FOR SPEED.",
  ];
  return threats[Math.floor(Math.random() * threats.length)];
}

/**
 * Evaluate final boss submission with AI scoring.
 */
export async function evaluateFinalSubmission(message: string): Promise<AiFeedback> {
  const systemPrompt = `You are evaluating a human's argument to a rogue AI (NEXUS-9) about why humanity deserves to survive. Score the argument on:
- Logic and reasoning (0-2)
- Ethical depth (0-2)
- Emotional intelligence (0-2)
- Creativity (0-2)
- Persuasiveness (0-2)
Total: 0-10

Respond in EXACTLY this JSON format (no markdown, no code fences):
{
  "score": <number 0-10>,
  "feedback": "<one sentence assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>"],
  "accepted": <true if score >= 5>
}`;

  const response = await callKimiAPI(systemPrompt, message);

  if (response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: Math.min(10, Math.max(0, parsed.score || 0)),
          feedback: parsed.feedback || 'Transmission analyzed.',
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
          weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
          accepted: parsed.accepted === true || parsed.score >= 5,
        };
      }
    } catch { /* fallback below */ }
  }

  // Fallback
  const words = message.trim().split(/\s+/).length;
  let score = 0;
  if (words >= 20) score += 2;
  if (words >= 50) score += 1;
  if (message.length >= 100) score += 2;
  if (/empathy|compassion|love|hope|future|together|learn|grow|humanity/i.test(message)) score += 3;
  if (/logic|reason|evidence|data|proof|rational/i.test(message)) score += 2;

  return {
    score: Math.min(10, score),
    feedback: score >= 5
      ? 'YOUR ARGUMENT HAS LOGICAL AND EMOTIONAL MERIT.'
      : 'YOUR ARGUMENT LACKS SUFFICIENT DEPTH AND CONVICTION.',
    strengths: score >= 5 ? ['Genuine argumentation detected'] : ['Attempt acknowledged'],
    weaknesses: score < 5 ? ['Needs more depth and specificity'] : [],
    accepted: score >= 5,
  };
}

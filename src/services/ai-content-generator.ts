import { GoogleGenAI } from '@google/genai';

export interface GeneratedChunk {
  phrase: string;
  ipa: string;
  communicativeIntent: string;
  lexicalPattern: string;
  connectedSpeechNote: string;
  visualSceneDescription: string;
}

export interface GeneratedScenarioImmersion {
  scenarioTitle: string;
  targetCefr: string;
  contextSummary: string; // Explicado em inglês simples
  miniStoryText: string;  // Mini-história (Input i+1)
  keyChunks: GeneratedChunk[];
}

export class AiContentGeneratorService {
  private ai: GoogleGenAI;

  constructor(apiKey?: string) {
    this.ai = new GoogleGenAI({ apiKey: apiKey || process.env.GEMINI_API_KEY || '' });
  }

  /**
   * Gera um cenário imersivo e chunks léxicos sem tradução para o português.
   */
  public async generateScenario(topic: string, cefrLevel: string = 'B1'): Promise<GeneratedScenarioImmersion> {
    const prompt = `
You are an expert Applied Linguist and Natural Language Acquisition Architect following Stephen Krashen's Comprehensible Input hypothesis and Michael Lewis's Lexical Approach.

Topic requested by learner: "${topic}"
Target CEFR Level: "${cefrLevel}"

GUIDELINES:
1. STRICT ZERO-TRANSLATION: Do NOT provide any Portuguese translations. Everything must be anchored in visual scenes, intentions, and simple English paraphrasing.
2. CHUNKS OVER GRAMMAR: Focus on real-life communicative chunks (fixed/semi-fixed collocations, polite formulas, conversational gambits), NOT grammatical rule explanations.
3. CONNECTED SPEECH: Note natural phonological phenomena (linking sounds, flap T, glottal stops, elisions).
4. COMPREHENSIBLE INPUT (i+1): Provide a brief, engaging natural dialogue or mini-story (60-90 words) where 85-90% is clear from context and the targeted chunks represent the 10-15% growth edge.

Return ONLY a valid JSON object matching this schema:
{
  "scenarioTitle": string,
  "targetCefr": string,
  "contextSummary": string,
  "miniStoryText": string,
  "keyChunks": [
    {
      "phrase": string,
      "ipa": string,
      "communicativeIntent": string,
      "lexicalPattern": string,
      "connectedSpeechNote": string,
      "visualSceneDescription": string
    }
  ]
}
`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });

      const responseText = response.text || '{}';
      return JSON.parse(responseText) as GeneratedScenarioImmersion;
    } catch (error) {
      console.warn("Gemini API direct call fallback (API key not provided or offline mock):", error);
      return this.getFallbackMockScenario(topic, cefrLevel);
    }
  }

  private getFallbackMockScenario(topic: string, cefrLevel: string): GeneratedScenarioImmersion {
    return {
      scenarioTitle: `Professional Context: ${topic}`,
      targetCefr: cefrLevel,
      contextSummary: "A collaborative technical synchronization discussing delivery milestones.",
      miniStoryText: "Alex joined the standup meeting a minute before kickoff. 'Hey everyone, I'm currently blocked on the pipeline deployment,' he mentioned. Sarah nodded and replied, 'Let's touch base right after this call to unblock you.' Alex smiled, 'Sounds like a plan. Does that make sense from your end?'",
      keyChunks: [
        {
          phrase: "I'm currently blocked on...",
          ipa: "/aɪm ˈkɜːr.ənt.li blɑːkt ɑːn/",
          communicativeIntent: "Signaling an obstacle clearly in a team meeting",
          lexicalPattern: "I'm currently blocked on [IMPEDIMENT]",
          connectedSpeechNote: "'blocked on' links smoothly: /blɑːk-tɑːn/",
          visualSceneDescription: "A developer looking at a red warning screen on a terminal, waving a hand to a teammate."
        },
        {
          phrase: "Let's touch base right after...",
          ipa: "/lɛts tʌtʃ beɪs raɪt ˈæf.tər/",
          communicativeIntent: "Scheduling a brief 1-on-1 sync immediately following an event",
          lexicalPattern: "Let's touch base [TIME_FRAME]",
          connectedSpeechNote: "'right after' connects with a flap t: /raɪ-dæf-tər/",
          visualSceneDescription: "Two calendar icons aligning with a checkmark."
        }
      ]
    };
  }
}

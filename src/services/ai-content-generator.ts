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
  contextSummary: string;
  miniStoryText: string;
  keyChunks: GeneratedChunk[];
}

export class AiContentGeneratorService {
  private apiKey: string;
  private apiUrl: string;
  private modelName: string;

  constructor() {
    // Padrão Agnóstico (OpenAI-compatible API). 
    // Pode ser facilmente trocado para Groq, Ollama local, ou OpenAI no arquivo .env
    this.apiKey = process.env.LLM_API_KEY || '';
    this.apiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
    this.modelName = process.env.LLM_MODEL || 'gpt-4o-mini';
  }

  /**
   * Gera um cenário imersivo agnóstico através de uma chamada REST padrão (Fetch)
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
      if (!this.apiKey) {
        throw new Error("API Key not found, using fallback.");
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`API response error: ${response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.choices[0].message.content || '{}';
      return JSON.parse(responseText) as GeneratedScenarioImmersion;
    } catch (error) {
      console.warn("Using offline fallback mock for scenario generation:", error.message);
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

/**
 * Shadowing & Speech Pronunciation Evaluator Service
 * Interface com provedores de avaliação fonética (ex: Azure Speech Pronunciation Assessment API)
 */

export interface WordPronunciationResult {
  word: string;
  accuracyScore: number;     // 0 - 100
  errorType?: 'None' | 'Omission' | 'Insertion' | 'Mispronunciation';
  phonemes: {
    phoneme: string;
    accuracyScore: number;
  }[];
}

export interface ShadowingEvaluationResponse {
  overallScore: number;      // 0 - 100
  accuracyScore: number;     // Precisão fonética
  fluencyScore: number;      // Ritmo e cadência contínua
  completenessScore: number; // Porcentagem de palavras reproduzidas
  words: WordPronunciationResult[];
  detectedPace: 'too_slow' | 'natural' | 'too_fast';
}

export class ShadowingEvaluatorService {
  /**
   * Avalia a gravação de áudio do usuário contra a transcrição de referência
   * @param referencePhrase Ex: "Could I get that to go, please?"
   * @param referenceIpa Ex: "/kʊd aɪ ɡɛt ðæt tuː ɡoʊ pliːz/"
   * @param audioBuffer Buffer de áudio enviado pelo microfone (WebM / Opus / WAV)
   */
  public async evaluateAttempt(
    referencePhrase: string,
    referenceIpa: string,
    audioBuffer: Buffer
  ): Promise<ShadowingEvaluationResponse> {
    // Em produção com chave configurada, faz a chamada REST/gRPC para Azure Speech ou SpeechSuper:
    // const result = await this.callAzureSpeechAssessment(referencePhrase, audioBuffer);
    
    // Simulação determinística para validação da arquitetura:
    const words = referencePhrase.replace(/[?,.!]/g, '').split(' ');
    const mockWordResults: WordPronunciationResult[] = words.map(w => ({
      word: w,
      accuracyScore: Math.floor(85 + Math.random() * 15),
      errorType: 'None',
      phonemes: [
        { phoneme: 'mock', accuracyScore: 90 }
      ]
    }));

    const accuracy = Math.round(mockWordResults.reduce((acc, curr) => acc + curr.accuracyScore, 0) / words.length);
    const fluency = 88;
    const completeness = 100;
    const overall = Math.round((accuracy * 0.4) + (fluency * 0.4) + (completeness * 0.2));

    return {
      overallScore: overall,
      accuracyScore: accuracy,
      fluencyScore: fluency,
      completenessScore: completeness,
      words: mockWordResults,
      detectedPace: 'natural'
    };
  }
}

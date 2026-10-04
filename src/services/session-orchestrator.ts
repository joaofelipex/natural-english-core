import { FSRSCard, FSRSScheduler, Rating } from '../fsrs/fsrs';
import { GeneratedChunk, GeneratedScenarioImmersion } from './ai-content-generator';

export interface DailyStudySession {
  sessionId: string;
  totalEstimatedMinutes: number;
  stages: {
    stageIndex: number;
    title: string;
    description: string;
    items: any[];
  }[];
}

export class SessionOrchestrator {
  private fsrs: FSRSScheduler;

  constructor() {
    this.fsrs = new FSRSScheduler();
  }

  /**
   * Constrói uma sessão diária completa e balanceada (20 minutos)
   */
  public buildDailySession(
    dueCards: { card: FSRSCard; chunk: GeneratedChunk }[],
    newImmersionScenario: GeneratedScenarioImmersion
  ): DailyStudySession {
    return {
      sessionId: `session_${Date.now()}`,
      totalEstimatedMinutes: 20,
      stages: [
        {
          stageIndex: 1,
          title: "Auditory & Visual SRS Retrieval",
          description: "6 minutes: Cold review of previously encountered chunks. Identify meaning from image & native audio.",
          items: dueCards.slice(0, 10) // Lote ideal para 6 minutos
        },
        {
          stageIndex: 2,
          title: "Comprehensible Input (i+1 Immersion)",
          description: "8 minutes: Listen to the continuous mini-story twice without text, then follow along with synced text.",
          items: [
            {
              scenarioTitle: newImmersionScenario.scenarioTitle,
              contextSummary: newImmersionScenario.contextSummary,
              miniStory: newImmersionScenario.miniStoryText
            }
          ]
        },
        {
          stageIndex: 3,
          title: "Active Muscle Memory & Shadowing",
          description: "4 minutes: Overlap speech with native cadence. Focus on rhythm, linking sounds, and stress.",
          items: newImmersionScenario.keyChunks
        },
        {
          stageIndex: 4,
          title: "Consolidation & SRS Ingestion",
          description: "2 minutes: Anchor 1 to 2 new chunks into your personal memory queue.",
          items: newImmersionScenario.keyChunks.map(c => ({
            phrase: c.phrase,
            pattern: c.lexicalPattern
          }))
        }
      ]
    };
  }
}

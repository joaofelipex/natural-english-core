/**
 * Free Spaced Repetition Scheduler (FSRS v4.5 Algorithm Implementation)
 * Ref: Open-Spaced-Repetition research & models.
 */

export enum Rating {
  AGAIN = 1,
  HARD = 2,
  GOOD = 3,
  EASY = 4
}

export enum CardState {
  NEW = 'NEW',
  LEARNING = 'LEARNING',
  REVIEW = 'REVIEW',
  RELEARNING = 'RELEARNING'
}

export interface FSRSCard {
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: CardState;
  lastReview?: Date;
}

export interface FSRSParameters {
  requestRetention: number; // Retenção alvo (padrão: 0.9 = 90%)
  maximumInterval: number;  // Intervalo máximo em dias (ex: 36500)
  w: number[];              // 19 pesos padrão do FSRS v4.5
}

export const DEFAULT_FSRS_PARAMS: FSRSParameters = {
  requestRetention: 0.9,
  maximumInterval: 36500,
  w: [
    0.40255, 1.18385, 3.173, 15.69105,
    7.1949, 0.5345, 1.4604, 0.0046,
    1.54575, 0.1192, 1.01925, 1.9395,
    0.11, 0.29605, 0.22695, 0.5698,
    2.85535, 0.4907, 0.3644
  ]
};

export class FSRSScheduler {
  private p: FSRSParameters;

  constructor(params: Partial<FSRSParameters> = {}) {
    this.p = { ...DEFAULT_FSRS_PARAMS, ...params };
  }

  /**
   * Calcula a probabilidade atual de recuperação (Retrievability) dado o tempo decorrido.
   */
  public retrievability(elapsedDays: number, stability: number): number {
    if (stability <= 0) return 0;
    return Math.pow(1 + elapsedDays / (9 * stability), -1);
  }

  /**
   * Inicializa um card novo
   */
  public createEmptyCard(now: Date = new Date()): FSRSCard {
    return {
      due: now,
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      state: CardState.NEW,
      lastReview: undefined
    };
  }

  /**
   * Processa a resposta do usuário a um card e agenda o próximo intervalo.
   */
  public review(card: FSRSCard, rating: Rating, now: Date = new Date()): { nextCard: FSRSCard; interval: number } {
    const nextCard: FSRSCard = { ...card };
    const elapsedDays = card.lastReview
      ? Math.max(0, Math.floor((now.getTime() - card.lastReview.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    nextCard.lastReview = now;
    nextCard.elapsedDays = elapsedDays;
    nextCard.reps += 1;

    if (card.state === CardState.NEW) {
      this.initFirstReview(nextCard, rating);
    } else {
      this.updateExistingReview(nextCard, rating, elapsedDays);
    }

    const interval = this.nextInterval(nextCard.stability);
    nextCard.scheduledDays = interval;
    nextCard.due = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

    return { nextCard, interval };
  }

  private initFirstReview(card: FSRSCard, rating: Rating): void {
    const w = this.p.w;
    card.difficulty = this.constrainDifficulty(w[4] - Math.exp(w[5] * (rating - 1)) + 1);
    card.stability = Math.max(0.1, w[rating - 1]);

    if (rating === Rating.AGAIN) {
      card.state = CardState.LEARNING;
      card.lapses += 1;
    } else {
      card.state = CardState.REVIEW;
    }
  }

  private updateExistingReview(card: FSRSCard, rating: Rating, elapsedDays: number): void {
    const w = this.p.w;
    const r = this.retrievability(elapsedDays, card.stability);
    
    // Atualiza Dificuldade (D)
    const newDifficulty = card.difficulty + w[6] * (rating - 3) * -1;
    card.difficulty = this.constrainDifficulty(
      w[7] * (w[4] - Math.exp(w[5] * 2) + 1) + (1 - w[7]) * newDifficulty
    );

    // Atualiza Estabilidade (S)
    if (rating === Rating.AGAIN) {
      card.lapses += 1;
      card.state = CardState.RELEARNING;
      card.stability = Math.max(
        0.1,
        w[11] *
        Math.pow(card.difficulty, -w[12]) *
        (Math.pow(card.stability + 1, w[13]) - 1) *
        Math.exp((1 - r) * w[14])
      );
    } else {
      card.state = CardState.REVIEW;
      const hardPenalty = rating === Rating.HARD ? w[15] : 1;
      const easyBonus = rating === Rating.EASY ? w[16] : 1;
      
      card.stability = card.stability * (
        1 +
        Math.exp(w[8]) *
        (11 - card.difficulty) *
        Math.pow(card.stability, -w[9]) *
        (Math.exp((1 - r) * w[10]) - 1) *
        hardPenalty *
        easyBonus
      );
    }
  }

  private nextInterval(stability: number): number {
    const interval = (stability / 9) * (Math.pow(1 / this.p.requestRetention, 1) - 1);
    return Math.min(Math.max(1, Math.round(interval)), this.p.maximumInterval);
  }

  private constrainDifficulty(d: number): number {
    return Math.min(Math.max(1, Math.round(d * 100) / 100), 10);
  }
}

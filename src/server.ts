import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { FSRSScheduler, Rating } from './fsrs/fsrs';

const app = express();
const prisma = new PrismaClient();
const scheduler = new FSRSScheduler();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir a UI estática do Immersion Lab
app.use(express.static(path.join(__dirname, '..')));

/**
 * GET /api/stories
 * Retorna o catálogo curado de histórias locais sem dependência de IA
 */
app.get('/api/stories', async (req, res) => {
  try {
    const curatedStories = await import('./data/curated-stories.json');
    res.json(curatedStories.default || curatedStories);
  } catch (err) {
    res.status(500).json({ error: "Failed to load stories" });
  }
});

/**
 * POST /api/generate-scenario
 * Gera um cenário imersivo via AI e persiste os novos chunks no SQLite
 */
app.post('/api/generate-scenario', async (req, res) => {
  try {
    const { topic, cefr = "B1" } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const { AiContentGeneratorService } = await import('./services/ai-content-generator');
    const generator = new AiContentGeneratorService();
    const scenarioData = await generator.generateScenario(topic, cefr);

    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: { email: 'learner@naturalenglish.local', name: 'Learner' }
      });
    }

    // Cria o cenário no SQLite
    const scenario = await prisma.scenario.create({
      data: {
        title: scenarioData.scenarioTitle,
        category: "Custom Learner Generation",
        cefrLevel: scenarioData.targetCefr,
        description: scenarioData.contextSummary
      }
    });

    // Salva os Chunks e cria os Cards FSRS
    const createdCards = [];
    for (const ch of scenarioData.keyChunks) {
      const chunk = await prisma.chunk.create({
        data: {
          scenarioId: scenario.id,
          textPhrase: ch.phrase,
          phoneticIpa: ch.ipa,
          communicativeIntent: ch.communicativeIntent,
          collocationKey: ch.lexicalPattern
        }
      });

      const userCard = await prisma.userCard.create({
        data: {
          userId: user.id,
          chunkId: chunk.id,
          state: 'NEW',
          stability: 0,
          difficulty: 0,
          dueDate: new Date()
        },
        include: {
          chunk: { include: { scenario: true } }
        }
      });

      createdCards.push(userCard);
    }

    res.json({
      success: true,
      scenario: scenarioData,
      newCards: createdCards
    });
  } catch (error) {
    console.error("Erro na geração de cenário:", error);
    res.status(500).json({ error: "Failed to generate scenario" });
  }
});

/**
 * GET /api/session
 * Retorna os cards do usuário devidos para revisão hoje
 */
app.get('/api/session', async (req, res) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return res.status(404).json({ error: "User not found. Run seed script first." });
    }

    const cards = await prisma.userCard.findMany({
      where: {
        userId: user.id,
        dueDate: { lte: new Date() }
      },
      include: {
        chunk: {
          include: { scenario: true }
        }
      },
      take: 15
    });

    res.json({
      userId: user.id,
      dailyGoalMinutes: user.dailyGoalMinutes,
      cardsCount: cards.length,
      cards
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

/**
 * POST /api/review
 * Registra a avaliação do FSRS e atualiza o intervalo no SQLite
 */
app.post('/api/review', async (req, res) => {
  try {
    const { userCardId, rating } = req.body; // rating: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)

    const card = await prisma.userCard.findUnique({
      where: { id: userCardId }
    });

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    // Calcula com motor FSRS
    const fsrsInput = {
      due: card.dueDate,
      stability: card.stability,
      difficulty: card.difficulty,
      elapsedDays: card.elapsedDays,
      scheduledDays: card.scheduledDays,
      reps: card.reps,
      lapses: card.lapses,
      state: card.state as any,
      lastReview: card.lastReviewDate || undefined
    };

    const outcome = scheduler.review(fsrsInput, rating as Rating);

    // Atualiza no SQLite
    const updated = await prisma.userCard.update({
      where: { id: userCardId },
      data: {
        state: outcome.nextCard.state,
        stability: outcome.nextCard.stability,
        difficulty: outcome.nextCard.difficulty,
        elapsedDays: outcome.nextCard.elapsedDays,
        scheduledDays: outcome.nextCard.scheduledDays,
        reps: outcome.nextCard.reps,
        lapses: outcome.nextCard.lapses,
        dueDate: outcome.nextCard.due,
        lastReviewDate: outcome.nextCard.lastReview
      }
    });

    // Registra histórico de log
    await prisma.reviewLog.create({
      data: {
        userCardId: card.id,
        userId: card.userId,
        rating: rating,
        state: outcome.nextCard.state,
        elapsedDays: outcome.nextCard.elapsedDays,
        scheduledDays: outcome.nextCard.scheduledDays
      }
    });

    res.json({
      success: true,
      nextDue: updated.dueDate,
      scheduledDays: updated.scheduledDays,
      stability: updated.stability
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to log review" });
  }
});

/**
 * GET /api/stats
 * Retorna métricas globais de retenção cognitiva (FSRS)
 */
app.get('/api/stats', async (req, res) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ error: "User not found" });

    const totalCards = await prisma.userCard.count({ where: { userId: user.id } });
    const masteredCards = await prisma.userCard.count({
      where: { userId: user.id, stability: { gte: 21 } } // Cards com mais de 21 dias de estabilidade
    });
    const reviewCards = await prisma.userCard.count({
      where: { userId: user.id, state: 'REVIEW' }
    });
    const totalReviews = await prisma.reviewLog.count({ where: { userId: user.id } });

    res.json({
      totalCards,
      masteredCards,
      reviewCards,
      totalReviews
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get stats" });
  }
});

app.listen(PORT, () => {
  console.log(`\n============================================================`);
  console.log(`🚀 NATURAL ENGLISH LAB RODANDO 100% LOCAL E GRATUITO`);
  console.log(`👉 Acesse no seu navegador: http://localhost:${PORT}/immersion-lab.html`);
  console.log(`============================================================\n`);
});

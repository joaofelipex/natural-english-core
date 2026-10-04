import { PrismaClient } from '@prisma/client';
import curatedStories from '../data/curated-stories.json';

const prisma = new PrismaClient();

async function main() {
  console.log(">> Sincronizando Biblioteca de Histórias e Chunks no SQLite Local...");

  // 1. Garante usuário padrão
  const user = await prisma.user.upsert({
    where: { email: 'learner@naturalenglish.local' },
    update: {},
    create: {
      email: 'learner@naturalenglish.local',
      name: 'Independent Learner',
      targetLevel: 'B2',
      dailyGoalMinutes: 20
    }
  });

  // 2. Insere ou atualiza os cenários curados
  for (const story of curatedStories) {
    let scenario = await prisma.scenario.findFirst({
      where: { title: story.title }
    });

    if (!scenario) {
      scenario = await prisma.scenario.create({
        data: {
          title: story.title,
          category: story.category,
          cefrLevel: story.cefr,
          description: story.context
        }
      });
    }

    for (const ch of story.chunks) {
      let chunk = await prisma.chunk.findFirst({
        where: { textPhrase: ch.phrase }
      });

      if (!chunk) {
        chunk = await prisma.chunk.create({
          data: {
            scenarioId: scenario.id,
            textPhrase: ch.phrase,
            phoneticIpa: ch.ipa,
            communicativeIntent: ch.communicativeIntent,
            collocationKey: ch.pattern
          }
        });
      }

      // Conecta card FSRS para o usuário
      const existingCard = await prisma.userCard.findUnique({
        where: {
          userId_chunkId: {
            userId: user.id,
            chunkId: chunk.id
          }
        }
      });

      if (!existingCard) {
        await prisma.userCard.create({
          data: {
            userId: user.id,
            chunkId: chunk.id,
            state: 'NEW',
            stability: 0,
            difficulty: 0,
            dueDate: new Date()
          }
        });
      }
    }
  }

  const totalScenarios = await prisma.scenario.count();
  const totalChunks = await prisma.chunk.count();
  const totalCards = await prisma.userCard.count();

  console.log(`- Biblioteca sincronizada com sucesso!`);
  console.log(`- ${totalScenarios} Cenários completos da vida real`);
  console.log(`- ${totalChunks} Chunks formulados com IPA e padrões`);
  console.log(`- ${totalCards} Cartões ativos na esteira FSRS`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

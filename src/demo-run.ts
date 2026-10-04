import { FSRSScheduler, Rating } from './fsrs/fsrs';
import { AiContentGeneratorService } from './services/ai-content-generator';
import { SessionOrchestrator } from './services/session-orchestrator';
import { ShadowingEvaluatorService } from './services/shadowing-evaluator';

async function main() {
  console.log("=================================================================");
  console.log("NATURAL ENGLISH ACQUISITION PLATFORM - SIMULAÇÃO END-TO-END");
  console.log("=================================================================\n");

  const aiGenerator = new AiContentGeneratorService();
  const sessionOrchestrator = new SessionOrchestrator();
  const fsrsScheduler = new FSRSScheduler();
  const speechEvaluator = new ShadowingEvaluatorService();

  // 1. Simulação: Geração de Conteúdo sob Demanda (Input Compreensível i+1)
  console.log(">> ETAPA 1: Gerando cenário imersivo focado em Chunks léxicos...");
  const scenario = await aiGenerator.generateScenario("Resolving a Critical Cloud Outage", "B2");
  
  console.log(`- Título do Cenário: ${scenario.scenarioTitle}`);
  console.log(`- Nível Alvo: ${scenario.targetCefr}`);
  console.log(`- Mini-História (Input i+1):\n  "${scenario.miniStoryText}"\n`);
  console.log(`- Chunks Extraídos (${scenario.keyChunks.length}):`);
  scenario.keyChunks.forEach((chunk, i) => {
    console.log(`  [${i+1}] "${chunk.phrase}"`);
    console.log(`      IPA: ${chunk.ipa}`);
    console.log(`      Intenção: ${chunk.communicativeIntent}`);
    console.log(`      Connected Speech: ${chunk.connectedSpeechNote}`);
  });

  // 2. Simulação: Montagem da Sessão Diária de 20 Minutos
  console.log("\n>> ETAPA 2: Orquestrando a Sessão Diária de Estudos...");
  const mockDueCard = fsrsScheduler.createEmptyCard();
  const dailySession = sessionOrchestrator.buildDailySession(
    [{ card: mockDueCard, chunk: scenario.keyChunks[0] }],
    scenario
  );

  console.log(`- Sessão ID: ${dailySession.sessionId}`);
  console.log(`- Duração Estimada: ${dailySession.totalEstimatedMinutes} minutos`);
  dailySession.stages.forEach(stg => {
    console.log(`  [Estágio ${stg.stageIndex}] ${stg.title} (${stg.description})`);
  });

  // 3. Simulação: Shadowing & Avaliação Fonética
  console.log("\n>> ETAPA 3: Avaliando Tentativa de Shadowing (Treino Motor)...");
  const targetChunk = scenario.keyChunks[0];
  const mockAudioBuffer = Buffer.from("audio_data_stream_mock");
  
  const evalResult = await speechEvaluator.evaluateAttempt(
    targetChunk.phrase,
    targetChunk.ipa,
    mockAudioBuffer
  );

  console.log(`- Chunk Alvo: "${targetChunk.phrase}"`);
  console.log(`- Score Geral: ${evalResult.overallScore}/100`);
  console.log(`- Acurácia Fonética: ${evalResult.accuracyScore}%`);
  console.log(`- Fluência e Cadência: ${evalResult.fluencyScore}%`);
  console.log(`- Ritmo Detectado: ${evalResult.detectedPace}`);

  // 4. Simulação: Atualização no FSRS após o treino
  console.log("\n>> ETAPA 4: Registrando Retenção no Algoritmo FSRS...");
  const reviewOutcome = fsrsScheduler.review(mockDueCard, Rating.GOOD);
  console.log(`- Card promovido para Estado: ${reviewOutcome.nextCard.state}`);
  console.log(`- Estabilidade atual: ${reviewOutcome.nextCard.stability.toFixed(2)} dias`);
  console.log(`- Próximo vencimento de revisão: ${reviewOutcome.nextCard.due.toISOString().split('T')[0]}`);

  console.log("\n=================================================================");
  console.log("SIMULAÇÃO CONCLUÍDA COM SUCESSO - FLUXO PRONTO PARA O FRONTEND!");
  console.log("=================================================================");
}

main().catch(console.error);

import { FSRSScheduler, Rating, CardState } from './fsrs';

console.log("=== TESTE DO MOTOR DE REPETIÇÃO ESPAÇADA (FSRS v4.5) ===");

const scheduler = new FSRSScheduler();
let card = scheduler.createEmptyCard();

console.log("\n1. Estado Inicial do Card Novo:");
console.log(`- State: ${card.state}, Stability: ${card.stability}, Difficulty: ${card.difficulty}`);

// Simulação de 1º Estudo: Usuário acertou com facilidade média (GOOD)
console.log("\n2. Primeira Revisão (Rating: GOOD)");
const rev1 = scheduler.review(card, Rating.GOOD);
card = rev1.nextCard;
console.log(`- Novo Intervalo: ${rev1.interval} dia(s)`);
console.log(`- Estabilidade (S): ${card.stability.toFixed(2)}`);
console.log(`- Dificuldade (D): ${card.difficulty.toFixed(2)}`);
console.log(`- Próxima data de revisão: ${card.due.toISOString().split('T')[0]}`);

// Simulação de 2ª Revisão após o intervalo agendado: Usuário achou fácil (EASY)
console.log("\n3. Segunda Revisão após o intervalo (Rating: EASY)");
const simulatedDate2 = new Date(card.due.getTime());
const rev2 = scheduler.review(card, Rating.EASY, simulatedDate2);
card = rev2.nextCard;
console.log(`- Novo Intervalo: ${rev2.interval} dia(s)`);
console.log(`- Estabilidade (S): ${card.stability.toFixed(2)}`);
console.log(`- Dificuldade (D): ${card.difficulty.toFixed(2)}`);
console.log(`- Próxima data de revisão: ${card.due.toISOString().split('T')[0]}`);

// Simulação de 3ª Revisão: Usuário esqueceu (AGAIN)
console.log("\n4. Terceira Revisão após esquecimento (Rating: AGAIN)");
const simulatedDate3 = new Date(card.due.getTime());
const rev3 = scheduler.review(card, Rating.AGAIN, simulatedDate3);
card = rev3.nextCard;
console.log(`- Estado do Card: ${card.state}`);
console.log(`- Lapses (Erros): ${card.lapses}`);
console.log(`- Novo Intervalo reduzido: ${rev3.interval} dia(s)`);
console.log(`- Estabilidade recalculada: ${card.stability.toFixed(2)}`);

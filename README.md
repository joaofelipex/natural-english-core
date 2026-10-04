# 🧠 Natural English Acquisition Engine (100% Free & Open Stack)

Sistema de aprendizagem de inglês focado em **Aquisição Natural de Linguagem** baseado nas hipóteses de **Stephen Krashen (Input Compreensível)** e na **Abordagem Léxica de Michael Lewis**, eliminando o ensino gramatical tradicional e traduções diretas para o português.

---

## 🎯 Pilares da Metodologia

1. **Zero-Translation (Sem Português):** A mente do aluno ancora a frase diretamente em uma imagem/situação e no som nativo.
2. **Abordagem Léxica (Chunks):** Memorização motora e auditiva de colocações fixas e semi-fixas (*"Could I get that to go?"*, *"I'm blocked on..."*).
3. **Repetição Espaçada FSRS v4.5:** Algoritmo matemático moderno de cálculo de estabilidade ($S$), dificuldade ($D$) e probabilidade de retenção ($R$), substituindo o SM-2 de 1987.
4. **Shadowing Ativo (Fala e Imitação):** O aluno ouve o ritmo nativo e repete em voz alta, sincronizando entonação e *connected speech*.

---

## 💎 Arquitetura 100% Gratuita (Zero-Cost Stack)

| Componente | Solução Implementada | Custo |
| :--- | :--- | :--- |
| **Banco de Dados** | SQLite Local (`prisma/dev.db`) gerenciado via Prisma ORM | **R$ 0,00** |
| **Síntese de Voz (TTS)** | Web Speech Synthesis API nativa do sistema / navegador | **R$ 0,00** |
| **Reconhecimento de Voz** | Web Speech Recognition API (Chrome/Edge/Safari) | **R$ 0,00** |
| **Avaliação Fonética** | Comparador de distância Levenshtein com pesos de fonema em JS | **R$ 0,00** |
| **Geração de Chunks/IA** | LLM Cloud API (OpenAI Compatible) com fallback local | **R$ 0,00** |
| **Servidor / Backend** | Node.js + Express enxuto | **R$ 0,00** |

---

## 🚀 Como Executar o Sistema

No diretório do projeto:

```powershell
# 1. Instalar dependências (caso não tenha instalado)
npm install

# 2. Inicializar o banco de dados SQLite local
npx prisma db push

# 3. Popular o banco com os primeiros Chunks de vida real
npm run seed

# 4. Iniciar o servidor e a interface
npm start
```

Abra o seu navegador em:
👉 **[http://localhost:3000/immersion-lab.html](http://localhost:3000/immersion-lab.html)**

---

## 📁 Estrutura do Projeto

```
natural-english-core/
├── prisma/
│   ├── schema.prisma          # Modelagem relacional do FSRS, Chunks e Sessões
│   └── dev.db                 # Banco de dados SQLite local
├── src/
│   ├── db/
│   │   └── seed.ts            # Carregamento dos dados iniciais de vida real
│   ├── fsrs/
│   │   ├── fsrs.ts            # Implementação matemática canônica do FSRS v4.5
│   │   └── test-fsrs.ts       # Validação e teste de curvas de esquecimento
│   ├── services/
│   │   ├── ai-content-generator.ts   # Integração com LLM Local/Cloud
│   │   ├── session-orchestrator.ts   # Montagem dos 4 blocos de 20 minutos
│   │   └── shadowing-evaluator.ts    # Métricas de acurácia, ritmo e fluência
│   └── server.ts              # Servidor Express com rotas de API sincronizadas
├── immersion-lab.html         # Single Page App de treino com microfone e TTS
└── package.json
```

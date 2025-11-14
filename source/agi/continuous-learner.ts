import type OpenAI from "openai";

export interface LearningRecord {
  taskId: string;
  prompt: string;
  strategy: string;
  result: string;
  success: boolean;
  executionTime: number;
  qualityScore: number;
  lessonsLearned: string[];
  timestamp: Date;
}

export interface LearningPattern {
  pattern: string;
  frequency: number;
  successRate: number;
  averageQuality: number;
  recommendations: string[];
}

export class ContinuousLearner {
  private client: OpenAI | null = null;
  private learningHistory: LearningRecord[] = [];
  private patterns: LearningPattern[] = [];

  constructor(client?: OpenAI) {
    this.client = client || null;
  }

  /**
   * Registra uma tarefa concluída para aprendizado
   */
  async recordTaskCompletion(record: Omit<LearningRecord, "timestamp">) {
    const learningRecord: LearningRecord = {
      ...record,
      timestamp: new Date(),
    };

    this.learningHistory.push(learningRecord);

    // Analisar padrões a cada 5 tarefas
    if (this.learningHistory.length % 5 === 0) {
      await this.analyzePatterns();
    }

    return learningRecord;
  }

  /**
   * Analisa padrões de sucesso e falha
   */
  async analyzePatterns() {
    if (!this.client || this.learningHistory.length < 3) {
      return;
    }

    const recentTasks = this.learningHistory.slice(-10);
    const successfulTasks = recentTasks.filter((t) => t.success);
    const failedTasks = recentTasks.filter((t) => !t.success);

    const message = await (this.client as any).messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analise os seguintes padrões de tarefas e identifique estratégias que funcionam melhor:

TAREFAS BEM-SUCEDIDAS (${successfulTasks.length}):
${successfulTasks
  .map(
    (t) => `
- Prompt: ${t.prompt.substring(0, 100)}...
- Estratégia: ${t.strategy}
- Qualidade: ${t.qualityScore}/10
- Tempo: ${t.executionTime}ms
`
  )
  .join("\n")}

TAREFAS MAL-SUCEDIDAS (${failedTasks.length}):
${failedTasks
  .map(
    (t) => `
- Prompt: ${t.prompt.substring(0, 100)}...
- Estratégia: ${t.strategy}
- Qualidade: ${t.qualityScore}/10
`
  )
  .join("\n")}

Com base nessa análise, forneça:
1. Padrões de sucesso identificados
2. Estratégias que funcionam melhor para cada tipo de tarefa
3. Recomendações para melhorar futuras execuções
4. Padrões a evitar

Responda em JSON com estrutura: { patterns: [], recommendations: [] }`,
        },
      ],
    });

    const analysisText =
      message.content[0].type === "text" ? message.content[0].text : "";

    try {
      const analysis = JSON.parse(analysisText);
      this.patterns = analysis.patterns || [];

      console.log("[CONTINUOUS LEARNER] Padrões analisados:");
      console.log(JSON.stringify(this.patterns, null, 2));
    } catch (error) {
      console.log("[CONTINUOUS LEARNER] Análise concluída (formato livre)");
      console.log(analysisText);
    }
  }

  /**
   * Obtém recomendações para uma nova tarefa
   */
  async getRecommendations(prompt: string): Promise<string[]> {
    if (!this.client || this.learningHistory.length < 3) {
      return ["Não há histórico suficiente para recomendações"];
    }

    const message = await (this.client as any).messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `Baseado no histórico de aprendizado anterior, forneça recomendações específicas para esta nova tarefa:

NOVA TAREFA: ${prompt}

HISTÓRICO DE SUCESSO:
${this.learningHistory
  .filter((t) => t.success)
  .slice(-5)
  .map((t) => `- ${t.strategy} (Qualidade: ${t.qualityScore}/10)`)
  .join("\n")}

PADRÕES IDENTIFICADOS:
${this.patterns.map((p) => `- ${p.pattern} (Taxa de sucesso: ${p.successRate}%)`).join("\n")}

Forneça 3-5 recomendações específicas para maximizar o sucesso desta tarefa.
Responda como lista JSON: ["recomendação 1", "recomendação 2", ...]`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "[]";

    try {
      return JSON.parse(responseText);
    } catch {
      return [
        "Usar estratégia de decomposição de tarefas",
        "Ativar modo AGI para tarefas complexas",
        "Validar requisitos antes de executar",
      ];
    }
  }

  /**
   * Obtém estatísticas de aprendizado
   */
  getStatistics() {
    const total = this.learningHistory.length;
    const successful = this.learningHistory.filter((t) => t.success).length;
    const avgQuality =
      this.learningHistory.reduce((sum, t) => sum + t.qualityScore, 0) / total;
    const avgTime =
      this.learningHistory.reduce((sum, t) => sum + t.executionTime, 0) / total;

    return {
      totalTasks: total,
      successRate: ((successful / total) * 100).toFixed(1),
      averageQuality: avgQuality.toFixed(1),
      averageExecutionTime: avgTime.toFixed(0),
      patterns: this.patterns.length,
    };
  }
}

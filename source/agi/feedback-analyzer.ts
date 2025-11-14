import type OpenAI from "openai";

export interface UserFeedback {
  taskId: string;
  rating: number; // 1-10
  comment: string;
  timestamp: Date;
  sentiment: "positive" | "neutral" | "negative";
}

export interface FeedbackAnalysis {
  averageRating: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  commonThemes: Array<{ theme: string; frequency: number }>;
  recommendations: string[];
  improvementAreas: string[];
}

export class FeedbackAnalyzer {
  private client: OpenAI | null = null;
  private feedbackHistory: UserFeedback[] = [];

  constructor(client?: OpenAI) {
    this.client = client || null;
  }

  /**
   * Registra feedback do usuário
   */
  async recordFeedback(feedback: Omit<UserFeedback, "timestamp" | "sentiment">) {
    // Analisar sentimento via LLM
    const sentiment = await this.analyzeSentiment(feedback.comment);

    const fullFeedback: UserFeedback = {
      ...feedback,
      sentiment,
      timestamp: new Date(),
    };

    this.feedbackHistory.push(fullFeedback);

    console.log(
      `[FEEDBACK ANALYZER] Feedback registrado: Rating ${feedback.rating}/10, Sentimento: ${sentiment}`
    );

    return fullFeedback;
  }

  /**
   * Analisa sentimento do comentário
   */
  private async analyzeSentiment(
    comment: string
  ): Promise<"positive" | "neutral" | "negative"> {
    if (!this.client) {
      return "neutral";
    }
    const message = await (this.client as any).messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 50,
      messages: [
        {
          role: "user",
          content: `Analise o sentimento deste comentário e responda APENAS com uma palavra: "positive", "neutral" ou "negative".

Comentário: "${comment}"

Resposta:`,
        },
      ],
    });

    const response =
      message.content[0].type === "text" ? message.content[0].text.toLowerCase() : "neutral";

    if (response.includes("positive")) return "positive";
    if (response.includes("negative")) return "negative";
    return "neutral";
  }

  /**
   * Analisa padrões de feedback
   */
  async analyzeFeedback(): Promise<FeedbackAnalysis> {
    if (!this.client || this.feedbackHistory.length === 0) {
      return {
        averageRating: 0,
        sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
        commonThemes: [],
        recommendations: [],
        improvementAreas: [],
      };
    }

    const averageRating =
      this.feedbackHistory.reduce((sum, f) => sum + f.rating, 0) /
      this.feedbackHistory.length;

    const sentimentDistribution = {
      positive: this.feedbackHistory.filter((f) => f.sentiment === "positive")
        .length,
      neutral: this.feedbackHistory.filter((f) => f.sentiment === "neutral")
        .length,
      negative: this.feedbackHistory.filter((f) => f.sentiment === "negative")
        .length,
    };

    // Analisar temas comuns via LLM
    const allComments = this.feedbackHistory
      .map((f) => f.comment)
      .join("\n");

    const message = await (this.client as any).messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analise os seguintes comentários de feedback do usuário e identifique:
1. Temas comuns mencionados
2. Áreas de melhoria sugeridas
3. Recomendações para melhorar o sistema

COMENTÁRIOS:
${allComments}

Responda em JSON com estrutura:
{
  "commonThemes": [{"theme": "...", "frequency": N}, ...],
  "improvementAreas": ["...", "..."],
  "recommendations": ["...", "..."]
}`,
        },
      ],
    });

    const analysisText =
      message.content[0].type === "text" ? message.content[0].text : "{}";

    try {
      const analysis = JSON.parse(analysisText);
      return {
        averageRating,
        sentimentDistribution,
        commonThemes: analysis.commonThemes || [],
        recommendations: analysis.recommendations || [],
        improvementAreas: analysis.improvementAreas || [],
      };
    } catch {
      return {
        averageRating,
        sentimentDistribution,
        commonThemes: [],
        recommendations: ["Coletar mais feedback para análise"],
        improvementAreas: ["Geral"],
      };
    }
  }

  /**
   * Gera relatório de feedback
   */
  async generateFeedbackReport(): Promise<string> {
    const analysis = await this.analyzeFeedback();

    return `
=== RELATÓRIO DE FEEDBACK ===

Avaliação Média: ${analysis.averageRating.toFixed(1)}/10

Distribuição de Sentimento:
- Positivo: ${analysis.sentimentDistribution.positive} (${((analysis.sentimentDistribution.positive / this.feedbackHistory.length) * 100).toFixed(1)}%)
- Neutro: ${analysis.sentimentDistribution.neutral} (${((analysis.sentimentDistribution.neutral / this.feedbackHistory.length) * 100).toFixed(1)}%)
- Negativo: ${analysis.sentimentDistribution.negative} (${((analysis.sentimentDistribution.negative / this.feedbackHistory.length) * 100).toFixed(1)}%)

Temas Comuns:
${analysis.commonThemes.map((t) => `- ${t.theme} (mencionado ${t.frequency}x)`).join("\n")}

Áreas de Melhoria:
${analysis.improvementAreas.map((a) => `- ${a}`).join("\n")}

Recomendações:
${analysis.recommendations.map((r) => `- ${r}`).join("\n")}
    `;
  }

  /**
   * Obtém feedback recente
   */
  getRecentFeedback(limit: number = 10): UserFeedback[] {
    return this.feedbackHistory.slice(-limit);
  }

  /**
   * Obtém estatísticas de feedback
   */
  getStatistics() {
    const total = this.feedbackHistory.length;
    const avgRating =
      total > 0
        ? this.feedbackHistory.reduce((sum, f) => sum + f.rating, 0) / total
        : 0;
    const positiveCount = this.feedbackHistory.filter(
      (f) => f.sentiment === "positive"
    ).length;

    return {
      totalFeedback: total,
      averageRating: avgRating.toFixed(1),
      positivePercentage: total > 0 ? ((positiveCount / total) * 100).toFixed(1) : 0,
    };
  }
}

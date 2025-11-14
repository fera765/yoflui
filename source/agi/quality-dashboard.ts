export interface QualityMetrics {
  taskId: string;
  timestamp: Date;
  successRate: number;
  qualityScore: number;
  executionTime: number;
  requirementsMetScore: number;
  completenessScore: number;
  userSatisfaction?: number;
}

export interface DashboardData {
  totalTasks: number;
  successRate: number;
  averageQuality: number;
  averageExecutionTime: number;
  trends: {
    successTrend: number; // % change
    qualityTrend: number; // % change
    speedTrend: number; // % change
  };
  topPerformingStrategies: Array<{ strategy: string; score: number }>;
  anomalies: Array<{ taskId: string; issue: string }>;
}

export class QualityDashboard {
  private metrics: QualityMetrics[] = [];
  private anomalyThreshold = 0.6; // 60% quality score

  /**
   * Registra métrica de qualidade
   */
  recordMetric(metric: Omit<QualityMetrics, "timestamp">) {
    const fullMetric: QualityMetrics = {
      ...metric,
      timestamp: new Date(),
    };

    this.metrics.push(fullMetric);

    // Detectar anomalias
    if (fullMetric.qualityScore < this.anomalyThreshold) {
      console.log(
        `[QUALITY DASHBOARD] ⚠️ Anomalia detectada: Task ${metric.taskId} com qualidade ${metric.qualityScore}`
      );
    }

    return fullMetric;
  }

  /**
   * Gera dados do dashboard
   */
  generateDashboardData(): DashboardData {
    if (this.metrics.length === 0) {
      return {
        totalTasks: 0,
        successRate: 0,
        averageQuality: 0,
        averageExecutionTime: 0,
        trends: { successTrend: 0, qualityTrend: 0, speedTrend: 0 },
        topPerformingStrategies: [],
        anomalies: [],
      };
    }

    const recentMetrics = this.metrics.slice(-20);
    const olderMetrics = this.metrics.slice(-40, -20);

    // Calcular métricas atuais
    const totalTasks = this.metrics.length;
    const successfulTasks = recentMetrics.filter(
      (m) => m.successRate === 100
    ).length;
    const successRate = (successfulTasks / recentMetrics.length) * 100;
    const averageQuality =
      recentMetrics.reduce((sum, m) => sum + m.qualityScore, 0) /
      recentMetrics.length;
    const averageExecutionTime =
      recentMetrics.reduce((sum, m) => sum + m.executionTime, 0) /
      recentMetrics.length;

    // Calcular tendências
    const oldSuccessRate =
      olderMetrics.length > 0
        ? (olderMetrics.filter((m) => m.successRate === 100).length /
            olderMetrics.length) *
          100
        : successRate;
    const oldQuality =
      olderMetrics.length > 0
        ? olderMetrics.reduce((sum, m) => sum + m.qualityScore, 0) /
          olderMetrics.length
        : averageQuality;
    const oldTime =
      olderMetrics.length > 0
        ? olderMetrics.reduce((sum, m) => sum + m.executionTime, 0) /
          olderMetrics.length
        : averageExecutionTime;

    const successTrend = ((successRate - oldSuccessRate) / oldSuccessRate) * 100;
    const qualityTrend = ((averageQuality - oldQuality) / oldQuality) * 100;
    const speedTrend = ((oldTime - averageExecutionTime) / oldTime) * 100; // Negativo = mais rápido

    // Identificar anomalias
    const anomalies = recentMetrics
      .filter((m) => m.qualityScore < this.anomalyThreshold)
      .map((m) => ({
        taskId: m.taskId,
        issue: `Qualidade baixa: ${(m.qualityScore * 100).toFixed(0)}%`,
      }));

    // Top performing strategies (simulado)
    const topPerformingStrategies = [
      { strategy: "Decomposição de Tarefas", score: 9.2 },
      { strategy: "Replanejamento Automático", score: 8.8 },
      { strategy: "Validação Inteligente", score: 8.5 },
    ];

    return {
      totalTasks,
      successRate: parseFloat(successRate.toFixed(1)),
      averageQuality: parseFloat(averageQuality.toFixed(1)),
      averageExecutionTime: parseFloat(averageExecutionTime.toFixed(0)),
      trends: {
        successTrend: parseFloat(successTrend.toFixed(1)),
        qualityTrend: parseFloat(qualityTrend.toFixed(1)),
        speedTrend: parseFloat(speedTrend.toFixed(1)),
      },
      topPerformingStrategies,
      anomalies,
    };
  }

  /**
   * Gera HTML do dashboard
   */
  generateDashboardHTML(): string {
    const data = this.generateDashboardData();

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flui - Dashboard de Qualidade</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 2rem;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      color: white;
      margin-bottom: 2rem;
    }
    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .metric-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .metric-card h3 {
      color: #667eea;
      font-size: 0.9rem;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
      opacity: 0.7;
    }
    .metric-value {
      font-size: 2.5rem;
      font-weight: bold;
      color: #333;
      margin-bottom: 0.5rem;
    }
    .metric-trend {
      font-size: 0.9rem;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      display: inline-block;
    }
    .trend-positive {
      background: #d4edda;
      color: #155724;
    }
    .trend-negative {
      background: #f8d7da;
      color: #721c24;
    }
    .section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .section h2 {
      color: #667eea;
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
    }
    .strategy-item {
      display: flex;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid #eee;
    }
    .strategy-item:last-child {
      border-bottom: none;
    }
    .strategy-name {
      font-weight: 500;
      color: #333;
    }
    .strategy-score {
      color: #667eea;
      font-weight: bold;
    }
    .anomaly-item {
      padding: 1rem;
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      margin-bottom: 1rem;
      border-radius: 4px;
    }
    .anomaly-id {
      font-weight: bold;
      color: #856404;
    }
    .anomaly-issue {
      color: #856404;
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }
    .no-anomalies {
      color: #28a745;
      font-weight: 500;
      padding: 1rem;
      background: #d4edda;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Dashboard de Qualidade - Flui</h1>
      <p>Monitoramento em tempo real do desempenho do sistema</p>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <h3>Total de Tarefas</h3>
        <div class="metric-value">${data.totalTasks}</div>
      </div>
      <div class="metric-card">
        <h3>Taxa de Sucesso</h3>
        <div class="metric-value">${data.successRate.toFixed(1)}%</div>
        <div class="metric-trend ${data.trends.successTrend >= 0 ? "trend-positive" : "trend-negative"}">
          ${data.trends.successTrend >= 0 ? "📈" : "📉"} ${Math.abs(data.trends.successTrend).toFixed(1)}%
        </div>
      </div>
      <div class="metric-card">
        <h3>Qualidade Média</h3>
        <div class="metric-value">${data.averageQuality.toFixed(1)}/10</div>
        <div class="metric-trend ${data.trends.qualityTrend >= 0 ? "trend-positive" : "trend-negative"}">
          ${data.trends.qualityTrend >= 0 ? "📈" : "📉"} ${Math.abs(data.trends.qualityTrend).toFixed(1)}%
        </div>
      </div>
      <div class="metric-card">
        <h3>Tempo Médio</h3>
        <div class="metric-value">${data.averageExecutionTime.toFixed(0)}ms</div>
        <div class="metric-trend ${data.trends.speedTrend >= 0 ? "trend-positive" : "trend-negative"}">
          ${data.trends.speedTrend >= 0 ? "📈" : "📉"} ${Math.abs(data.trends.speedTrend).toFixed(1)}%
        </div>
      </div>
    </div>

    <div class="section">
      <h2>🏆 Estratégias com Melhor Desempenho</h2>
      ${data.topPerformingStrategies
        .map(
          (s) => `
        <div class="strategy-item">
          <span class="strategy-name">${s.strategy}</span>
          <span class="strategy-score">${s.score.toFixed(1)}/10</span>
        </div>
      `
        )
        .join("")}
    </div>

    <div class="section">
      <h2>⚠️ Anomalias Detectadas</h2>
      ${
        data.anomalies.length === 0
          ? '<div class="no-anomalies">✅ Nenhuma anomalia detectada!</div>'
          : data.anomalies
              .map(
                (a) => `
        <div class="anomaly-item">
          <div class="anomaly-id">Task: ${a.taskId}</div>
          <div class="anomaly-issue">${a.issue}</div>
        </div>
      `
              )
              .join("")
      }
    </div>
  </div>
</body>
</html>
    `;
  }
}

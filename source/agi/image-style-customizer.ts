import type OpenAI from "openai";

export type ImageStyle = "profissional" | "criativo" | "minimalista" | "vibrante" | "clássico";

export interface ImageStyleConfig {
  style: ImageStyle;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
  };
  size?: {
    width?: number;
    height?: number;
  };
  effects?: {
    blur?: boolean;
    grayscale?: boolean;
    sepia?: boolean;
    brightness?: number; // 0-200
    contrast?: number; // 0-200
  };
}

export interface StylePreset {
  name: ImageStyle;
  description: string;
  promptModifier: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  defaultSize: {
    width: number;
    height: number;
  };
}

export class ImageStyleCustomizer {
  private client: OpenAI | null = null;
  private stylePresets: Map<ImageStyle, StylePreset> = new Map();
  private currentStyle: ImageStyle = "profissional";

  constructor(client?: OpenAI) {
    this.client = client || null;
    this.initializePresets();
  }

  /**
   * Inicializa os presets de estilo predefinidos
   */
  private initializePresets(): void {
    const presets: StylePreset[] = [
      {
        name: "profissional",
        description: "Design corporativo e formal",
        promptModifier:
          "professional corporate design, clean lines, business aesthetic, high quality",
        colors: {
          primary: "#1F2937",
          secondary: "#3B82F6",
          accent: "#10B981",
          background: "#F9FAFB",
        },
        defaultSize: { width: 1024, height: 768 },
      },
      {
        name: "criativo",
        description: "Design moderno e vibrante",
        promptModifier:
          "creative modern design, vibrant colors, artistic style, innovative",
        colors: {
          primary: "#FF006E",
          secondary: "#8338EC",
          accent: "#FFBE0B",
          background: "#FFFFFF",
        },
        defaultSize: { width: 1024, height: 768 },
      },
      {
        name: "minimalista",
        description: "Design limpo e simples",
        promptModifier:
          "minimalist design, simple lines, monochrome, clean aesthetic",
        colors: {
          primary: "#000000",
          secondary: "#666666",
          accent: "#CCCCCC",
          background: "#FFFFFF",
        },
        defaultSize: { width: 1024, height: 768 },
      },
      {
        name: "vibrante",
        description: "Design colorido e energético",
        promptModifier:
          "vibrant colorful design, bright colors, energetic style, fun",
        colors: {
          primary: "#FF4757",
          secondary: "#2ED573",
          accent: "#FFD93D",
          background: "#FFFFFF",
        },
        defaultSize: { width: 1024, height: 768 },
      },
      {
        name: "clássico",
        description: "Design elegante e atemporal",
        promptModifier:
          "classic elegant design, timeless style, sophisticated, refined",
        colors: {
          primary: "#4A4A4A",
          secondary: "#8B7355",
          accent: "#D4AF37",
          background: "#F5F5F0",
        },
        defaultSize: { width: 1024, height: 768 },
      },
    ];

    presets.forEach((preset) => {
      this.stylePresets.set(preset.name, preset);
    });
  }

  /**
   * Define o estilo atual
   */
  setStyle(style: ImageStyle): void {
    if (this.stylePresets.has(style)) {
      this.currentStyle = style;
      console.log(`[IMAGE STYLE] Estilo alterado para: ${style}`);
    } else {
      console.warn(`[IMAGE STYLE] Estilo desconhecido: ${style}`);
    }
  }

  /**
   * Obtém o estilo atual
   */
  getCurrentStyle(): ImageStyle {
    return this.currentStyle;
  }

  /**
   * Obtém o preset de um estilo
   */
  getPreset(style: ImageStyle): StylePreset | null {
    return this.stylePresets.get(style) || null;
  }

  /**
   * Lista todos os estilos disponíveis
   */
  listStyles(): StylePreset[] {
    return Array.from(this.stylePresets.values());
  }

  /**
   * Recomenda um estilo baseado no contexto
   */
  async recommendStyle(context: string): Promise<ImageStyle> {
    if (!this.client) {
      return "profissional";
    }

    const message = await (this.client as any).messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: `Baseado no seguinte contexto, recomende um dos seguintes estilos de imagem: profissional, criativo, minimalista, vibrante, clássico.

CONTEXTO:
${context}

Responda APENAS com o nome do estilo (uma palavra).`,
        },
      ],
    });

    const styleText =
      message.content[0].type === "text" ? message.content[0].text : "";
    const style = styleText.toLowerCase().trim() as ImageStyle;

    if (this.stylePresets.has(style)) {
      return style;
    }

    return "profissional";
  }

  /**
   * Modifica o prompt de imagem com base no estilo
   */
  modifyPromptByStyle(originalPrompt: string, style?: ImageStyle): string {
    const targetStyle = style || this.currentStyle;
    const preset = this.stylePresets.get(targetStyle);

    if (!preset) {
      return originalPrompt;
    }

    return `${originalPrompt}, ${preset.promptModifier}`;
  }

  /**
   * Gera CSS para aplicar efeitos de estilo
   */
  generateCSS(config: ImageStyleConfig): string {
    const colors = config.colors || this.stylePresets.get(config.style)?.colors;
    const size = config.size || this.stylePresets.get(config.style)?.defaultSize;
    const effects = config.effects || {};

    let css = `
      .styled-image {
        width: ${size?.width || 1024}px;
        height: ${size?.height || 768}px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    // Aplicar efeitos
    if (effects.blur) css += `filter: blur(5px);`;
    if (effects.grayscale) css += `filter: grayscale(100%);`;
    if (effects.sepia) css += `filter: sepia(100%);`;
    if (effects.brightness) css += `filter: brightness(${effects.brightness}%);`;
    if (effects.contrast) css += `filter: contrast(${effects.contrast}%);`;

    css += `}`;

    // Gerar CSS para cores
    if (colors) {
      css += `
        .color-primary { color: ${colors.primary}; }
        .color-secondary { color: ${colors.secondary}; }
        .color-accent { color: ${colors.accent}; }
        .bg-primary { background-color: ${colors.primary}; }
        .bg-secondary { background-color: ${colors.secondary}; }
        .bg-accent { background-color: ${colors.accent}; }
        .bg-background { background-color: ${colors.background}; }
      `;
    }

    return css;
  }

  /**
   * Cria configuração customizada
   */
  createCustomConfig(
    style: ImageStyle,
    overrides?: Partial<ImageStyleConfig>
  ): ImageStyleConfig {
    const preset = this.stylePresets.get(style);
    if (!preset) {
      return { style: "profissional" };
    }

    return {
      style,
      colors: {
        ...preset.colors,
        ...overrides?.colors,
      },
      size: {
        ...preset.defaultSize,
        ...overrides?.size,
      },
      effects: overrides?.effects || {},
    };
  }

  /**
   * Obtém descrição de um estilo
   */
  getStyleDescription(style: ImageStyle): string {
    return this.stylePresets.get(style)?.description || "Estilo desconhecido";
  }

  /**
   * Exporta configuração como JSON
   */
  exportConfig(config: ImageStyleConfig): string {
    return JSON.stringify(config, null, 2);
  }

  /**
   * Importa configuração de JSON
   */
  importConfig(jsonString: string): ImageStyleConfig | null {
    try {
      const config = JSON.parse(jsonString) as ImageStyleConfig;
      if (config.style && this.stylePresets.has(config.style)) {
        return config;
      }
      return null;
    } catch {
      return null;
    }
  }
}

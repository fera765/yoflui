import type OpenAI from "openai";

export interface Theme {
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  layout: {
    spacing: string;
    borderRadius: string;
    shadows: string;
  };
}

export const PREDEFINED_THEMES: Record<string, Theme> = {
  corporativo: {
    name: "Corporativo",
    description: "Design profissional e formal para documentos corporativos",
    colors: {
      primary: "#003366",
      secondary: "#0066CC",
      accent: "#FF6600",
      background: "#FFFFFF",
      text: "#333333",
    },
    fonts: {
      heading: "Georgia, serif",
      body: "Arial, sans-serif",
    },
    layout: {
      spacing: "1.5rem",
      borderRadius: "4px",
      shadows: "0 2px 4px rgba(0,0,0,0.1)",
    },
  },
  criativo: {
    name: "Criativo",
    description: "Design vibrante e moderno para conteúdo criativo",
    colors: {
      primary: "#FF006E",
      secondary: "#8338EC",
      accent: "#FFBE0B",
      background: "#FFFFFF",
      text: "#1A1A1A",
    },
    fonts: {
      heading: "Trebuchet MS, sans-serif",
      body: "Segoe UI, sans-serif",
    },
    layout: {
      spacing: "2rem",
      borderRadius: "12px",
      shadows: "0 8px 16px rgba(0,0,0,0.15)",
    },
  },
  minimalista: {
    name: "Minimalista",
    description: "Design limpo e simples com foco no conteúdo",
    colors: {
      primary: "#000000",
      secondary: "#666666",
      accent: "#CCCCCC",
      background: "#FAFAFA",
      text: "#222222",
    },
    fonts: {
      heading: "Helvetica, sans-serif",
      body: "Helvetica, sans-serif",
    },
    layout: {
      spacing: "1rem",
      borderRadius: "0px",
      shadows: "none",
    },
  },
  vibrante: {
    name: "Vibrante",
    description: "Design colorido e energético para conteúdo dinâmico",
    colors: {
      primary: "#00D9FF",
      secondary: "#FF006E",
      accent: "#FFBE0B",
      background: "#0A0E27",
      text: "#FFFFFF",
    },
    fonts: {
      heading: "Impact, sans-serif",
      body: "Verdana, sans-serif",
    },
    layout: {
      spacing: "2.5rem",
      borderRadius: "16px",
      shadows: "0 10px 30px rgba(0,217,255,0.3)",
    },
  },
  classico: {
    name: "Clássico",
    description: "Design elegante e atemporal inspirado em publicações tradicionais",
    colors: {
      primary: "#8B4513",
      secondary: "#D2B48C",
      accent: "#DAA520",
      background: "#FFF8DC",
      text: "#2F4F4F",
    },
    fonts: {
      heading: "Garamond, serif",
      body: "Garamond, serif",
    },
    layout: {
      spacing: "1.75rem",
      borderRadius: "2px",
      shadows: "0 4px 8px rgba(0,0,0,0.2)",
    },
  },
};

export class ThemeManager {
  private client: OpenAI | null = null;
  private selectedTheme: Theme = PREDEFINED_THEMES.corporativo;

  constructor(client?: OpenAI) {
    this.client = client || null;
  }

  /**
   * Seleciona um tema predefinido
   */
  selectTheme(themeName: string): Theme {
    const theme = PREDEFINED_THEMES[themeName.toLowerCase()];
    if (theme) {
      this.selectedTheme = theme;
      console.log(`[THEME MANAGER] Tema selecionado: ${theme.name}`);
      return theme;
    }
    console.log(`[THEME MANAGER] Tema não encontrado, usando padrão`);
    return this.selectedTheme;
  }

  /**
   * Recomenda um tema baseado no contexto
   */
  async recommendTheme(prompt: string): Promise<Theme> {
    if (!this.client) {
      return this.selectedTheme;
    }
    const message = await (this.client as any).messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `Baseado no seguinte prompt, recomende qual dos seguintes temas seria mais apropriado:

PROMPT: ${prompt}

TEMAS DISPONÍVEIS:
${Object.entries(PREDEFINED_THEMES)
  .map(([key, theme]) => `- ${key}: ${theme.description}`)
  .join("\n")}

Responda APENAS com o nome da chave do tema (ex: "corporativo", "criativo", etc.)`,
        },
      ],
    });

    const recommendation =
      message.content[0].type === "text"
        ? message.content[0].text.toLowerCase().trim()
        : "corporativo";

    const theme = PREDEFINED_THEMES[recommendation] || this.selectedTheme;
    this.selectedTheme = theme;

    console.log(`[THEME MANAGER] Tema recomendado: ${theme.name}`);
    return theme;
  }

  /**
   * Customiza o tema atual
   */
  customizeTheme(customizations: Partial<Theme>): Theme {
    this.selectedTheme = {
      ...this.selectedTheme,
      ...customizations,
      colors: {
        ...this.selectedTheme.colors,
        ...(customizations.colors || {}),
      },
      fonts: {
        ...this.selectedTheme.fonts,
        ...(customizations.fonts || {}),
      },
      layout: {
        ...this.selectedTheme.layout,
        ...(customizations.layout || {}),
      },
    };

    console.log(`[THEME MANAGER] Tema customizado`);
    return this.selectedTheme;
  }

  /**
   * Gera CSS baseado no tema
   */
  generateCSS(): string {
    const theme = this.selectedTheme;

    return `
:root {
  --color-primary: ${theme.colors.primary};
  --color-secondary: ${theme.colors.secondary};
  --color-accent: ${theme.colors.accent};
  --color-background: ${theme.colors.background};
  --color-text: ${theme.colors.text};
  --font-heading: ${theme.fonts.heading};
  --font-body: ${theme.fonts.body};
  --spacing: ${theme.layout.spacing};
  --border-radius: ${theme.layout.borderRadius};
  --shadow: ${theme.layout.shadows};
}

body {
  font-family: var(--font-body);
  color: var(--color-text);
  background-color: var(--color-background);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  color: var(--color-primary);
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-background);
  padding: var(--spacing);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
}

.btn-secondary {
  background-color: var(--color-secondary);
  color: var(--color-background);
  padding: var(--spacing);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
}

.accent {
  color: var(--color-accent);
}

.card {
  background-color: var(--color-background);
  border: 1px solid var(--color-secondary);
  border-radius: var(--border-radius);
  padding: var(--spacing);
  box-shadow: var(--shadow);
}
    `;
  }

  /**
   * Obtém o tema atual
   */
  getCurrentTheme(): Theme {
    return this.selectedTheme;
  }

  /**
   * Lista todos os temas disponíveis
   */
  listThemes(): Array<{ name: string; description: string }> {
    return Object.values(PREDEFINED_THEMES).map((theme) => ({
      name: theme.name,
      description: theme.description,
    }));
  }
}

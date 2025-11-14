import type OpenAI from "openai";

export interface ImageGenerationRequest {
  prompt: string;
  style?: string;
  model?: "flux-pro" | "flux-realism" | "flux-anime" | "flux-3d";
  width?: number;
  height?: number;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  model: string;
  timestamp: Date;
  base64?: string;
}

export class ImageGenerator {
  private client: OpenAI | null = null;
  private generatedImages: GeneratedImage[] = [];
  private pollinations_api_url = "https://image.pollinations.ai/prompt/";

  constructor(client?: OpenAI) {
    this.client = client || null;
  }

  /**
   * Detecta automaticamente quando imagens são necessárias no conteúdo
   */
  async detectImageNeed(content: string): Promise<string[]> {
    if (!this.client) {
      return [];
    }

    const message = await (this.client as any).messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analise o seguinte conteúdo e identifique QUAIS seções precisariam de imagens para melhorar a compreensão e o visual. Para cada seção que precisa de imagem, forneça um prompt específico e descritivo para geração de imagem.

CONTEÚDO:
${content}

Responda em JSON com estrutura:
{
  "needsImages": true/false,
  "imagePrompts": [
    {
      "section": "Nome da seção",
      "prompt": "Prompt detalhado para geração de imagem",
      "style": "estilo visual (profissional, criativo, minimalista, etc)",
      "priority": "alta/média/baixa"
    }
  ]
}`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "{}";

    try {
      const analysis = JSON.parse(responseText);
      if (analysis.imagePrompts && Array.isArray(analysis.imagePrompts)) {
        return analysis.imagePrompts.map((img: any) => img.prompt);
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Gera imagem usando Pollinations AI (sem autenticação)
   */
  async generateImage(
    request: ImageGenerationRequest
  ): Promise<GeneratedImage | null> {
    try {
      // Usar Pollinations AI API (gratuita, sem autenticação)
      const encodedPrompt = encodeURIComponent(request.prompt);
      const model = request.model || "flux-pro";
      const imageUrl = `${this.pollinations_api_url}${encodedPrompt}?model=${model}&width=${request.width || 1024}&height=${request.height || 768}`;

      console.log(`[IMAGE GENERATOR] Gerando imagem: ${request.prompt}`);
      console.log(`[IMAGE GENERATOR] URL: ${imageUrl}`);

      const generatedImage: GeneratedImage = {
        url: imageUrl,
        prompt: request.prompt,
        model: model,
        timestamp: new Date(),
      };

      this.generatedImages.push(generatedImage);

      console.log(`[IMAGE GENERATOR] ✅ Imagem gerada com sucesso`);
      return generatedImage;
    } catch (error) {
      console.error(`[IMAGE GENERATOR] ❌ Erro ao gerar imagem:`, error);
      return null;
    }
  }

  /**
   * Gera múltiplas imagens em paralelo
   */
  async generateMultipleImages(
    requests: ImageGenerationRequest[]
  ): Promise<GeneratedImage[]> {
    const promises = requests.map((req) => this.generateImage(req));
    const results = await Promise.all(promises);
    return results.filter((img) => img !== null) as GeneratedImage[];
  }

  /**
   * Incorpora imagens no conteúdo HTML
   */
  async incorporateImagesInHTML(
    htmlContent: string,
    images: GeneratedImage[]
  ): Promise<string> {
    if (images.length === 0) {
      return htmlContent;
    }

    let enhancedHTML = htmlContent;

    // Incorporar imagens em seções apropriadas
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const imageHTML = `
        <figure class="my-8 text-center">
          <img src="${image.url}" alt="${image.prompt}" class="max-w-full h-auto rounded-lg shadow-lg mx-auto" />
          <figcaption class="text-sm text-gray-600 mt-2">${image.prompt}</figcaption>
        </figure>
      `;

      // Inserir imagem após o primeiro parágrafo de cada seção
      const sectionRegex = /<h[2-3][^>]*>([^<]+)<\/h[2-3]>/g;
      let sectionCount = 0;

      enhancedHTML = enhancedHTML.replace(sectionRegex, (match) => {
        sectionCount++;
        if (sectionCount === i + 1) {
          // Encontrar o próximo parágrafo e inserir a imagem depois dele
          const nextParagraphRegex = /(<p[^>]*>.*?<\/p>)/;
          return match + nextParagraphRegex.exec(enhancedHTML)?.[1] || "";
        }
        return match;
      });

      // Se não conseguiu inserir na seção, inserir no final
      if (sectionCount < i + 1) {
        enhancedHTML = enhancedHTML.replace(
          "</body>",
          imageHTML + "</body>"
        );
      }
    }

    return enhancedHTML;
  }

  /**
   * Obtém imagens geradas
   */
  getGeneratedImages(): GeneratedImage[] {
    return this.generatedImages;
  }

  /**
   * Limpa histórico de imagens
   */
  clearHistory(): void {
    this.generatedImages = [];
  }

  /**
   * Gera HTML com imagens embutidas como base64 (para PDF)
   */
  async generateHTMLWithEmbeddedImages(
    htmlContent: string,
    images: GeneratedImage[]
  ): Promise<string> {
    if (images.length === 0) {
      return htmlContent;
    }

    let enhancedHTML = htmlContent;

    // Para cada imagem, tentar embutir como base64
    for (const image of images) {
      try {
        // Usar a URL direta do Pollinations (que suporta CORS)
        const imageHTML = `
          <figure class="my-8 text-center">
            <img src="${image.url}" alt="${image.prompt}" class="max-w-full h-auto rounded-lg shadow-lg mx-auto" loading="lazy" />
            <figcaption class="text-sm text-gray-600 mt-2">${image.prompt}</figcaption>
          </figure>
        `;

        // Inserir antes de </body>
        enhancedHTML = enhancedHTML.replace("</body>", imageHTML + "</body>");
      } catch (error) {
        console.error(
          `[IMAGE GENERATOR] Erro ao embutir imagem:`,
          error
        );
      }
    }

    return enhancedHTML;
  }

  /**
   * Obtém estatísticas de geração
   */
  getStatistics() {
    return {
      totalGenerated: this.generatedImages.length,
      models: [
        ...new Set(this.generatedImages.map((img) => img.model)),
      ],
      timestamps: this.generatedImages.map((img) => img.timestamp),
    };
  }
}

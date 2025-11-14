import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface CachedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  timestamp: Date;
  expiresAt: Date;
  filePath: string;
  hash: string;
}

export interface ImageCache {
  [hash: string]: CachedImage;
}

export class ImagePersistence {
  private cacheDir: string;
  private cache: ImageCache = {};
  private cacheFilePath: string;
  private cacheTTL: number = 24 * 60 * 60 * 1000; // 24 horas em ms

  constructor(cacheDir?: string) {
    this.cacheDir = cacheDir || path.join(process.cwd(), "work", ".image-cache");
    this.cacheFilePath = path.join(this.cacheDir, "cache.json");

    // Criar diretório se não existir
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }

    // Carregar cache existente
    this.loadCache();
  }

  /**
   * Gera hash para um prompt de imagem
   */
  private generateHash(prompt: string, model: string): string {
    const combined = `${prompt}:${model}`;
    return crypto.createHash("sha256").update(combined).digest("hex");
  }

  /**
   * Carrega cache do arquivo
   */
  private loadCache(): void {
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        const data = fs.readFileSync(this.cacheFilePath, "utf-8");
        const parsed = JSON.parse(data);

        // Validar e carregar apenas imagens não expiradas
        for (const [hash, image] of Object.entries(parsed)) {
          const cachedImage = image as CachedImage;
          const expiresAt = new Date(cachedImage.expiresAt);

          if (expiresAt > new Date()) {
            this.cache[hash] = cachedImage;
          } else {
            // Deletar arquivo expirado
            try {
              if (fs.existsSync(cachedImage.filePath)) {
                fs.unlinkSync(cachedImage.filePath);
              }
            } catch (error) {
              console.error(
                `[IMAGE PERSISTENCE] Erro ao deletar imagem expirada:`,
                error
              );
            }
          }
        }

        console.log(
          `[IMAGE PERSISTENCE] Cache carregado: ${Object.keys(this.cache).length} imagens válidas`
        );
      }
    } catch (error) {
      console.error(`[IMAGE PERSISTENCE] Erro ao carregar cache:`, error);
      this.cache = {};
    }
  }

  /**
   * Salva cache no arquivo
   */
  private saveCache(): void {
    try {
      fs.writeFileSync(
        this.cacheFilePath,
        JSON.stringify(this.cache, null, 2)
      );
      console.log(`[IMAGE PERSISTENCE] Cache salvo com sucesso`);
    } catch (error) {
      console.error(`[IMAGE PERSISTENCE] Erro ao salvar cache:`, error);
    }
  }

  /**
   * Verifica se uma imagem já está em cache
   */
  isCached(prompt: string, model: string): CachedImage | null {
    const hash = this.generateHash(prompt, model);
    const cached = this.cache[hash];

    if (cached) {
      const expiresAt = new Date(cached.expiresAt);
      if (expiresAt > new Date()) {
        console.log(
          `[IMAGE PERSISTENCE] ✅ Imagem encontrada em cache: ${hash.substring(0, 8)}...`
        );
        return cached;
      } else {
        // Remover do cache se expirou
        delete this.cache[hash];
        this.saveCache();
      }
    }

    return null;
  }

  /**
   * Armazena imagem em cache
   */
  storeImage(
    prompt: string,
    model: string,
    url: string,
    filePath?: string
  ): CachedImage {
    const hash = this.generateHash(prompt, model);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.cacheTTL);

    const cachedImage: CachedImage = {
      id: hash.substring(0, 16),
      url,
      prompt,
      model,
      timestamp: now,
      expiresAt,
      filePath: filePath || path.join(this.cacheDir, `${hash}.json`),
      hash,
    };

    this.cache[hash] = cachedImage;
    this.saveCache();

    console.log(
      `[IMAGE PERSISTENCE] 💾 Imagem armazenada em cache: ${hash.substring(0, 8)}...`
    );

    return cachedImage;
  }

  /**
   * Obtém imagem do cache
   */
  getImage(prompt: string, model: string): CachedImage | null {
    return this.isCached(prompt, model);
  }

  /**
   * Lista todas as imagens em cache
   */
  listCached(): CachedImage[] {
    return Object.values(this.cache).filter((img) => {
      const expiresAt = new Date(img.expiresAt);
      return expiresAt > new Date();
    });
  }

  /**
   * Limpa cache expirado
   */
  cleanExpired(): number {
    const now = new Date();
    let deletedCount = 0;

    for (const [hash, image] of Object.entries(this.cache)) {
      const expiresAt = new Date(image.expiresAt);
      if (expiresAt <= now) {
        delete this.cache[hash];
        deletedCount++;

        // Deletar arquivo se existir
        try {
          if (fs.existsSync(image.filePath)) {
            fs.unlinkSync(image.filePath);
          }
        } catch (error) {
          console.error(
            `[IMAGE PERSISTENCE] Erro ao deletar arquivo expirado:`,
            error
          );
        }
      }
    }

    if (deletedCount > 0) {
      this.saveCache();
      console.log(
        `[IMAGE PERSISTENCE] 🧹 ${deletedCount} imagens expiradas limpas`
      );
    }

    return deletedCount;
  }

  /**
   * Limpa todo o cache
   */
  clearAll(): void {
    for (const image of Object.values(this.cache)) {
      try {
        if (fs.existsSync(image.filePath)) {
          fs.unlinkSync(image.filePath);
        }
      } catch (error) {
        console.error(
          `[IMAGE PERSISTENCE] Erro ao deletar arquivo:`,
          error
        );
      }
    }

    this.cache = {};
    this.saveCache();
    console.log(`[IMAGE PERSISTENCE] 🗑️ Cache completamente limpo`);
  }

  /**
   * Obtém estatísticas do cache
   */
  getStatistics() {
    const cached = this.listCached();
    const totalSize = cached.reduce((sum, img) => {
      try {
        if (fs.existsSync(img.filePath)) {
          const stats = fs.statSync(img.filePath);
          return sum + stats.size;
        }
      } catch {
        return sum;
      }
      return sum;
    }, 0);

    return {
      totalCached: cached.length,
      totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
      models: [...new Set(cached.map((img) => img.model))],
      oldestImage: cached.length > 0 ? cached[0].timestamp : null,
      newestImage:
        cached.length > 0
          ? cached[cached.length - 1].timestamp
          : null,
    };
  }

  /**
   * Define novo TTL para cache
   */
  setTTL(ttlHours: number): void {
    this.cacheTTL = ttlHours * 60 * 60 * 1000;
    console.log(
      `[IMAGE PERSISTENCE] ⏱️ TTL do cache alterado para ${ttlHours} horas`
    );
  }
}

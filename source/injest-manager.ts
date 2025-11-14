import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { FluiContext, loadOrCreateContext, saveContext, updateContextCarryover } from './context-manager.js';
import { getConfig } from './llm-config.js';
import OpenAI from 'openai';
import { getValidAccessToken, loadQwenCredentials } from './qwen-oauth.js';
import { executeShellTool } from './tools/shell.js';

const INJEST_DIR = 'injest';
const KNOWLEDGE_FILE = '.flui/knowledge_base.json';

interface KnowledgeEntry {
    path: string;
    hash: string; // Para detectar mudanças no arquivo
    summary: string;
    extractedText: string;
    timestamp: number;
}

interface KnowledgeBase {
    [filePath: string]: KnowledgeEntry;
}

/**
 * Inicializa o cliente OpenAI para sumarização.
 */
async function initializeOpenAI(): Promise<OpenAI> {
    const config = getConfig();
    const qwenCreds = loadQwenCredentials();
    let endpoint = config.endpoint;
    let apiKey = config.apiKey || 'not-needed';

    if (qwenCreds?.access_token) {
        const validToken = await getValidAccessToken();
        if (validToken) {
            apiKey = validToken;
            const resourceUrl = qwenCreds.resource_url || 'portal.qwen.ai';
            endpoint = `https://${resourceUrl}/v1`;
        }
    }

    return new OpenAI({ baseURL: endpoint, apiKey });
}

/**
 * Calcula um hash simples do arquivo (timestamp + tamanho) para detecção de mudança.
 */
function getFileHash(filePath: string): string {
    try {
        const stats = statSync(filePath);
        return `${stats.mtimeMs}-${stats.size}`;
    } catch (error) {
        return 'new';
    }
}

/**
 * Carrega a base de conhecimento existente.
 */
function loadKnowledgeBase(cwd: string): KnowledgeBase {
    const knowledgePath = join(cwd, KNOWLEDGE_FILE);
    if (existsSync(knowledgePath)) {
        try {
            const data = readFileSync(knowledgePath, 'utf-8');
            return JSON.parse(data) as KnowledgeBase;
        } catch (error) {
            console.error('Erro ao carregar base de conhecimento:', error);
            return {};
        }
    }
    return {};
}

/**
 * Salva a base de conhecimento.
 */
function saveKnowledgeBase(cwd: string, base: KnowledgeBase): void {
    const knowledgePath = join(cwd, KNOWLEDGE_FILE);
    writeFileSync(knowledgePath, JSON.stringify(base, null, 2), 'utf-8');
}

/**
 * Extrai texto de arquivos PDF usando pdftotext (via shell).
 */
async function extractTextFromPDF(filePath: string): Promise<string> {
    const tempTxtPath = `${filePath}.txt`;
    try {
        // Comando: pdftotext <input_pdf> <output_txt>
        const result = await executeShellTool({
            brief: `Extraindo texto de PDF: ${filePath}`,
            action: 'exec',
            session: 'injest-pdf',
            command: `pdftotext "${filePath}" "${tempTxtPath}"`,
            timeout: 60
        });

        if (result.exitCode !== 0) {
            throw new Error(`Falha ao extrair texto do PDF: ${result.stderr}`);
        }

        const text = readFileSync(tempTxtPath, 'utf-8');
        // Limpar arquivo temporário
        await executeShellTool({
            brief: `Removendo arquivo temporário: ${tempTxtPath}`,
            action: 'exec',
            session: 'injest-pdf',
            command: `rm "${tempTxtPath}"`
        });
        return text;

    } catch (error) {
        console.error(`Erro ao processar PDF ${filePath}:`, error);
        // Tentar limpar o arquivo temporário em caso de erro
        if (existsSync(tempTxtPath)) {
             await executeShellTool({
                brief: `Removendo arquivo temporário após erro: ${tempTxtPath}`,
                action: 'exec',
                session: 'injest-pdf',
                command: `rm "${tempTxtPath}"`
            });
        }
        return `[ERRO DE EXTRAÇÃO DE PDF] ${error instanceof Error ? error.message : String(error)}`;
    }
}

/**
 * Extrai texto de arquivos DOCX (simulando, pois não temos uma ferramenta direta).
 * Usaremos um placeholder ou instrução para o LLM.
 */
async function extractTextFromDOCX(filePath: string): Promise<string> {
    // Placeholder - na vida real usaria uma biblioteca como 'mammoth' ou 'docx-text'
    return `[TEXTO EXTRAÍDO DE DOCX - SIMULAÇÃO] Conteúdo do arquivo ${filePath} seria extraído aqui.`;
}

/**
 * Sumariza o texto extraído usando o LLM.
 */
async function summarizeText(openai: OpenAI, text: string, filePath: string): Promise<string> {
    const MAX_TOKENS = 16000; // Limite de tokens para o prompt
    let textToSummarize = text;

    if (text.length > MAX_TOKENS * 4) { // Estimativa grosseira de 4 caracteres por token
        textToSummarize = text.substring(0, MAX_TOKENS * 4) + '... [TEXTO TRUNCADO PARA SUMARIZAÇÃO]';
    }

    const prompt = `Você é um Agente de Conhecimento. Sua tarefa é ler o texto a seguir, extraído do arquivo "${filePath}", e criar um resumo conciso e de alta qualidade que capture os pontos chave, argumentos principais e dados relevantes. O resumo será usado para injetar conhecimento no contexto de um AGI.

TEXTO PARA SUMARIZAÇÃO:
---
${textToSummarize}
---

RESUMO CONCISO E DE ALTA QUALIDADE:`;

    try {
        const response = await openai.chat.completions.create({
            model: getConfig().model,
            messages: [
                { role: 'system', content: 'Você é um Agente de Conhecimento. Sua tarefa é criar um resumo conciso e de alta qualidade.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1,
        });

        return response.choices[0].message.content || '[ERRO DE SUMARIZAÇÃO]';
    } catch (error) {
        console.error('Erro ao sumarizar texto:', error);
        return `[ERRO DE SUMARIZAÇÃO] ${error instanceof Error ? error.message : String(error)}`;
    }
}

/**
 * Processa um único arquivo.
 */
async function processFile(openai: OpenAI, filePath: string, cwd: string): Promise<KnowledgeEntry | null> {
    const ext = extname(filePath).toLowerCase();
    let extractedText = '';

    try {
        switch (ext) {
            case '.pdf':
                extractedText = await extractTextFromPDF(filePath);
                break;
            case '.txt':
            case '.md':
                extractedText = readFileSync(filePath, 'utf-8');
                break;
            case '.docx':
                extractedText = await extractTextFromDOCX(filePath);
                break;
            default:
                console.log(`Arquivo ignorado (extensão não suportada): ${filePath}`);
                return null;
        }

        if (extractedText.length < 10) {
            console.log(`Arquivo ignorado (texto muito curto): ${filePath}`);
            return null;
        }

        const summary = await summarizeText(openai, extractedText, filePath);
        const hash = getFileHash(filePath);

        return {
            path: filePath,
            hash,
            summary,
            extractedText,
            timestamp: Date.now(),
        };

    } catch (error) {
        console.error(`Falha ao processar arquivo ${filePath}:`, error);
        return null;
    }
}

/**
 * Função principal para gerenciar a injeção de conhecimento.
 */
export async function injestKnowledge(cwd: string): Promise<void> {
    const injestPath = join(cwd, INJEST_DIR);
    if (!existsSync(injestPath)) {
        console.log(`Diretório injest não encontrado: ${injestPath}. Criando...`);
        mkdirSync(injestPath, { recursive: true });
        return;
    }

    const openai = await initializeOpenAI();
    const knowledgeBase = loadKnowledgeBase(cwd);
    const filesToProcess: string[] = [];

    // 1. Encontrar arquivos novos ou modificados
    const files = readdirSync(injestPath);
    for (const file of files) {
        const filePath = join(injestPath, file);
        const stats = statSync(filePath);

        if (stats.isFile()) {
            const currentHash = getFileHash(filePath);
            const knownEntry = knowledgeBase[filePath];

            if (!knownEntry || knownEntry.hash !== currentHash) {
                filesToProcess.push(filePath);
            }
        }
    }

    // 2. Processar arquivos
    if (filesToProcess.length > 0) {
        console.log(`[INJEST] Processando ${filesToProcess.length} arquivo(s) novo(s) ou modificado(s)...`);
        for (const filePath of filesToProcess) {
            const entry = await processFile(openai, filePath, cwd);
            if (entry) {
                knowledgeBase[filePath] = entry;
                console.log(`[INJEST] Sucesso: ${filePath} sumarizado.`);
            }
        }
        // 3. Salvar base de conhecimento atualizada
        saveKnowledgeBase(cwd, knowledgeBase);
    } else {
        console.log('[INJEST] Nenhuma alteração nos arquivos de conhecimento detectada.');
    }

    // 4. Injetar conhecimento no contexto do AGI
    const allSummaries: string[] = [];
    for (const key in knowledgeBase) {
        if (knowledgeBase.hasOwnProperty(key)) {
            allSummaries.push(`---
Fonte: ${key}
Resumo: ${knowledgeBase[key].summary}
---`);
        }
    }

    if (allSummaries.length > 0) {
        const knowledgeContext = `## BASE DE CONHECIMENTO INJETADA (INJEST)
Este contexto foi extraído e sumarizado automaticamente dos arquivos na pasta 'injest/'. Use-o como conhecimento de fundo para todas as tarefas.

${allSummaries.join('\n')}`;

        // Injetar no contextCarryover para ser usado pelo PromptEngineer
        updateContextCarryover({ injestKnowledge: knowledgeContext }, cwd);
        console.log(`[INJEST] ${allSummaries.length} resumo(s) injetado(s) no contexto do AGI.`);
    }
}

// Exemplo de uso (para ser chamado no orchestrator-v2.ts)
// injestKnowledge(process.cwd());

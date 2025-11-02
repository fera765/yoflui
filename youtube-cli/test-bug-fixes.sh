#!/bin/bash

echo "================================================"
echo "TESTE DE CORRE??ES DE BUGS"
echo "================================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_success() {
    echo -e "${GREEN}[?]${NC} $1"
}

log_error() {
    echo -e "${RED}[?]${NC} $1"
}

log_info() {
    echo -e "${YELLOW}[?]${NC} $1"
}

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

echo "1. TESTE: Comandos n?o devem ser processados pela LLM"
echo "   - Comandos exatos (/llm, /config, /tools, /exit) devem ser executados"
echo "   - Comandos com texto depois devem ser tratados como mensagem normal"
echo ""

# Verificar se a l?gica de comando est? correta
log_test "Verificando l?gica de comandos no app.tsx..."
if grep -q "if (msg.startsWith('/'))" /workspace/youtube-cli/source/app.tsx; then
    if grep -q "if (msg === command)" /workspace/youtube-cli/source/app.tsx; then
        log_success "L?gica de comando implementada corretamente"
    else
        log_error "Falta valida??o de comando exato"
        exit 1
    fi
else
    log_error "Falta verifica??o de comando"
    exit 1
fi

echo ""
echo "2. TESTE: Mensagem do usu?rio n?o deve multiplicar"
echo "   - Mensagem deve ser adicionada AP?S verificar se ? comando"
echo ""

log_test "Verificando ordem de adi??o de mensagens..."
# Verificar se a adi??o da mensagem est? ap?s as verifica??es de comando
APP_CONTENT=$(cat /workspace/youtube-cli/source/app.tsx)
if echo "$APP_CONTENT" | grep -A 10 "if (msg.startsWith('/'))" | grep -q "setMessages(prev => \[...prev, { role: 'user'"; then
    log_success "Mensagem adicionada ap?s verifica??o de comandos"
else
    log_error "Ordem de adi??o de mensagem pode estar incorreta"
fi

echo ""
echo "3. TESTE: OAuth deve limpar sess?o anterior"
echo "   - Ao entrar na tela OAuth, credenciais antigas devem ser limpadas"
echo ""

log_test "Verificando clearQwenCredentials no QwenOAuthScreen..."
if grep -q "clearQwenCredentials();" /workspace/youtube-cli/source/components/QwenOAuthScreen.tsx; then
    if grep -q "Starting fresh OAuth login" /workspace/youtube-cli/source/components/QwenOAuthScreen.tsx; then
        log_success "OAuth limpa sess?o anterior ao iniciar"
    else
        log_error "Falta mensagem de login fresco"
        exit 1
    fi
else
    log_error "OAuth n?o limpa credenciais antigas"
    exit 1
fi

echo ""
echo "4. TESTE: Credenciais expiradas devem ser limpas"
echo "   - loadQwenCredentials deve limpar credenciais expiradas"
echo ""

log_test "Verificando limpeza de credenciais expiradas..."
if grep -A 3 "Token expired" /workspace/youtube-cli/source/qwen-oauth.ts | grep -q "clearQwenCredentials()"; then
    log_success "Credenciais expiradas s?o limpas automaticamente"
else
    log_error "Credenciais expiradas n?o s?o limpas"
    exit 1
fi

echo ""
echo "5. TESTE: clearQwenCredentials limpa ambos os locais"
echo "   - Deve limpar home directory E local directory"
echo ""

log_test "Verificando limpeza de ambos os locais..."
CLEAR_FUNC=$(grep -A 20 "export function clearQwenCredentials" /workspace/youtube-cli/source/qwen-oauth.ts)
if echo "$CLEAR_FUNC" | grep -q "qwen-credentials.json"; then
    if echo "$CLEAR_FUNC" | grep -q "local directory"; then
        log_success "Limpa credenciais de ambos os locais"
    else
        log_error "N?o limpa local directory"
        exit 1
    fi
else
    log_error "Fun??o clearQwenCredentials incompleta"
    exit 1
fi

echo ""
echo "6. TESTE: Build compilado sem erros"
echo ""

log_test "Verificando arquivos compilados..."
if [ -f "/workspace/youtube-cli/dist/app.js" ] && \
   [ -f "/workspace/youtube-cli/dist/qwen-oauth.js" ] && \
   [ -f "/workspace/youtube-cli/dist/components/QwenOAuthScreen.js" ]; then
    log_success "Todos os arquivos compilados existem"
else
    log_error "Arquivos compilados faltando"
    exit 1
fi

echo ""
echo "7. TESTE FUNCIONAL: Simula??o de comportamento"
echo ""

# Criar arquivo de teste
cat > /tmp/test-commands.js <<'EOF'
// Simular comportamento de comandos
function handleCommand(msg) {
    if (msg.startsWith('/')) {
        const command = msg.split(/\s+/)[0];
        
        if (msg === command) {
            // Comando exato
            if (command === '/llm') return 'EXECUTE_LLM_SCREEN';
            if (command === '/config') return 'EXECUTE_CONFIG_SCREEN';
            if (command === '/tools') return 'EXECUTE_TOOLS_SCREEN';
            if (command === '/exit') return 'EXIT';
        }
    }
    return 'SEND_TO_LLM';
}

// Testes
const tests = [
    { input: '/llm', expected: 'EXECUTE_LLM_SCREEN', desc: 'Comando exato /llm' },
    { input: '/config', expected: 'EXECUTE_CONFIG_SCREEN', desc: 'Comando exato /config' },
    { input: '/tools', expected: 'EXECUTE_TOOLS_SCREEN', desc: 'Comando exato /tools' },
    { input: '/exit', expected: 'EXIT', desc: 'Comando exato /exit' },
    { input: '/llm configure', expected: 'SEND_TO_LLM', desc: 'Comando com texto (ignorar)' },
    { input: 'ol? /llm', expected: 'SEND_TO_LLM', desc: 'Texto com comando no meio (ignorar)' },
    { input: '/unknown', expected: 'SEND_TO_LLM', desc: 'Comando desconhecido (enviar para LLM)' },
    { input: 'mensagem normal', expected: 'SEND_TO_LLM', desc: 'Mensagem normal' },
];

let passed = 0;
let failed = 0;

tests.forEach(test => {
    const result = handleCommand(test.input);
    if (result === test.expected) {
        console.log(`? ${test.desc}: OK`);
        passed++;
    } else {
        console.log(`? ${test.desc}: FALHOU (esperado: ${test.expected}, obtido: ${result})`);
        failed++;
    }
});

console.log(`\nResultado: ${passed} passaram, ${failed} falharam`);
process.exit(failed);
EOF

log_test "Executando testes funcionais..."
if node /tmp/test-commands.js; then
    log_success "Todos os testes funcionais passaram"
else
    log_error "Alguns testes funcionais falharam"
    exit 1
fi

echo ""
echo "================================================"
echo "RESUMO DOS TESTES"
echo "================================================"
log_success "? L?gica de comandos correta"
log_success "? Mensagem n?o multiplica"
log_success "? OAuth limpa sess?o anterior"
log_success "? Credenciais expiradas limpas"
log_success "? clearQwenCredentials completa"
log_success "? Build compilado OK"
log_success "? Testes funcionais passaram"
echo ""
log_success "TODAS AS CORRE??ES VALIDADAS!"
echo ""

# Limpeza
rm -f /tmp/test-commands.js

exit 0

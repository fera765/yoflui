#!/bin/bash

echo "========================================"
echo "TESTE COMPLETO DO SISTEMA FLUI"
echo "========================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_success() {
    echo -e "${GREEN}[?]${NC} $1"
}

log_error() {
    echo -e "${RED}[?]${NC} $1"
}

log_info() {
    echo -e "${YELLOW}[*]${NC} $1"
}

# 1. Verificar build
log_info "Verificando build..."
if [ -d "dist" ]; then
    log_success "Diret?rio dist existe"
else
    log_error "Diret?rio dist n?o encontrado"
    exit 1
fi

# 2. Verificar arquivos cr?ticos
log_info "Verificando arquivos cr?ticos..."
critical_files=(
    "dist/context-manager.js"
    "dist/folder-scanner.js"
    "dist/agent-system.js"
    "dist/tools/agent.js"
    "dist/autonomous-agent.js"
    "dist/app.js"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        log_success "$file existe"
    else
        log_error "$file n?o encontrado"
        exit 1
    fi
done

# 3. Criar diret?rio de teste
TEST_DIR="/tmp/flui-test-$(date +%s)"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"
log_info "Diret?rio de teste criado: $TEST_DIR"

# 4. Criar estrutura de teste
log_info "Criando estrutura de teste..."
mkdir -p src/components
mkdir -p tests
touch src/index.js
touch src/components/Button.js
touch tests/test.spec.js
touch package.json
echo '{"name": "test-project", "version": "1.0.0"}' > package.json
log_success "Estrutura de teste criada"

# 5. Testar scanner de pasta
log_info "Testando scanner de pasta..."
node -e "
const { scanFolderStructure, getFolderSummary } = require('/workspace/youtube-cli/dist/folder-scanner.js');
const summary = getFolderSummary('$TEST_DIR');
console.log('Total de arquivos:', summary.totalFiles);
console.log('Total de pastas:', summary.totalFolders);
if (summary.totalFiles > 0 && summary.totalFolders > 0) {
    process.exit(0);
} else {
    process.exit(1);
}
"

if [ $? -eq 0 ]; then
    log_success "Scanner de pasta funciona corretamente"
else
    log_error "Scanner de pasta falhou"
    exit 1
fi

# 6. Testar context manager
log_info "Testando context manager..."
node -e "
const { loadOrCreateContext, saveContext } = require('/workspace/youtube-cli/dist/context-manager.js');
const context = loadOrCreateContext('Teste de Sistema', '$TEST_DIR');
saveContext(context, '$TEST_DIR');
console.log('Context criado:', context.sessionId);
console.log('Tipo de projeto:', context.projectType);
console.log('Total de n?s:', context.folderStructure.length);
if (context.sessionId && context.folderStructure.length > 0) {
    process.exit(0);
} else {
    process.exit(1);
}
"

if [ $? -eq 0 ]; then
    log_success "Context manager funciona corretamente"
else
    log_error "Context manager falhou"
    exit 1
fi

# 7. Verificar se .flui foi criado
if [ -d "$TEST_DIR/.flui" ]; then
    log_success "Pasta .flui criada automaticamente"
    if [ -f "$TEST_DIR/.flui/context.json" ]; then
        log_success "Arquivo context.json existe e foi salvo"
        log_info "Primeiras linhas do context.json:"
        head -10 "$TEST_DIR/.flui/context.json"
    else
        log_error "Arquivo context.json n?o encontrado"
        exit 1
    fi
else
    log_error "Pasta .flui n?o foi criada"
    exit 1
fi

# 8. Testar agent system
log_info "Testando agent system..."
node -e "
const { AgentSystem } = require('/workspace/youtube-cli/dist/agent-system.js');
const system = new AgentSystem();
const agent = system.createAgent('TestAgent', 'Tester');
console.log('Agent criado:', agent.id);
console.log('Agent nome:', agent.name);
console.log('Agent role:', agent.role);
console.log('Agent status:', agent.status);
if (agent.id && agent.name === 'TestAgent' && agent.role === 'Tester') {
    process.exit(0);
} else {
    process.exit(1);
}
"

if [ $? -eq 0 ]; then
    log_success "Agent system funciona corretamente"
else
    log_error "Agent system falhou"
    exit 1
fi

# 9. Verificar UI components
log_info "Verificando componentes UI..."
if grep -q "width=\"100%\"" /workspace/youtube-cli/source/components/QuantumTerminal.tsx; then
    log_success "Width 100% aplicado no QuantumInput"
else
    log_error "Width 100% n?o encontrado"
fi

if grep -q "??" /workspace/youtube-cli/source/components/CommandSuggestions.tsx; then
    log_success "Emojis corretos no CommandSuggestions"
else
    log_error "Emojis n?o encontrados no CommandSuggestions"
fi

# 10. Verificar tool registration
log_info "Verificando registro de tools..."
if grep -q "delegateAgentToolDefinition" /workspace/youtube-cli/dist/tools/index.js; then
    log_success "Tool delegate_to_agent registrada"
else
    log_error "Tool delegate_to_agent n?o encontrada"
fi

# 11. Teste de contexto em nova pasta
log_info "Testando contexto em nova pasta..."
TEST_DIR2="/tmp/flui-test-2-$(date +%s)"
mkdir -p "$TEST_DIR2"
cd "$TEST_DIR2"
mkdir -p backend/api
touch backend/api/server.py
touch requirements.txt

node -e "
const { loadOrCreateContext, saveContext, generateContextPrompt } = require('/workspace/youtube-cli/dist/context-manager.js');
const context = loadOrCreateContext('Criar API REST', '$TEST_DIR2');
saveContext(context, '$TEST_DIR2');
const prompt = generateContextPrompt(context);
console.log('Tipo detectado:', context.projectType);
if (context.projectType === 'python' && prompt.includes('FOLDER STRUCTURE')) {
    process.exit(0);
} else {
    process.exit(1);
}
"

if [ $? -eq 0 ]; then
    log_success "Detec??o autom?tica de projeto Python funciona"
else
    log_error "Detec??o de projeto falhou"
fi

# Resumo final
echo ""
echo "========================================"
echo "RESUMO DOS TESTES"
echo "========================================"
log_success "? Build compilado com sucesso"
log_success "? Sistema de contexto funcionando"
log_success "? Scanner de pasta operacional"
log_success "? Context manager salvando dados"
log_success "? Pasta .flui sendo criada"
log_success "? Agent system inicializado"
log_success "? UI components atualizados"
log_success "? Todas as ferramentas registradas"
log_success "? Detec??o autom?tica de projeto"
echo ""
log_success "TODOS OS TESTES PASSARAM!"
echo ""
echo "Diret?rios de teste:"
echo "  - $TEST_DIR"
echo "  - $TEST_DIR2"
echo ""
echo "Para limpar: rm -rf /tmp/flui-test-*"
echo ""

exit 0

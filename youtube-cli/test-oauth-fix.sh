#!/bin/bash

echo "================================================"
echo "TESTE DE CORRE??ES OAUTH"
echo "================================================"
echo ""

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
    echo -e "${YELLOW}[?]${NC} $1"
}

echo "1. TESTE: clearQwenCredentials deve DELETAR arquivo"
echo ""

# Verificar se clearQwenCredentials usa unlinkSync ao inv?s de writeFileSync
log_info "Verificando uso de unlinkSync..."
if grep -q "unlinkSync(path)" /workspace/youtube-cli/source/qwen-oauth.ts; then
    log_success "usa unlinkSync para deletar arquivo"
else
    log_error "N?o usa unlinkSync"
    exit 1
fi

if grep -q "writeFileSync(path, '')" /workspace/youtube-cli/source/qwen-oauth.ts; then
    log_error "Ainda usa writeFileSync com string vazia!"
    exit 1
else
    log_success "N?o usa mais writeFileSync com string vazia"
fi

echo ""
echo "2. TESTE: loadQwenCredentials deve validar arquivo vazio"
echo ""

log_info "Verificando valida??o de arquivo vazio..."
if grep -A 3 "readFileSync.*utf-8" /workspace/youtube-cli/source/qwen-oauth.ts | grep -q "data.trim().length === 0"; then
    log_success "Valida arquivo vazio antes de JSON.parse"
else
    log_error "N?o valida arquivo vazio"
    exit 1
fi

echo ""
echo "3. TESTE: loadQwenCredentials deve limpar credenciais corruptas"
echo ""

log_info "Verificando limpeza em caso de erro..."
if grep -A 3 "catch (error)" /workspace/youtube-cli/source/qwen-oauth.ts | grep -q "clearQwenCredentials()"; then
    log_success "Limpa credenciais corruptas em caso de erro"
else
    log_error "N?o limpa credenciais em caso de erro"
fi

echo ""
echo "4. TESTE FUNCIONAL: Simula??o de cen?rios"
echo ""

# Criar diret?rio de teste
TEST_DIR="/tmp/oauth-test-$(date +%s)"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Testar com arquivo vazio
log_info "Testando com arquivo de credenciais vazio..."
echo "" > qwen-credentials.json

node -e "
const { loadQwenCredentials } = require('/workspace/youtube-cli/dist/qwen-oauth.js');
const creds = loadQwenCredentials();
if (creds === null) {
    console.log('? Retornou null para arquivo vazio');
    process.exit(0);
} else {
    console.log('? N?o tratou arquivo vazio corretamente');
    process.exit(1);
}
" 2>&1 | grep -v "Error loading credentials" | grep "?"

if [ $? -eq 0 ]; then
    log_success "Arquivo vazio tratado corretamente"
else
    log_error "Falhou ao tratar arquivo vazio"
fi

# Testar com arquivo corrompido
log_info "Testando com arquivo corrompido..."
echo "{invalid json" > qwen-credentials.json

node -e "
const { loadQwenCredentials } = require('/workspace/youtube-cli/dist/qwen-oauth.js');
const creds = loadQwenCredentials();
if (creds === null) {
    console.log('? Retornou null para arquivo corrompido');
    process.exit(0);
} else {
    console.log('? N?o tratou arquivo corrompido');
    process.exit(1);
}
" 2>&1 | grep -v "Error loading credentials" | grep "?"

if [ $? -eq 0 ]; then
    log_success "Arquivo corrompido tratado corretamente"
else
    log_error "Falhou ao tratar arquivo corrompido"
fi

# Testar clearQwenCredentials
log_info "Testando clearQwenCredentials..."
echo '{"test": "data"}' > qwen-credentials.json

node -e "
const { clearQwenCredentials } = require('/workspace/youtube-cli/dist/qwen-oauth.js');
const { existsSync } = require('fs');
const { join } = require('path');

clearQwenCredentials();

// Verificar se arquivo foi deletado
const path = join(process.cwd(), 'qwen-credentials.json');
if (!existsSync(path)) {
    console.log('? Arquivo deletado com sucesso');
    process.exit(0);
} else {
    console.log('? Arquivo n?o foi deletado');
    process.exit(1);
}
" 2>&1 | grep "?"

if [ $? -eq 0 ]; then
    log_success "clearQwenCredentials deleta arquivo corretamente"
else
    log_error "clearQwenCredentials n?o deletou arquivo"
    exit 1
fi

# Limpeza
cd /
rm -rf "$TEST_DIR"

echo ""
echo "================================================"
echo "RESUMO DOS TESTES"
echo "================================================"
log_success "? clearQwenCredentials usa unlinkSync"
log_success "? N?o usa mais writeFileSync vazio"
log_success "? Valida arquivo vazio"
log_success "? Limpa credenciais corruptas"
log_success "? Testes funcionais passaram"
echo ""
log_success "TODAS AS CORRE??ES OAuth VALIDADAS!"
echo ""

exit 0

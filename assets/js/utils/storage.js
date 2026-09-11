/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Gerenciador de Armazenamento Local (LocalStorage)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Gerencia:
 *   1. Dados Corporativos (Empresa, Colaborador, Cargo)
 *   2. Histórico de Simulações Recentes (com parâmetros e resultados)
 * ═══════════════════════════════════════════════════════════════════════
 */

const STORAGE_KEYS = {
    EMPRESA: 'rhub_dados_empresa',
    HISTORICO: 'rhub_historico_calculos',
};

const MAX_HISTORICO_ITEMS = 15;

/**
 * Retorna os dados corporativos salvos.
 */
export function getDadosCorporativos() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.EMPRESA);
        if (!raw) return { empresa: '', colaborador: '', cargo: '' };
        return JSON.parse(raw);
    } catch {
        return { empresa: '', colaborador: '', cargo: '' };
    }
}

/**
 * Salva os dados corporativos.
 */
export function salvarDadosCorporativos(dados) {
    try {
        localStorage.setItem(STORAGE_KEYS.EMPRESA, JSON.stringify({
            empresa: (dados.empresa || '').trim(),
            colaborador: (dados.colaborador || '').trim(),
            cargo: (dados.cargo || '').trim()
        }));
        return true;
    } catch {
        return false;
    }
}

/**
 * Retorna o histórico de simulações salvo.
 */
export function getHistoricoCalculos() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.HISTORICO);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

/**
 * Adiciona uma nova simulação ao histórico.
 */
export function adicionarAoHistorico({ modulo, titulo, resumoPrincipal, valorPrincipal, params }) {
    try {
        const historico = getHistoricoCalculos();
        const agora = new Date();
        const item = {
            id: 'sim_' + Date.now(),
            dataHora: agora.toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }),
            timestamp: agora.getTime(),
            modulo,
            titulo,
            resumoPrincipal,
            valorPrincipal,
            params
        };

        // Adiciona no início
        historico.unshift(item);

        // Limita a quantidade máxima
        if (historico.length > MAX_HISTORICO_ITEMS) {
            historico.splice(MAX_HISTORICO_ITEMS);
        }

        localStorage.setItem(STORAGE_KEYS.HISTORICO, JSON.stringify(historico));
        return item;
    } catch (err) {
        console.error('Erro ao salvar no histórico:', err);
        return null;
    }
}

/**
 * Remove um item do histórico pelo ID.
 */
export function removerDoHistorico(id) {
    try {
        const historico = getHistoricoCalculos().filter(item => item.id !== id);
        localStorage.setItem(STORAGE_KEYS.HISTORICO, JSON.stringify(historico));
        return historico;
    } catch {
        return [];
    }
}

/**
 * Limpa todo o histórico de simulações.
 */
export function limparHistorico() {
    try {
        localStorage.removeItem(STORAGE_KEYS.HISTORICO);
        return true;
    } catch {
        return false;
    }
}

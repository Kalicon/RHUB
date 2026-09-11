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

/**
 * Exporta todos os dados e histórico como arquivo JSON para download.
 */
export function exportarBackupJSON() {
    try {
        const backup = {
            rhubVersion: '5.1.0',
            dataExportacao: new Date().toISOString(),
            dadosCorporativos: getDadosCorporativos(),
            historicoCalculos: getHistoricoCalculos()
        };

        const jsonStr = JSON.stringify(backup, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RHUB_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
    } catch (err) {
        console.error('Falha ao exportar backup JSON:', err);
        return false;
    }
}

/**
 * Importa e restaura dados a partir de uma string JSON.
 * @param {string} jsonString
 * @returns {{ success: boolean, message: string, countHistorico?: number }}
 */
export function importarBackupJSON(jsonString) {
    try {
        if (!jsonString || typeof jsonString !== 'string') {
            throw new Error('Arquivo vazio ou formato inválido.');
        }

        const data = JSON.parse(jsonString);

        if (!data || typeof data !== 'object') {
            throw new Error('JSON não contém um objeto válido.');
        }

        let count = 0;

        if (data.dadosCorporativos && typeof data.dadosCorporativos === 'object') {
            salvarDadosCorporativos(data.dadosCorporativos);
        }

        if (Array.isArray(data.historicoCalculos)) {
            localStorage.setItem(STORAGE_KEYS.HISTORICO, JSON.stringify(data.historicoCalculos.slice(0, MAX_HISTORICO_ITEMS)));
            count = data.historicoCalculos.length;
        }

        return {
            success: true,
            message: `Backup restaurado com sucesso! (${count} simulações)`,
            countHistorico: count
        };
    } catch (err) {
        console.error('Falha ao importar backup:', err);
        return {
            success: false,
            message: 'Erro ao importar backup: ' + (err.message || 'Arquivo corrompido')
        };
    }
}


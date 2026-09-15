/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Gestor de Regras de Convenções e Acordos Coletivos (CCT / ACT)
 * Permite configurar regras sindicais que prevalecem sobre a CLT
 * (Art. 611-A da CLT — O negociado sobre o legislado)
 * ═══════════════════════════════════════════════════════════════════════
 */

const STORAGE_KEY = 'rhub_cct_profile';

export const CCT_CONFIG_PADRAO = {
    nomeSindicato: 'Padrão CLT (Sem Convenção Customizada)',
    ativo: false,
    pisoSalarial: 1412.00,
    adicionalNoturnoPercentual: 20.0, // CLT Art. 73 padrão: 20%
    horasNoturnasReduzidas: true,     // 52min30s
    sabadoComoDsr: false,             // Se true, sábado conta no divisor/multiplicador do DSR
    tipoAts: 'NENHUM',                // 'NENHUM' | 'ANUENIO' | 'TRIENIO' | 'QUINQUENIO'
    percentualAtsPorPeriodo: 0.0,     // Ex: 1% ao ano, 5% a cada 5 anos
    adicionalQuebraCaixa: 0.0,        // % sobre salário base (ex: 10%)
    horasExtras50Percentual: 50.0,    // Convenção pode ter 60%, 70%, 80%
    horasExtras100Percentual: 100.0   // Domingos e feriados
};

/**
 * Obtém a configuração ativa de CCT do localStorage
 * @returns {object}
 */
export function obterConfigCCT() {
    try {
        if (typeof localStorage !== 'undefined') {
            const salvo = localStorage.getItem(STORAGE_KEY);
            if (salvo) {
                const parsed = JSON.parse(salvo);
                return { ...CCT_CONFIG_PADRAO, ...parsed };
            }
        }
    } catch (e) {
        // Silencioso em ambiente de teste
    }
    return { ...CCT_CONFIG_PADRAO };
}

/**
 * Salva a configuração de CCT no localStorage
 * @param {object} novaConfig 
 * @returns {boolean}
 */
export function salvarConfigCCT(novaConfig) {
    try {
        if (typeof localStorage !== 'undefined') {
            const atual = obterConfigCCT();
            const mesclado = { ...atual, ...novaConfig };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mesclado));
            return true;
        }
    } catch (e) {
        return false;
    }
    return false;
}

/**
 * Restaura os parâmetros originais da CLT
 */
export function restaurarPadraoCLT() {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        }
    } catch (e) {
        return false;
    }
    return false;
}

/**
 * Calcula Adicional por Tempo de Serviço (ATS)
 * @param {number} salarioBase 
 * @param {number} anosServico 
 * @param {object} config 
 * @returns {number}
 */
export function calcularATS(salarioBase, anosServico, config = obterConfigCCT()) {
    if (!config.ativo || !anosServico || anosServico <= 0) return 0;

    let periodos = 0;
    if (config.tipoAts === 'ANUENIO') periodos = Math.floor(anosServico);
    else if (config.tipoAts === 'TRIENIO') periodos = Math.floor(anosServico / 3);
    else if (config.tipoAts === 'QUINQUENIO') periodos = Math.floor(anosServico / 5);

    const percentualTotal = (periodos * config.percentualAtsPorPeriodo) / 100;
    return salarioBase * percentualTotal;
}

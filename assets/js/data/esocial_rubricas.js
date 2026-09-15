/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Tabela de Rubricas eSocial (Eventos S-1010 e S-1200)
 * Mapeamento oficial de incidências fiscais: CP (INSS), FGTS e IRRF
 * ═══════════════════════════════════════════════════════════════════════
 */

export const TABELA_RUBRICAS_ESOCIAL = {
    '1000': {
        codigo: '1000',
        nome: 'Salário Base / Vencimento Mensal',
        tipo: 'PROVENTO',
        incidencias: {
            inss: { codigo: '11', descricao: 'Base de cálculo das contribuições sociais da Previdência Social' },
            fgts: { codigo: '11', descricao: 'Base de cálculo do FGTS mensal' },
            irrf: { codigo: '11', descricao: 'Rendimento tributável - Remuneração mensal' }
        },
        fundamento: 'Art. 457 da CLT e Lei 8.212/1991'
    },
    '1003': {
        codigo: '1003',
        nome: 'Horas Extras (50%)',
        tipo: 'PROVENTO',
        incidencias: {
            inss: { codigo: '11', descricao: 'Base de cálculo integral do INSS' },
            fgts: { codigo: '11', descricao: 'Base de cálculo do FGTS mensal' },
            irrf: { codigo: '11', descricao: 'Rendimento tributável - Remuneração mensal' }
        },
        fundamento: 'Art. 59 da CLT e Art. 7º, XVI da CF/88'
    },
    '1004': {
        codigo: '1004',
        nome: 'Horas Extras (100%)',
        tipo: 'PROVENTO',
        incidencias: {
            inss: { codigo: '11', descricao: 'Base de cálculo integral do INSS' },
            fgts: { codigo: '11', descricao: 'Base de cálculo do FGTS mensal' },
            irrf: { codigo: '11', descricao: 'Rendimento tributável - Remuneração mensal' }
        },
        fundamento: 'Art. 59 da CLT e Súmula 146 do TST'
    },
    '1020': {
        codigo: '1020',
        nome: 'Descanso Semanal Remunerado (DSR) sobre Variáveis',
        tipo: 'PROVENTO',
        incidencias: {
            inss: { codigo: '11', descricao: 'Base de cálculo integral do INSS' },
            fgts: { codigo: '11', descricao: 'Base de cálculo do FGTS mensal' },
            irrf: { codigo: '11', descricao: 'Rendimento tributável - Remuneração mensal' }
        },
        fundamento: 'Lei 605/1949 e Súmula 172 do TST'
    },
    '1030': {
        codigo: '1030',
        nome: 'Adicional Noturno (20% CLT)',
        tipo: 'PROVENTO',
        incidencias: {
            inss: { codigo: '11', descricao: 'Base de cálculo integral do INSS' },
            fgts: { codigo: '11', descricao: 'Base de cálculo do FGTS mensal' },
            irrf: { codigo: '11', descricao: 'Rendimento tributável - Remuneração mensal' }
        },
        fundamento: 'Art. 73 da CLT e Súmula 60 do TST'
    },
    '1040': {
        codigo: '1040',
        nome: 'Adicional de Periculosidade (30%)',
        tipo: 'PROVENTO',
        incidencias: {
            inss: { codigo: '11', descricao: 'Base de cálculo integral do INSS' },
            fgts: { codigo: '11', descricao: 'Base de cálculo do FGTS mensal' },
            irrf: { codigo: '11', descricao: 'Rendimento tributável - Remuneração mensal' }
        },
        fundamento: 'Art. 193 da CLT'
    },
    '1050': {
        codigo: '1050',
        nome: 'Adicional de Insalubridade (10%, 20% ou 40%)',
        tipo: 'PROVENTO',
        incidencias: {
            inss: { codigo: '11', descricao: 'Base de cálculo integral do INSS' },
            fgts: { codigo: '11', descricao: 'Base de cálculo do FGTS mensal' },
            irrf: { codigo: '11', descricao: 'Rendimento tributável - Remuneração mensal' }
        },
        fundamento: 'Art. 192 da CLT e Súmula Vinculante 4 STF'
    },
    '1080': {
        codigo: '1080',
        nome: '13º Salário (Gratificação Natalina)',
        tipo: 'PROVENTO',
        incidencias: {
            inss: { codigo: '12', descricao: 'Base exclusiva de 13º Salário (Folha Anual)' },
            fgts: { codigo: '12', descricao: 'Base de cálculo FGTS de 13º Salário' },
            irrf: { codigo: '12', descricao: 'Tributação exclusiva na fonte (Art. 700 RIR/2018)' }
        },
        fundamento: 'Lei 4.090/1962 e Lei 4.749/1965'
    },
    '1090': {
        codigo: '1090',
        nome: 'Férias Gozadas',
        tipo: 'PROVENTO',
        incidencias: {
            inss: { codigo: '11', descricao: 'Incidência de INSS mensal' },
            fgts: { codigo: '11', descricao: 'Incidência de FGTS mensal' },
            irrf: { codigo: '13', descricao: 'Tributação de férias em separado do mês' }
        },
        fundamento: 'Art. 129 ao 153 da CLT'
    },
    '1091': {
        codigo: '1091',
        nome: '1/3 Constitucional de Férias',
        tipo: 'PROVENTO',
        incidencias: {
            inss: { codigo: '11', descricao: 'Incide INSS s/ terço de férias gozadas (Tema 985 STF)' },
            fgts: { codigo: '11', descricao: 'Incidência de FGTS mensal' },
            irrf: { codigo: '13', descricao: 'Tributação de férias em separado do mês' }
        },
        fundamento: 'Art. 7º, XVII da CF/88 e Tema 985 STF'
    },
    '1500': {
        codigo: '1500',
        nome: 'Abono Pecuniário de Férias (Venda de 10 dias)',
        tipo: 'PROVENTO',
        incidencias: {
            inss: { codigo: '00', descricao: 'Não é base de cálculo (Isento)' },
            fgts: { codigo: '00', descricao: 'Não é base de cálculo (Isento)' },
            irrf: { codigo: '00', descricao: 'Isento de IRRF (Súmula 125 STJ)' }
        },
        fundamento: 'Art. 143 da CLT e Súmula 125 STJ'
    },
    '1600': {
        codigo: '1600',
        nome: 'Participação nos Lucros e Resultados (PLR)',
        tipo: 'PROVENTO',
        incidencias: {
            inss: { codigo: '00', descricao: 'Não incide contribuição previdenciária' },
            fgts: { codigo: '00', descricao: 'Não incide FGTS' },
            irrf: { codigo: '31', descricao: 'Tributação exclusiva na fonte - Tabela progressiva PLR' }
        },
        fundamento: 'Lei 10.101/2000'
    },
    '1700': {
        codigo: '1700',
        nome: 'Ajuda de Custo Teletrabalho / Home Office',
        tipo: 'PROVENTO',
        incidencias: {
            inss: { codigo: '00', descricao: 'Natureza indenizatória (Não incide INSS)' },
            fgts: { codigo: '00', descricao: 'Não incide FGTS' },
            irrf: { codigo: '00', descricao: 'Não tributável (Caráter indenizatório)' }
        },
        fundamento: 'Art. 75-D, parágrafo único e Art. 457, § 2º da CLT'
    },
    '9201': {
        codigo: '9201',
        nome: 'INSS — Contribuição Previdenciária do Empregado',
        tipo: 'DESCONTO',
        incidencias: {
            inss: { codigo: '00', descricao: 'Desconto legal obrigatório' },
            fgts: { codigo: '00', descricao: 'Não aplicável' },
            irrf: { codigo: '00', descricao: 'Dedução legal da base de cálculo do IRRF' }
        },
        fundamento: 'Art. 28 da Lei 8.212/1991 e Emenda Constitucional 103/2019'
    },
    '9214': {
        codigo: '9214',
        nome: 'IRRF — Imposto sobre a Renda Retido na Fonte',
        tipo: 'DESCONTO',
        incidencias: {
            inss: { codigo: '00', descricao: 'Não aplicável' },
            fgts: { codigo: '00', descricao: 'Não aplicável' },
            irrf: { codigo: '00', descricao: 'Retenção tributária federal devida à Receita Federal' }
        },
        fundamento: 'Art. 7º da Lei 7.713/1988 e RIR/2018'
    },
    '9220': {
        codigo: '9220',
        nome: 'Desconto de Vale-Transporte (até 6%)',
        tipo: 'DESCONTO',
        incidencias: {
            inss: { codigo: '00', descricao: 'Desconto autorizado por lei' },
            fgts: { codigo: '00', descricao: 'Não aplicável' },
            irrf: { codigo: '00', descricao: 'Não dedutível do IRRF' }
        },
        fundamento: 'Art. 4º, parágrafo único da Lei 7.418/1985'
    },
    '9230': {
        codigo: '9230',
        nome: 'Desconto de Faltas e Atrasos Injustificados',
        tipo: 'DESCONTO',
        incidencias: {
            inss: { codigo: '11', descricao: 'Redutor da base de cálculo do INSS' },
            fgts: { codigo: '11', descricao: 'Redutor da base de cálculo do FGTS' },
            irrf: { codigo: '11', descricao: 'Redutor da base tributável do IRRF' }
        },
        fundamento: 'Art. 473 da CLT e Art. 6º da Lei 605/1949'
    }
};

/**
 * Consulta informações de uma rubrica pelo código
 * @param {string} codigo 
 * @returns {object|null}
 */
export function obterRubrica(codigo) {
    return TABELA_RUBRICAS_ESOCIAL[String(codigo)] || null;
}

/**
 * Retorna todas as rubricas cadastradas
 * @returns {Array<object>}
 */
export function listarTodasRubricas() {
    return Object.values(TABELA_RUBRICAS_ESOCIAL);
}

/**
 * Gera um elemento HTML em badge com tooltip explicativo do eSocial
 * @param {string} codigo 
 * @returns {string}
 */
export function renderizarBadgeEsocial(codigo) {
    const rubrica = TABELA_RUBRICAS_ESOCIAL[String(codigo)];
    if (!rubrica) return '';

    return `
        <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium 
                     bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
              title="Rubrica eSocial S-1010 [${rubrica.codigo}] — ${rubrica.nome}&#10;INSS: ${rubrica.incidencias.inss.codigo} | FGTS: ${rubrica.incidencias.fgts.codigo} | IRRF: ${rubrica.incidencias.irrf.codigo}&#10;Base: ${rubrica.fundamento}">
            <svg class="w-2.5 h-2.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            eSocial ${rubrica.codigo}
        </span>
    `;
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Módulo de Cálculo de Faltas e Atrasos (CLT)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Legislação Aplicada:
 *   • Art. 462 CLT — Desconto no salário por falta ao serviço
 *   • Art. 130 CLT — Tabela progressiva de perda de dias de férias
 *   • Lei 605/49, Art. 6º — Perda do DSR por falta injustificada
 *   • Súmula 366 TST — Tolerância de atraso (5 min/dia, 10 min diários)
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Tabela de impacto de faltas no período de férias (Art. 130 CLT).
 * Cada faixa define o número máximo de faltas injustificadas no
 * período aquisitivo e os dias de férias correspondentes.
 */
export const TABELA_FERIAS_FALTAS = [
    { maxFaltas: 5,  diasFerias: 30, label: 'Até 5 faltas → 30 dias de férias' },
    { maxFaltas: 14, diasFerias: 24, label: '6 a 14 faltas → 24 dias de férias' },
    { maxFaltas: 23, diasFerias: 18, label: '15 a 23 faltas → 18 dias de férias' },
    { maxFaltas: 32, diasFerias: 12, label: '24 a 32 faltas → 12 dias de férias' },
    { maxFaltas: Infinity, diasFerias: 0, label: 'Acima de 32 faltas → Perde o direito' },
];

/**
 * Retorna os dias de férias correspondentes com base nas faltas
 * injustificadas no período aquisitivo (Art. 130 CLT).
 *
 * @param {number} faltasNoPeriodo — Total de faltas injustificadas no período aquisitivo.
 * @returns {{ diasFerias: number, label: string, perdeuDireito: boolean }}
 */
export function consultarImpactoFerias(faltasNoPeriodo) {
    const faltas = Math.max(0, Math.floor(Number(faltasNoPeriodo) || 0));

    for (const faixa of TABELA_FERIAS_FALTAS) {
        if (faltas <= faixa.maxFaltas) {
            return {
                diasFerias: faixa.diasFerias,
                label: faixa.label,
                perdeuDireito: faixa.diasFerias === 0
            };
        }
    }

    return { diasFerias: 0, label: 'Acima de 32 faltas → Perde o direito', perdeuDireito: true };
}

/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  FUNÇÃO PRINCIPAL: Cálculo Completo de Faltas e Atrasos    │
 * └─────────────────────────────────────────────────────────────┘
 *
 * @param {Object} params
 * @param {number} params.salarioBase          — Salário mensal bruto.
 * @param {number} [params.divisorMensal=220]  — Carga horária mensal.
 * @param {number} params.diasFalta            — Dias de falta injustificada no mês.
 * @param {number} [params.horasAtraso=0]      — Horas de atraso no mês (decimal).
 * @param {number} [params.dsrAfetados=0]      — DSRs (domingos/feriados) perdidos na(s) semana(s) com falta.
 * @param {number} [params.faltasPeriodoAquisitivo=0] — Faltas acumuladas no período aquisitivo (para simular impacto em férias).
 *
 * @returns {Object} Resultado detalhado com descontos e impacto em férias.
 */
export function calcularFaltas({
    salarioBase,
    divisorMensal = 220,
    diasFalta,
    horasAtraso = 0,
    dsrAfetados = 0,
    faltasPeriodoAquisitivo = 0
}) {
    const salario  = Math.max(0, Number(salarioBase) || 0);
    const divisor  = Math.max(1, Number(divisorMensal) || 220);
    const faltas   = Math.max(0, Number(diasFalta) || 0);
    const atrasos  = Math.max(0, Number(horasAtraso) || 0);
    const dsrs     = Math.max(0, Number(dsrAfetados) || 0);
    const faltasPA = Math.max(0, Number(faltasPeriodoAquisitivo) || 0);

    // ── 1. Valor do Dia de Trabalho ────────────────────────────
    // Art. 462 CLT: Salário ÷ 30 (mês comercial)
    const valorDia = salario / 30;

    // ── 2. Valor da Hora de Trabalho ───────────────────────────
    const valorHora = salario / divisor;

    // ── 3. Desconto por Dias de Falta ──────────────────────────
    const descontoFaltas = valorDia * faltas;

    // ── 4. Desconto por Horas de Atraso ────────────────────────
    // Súmula 366 TST: Tolerância de 5 min por registro, máx 10 min/dia.
    // Aqui consideramos que o profissional já apurou as horas efetivas de atraso.
    const descontoAtrasos = valorHora * atrasos;

    // ── 5. Perda do DSR (Lei 605/49, Art. 6º) ─────────────────
    // O empregado que faltar injustificadamente perde o DSR da semana.
    const descontoDSR = valorDia * dsrs;

    // ── 6. Total de Descontos no Mês ───────────────────────────
    const totalDescontos = descontoFaltas + descontoAtrasos + descontoDSR;

    // ── 7. Salário Líquido Após Descontos (antes de INSS/IRRF)─
    const salarioAposDescontos = Math.max(0, salario - totalDescontos);

    // ── 8. Impacto em Férias (Art. 130 CLT) ────────────────────
    const impactoFerias = consultarImpactoFerias(faltasPA);

    // ── 9. Memória de Cálculo ──────────────────────────────────
    const memoriaCalculo = [
        {
            passo: 1,
            titulo: 'Valor do Dia de Trabalho',
            descricao: 'Art. 462 CLT — Salário ÷ 30 (mês comercial)',
            formula: `R$ ${salario.toFixed(2)} ÷ 30`,
            resultado: valorDia
        },
        {
            passo: 2,
            titulo: 'Desconto por Faltas',
            descricao: `${faltas} dia(s) de falta injustificada`,
            formula: `R$ ${valorDia.toFixed(2)} × ${faltas} dias`,
            resultado: descontoFaltas
        },
        {
            passo: 3,
            titulo: 'Desconto por Atrasos',
            descricao: `${atrasos.toFixed(2)} hora(s) de atraso apuradas`,
            formula: `R$ ${valorHora.toFixed(2)}/h × ${atrasos.toFixed(2)}h`,
            resultado: descontoAtrasos
        },
        {
            passo: 4,
            titulo: 'Perda do DSR',
            descricao: 'Lei 605/49 — Perda do repouso semanal na semana da falta',
            formula: `R$ ${valorDia.toFixed(2)} × ${dsrs} DSR(s)`,
            resultado: descontoDSR
        },
        {
            passo: 5,
            titulo: 'Total de Descontos no Mês',
            descricao: 'Faltas + Atrasos + DSR perdido',
            formula: `R$ ${descontoFaltas.toFixed(2)} + R$ ${descontoAtrasos.toFixed(2)} + R$ ${descontoDSR.toFixed(2)}`,
            resultado: totalDescontos
        },
        {
            passo: 6,
            titulo: 'Salário Após Descontos',
            descricao: 'Valor bruto antes de INSS e IRRF',
            formula: `R$ ${salario.toFixed(2)} − R$ ${totalDescontos.toFixed(2)}`,
            resultado: salarioAposDescontos
        }
    ];

    return {
        // Entradas
        salarioBase: salario,
        divisorMensal: divisor,
        diasFalta: faltas,
        horasAtraso: atrasos,
        dsrAfetados: dsrs,

        // Valores intermediários
        valorDia,
        valorHora,

        // Descontos
        descontoFaltas,
        descontoAtrasos,
        descontoDSR,
        totalDescontos,

        // Resultado
        salarioAposDescontos,

        // Impacto em férias
        impactoFerias,
        faltasPeriodoAquisitivo: faltasPA,

        // Auditoria
        memoriaCalculo
    };
}

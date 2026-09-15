/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Módulo de Equiparação Salarial & Passivo Trabalhista (CLT)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Fundamentação Legal:
 *   • Art. 461 da CLT (com redação da Lei 13.467/2017 e Lei 14.611/2023)
 *   • Súmula 6 do TST — Requisitos e ônus da prova na equiparação
 *   • Art. 7º, XXIX da CF/88 — Prescrição quinquenal (limite de 5 anos / 60 meses)
 *   • Lei 14.611/2023 — Igualdade Salarial entre Mulheres e Homens e multa do § 6º
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Calcula a diferença salarial entre o colaborador e o paradigma,
 * seus reflexos legais e o passivo trabalhista estimado.
 *
 * @param {Object} params
 * @param {number} params.salarioReclamante     — Salário mensal atual do colaborador (R$).
 * @param {number} params.salarioParadigma      — Salário mensal do paradigma na mesma função (R$).
 * @param {number} [params.mesesPeriodo=12]     — Meses apurados no período imprescrito (1 a 60 meses).
 * @param {boolean} [params.incluir13o=true]    — Calcular reflexos em 13º salário (1/12 por mês).
 * @param {boolean} [params.incluirFeriasTerco=true] — Calcular reflexos em férias + 1/3 constitucional.
 * @param {boolean} [params.incluirFGTS=true]   — Calcular reflexos em depósito de FGTS (8%).
 * @param {boolean} [params.incluirMultaFGTS=false] — Calcular multa rescisória de 40% sobre o FGTS apurado.
 * @param {boolean} [params.discriminacaoGenero=false] — Aplicar multa do Art. 461, § 6º CLT / Lei 14.611/23 (10x novo salário).
 *
 * @returns {Object} Demonstrativo detalhado do passivo, reflexos e memória de cálculo.
 */
export function calcularEquiparacao({
    salarioReclamante = 0,
    salarioParadigma = 0,
    mesesPeriodo = 12,
    incluir13o = true,
    incluirFeriasTerco = true,
    incluirFGTS = true,
    incluirMultaFGTS = false,
    discriminacaoGenero = false
}) {
    const sReclamante = Math.max(0, Number(salarioReclamante) || 0);
    const sParadigma = Math.max(0, Number(salarioParadigma) || 0);
    const meses = Math.min(60, Math.max(1, Number(mesesPeriodo) || 12));

    // 1. Diferença Salarial Mensal
    const diferencaMensal = Math.max(0, sParadigma - sReclamante);

    // 2. Diferença Salarial Nominal no Período
    const totalDiferencaNominal = diferencaMensal * meses;

    // 3. Reflexos em 13º Salário (1/12 avos por mês trabalhado)
    const reflexo13o = incluir13o ? (diferencaMensal / 12) * meses : 0;

    // 4. Reflexos em Férias + 1/3 Constitucional (4/3 da proporção mensal)
    const reflexoFeriasTerco = incluirFeriasTerco ? ((diferencaMensal / 12) * meses) * (4 / 3) : 0;

    // 5. Subtotal Remuneratório (Base de incidência do FGTS)
    const subtotalRemuneratorio = totalDiferencaNominal + reflexo13o + reflexoFeriasTerco;

    // 6. Encargos de FGTS (8%)
    const valorFGTS = incluirFGTS ? subtotalRemuneratorio * 0.08 : 0;

    // 7. Multa Rescisória de 40% do FGTS
    const valorMultaFGTS = (incluirFGTS && incluirMultaFGTS) ? valorFGTS * 0.40 : 0;

    // 8. Multa por Discriminação de Gênero / Raça (Lei 14.611/2023 & Art. 461, § 6º CLT)
    // Multa administrativa correspondente a 10 (dez) vezes o valor do novo salário devido
    const multaDiscriminacao = (discriminacaoGenero && diferencaMensal > 0) ? (sParadigma * 10) : 0;

    // 9. Total Geral do Passivo Trabalhista
    const passivoTotal = subtotalRemuneratorio + valorFGTS + valorMultaFGTS + multaDiscriminacao;

    // 10. Memória de Cálculo Auditável
    const memoriaCalculo = [
        {
            passo: 1,
            titulo: 'Diferença Salarial Mensal',
            descricao: 'Art. 461 CLT — Salário do paradigma deduzido do salário do colaborador.',
            formula: `R$ ${sParadigma.toFixed(2)} - R$ ${sReclamante.toFixed(2)}`,
            resultado: diferencaMensal
        },
        {
            passo: 2,
            titulo: `Diferença Nominal no Período (${meses} meses)`,
            descricao: 'Total das diferenças acumuladas ao longo dos meses apurados.',
            formula: `R$ ${diferencaMensal.toFixed(2)} × ${meses} meses`,
            resultado: totalDiferencaNominal
        },
        {
            passo: 3,
            titulo: 'Reflexos em 13º Salário',
            descricao: 'Integração das diferenças salariais nos avos de gratificação natalina.',
            formula: incluir13o ? `(R$ ${diferencaMensal.toFixed(2)} ÷ 12) × ${meses} avos` : 'Não selecionado (R$ 0,00)',
            resultado: reflexo13o
        },
        {
            passo: 4,
            titulo: 'Reflexos em Férias + 1/3 Constitucional',
            descricao: 'Art. 7º, XVII CF/88 — Integração da média de diferenças em férias e terço.',
            formula: incluirFeriasTerco ? `((R$ ${diferencaMensal.toFixed(2)} ÷ 12) × ${meses}) × 1,3333` : 'Não selecionado (R$ 0,00)',
            resultado: reflexoFeriasTerco
        },
        {
            passo: 5,
            titulo: 'Reflexos em Depósito de FGTS (8%)',
            descricao: 'Lei 8.036/90 — Recolhimento fundiário devido sobre proventos e reflexos.',
            formula: incluirFGTS ? `R$ ${subtotalRemuneratorio.toFixed(2)} × 8%` : 'Não selecionado (R$ 0,00)',
            resultado: valorFGTS
        }
    ];

    if (incluirMultaFGTS) {
        memoriaCalculo.push({
            passo: 6,
            titulo: 'Multa Rescisória de 40% sobre FGTS',
            descricao: 'Art. 18, § 1º Lei 8.036/90 — Indenização rescisória sobre os depósitos apurados.',
            formula: `R$ ${valorFGTS.toFixed(2)} × 40%`,
            resultado: valorMultaFGTS
        });
    }

    if (discriminacaoGenero) {
        memoriaCalculo.push({
            passo: memoriaCalculo.length + 1,
            titulo: 'Multa por Discriminação Salarial (Lei 14.611/2023)',
            descricao: 'Art. 461, § 6º CLT — 10 vezes o novo salário devido ao empregado discriminado.',
            formula: `10 × R$ ${sParadigma.toFixed(2)}`,
            resultado: multaDiscriminacao
        });
    }

    memoriaCalculo.push({
        passo: memoriaCalculo.length + 1,
        titulo: 'Passivo Trabalhista Total Estimado',
        descricao: 'Soma de diferenças, reflexos trabalhistas, FGTS e eventuais penalidades.',
        formula: `Soma de todas as rubricas apuradas`,
        resultado: passivoTotal
    });

    return {
        salarioReclamante: sReclamante,
        salarioParadigma: sParadigma,
        diferencaMensal,
        mesesPeriodo: meses,
        totalDiferencaNominal,
        reflexo13o,
        reflexoFeriasTerco,
        subtotalRemuneratorio,
        valorFGTS,
        valorMultaFGTS,
        multaDiscriminacao,
        passivoTotal,
        memoriaCalculo
    };
}

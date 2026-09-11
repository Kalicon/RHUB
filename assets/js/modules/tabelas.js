/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Tabelas Progressivas INSS e IRRF (Vigência 2024)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Referências:
 *   • INSS: Portaria Interministerial MPS/MF nº 2, de 11/01/2024
 *   • IRRF: Medida Provisória nº 1.206/2024 + IN RFB
 *
 * O INSS utiliza cálculo PROGRESSIVO por faixas (cada faixa incide
 * apenas sobre a parcela do salário que cai naquela faixa).
 * O IRRF utiliza cálculo com alíquota efetiva e parcela a deduzir.
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─── Tabela Progressiva do INSS 2024 ──────────────────────────────────
export const FAIXAS_INSS = [
    { limite: 1412.00,  aliquota: 0.075 },  // 7,5%
    { limite: 2666.68,  aliquota: 0.09  },  // 9%
    { limite: 4000.03,  aliquota: 0.12  },  // 12%
    { limite: 7786.02,  aliquota: 0.14  },  // 14%
];

// Teto máximo de contribuição do INSS
export const TETO_INSS = 7786.02;

// ─── Tabela Progressiva do IRRF 2024 ──────────────────────────────────
export const FAIXAS_IRRF = [
    { limite: 2259.20,  aliquota: 0.000, deducao: 0      },  // Isento
    { limite: 2826.65,  aliquota: 0.075, deducao: 169.44  },  // 7,5%
    { limite: 3751.05,  aliquota: 0.15,  deducao: 381.44  },  // 15%
    { limite: 4664.68,  aliquota: 0.225, deducao: 662.77  },  // 22,5%
    { limite: Infinity, aliquota: 0.275, deducao: 896.00  },  // 27,5%
];

// Valor de dedução por dependente no IRRF
export const DEDUCAO_DEPENDENTE_IRRF = 189.59;

/**
 * Calcula o INSS devido usando a tabela progressiva por faixas.
 *
 * Cada faixa incide APENAS sobre a parcela do salário que cai nela:
 *   Faixa 1: até R$ 1.412,00 → 7,5%
 *   Faixa 2: de R$ 1.412,01 até R$ 2.666,68 → 9%
 *   Faixa 3: de R$ 2.666,69 até R$ 4.000,03 → 12%
 *   Faixa 4: de R$ 4.000,04 até R$ 7.786,02 → 14%
 *
 * @param {number} baseCalculo — Remuneração bruta sujeita a INSS.
 * @returns {{ valor: number, aliquotaEfetiva: number, detalhamento: Array }}
 */
export function calcularINSS(baseCalculo) {
    const base = Math.max(0, Number(baseCalculo) || 0);
    let totalINSS = 0;
    let limiteAnterior = 0;
    const detalhamento = [];

    for (const faixa of FAIXAS_INSS) {
        if (base <= limiteAnterior) break;

        const baseNaFaixa = Math.min(base, faixa.limite) - limiteAnterior;
        const contribuicaoFaixa = baseNaFaixa * faixa.aliquota;

        detalhamento.push({
            de: limiteAnterior,
            ate: Math.min(base, faixa.limite),
            baseNaFaixa,
            aliquota: faixa.aliquota,
            contribuicao: contribuicaoFaixa
        });

        totalINSS += contribuicaoFaixa;
        limiteAnterior = faixa.limite;
    }

    return {
        valor: totalINSS,
        aliquotaEfetiva: base > 0 ? (totalINSS / base) * 100 : 0,
        detalhamento
    };
}

/**
 * Calcula o IRRF sobre a base de cálculo já deduzida de INSS e dependentes.
 *
 * Base IRRF = Remuneração Bruta − INSS − (N° Dependentes × R$ 189,59)
 *
 * @param {number} baseCalculo — Base após dedução de INSS e dependentes.
 * @returns {{ valor: number, aliquota: number, faixa: number }}
 */
export function calcularIRRF(baseCalculo) {
    const base = Math.max(0, Number(baseCalculo) || 0);

    for (let i = 0; i < FAIXAS_IRRF.length; i++) {
        const faixa = FAIXAS_IRRF[i];
        if (base <= faixa.limite) {
            const imposto = Math.max(0, (base * faixa.aliquota) - faixa.deducao);
            return {
                valor: imposto,
                aliquota: faixa.aliquota * 100,
                faixa: i + 1
            };
        }
    }

    // Fallback (última faixa = Infinity)
    const ultima = FAIXAS_IRRF[FAIXAS_IRRF.length - 1];
    return {
        valor: Math.max(0, (base * ultima.aliquota) - ultima.deducao),
        aliquota: ultima.aliquota * 100,
        faixa: FAIXAS_IRRF.length
    };
}

/**
 * Calcula o IRRF completo partindo do bruto, com INSS e dependentes.
 *
 * @param {number} brutoParcela — Valor bruto da verba tributável.
 * @param {number} numDependentes — Quantidade de dependentes para dedução.
 * @returns {{ inss: object, irrf: object, baseIRRF: number, liquido: number }}
 */
export function calcularDeducoesCompletas(brutoParcela, numDependentes = 0) {
    const bruto = Math.max(0, Number(brutoParcela) || 0);
    const deps = Math.max(0, Math.floor(Number(numDependentes) || 0));

    const inss = calcularINSS(bruto);
    const baseIRRF = bruto - inss.valor - (deps * DEDUCAO_DEPENDENTE_IRRF);
    const irrf = calcularIRRF(baseIRRF);
    const liquido = bruto - inss.valor - irrf.valor;

    return { inss, irrf, baseIRRF, liquido };
}

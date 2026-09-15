/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Módulo de Participação nos Lucros e Resultados (PLR)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Fundamentação Legal:
 *   • Art. 7º, XI da Constituição Federal de 1988 — Desvinculação da remuneração
 *   • Lei 10.101/2000 (alterada pela Lei 12.832/2013) — Regramento da PLR
 *   • Tabela Progressiva Exclusiva de IRRF na Fonte para PLR (Receita Federal)
 *   • Isenção total de encargos sociais: NÃO incide INSS nem FGTS
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Tabela Oficial de IRRF Exclusivo na Fonte para PLR (Receita Federal).
 */
export const TABELA_IRRF_PLR = [
    { teto: 7640.80,  aliquota: 0,     deducao: 0,       faixa: 'Até R$ 7.640,80' },
    { teto: 9922.28,  aliquota: 0.075, deducao: 573.06,  faixa: 'De R$ 7.640,81 até R$ 9.922,28' },
    { teto: 13167.00, aliquota: 0.150, deducao: 1317.23, faixa: 'De R$ 9.922,29 até R$ 13.167,00' },
    { teto: 16387.72, aliquota: 0.225, deducao: 2304.76, faixa: 'De R$ 13.167,01 até R$ 16.387,72' },
    { teto: Infinity, aliquota: 0.275, deducao: 3124.15, faixa: 'Acima de R$ 16.387,72' }
];

/**
 * Calcula o Imposto de Renda Retido na Fonte (IRRF) exclusivo de PLR.
 *
 * @param {number} valorBrutoTotal — Total bruto de PLR pago no ano-calendário.
 * @returns {{ aliquota: number, deducao: number, impostoDevido: number, faixa: string, aliquotaEfetiva: number }}
 */
export function calcularIRRF_PLR(valorBrutoTotal) {
    const valor = Math.max(0, Number(valorBrutoTotal) || 0);

    for (const faixa of TABELA_IRRF_PLR) {
        if (valor <= faixa.teto) {
            const impostoDevido = Math.max(0, (valor * faixa.aliquota) - faixa.deducao);
            const aliquotaEfetiva = valor > 0 ? (impostoDevido / valor) * 100 : 0;
            return {
                aliquota: faixa.aliquota * 100,
                deducao: faixa.deducao,
                impostoDevido,
                faixa: faixa.faixa,
                aliquotaEfetiva
            };
        }
    }

    return { aliquota: 0, deducao: 0, impostoDevido: 0, faixa: 'Isento', aliquotaEfetiva: 0 };
}

/**
 * Calcula o valor líquido da PLR, deduções fiscais e economia tributária.
 *
 * @param {Object} params
 * @param {number} params.valorBrutoPLR      — Valor bruto total da PLR acordada (R$).
 * @param {number} [params.antecipacaoPaga=0] — Valor de 1ª parcela já paga anteriormente no ano.
 * @param {number} [params.irrfJaRetido=0]   — IRRF já retido na primeira parcela.
 *
 * @returns {Object} Resultado detalhado, comparativo de encargos e memória de cálculo.
 */
export function calcularPLR({
    valorBrutoPLR = 0,
    antecipacaoPaga = 0,
    irrfJaRetido = 0
}) {
    const brutoTotal = Math.max(0, Number(valorBrutoPLR) || 0);
    const antecipacao = Math.max(0, Number(antecipacaoPaga) || 0);
    const irrfAnterior = Math.max(0, Number(irrfJaRetido) || 0);

    // Saldo bruto a pagar na parcela atual
    const saldoBrutoPagar = Math.max(0, brutoTotal - antecipacao);

    // Apuração do IRRF sobre o valor global do ano (regra da RFB)
    const calculoIRRFGlobal = calcularIRRF_PLR(brutoTotal);
    const irrfTotalDevido = calculoIRRFGlobal.impostoDevido;

    // IRRF a reter nesta parcela
    const irrfAReter = Math.max(0, irrfTotalDevido - irrfAnterior);

    // Valor líquido que o colaborador receberá nesta parcela
    const liquidoParcela = Math.max(0, saldoBrutoPagar - irrfAReter);

    // Líquido global recebido pelo colaborador
    const liquidoTotal = Math.max(0, brutoTotal - irrfTotalDevido);

    // ── Comparativo de Economia Tributária (PLR vs Bônus / Salário Comum) ──
    // Se fosse pago como remuneração normal:
    // • FGTS (8%): R$ bruto × 0.08
    // • INSS Patronal + Terceiros (~28% no regime normal)
    // • INSS Empregado (até ~14%)
    const fgtsEconomizado = brutoTotal * 0.08;
    const inssPatronalEconomizado = brutoTotal * 0.20; // Apenas INSS patronal 20%
    const inssEmpregadoEconomizado = Math.min(brutoTotal * 0.14, 908.85); // Estimativa teto INSS
    const economiaTotalEmpresa = fgtsEconomizado + inssPatronalEconomizado;

    // Memória de Cálculo
    const memoriaCalculo = [
        {
            passo: 1,
            titulo: 'Valor Bruto da PLR',
            descricao: 'Art. 7º, XI CF/88 e Lei 10.101/2000 — Verba desvinculada do salário.',
            formula: `Total Bruto: R$ ${brutoTotal.toFixed(2)}${antecipacao > 0 ? ` (Antecipação: R$ ${antecipacao.toFixed(2)})` : ''}`,
            resultado: brutoTotal
        },
        {
            passo: 2,
            titulo: `Imposto de Renda Exclusivo na Fonte (${calculoIRRFGlobal.aliquota}%)`,
            descricao: `Faixa da Tabela IRRF PLR: ${calculoIRRFGlobal.faixa}. Alíquota Efetiva: ${calculoIRRFGlobal.aliquotaEfetiva.toFixed(2)}%.`,
            formula: `(R$ ${brutoTotal.toFixed(2)} × ${calculoIRRFGlobal.aliquota}%) - R$ ${calculoIRRFGlobal.deducao.toFixed(2)}`,
            resultado: irrfTotalDevido
        },
        {
            passo: 3,
            titulo: 'Isenção de Encargos Previdenciários e FGTS',
            descricao: 'Lei 10.101/2000, Art. 3º — A PLR não constitui base de incidência de INSS ou FGTS.',
            formula: 'INSS Empregado: R$ 0,00 | INSS Patronal: R$ 0,00 | FGTS: R$ 0,00',
            resultado: 0
        },
        {
            passo: 4,
            titulo: 'Valor Líquido a Receber',
            descricao: 'Valor bruto descontado exclusivamente do IRRF retido na fonte.',
            formula: `R$ ${brutoTotal.toFixed(2)} - R$ ${irrfTotalDevido.toFixed(2)}`,
            resultado: liquidoTotal
        },
        {
            passo: 5,
            titulo: 'Economia Tributária para a Empresa',
            descricao: 'Estimativa de encargos que deixaram de ser recolhidos (FGTS 8% + INSS Patronal 20%).',
            formula: `R$ ${fgtsEconomizado.toFixed(2)} (FGTS) + R$ ${inssPatronalEconomizado.toFixed(2)} (INSS)`,
            resultado: economiaTotalEmpresa
        }
    ];

    return {
        valorBrutoPLR: brutoTotal,
        antecipacaoPaga: antecipacao,
        saldoBrutoPagar,
        irrfTotalDevido,
        irrfAReter,
        aliquotaNominal: calculoIRRFGlobal.aliquota,
        deducaoIRRF: calculoIRRFGlobal.deducao,
        aliquotaEfetiva: calculoIRRFGlobal.aliquotaEfetiva,
        faixaIRRF: calculoIRRFGlobal.faixa,
        liquidoParcela,
        liquidoTotal,
        fgtsEconomizado,
        inssPatronalEconomizado,
        inssEmpregadoEconomizado,
        economiaTotalEmpresa,
        memoriaCalculo
    };
}

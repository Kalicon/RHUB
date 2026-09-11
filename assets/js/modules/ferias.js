/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Módulo de Cálculo de Férias & 13º Salário (CLT)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Legislação Aplicada:
 *   • Art. 129 a 145 CLT — Férias anuais remuneradas
 *   • Art. 7º, XVII CF — Adicional de 1/3 constitucional
 *   • Art. 143 CLT — Abono pecuniário (conversão de 1/3 em dinheiro)
 *   • Art. 137 CLT — Férias em dobro (período concessivo expirado)
 *   • Lei 4.090/62 — 13º Salário (gratificação natalina)
 * ═══════════════════════════════════════════════════════════════════════
 */

import { calcularINSS, calcularIRRF, DEDUCAO_DEPENDENTE_IRRF } from './tabelas.js';

/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Cálculo Completo de Férias Individuais ou Coletivas       │
 * └─────────────────────────────────────────────────────────────┘
 *
 * @param {Object} params
 * @param {number} params.salarioBase       — Salário mensal bruto.
 * @param {number} [params.diasFerias=30]   — Dias de férias (30, 24, 18 ou 12 conforme Art. 130).
 * @param {boolean}[params.abonoPecuniario=false] — Se vende 1/3 dos dias (Art. 143 CLT).
 * @param {boolean}[params.feriasEmDobro=false]   — Férias pagas em dobro (Art. 137 CLT).
 * @param {number} [params.dependentesIR=0] — Dependentes para dedução no IRRF.
 *
 * @returns {Object} Resultado detalhado com bruto, deduções e líquido.
 */
export function calcularFerias({
    salarioBase,
    diasFerias = 30,
    abonoPecuniario = false,
    feriasEmDobro = false,
    dependentesIR = 0
}) {
    const salario = Math.max(0, Number(salarioBase) || 0);
    const dias = Math.max(0, Math.min(30, Number(diasFerias) || 30));
    const deps = Math.max(0, Math.floor(Number(dependentesIR) || 0));

    const valorDia = salario / 30;

    // ── 1. Valor Base das Férias ───────────────────────────────
    // Proporcional aos dias (pode ser 30, 24, 18 ou 12 por Art. 130 CLT)
    let valorBaseFerias = valorDia * dias;

    // ── 2. Terço Constitucional (Art. 7º, XVII CF) ─────────────
    let tercoConstitucional = valorBaseFerias / 3;

    // ── 3. Férias em Dobro (Art. 137 CLT) ──────────────────────
    // Se concedidas após o período concessivo (12 meses após aquisição)
    let multiplicadorDobro = 1;
    if (feriasEmDobro) {
        multiplicadorDobro = 2;
        valorBaseFerias *= 2;
        tercoConstitucional *= 2;
    }

    // ── 4. Abono Pecuniário (Art. 143 CLT) ─────────────────────
    // Conversão de até 1/3 do período em dinheiro (ex: 10 dias de 30)
    let diasAbono = 0;
    let valorAbono = 0;
    let tercoAbono = 0;
    if (abonoPecuniario) {
        diasAbono = Math.floor(dias / 3);  // 1/3 dos dias
        valorAbono = valorDia * diasAbono * multiplicadorDobro;
        tercoAbono = valorAbono / 3;
    }

    // ── 5. Total Bruto de Férias ───────────────────────────────
    const totalBrutoFerias = valorBaseFerias + tercoConstitucional + valorAbono + tercoAbono;

    // ── 6. Base tributável ──────────────────────────────────────
    // O abono pecuniário e seu 1/3 são ISENTOS de INSS e IRRF
    const baseTributavel = valorBaseFerias + tercoConstitucional;

    // ── 7. Deduções INSS e IRRF ────────────────────────────────
    const inss = calcularINSS(baseTributavel);
    const baseIRRF = baseTributavel - inss.valor - (deps * DEDUCAO_DEPENDENTE_IRRF);
    const irrf = calcularIRRF(Math.max(0, baseIRRF));

    const totalDeducoes = inss.valor + irrf.valor;
    const liquidoFerias = totalBrutoFerias - totalDeducoes;

    // ── 8. Memória de Cálculo ──────────────────────────────────
    const memoriaCalculo = [
        {
            passo: 1,
            titulo: 'Valor Base das Férias',
            descricao: `${dias} dias × R$ ${valorDia.toFixed(2)}/dia${feriasEmDobro ? ' × 2 (dobro)' : ''}`,
            formula: `(R$ ${salario.toFixed(2)} ÷ 30) × ${dias}${feriasEmDobro ? ' × 2' : ''}`,
            resultado: valorBaseFerias
        },
        {
            passo: 2,
            titulo: '1/3 Constitucional',
            descricao: 'Art. 7º, XVII CF — Adicional obrigatório de um terço',
            formula: `R$ ${valorBaseFerias.toFixed(2)} ÷ 3`,
            resultado: tercoConstitucional
        },
    ];

    if (abonoPecuniario) {
        memoriaCalculo.push({
            passo: memoriaCalculo.length + 1,
            titulo: 'Abono Pecuniário',
            descricao: `Art. 143 CLT — Venda de ${diasAbono} dia(s) (1/3 do período)`,
            formula: `R$ ${valorDia.toFixed(2)} × ${diasAbono} dias${feriasEmDobro ? ' × 2' : ''} + 1/3`,
            resultado: valorAbono + tercoAbono
        });
    }

    memoriaCalculo.push(
        {
            passo: memoriaCalculo.length + 1,
            titulo: 'Total Bruto das Férias',
            descricao: 'Base + 1/3' + (abonoPecuniario ? ' + Abono Pecuniário' : ''),
            formula: `R$ ${valorBaseFerias.toFixed(2)} + R$ ${tercoConstitucional.toFixed(2)}` + (abonoPecuniario ? ` + R$ ${(valorAbono + tercoAbono).toFixed(2)}` : ''),
            resultado: totalBrutoFerias
        },
        {
            passo: memoriaCalculo.length + 2,
            titulo: 'INSS',
            descricao: `Alíquota efetiva: ${inss.aliquotaEfetiva.toFixed(2)}%`,
            formula: `Base tributável: R$ ${baseTributavel.toFixed(2)}`,
            resultado: inss.valor
        },
        {
            passo: memoriaCalculo.length + 3,
            titulo: 'IRRF',
            descricao: `Faixa ${irrf.faixa} — ${(irrf.aliquota).toFixed(1)}%`,
            formula: `Base IRRF: R$ ${Math.max(0, baseIRRF).toFixed(2)}`,
            resultado: irrf.valor
        },
        {
            passo: memoriaCalculo.length + 4,
            titulo: 'Líquido a Receber',
            descricao: 'Bruto − INSS − IRRF',
            formula: `R$ ${totalBrutoFerias.toFixed(2)} − R$ ${inss.valor.toFixed(2)} − R$ ${irrf.valor.toFixed(2)}`,
            resultado: liquidoFerias
        }
    );

    // Corrige a numeração sequencial dos passos
    memoriaCalculo.forEach((p, i) => p.passo = i + 1);

    return {
        // Entradas
        salarioBase: salario,
        diasFerias: dias,
        abonoPecuniario,
        feriasEmDobro,
        diasAbono,

        // Valores
        valorDia,
        valorBaseFerias,
        tercoConstitucional,
        valorAbono,
        tercoAbono,
        totalBrutoFerias,

        // Deduções
        inss,
        irrf,
        totalDeducoes,

        // Resultado
        liquidoFerias,

        // Auditoria
        memoriaCalculo
    };
}

/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Cálculo do 13º Salário Proporcional                       │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Lei 4.090/62 — Mês com ≥ 15 dias trabalhados = 1 avo.
 *
 * @param {Object} params
 * @param {number} params.salarioBase       — Salário mensal bruto.
 * @param {number} params.mesesTrabalhados  — Avos de 13º (1 a 12).
 * @param {number} [params.dependentesIR=0] — Dependentes IRRF.
 *
 * @returns {Object} Resultado detalhado.
 */
export function calcular13o({
    salarioBase,
    mesesTrabalhados,
    dependentesIR = 0
}) {
    const salario = Math.max(0, Number(salarioBase) || 0);
    const meses = Math.max(0, Math.min(12, Math.floor(Number(mesesTrabalhados) || 0)));
    const deps = Math.max(0, Math.floor(Number(dependentesIR) || 0));

    // ── 1. Valor do 13º Proporcional ───────────────────────────
    const valor13oBruto = (salario / 12) * meses;

    // ── 2. Deduções INSS e IRRF ────────────────────────────────
    const inss = calcularINSS(valor13oBruto);
    const baseIRRF = valor13oBruto - inss.valor - (deps * DEDUCAO_DEPENDENTE_IRRF);
    const irrf = calcularIRRF(Math.max(0, baseIRRF));

    const totalDeducoes = inss.valor + irrf.valor;
    const liquido13o = valor13oBruto - totalDeducoes;

    // ── 3. Memória de Cálculo ──────────────────────────────────
    const memoriaCalculo = [
        {
            passo: 1,
            titulo: '13º Salário Proporcional',
            descricao: `Lei 4.090/62 — ${meses}/12 avos`,
            formula: `(R$ ${salario.toFixed(2)} ÷ 12) × ${meses}`,
            resultado: valor13oBruto
        },
        {
            passo: 2,
            titulo: 'INSS sobre 13º',
            descricao: `Alíquota efetiva: ${inss.aliquotaEfetiva.toFixed(2)}%`,
            formula: `Base: R$ ${valor13oBruto.toFixed(2)}`,
            resultado: inss.valor
        },
        {
            passo: 3,
            titulo: 'IRRF sobre 13º',
            descricao: `Faixa ${irrf.faixa} — ${(irrf.aliquota).toFixed(1)}%`,
            formula: `Base: R$ ${Math.max(0, baseIRRF).toFixed(2)}`,
            resultado: irrf.valor
        },
        {
            passo: 4,
            titulo: 'Líquido do 13º a Receber',
            descricao: 'Bruto − INSS − IRRF',
            formula: `R$ ${valor13oBruto.toFixed(2)} − R$ ${inss.valor.toFixed(2)} − R$ ${irrf.valor.toFixed(2)}`,
            resultado: liquido13o
        }
    ];

    return {
        salarioBase: salario,
        mesesTrabalhados: meses,
        valor13oBruto,
        inss,
        irrf,
        totalDeducoes,
        liquido13o,
        memoriaCalculo
    };
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Módulo de Salário Líquido / Holerite Completo (CLT)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Legislação Aplicada:
 *   • Art. 457 a 467 CLT — Remuneração e folha de pagamento
 *   • Portaria MPS/MF nº 2/2024 — Tabela Progressiva do INSS
 *   • MP nº 1.206/2024 — Tabela Progressiva do IRRF
 *   • Lei 7.418/85 — Vale Transporte (teto de 6% do salário base)
 *   • Lei 605/49 e Súmula 172 TST — Reflexo DSR sobre horas extras/noturno
 *   • Art. 192 e 193 CLT — Insalubridade e Periculosidade
 * ═══════════════════════════════════════════════════════════════════════
 */

import { calcularINSS, calcularIRRF, DEDUCAO_DEPENDENTE_IRRF } from './tabelas.js';

// Salário Mínimo Nacional (Vigência 2024) — Base da Insalubridade
export const SALARIO_MINIMO_2024 = 1412.00;

/**
 * Realiza a apuração completa da folha de pagamento e holerite mensal.
 *
 * @param {Object} params
 * @param {number} params.salarioBase          — Salário mensal contratual.
 * @param {number} [params.divisorMensal=220]  — Carga horária mensal (220, 200, 180).
 * @param {number} [params.horasExtras50=0]    — Quantidade de horas extras a 50%.
 * @param {number} [params.horasExtras100=0]   — Quantidade de horas extras a 100% (domingos/feriados).
 * @param {number} [params.adicionalNoturnoValor=0] — Valor do adicional noturno já apurado.
 * @param {number} [params.diasUteis=22]       — Dias úteis do mês (para cálculo do DSR).
 * @param {number} [params.repousos=8]         — Domingos e feriados do mês (para cálculo do DSR).
 * @param {number} [params.insalubridadeGrau=0] — Grau de insalubridade: 0, 0.10 (mín), 0.20 (méd), 0.40 (máx).
 * @param {boolean} [params.temPericulosidade=false] — Adicional de 30% sobre o salário base.
 * @param {number} [params.outrosProventos=0]  — Comissões, prêmios ou gratificações.
 * @param {number} [params.dependentesIR=0]    — Quantidade de dependentes para dedução de IRRF.
 * @param {boolean} [params.optanteVT=false]   — Se o colaborador recebe Vale Transporte (desconto até 6%).
 * @param {number} [params.custoRealVT=0]      — Valor total do custo do VT fornecido pela empresa.
 * @param {number} [params.descontoVR=0]       — Desconto em folha de Vale Refeição / Alimentação.
 * @param {number} [params.descontoSaude=0]    — Desconto de Plano de Saúde / Odontológico.
 * @param {number} [params.pensaoAlimenticia=0] — Valor judicial fixo de pensão alimentícia.
 * @param {number} [params.outrosDescontos=0]  — Faltas, adiantamentos ou outros descontos.
 *
 * @returns {Object} Demonstrativo completo do holerite com proventos, deduções e líquido.
 */
export function calcularSalarioLiquido({
    salarioBase,
    divisorMensal = 220,
    horasExtras50 = 0,
    horasExtras100 = 0,
    adicionalNoturnoValor = 0,
    diasUteis = 22,
    repousos = 8,
    insalubridadeGrau = 0,
    temPericulosidade = false,
    outrosProventos = 0,
    dependentesIR = 0,
    optanteVT = false,
    custoRealVT = 0,
    descontoVR = 0,
    descontoSaude = 0,
    pensaoAlimenticia = 0,
    outrosDescontos = 0
}) {
    const salario = Math.max(0, Number(salarioBase) || 0);
    const divisor = Math.max(1, Number(divisorMensal) || 220);
    const deps = Math.max(0, Math.floor(Number(dependentesIR) || 0));
    const valorHora = salario / divisor;

    // ── 1. PROVENTOS ───────────────────────────────────────────────
    const rubricasProventos = [];

    // Salário Base
    rubricasProventos.push({
        codigo: '001',
        nome: 'Salário Base Contratual',
        referencia: '30 dias',
        valor: salario,
        tributavel: true
    });

    // Horas Extras 50%
    const he50 = Math.max(0, Number(horasExtras50) || 0);
    const valorHE50 = he50 > 0 ? (valorHora * 1.5) * he50 : 0;
    if (he50 > 0) {
        rubricasProventos.push({
            codigo: '050',
            nome: 'Horas Extras 50%',
            referencia: `${he50.toFixed(2)}h`,
            valor: valorHE50,
            tributavel: true
        });
    }

    // Horas Extras 100%
    const he100 = Math.max(0, Number(horasExtras100) || 0);
    const valorHE100 = he100 > 0 ? (valorHora * 2.0) * he100 : 0;
    if (he100 > 0) {
        rubricasProventos.push({
            codigo: '100',
            nome: 'Horas Extras 100%',
            referencia: `${he100.toFixed(2)}h`,
            valor: valorHE100,
            tributavel: true
        });
    }

    // Adicional Noturno
    const adicNoturno = Math.max(0, Number(adicionalNoturnoValor) || 0);
    if (adicNoturno > 0) {
        rubricasProventos.push({
            codigo: '020',
            nome: 'Adicional Noturno (Art. 73 CLT)',
            referencia: 'Variável',
            valor: adicNoturno,
            tributavel: true
        });
    }

    // DSR sobre Variáveis (HE + Noturno)
    const totalVariaveis = valorHE50 + valorHE100 + adicNoturno;
    const du = Math.max(1, Number(diasUteis) || 22);
    const dom = Math.max(0, Number(repousos) || 8);
    const valorDSR = totalVariaveis > 0 ? (totalVariaveis / du) * dom : 0;
    if (valorDSR > 0) {
        rubricasProventos.push({
            codigo: '025',
            nome: 'DSR s/ Horas Extras e Noturno',
            referencia: `${dom} DSRs`,
            valor: valorDSR,
            tributavel: true
        });
    }

    // Insalubridade (10%, 20% ou 40% do Salário Mínimo)
    const grauInsalubridade = Number(insalubridadeGrau) || 0;
    const valorInsalubridade = grauInsalubridade > 0 ? SALARIO_MINIMO_2024 * grauInsalubridade : 0;
    if (valorInsalubridade > 0) {
        rubricasProventos.push({
            codigo: '015',
            nome: `Adicional de Insalubridade (${(grauInsalubridade * 100).toFixed(0)}%)`,
            referencia: 'Art. 192 CLT',
            valor: valorInsalubridade,
            tributavel: true
        });
    }

    // Periculosidade (30% do Salário Base)
    const valorPericulosidade = temPericulosidade ? salario * 0.30 : 0;
    if (valorPericulosidade > 0) {
        rubricasProventos.push({
            codigo: '030',
            nome: 'Adicional de Periculosidade (30%)',
            referencia: 'Art. 193 CLT',
            valor: valorPericulosidade,
            tributavel: true
        });
    }

    // Outros Proventos
    const outrosProv = Math.max(0, Number(outrosProventos) || 0);
    if (outrosProv > 0) {
        rubricasProventos.push({
            codigo: '090',
            nome: 'Outros Proventos / Gratificações',
            referencia: 'Eventual',
            valor: outrosProv,
            tributavel: true
        });
    }

    // Total de Proventos Brutos
    const totalBruto = rubricasProventos.reduce((acc, r) => acc + r.valor, 0);

    // ── 2. DEDUÇÕES E DESCONTOS ────────────────────────────────────
    const rubricasDescontos = [];

    // Base para INSS: soma de todas as rubricas tributáveis
    const baseINSS = rubricasProventos.filter(r => r.tributavel).reduce((acc, r) => acc + r.valor, 0);
    const inss = calcularINSS(baseINSS);

    rubricasDescontos.push({
        codigo: '501',
        nome: 'INSS — Previdência Social',
        referencia: `${inss.aliquotaEfetiva.toFixed(2)}%`,
        valor: inss.valor
    });

    // Base para IRRF: Base INSS − INSS − (Dependentes × 189,59) − Pensão
    const pensao = Math.max(0, Number(pensaoAlimenticia) || 0);
    const deducaoDependentes = deps * DEDUCAO_DEPENDENTE_IRRF;
    const baseIRRF = Math.max(0, baseINSS - inss.valor - deducaoDependentes - pensao);
    const irrf = calcularIRRF(baseIRRF);

    if (irrf.valor > 0) {
        rubricasDescontos.push({
            codigo: '502',
            nome: 'IRRF — Imposto de Renda',
            referencia: `${irrf.aliquota.toFixed(1)}%`,
            valor: irrf.valor
        });
    }

    // Vale Transporte: Lei 7.418/85 — teto de 6% do salário base
    if (optanteVT) {
        const teto6Porcento = salario * 0.06;
        const custoVT = Math.max(0, Number(custoRealVT) || 0);
        // O desconto é o menor entre 6% do salário base e o custo real do transporte
        const descVT = custoVT > 0 ? Math.min(teto6Porcento, custoVT) : teto6Porcento;
        if (descVT > 0) {
            rubricasDescontos.push({
                codigo: '510',
                nome: 'Vale Transporte (Lei 7.418/85)',
                referencia: 'Até 6%',
                valor: descVT
            });
        }
    }

    // Vale Refeição / Alimentação
    const descVR = Math.max(0, Number(descontoVR) || 0);
    if (descVR > 0) {
        rubricasDescontos.push({
            codigo: '520',
            nome: 'Vale Refeição / Alimentação',
            referencia: 'Copart.',
            valor: descVR
        });
    }

    // Plano de Saúde / Odontológico
    const descSaude = Math.max(0, Number(descontoSaude) || 0);
    if (descSaude > 0) {
        rubricasDescontos.push({
            codigo: '530',
            nome: 'Plano de Saúde / Odonto',
            referencia: 'Mensalidade',
            valor: descSaude
        });
    }

    // Pensão Alimentícia
    if (pensao > 0) {
        rubricasDescontos.push({
            codigo: '540',
            nome: 'Pensão Alimentícia Judicial',
            referencia: 'Ordem Jud.',
            valor: pensao
        });
    }

    // Outros Descontos
    const descOutros = Math.max(0, Number(outrosDescontos) || 0);
    if (descOutros > 0) {
        rubricasDescontos.push({
            codigo: '590',
            nome: 'Outros Descontos / Faltas',
            referencia: 'Diversos',
            valor: descOutros
        });
    }

    // Total de Descontos
    const totalDescontos = rubricasDescontos.reduce((acc, r) => acc + r.valor, 0);

    // ── 3. SALÁRIO LÍQUIDO ─────────────────────────────────────────
    const salarioLiquido = Math.max(0, totalBruto - totalDescontos);

    // ── 4. FGTS DO MÊS (Não desconta do empregado — obrigação patronal)
    const fgtsMes = baseINSS * 0.08;

    // ── 5. MEMÓRIA DE CÁLCULO AUDITÁVEL ────────────────────────────
    const memoriaCalculo = [
        {
            passo: 1,
            titulo: 'Totalização dos Proventos Brutos',
            descricao: 'Soma do Salário Base com adicionais (Horas Extras, Noturno, DSR, Insalubridade, Periculosidade).',
            formula: 'Salário Base + Adicionais',
            resultado: totalBruto
        },
        {
            passo: 2,
            titulo: 'Contribuição Previdenciária (INSS)',
            descricao: `Aplicação da Tabela Progressiva 2024 sobre R$ ${baseINSS.toFixed(2)} (Alíquota efetiva de ${inss.aliquotaEfetiva.toFixed(2)}%).`,
            formula: 'Tabela Progressiva por Faixas',
            resultado: inss.valor
        },
        {
            passo: 3,
            titulo: 'Imposto de Renda Retido na Fonte (IRRF)',
            descricao: `Base IRRF = R$ ${baseINSS.toFixed(2)} − INSS (R$ ${inss.valor.toFixed(2)}) − Dependentes (R$ ${deducaoDependentes.toFixed(2)})${pensao > 0 ? ` − Pensão (R$ ${pensao.toFixed(2)})` : ''} = R$ ${baseIRRF.toFixed(2)}.`,
            formula: irrf.valor > 0 ? `(Base × ${irrf.aliquota.toFixed(1)}%) − Parcela a Deduzir` : 'Isento de IRRF',
            resultado: irrf.valor
        },
        {
            passo: 4,
            titulo: 'Total de Descontos e Benefícios',
            descricao: 'Soma de INSS, IRRF, Vale Transporte, Alimentação, Saúde e outras retenções.',
            formula: 'INSS + IRRF + Benefícios + Retenções',
            resultado: totalDescontos
        },
        {
            passo: 5,
            titulo: 'Salário Líquido Final a Receber',
            descricao: 'Valor efetivo que será creditado na conta bancária do colaborador.',
            formula: 'Total Bruto − Total Descontos',
            resultado: salarioLiquido
        }
    ];

    return {
        totalBruto,
        totalDescontos,
        salarioLiquido,
        baseINSS,
        inss,
        baseIRRF,
        irrf,
        fgtsMes,
        rubricasProventos,
        rubricasDescontos,
        memoriaCalculo
    };
}

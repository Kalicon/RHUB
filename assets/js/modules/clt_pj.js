/**
 * RHUB — Módulo 6: Simulador CLT vs. PJ & Custo Total Empresa
 * 
 * Legislação e Fundamentação:
 * - CLT e Lei 8.036/90: FGTS (8%), 13º Salário (Lei 4.090/62) e Férias + 1/3 (Art. 129-145 CLT)
 * - Lei 8.212/91 e Decreto 3.048/99: Encargos Previdenciários Patronais (INSS 20%, RAT 1-3% x FAP, Terceiros ~5.8%)
 * - Lei Complementar 123/2006: Estatuto da Micro e Pequena Empresa (Simples Nacional - isenção de cota patronal ordinária)
 * - Tabela Progressiva INSS (Portaria MPS/MF nº 2/2024) e IRRF (MP 1.206/2024)
 * - Simples Nacional Anexo III (6% c/ Fator R) ou Anexo V (15.5%) para serviços
 */

import { calcularINSS, calcularIRRF, DEDUCAO_DEPENDENTE_IRRF } from './tabelas.js';

/**
 * @typedef {Object} BeneficiosEmpresa
 * @property {number} [vrVa=0] - Vale Refeição / Alimentação mensal
 * @property {number} [saude=0] - Assistência Médica / Odontológica mensal
 * @property {number} [seguroVida=0] - Seguro de Vida mensal
 * @property {number} [previdenciaPrivada=0] - Contribuição patronal à previdência privada
 * @property {number} [outros=0] - Outros benefícios mensais
 */

/**
 * @typedef {Object} ParametrosCltPj
 * @property {number} salarioBase - Salário nominal CLT
 * @property {'simples'|'lucro_presumido_real'} regimeTributario - Regime tributário da empresa
 * @property {number} [aliquotaRat=2] - Alíquota RAT/GILRAT (1%, 2% ou 3%)
 * @property {number} [fap=1.0] - Fator Acidentário de Prevenção (0.5 a 2.0)
 * @property {number} [aliquotaTerceiros=5.8] - Alíquota Sistema S / Terceiros (em %)
 * @property {number} [dependentesIrrf=0] - Dependentes para dedução de IRRF
 * @property {BeneficiosEmpresa} [beneficios] - Benefícios concedidos
 * @property {number} [aliquotaSimplesPj=6] - Alíquota do Simples Nacional da PJ (6% no Anexo III ou 15.5% Anexo V)
 * @property {number} [proLaborePercent=28] - Percentual de pró-labore da PJ para enquadramento no Fator R (mín. 28%)
 * @property {number} [custoContadorPj=200] - Custo mensal com contabilidade PJ
 * @property {number} [beneficiosPjProprios=0] - Despesa mensal com saúde/alimentação mantida pelo PJ
 * @property {number} [faturamentoPjInformado=0] - Faturamento mensal PJ ofertado ou simulado (opcional)
 */

/**
 * Realiza o cálculo comparativo aprofundado entre contratação CLT e PJ
 * @param {ParametrosCltPj} params
 * @returns {Object} Relatório analítico completo
 */
export function calcularCustosCltPj(params) {
    const salario = Math.max(0, Number(params.salarioBase) || 0);
    const regime = params.regimeTributario === 'simples' ? 'simples' : 'lucro_presumido_real';
    const rat = Math.max(0, Number(params.aliquotaRat) || 2);
    const fap = Math.max(0.5, Math.min(2.0, Number(params.fap) || 1.0));
    const terceiros = Math.max(0, Number(params.aliquotaTerceiros) || 5.8);
    const dependentes = Math.max(0, Number(params.dependentesIrrf) || 0);

    // Benefícios
    const ben = params.beneficios || {};
    const vrVa = Math.max(0, Number(ben.vrVa) || 0);
    const saude = Math.max(0, Number(ben.saude) || 0);
    const seguroVida = Math.max(0, Number(ben.seguroVida) || 0);
    const previdencia = Math.max(0, Number(ben.previdenciaPrivada) || 0);
    const outrosBen = Math.max(0, Number(ben.outros) || 0);
    const totalBeneficiosEmpresa = vrVa + saude + seguroVida + previdencia + outrosBen;

    // Parâmetros PJ
    const aliqSimplesPj = Math.max(0, Number(params.aliquotaSimplesPj) || 6);
    const proLaborePct = Math.max(10, Math.min(100, Number(params.proLaborePercent) || 28));
    const contadorPj = Math.max(0, Number(params.custoContadorPj) || 200);
    const benPjProprio = Math.max(0, Number(params.beneficiosPjProprios) || 0);
    const pjInformado = Math.max(0, Number(params.faturamentoPjInformado) || 0);

    // ═══ 1. CUSTO CLT PARA A EMPRESA ═══
    const fgtsMensal = salario * 0.08;
    const provisao13 = salario / 12; // 8.333%
    const provisaoFerias = salario / 12; // 8.333%
    const provisaoTercoFerias = provisaoFerias / 3; // 2.778%
    const totalProvisoes = provisao13 + provisaoFerias + provisaoTercoFerias;

    // FGTS sobre provisões (13º e Férias)
    const fgtsSobreProvisoes = totalProvisoes * 0.08;

    // Encargos Previdenciários e Patronais
    let inssPatronal = 0;
    let ratAjustado = 0;
    let terceirosPatronal = 0;
    let encargosSobreProvisoes = 0;

    const ratEfetivoPercent = rat * fap;

    if (regime === 'lucro_presumido_real') {
        inssPatronal = salario * 0.20; // 20% INSS Empresa
        ratAjustado = salario * (ratEfetivoPercent / 100);
        terceirosPatronal = salario * (terceiros / 100);

        const aliqTotalPatronal = 0.20 + (ratEfetivoPercent / 100) + (terceiros / 100);
        encargosSobreProvisoes = totalProvisoes * aliqTotalPatronal;
    }

    const totalEncargosPatronais = inssPatronal + ratAjustado + terceirosPatronal;

    const custoMensalEmpresaClt = salario 
        + fgtsMensal 
        + totalProvisoes 
        + fgtsSobreProvisoes 
        + totalEncargosPatronais 
        + encargosSobreProvisoes 
        + totalBeneficiosEmpresa;

    const custoAnualEmpresaClt = custoMensalEmpresaClt * 12;

    // ═══ 2. RENDA LÍQUIDA E PODER DE COMPRA DO COLABORADOR CLT ═══
    const inssClt = calcularINSS(salario).valor;
    const baseIrrfClt = Math.max(0, salario - inssClt - (dependentes * DEDUCAO_DEPENDENTE_IRRF));
    const irrfClt = calcularIRRF(baseIrrfClt).valor;

    // Salário Líquido que cai na conta mensalmente (sem considerar deduções de benefícios)
    const salarioLiquidoEmFolha = Math.max(0, salario - inssClt - irrfClt);

    // Provisões líquidas mensalizadas que o colaborador recebe ao longo do ano:
    // 13º salário líquido aproximado
    const inss13 = calcularINSS(salario).valor;
    const baseIrrf13 = Math.max(0, salario - inss13 - (dependentes * DEDUCAO_DEPENDENTE_IRRF));
    const irrf13 = calcularIRRF(baseIrrf13).valor;
    const decimoTerceiroLiquidoMensal = Math.max(0, salario - inss13 - irrf13) / 12;

    // Férias líquidas (Salário + 1/3 - INSS - IRRF sobre o mês de gozo) / 12
    const baseFeriasBruta = salario + (salario / 3);
    const inssFerias = calcularINSS(baseFeriasBruta).valor;
    const baseIrrfFerias = Math.max(0, baseFeriasBruta - inssFerias - (dependentes * DEDUCAO_DEPENDENTE_IRRF));
    const irrfFerias = calcularIRRF(baseIrrfFerias).valor;
    const feriasLiquidasMensal = Math.max(0, baseFeriasBruta - inssFerias - irrfFerias) / 12;

    // FGTS acumulado (patrimônio líquido do colaborador)
    const fgtsAcumuladoMensal = fgtsMensal;

    // Benefícios líquidos diretos (VR/VA + Saúde pago pela empresa)
    const beneficiosRecebidosMensal = totalBeneficiosEmpresa;

    // PODER DE COMPRA REAL MENSAL TOTAL CLT
    const poderCompraTotalClt = salarioLiquidoEmFolha 
        + decimoTerceiroLiquidoMensal 
        + (feriasLiquidasMensal - (salarioLiquidoEmFolha / 12)) // adicional real de férias
        + fgtsAcumuladoMensal 
        + beneficiosRecebidosMensal;

    // ═══ 3. SIMULAÇÃO DO CENÁRIO PJ ═══

    /**
     * Calcula o resultado líquido no bolso dado um faturamento bruto PJ
     * @param {number} faturamentoBruto 
     */
    function apurarResultadoPj(faturamentoBruto) {
        if (faturamentoBruto <= 0) {
            return {
                faturamentoBruto: 0,
                dasSimples: 0,
                proLaboreBruto: 0,
                inssProLabore: 0,
                irrfProLabore: 0,
                proLaboreLiquido: 0,
                distribuicaoLucros: 0,
                custoContabilidade: 0,
                custoBeneficiosProprios: 0,
                liquidoRealNoBolso: 0
            };
        }

        // Imposto PJ - DAS (Simples Nacional)
        const das = faturamentoBruto * (aliqSimplesPj / 100);

        // Pró-labore (pelo menos Salário Mínimo R$ 1.412 ou % do faturamento)
        const salarioMinimo = 1412.00;
        let proLabore = Math.max(salarioMinimo, faturamentoBruto * (proLaborePct / 100));
        proLabore = Math.min(faturamentoBruto, proLabore);

        // INSS sobre Pró-labore: 11% (respeitando teto do INSS R$ 7.786,02 -> máx R$ 856,46)
        const tetoInss2024 = 7786.02;
        const baseInssProLabore = Math.min(proLabore, tetoInss2024);
        const inssProLabore = baseInssProLabore * 0.11;

        // IRRF sobre Pró-labore (tabela progressiva)
        const baseIrrfProLabore = Math.max(0, proLabore - inssProLabore - (dependentes * DEDUCAO_DEPENDENTE_IRRF));
        const irrfProLabore = calcularIRRF(baseIrrfProLabore).valor;
        const proLaboreLiquido = Math.max(0, proLabore - inssProLabore - irrfProLabore);

        // Distribuição de Lucros isenta de IRPF = Faturamento - DAS - Pró-Labore Bruto - Contabilidade
        const distribuicaoLucros = Math.max(0, faturamentoBruto - das - proLabore - contadorPj);

        // Sobra líquida real no bolso
        const liquidoRealNoBolso = Math.max(0, (proLaboreLiquido + distribuicaoLucros) - benPjProprio);

        return {
            faturamentoBruto,
            dasSimples: das,
            proLaboreBruto: proLabore,
            inssProLabore,
            irrfProLabore,
            proLaboreLiquido,
            distribuicaoLucros,
            custoContabilidade: contadorPj,
            custoBeneficiosProprios: benPjProprio,
            liquidoRealNoBolso
        };
    }

    // A) Encontrar o Faturamento PJ de Equivalência (Break-Even para empatar com o Poder de Compra CLT)
    let pjBreakEven = poderCompraTotalClt * 1.35;
    for (let iter = 0; iter < 20; iter++) {
        const sim = apurarResultadoPj(pjBreakEven);
        const diff = poderCompraTotalClt - sim.liquidoRealNoBolso;
        if (Math.abs(diff) < 1.0) break;
        pjBreakEven += diff * 1.15;
    }
    pjBreakEven = Math.max(0, pjBreakEven);

    const resultadoPjBreakEven = apurarResultadoPj(pjBreakEven);

    // B) Apurar PJ com o Faturamento Informado (se houver, ou padrão 1.5x salário CLT)
    const faturamentoPjEfetivo = pjInformado > 0 ? pjInformado : (salario * 1.5);
    const resultadoPjSimulado = apurarResultadoPj(faturamentoPjEfetivo);

    // Veredito / Diferencial
    const diferencaMensalPjVsClt = resultadoPjSimulado.liquidoRealNoBolso - poderCompraTotalClt;
    const percentualDiferenca = poderCompraTotalClt > 0 
        ? ((resultadoPjSimulado.liquidoRealNoBolso / poderCompraTotalClt) - 1) * 100 
        : 0;

    // Fator multiplicador de equivalência da empresa
    const multiplicadorCustoEmpresa = salario > 0 ? (custoMensalEmpresaClt / salario) : 1;
    const multiplicadorPjBreakEven = salario > 0 ? (pjBreakEven / salario) : 1;

    return {
        parametros: {
            salarioBase: salario,
            regimeTributario: regime,
            ratEfetivoPercent,
            terceirosPercent: terceiros,
            dependentes,
            totalBeneficiosEmpresa,
            aliquotaSimplesPj: aliqSimplesPj,
            faturamentoPjSimulado: faturamentoPjEfetivo
        },
        empresaClt: {
            salarioBase: salario,
            fgtsMensal,
            provisao13,
            provisaoFerias,
            provisaoTercoFerias,
            totalProvisoes,
            fgtsSobreProvisoes,
            inssPatronal,
            ratAjustado,
            terceirosPatronal,
            totalEncargosPatronais,
            encargosSobreProvisoes,
            beneficiosEmpresa: totalBeneficiosEmpresa,
            custoTotalMensal: custoMensalEmpresaClt,
            custoTotalAnual: custoAnualEmpresaClt,
            multiplicadorCusto: multiplicadorCustoEmpresa
        },
        trabalhadorClt: {
            salarioBase: salario,
            inss: inssClt,
            irrf: irrfClt,
            salarioLiquidoEmFolha,
            decimoTerceiroLiquidoMensal,
            adicionalFeriasLiquidoMensal: Math.max(0, feriasLiquidasMensal - (salarioLiquidoEmFolha / 12)),
            fgtsAcumuladoMensal,
            beneficiosRecebidosMensal,
            poderCompraTotalMensal: poderCompraTotalClt
        },
        pjBreakEven: {
            faturamentoNecessario: pjBreakEven,
            multiplicadorSalario: multiplicadorPjBreakEven,
            detalhes: resultadoPjBreakEven
        },
        pjSimulado: {
            ...resultadoPjSimulado,
            diferencaVsPoderCompraClt: diferencaMensalPjVsClt,
            percentualDiferenca,
            isVantajosoPj: diferencaMensalPjVsClt > 0
        },
        memoriaCalculo: [
            {
                passo: 1,
                titulo: 'Custo Total da Empresa (CLT)',
                formula: 'Salário Base + FGTS (8%) + Provisões (13º e Férias c/ 1/3) + Encargos Patronais + Benefícios',
                detalhe: `Salário: R$ ${salario.toFixed(2)} | FGTS: R$ ${fgtsMensal.toFixed(2)} | Provisões: R$ ${totalProvisoes.toFixed(2)} | Patronal: R$ ${totalEncargosPatronais.toFixed(2)} | Benefícios: R$ ${totalBeneficiosEmpresa.toFixed(2)}`,
                resultado: `R$ ${custoMensalEmpresaClt.toFixed(2)} / mês (${(multiplicadorCustoEmpresa * 100).toFixed(1)}% do salário base)`
            },
            {
                passo: 2,
                titulo: 'Salário Líquido em Folha (CLT)',
                formula: 'Salário Base - INSS Progressivo 2024 - IRRF Progressivo c/ Dependentes',
                detalhe: `R$ ${salario.toFixed(2)} - R$ ${inssClt.toFixed(2)} (INSS) - R$ ${irrfClt.toFixed(2)} (IRRF)`,
                resultado: `R$ ${salarioLiquidoEmFolha.toFixed(2)} / mês líquido`
            },
            {
                passo: 3,
                titulo: 'Poder de Compra Real Mensal (CLT)',
                formula: 'Líquido Folha + Provisão 13º Líquido + Adicional Férias Líquido + FGTS (8%) + Benefícios',
                detalhe: `R$ ${salarioLiquidoEmFolha.toFixed(2)} + R$ ${decimoTerceiroLiquidoMensal.toFixed(2)} (13º) + R$ ${(feriasLiquidasMensal - (salarioLiquidoEmFolha/12)).toFixed(2)} (Férias) + R$ ${fgtsAcumuladoMensal.toFixed(2)} (FGTS) + R$ ${beneficiosRecebidosMensal.toFixed(2)} (VR/Saúde)`,
                resultado: `R$ ${poderCompraTotalClt.toFixed(2)} / mês (Totalidade dos direitos e patrimônio)`
            },
            {
                passo: 4,
                titulo: 'Equivalência PJ Mínima (Break-Even)',
                formula: 'Faturamento PJ que resulta no mesmo poder de compra CLT após DAS Simples, Pró-Labore, INSS/IR e Contabilidade',
                detalhe: `Faturamento necessário estimado: R$ ${pjBreakEven.toFixed(2)} → DAS (${aliqSimplesPj}%): R$ ${resultadoPjBreakEven.dasSimples.toFixed(2)} | Pró-Labore Liq: R$ ${resultadoPjBreakEven.proLaboreLiquido.toFixed(2)} | Lucro Isento: R$ ${resultadoPjBreakEven.distribuicaoLucros.toFixed(2)}`,
                resultado: `R$ ${pjBreakEven.toFixed(2)} / mês (${multiplicadorPjBreakEven.toFixed(2)}x o salário CLT)`
            },
            {
                passo: 5,
                titulo: 'Diagnóstico da Proposta PJ Simulada',
                formula: 'Líquido no Bolso PJ Simulado vs Poder de Compra CLT',
                detalhe: `Faturamento PJ: R$ ${faturamentoPjEfetivo.toFixed(2)} → Sobra Real no Bolso: R$ ${resultadoPjSimulado.liquidoRealNoBolso.toFixed(2)} vs Poder de Compra CLT: R$ ${poderCompraTotalClt.toFixed(2)}`,
                resultado: diferencaMensalPjVsClt >= 0 
                    ? `PJ é vantajoso em +R$ ${diferencaMensalPjVsClt.toFixed(2)}/mês (+${percentualDiferenca.toFixed(1)}%)`
                    : `CLT é mais vantajoso em +R$ ${Math.abs(diferencaMensalPjVsClt).toFixed(2)}/mês (${percentualDiferenca.toFixed(1)}%)`
            }
        ]
    };
}

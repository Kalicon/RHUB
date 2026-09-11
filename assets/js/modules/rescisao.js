/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Módulo de Cálculo de Rescisão Contratual (CLT)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Legislação Aplicada:
 *   • Art. 477 CLT — Prazo e formalidades da rescisão
 *   • Art. 484-A CLT — Acordo mútuo de rescisão (Reforma Trabalhista)
 *   • Lei 12.506/2011 — Aviso prévio proporcional ao tempo de serviço
 *   • Art. 7º, XVII CF — Férias + 1/3 constitucional
 *   • Lei 4.090/62 — 13º Salário
 *   • Lei 8.036/90 — FGTS e multa rescisória
 * ═══════════════════════════════════════════════════════════════════════
 */

import { calcularINSS, calcularIRRF, DEDUCAO_DEPENDENTE_IRRF } from './tabelas.js';

/**
 * Motivos de desligamento e suas regras de elegibilidade.
 * Cada chave mapeia para as verbas devidas (true) ou não devidas (false).
 */
export const MOTIVOS_RESCISAO = {
    SEM_JUSTA_CAUSA: {
        label: 'Dispensa Sem Justa Causa',
        saldoSalario: true,
        avisoPrevio: true,       // Indenizado ou trabalhado
        avisoPreviewPercentual: 1.0, // 100% do aviso
        decimoTerceiro: true,
        feriasVencidas: true,
        feriasProporcionais: true,
        multaFGTS: true,
        percentualMultaFGTS: 0.40,  // 40%
        saqueFGTS: true,
        seguroDesemprego: true,
    },
    PEDIDO_DEMISSAO: {
        label: 'Pedido de Demissão',
        saldoSalario: true,
        avisoPrevio: true,       // Trabalhado (ou desconta se não cumprir)
        avisoPreviewPercentual: 1.0,
        decimoTerceiro: true,
        feriasVencidas: true,
        feriasProporcionais: true,
        multaFGTS: false,
        percentualMultaFGTS: 0,
        saqueFGTS: false,
        seguroDesemprego: false,
    },
    JUSTA_CAUSA: {
        label: 'Dispensa por Justa Causa (Art. 482)',
        saldoSalario: true,
        avisoPrevio: false,
        avisoPreviewPercentual: 0,
        decimoTerceiro: false,
        feriasVencidas: true,     // Férias vencidas são devidas mesmo na justa causa
        feriasProporcionais: false,
        multaFGTS: false,
        percentualMultaFGTS: 0,
        saqueFGTS: false,
        seguroDesemprego: false,
    },
    ACORDO_MUTUO: {
        label: 'Acordo Mútuo (Art. 484-A CLT)',
        saldoSalario: true,
        avisoPrevio: true,
        avisoPreviewPercentual: 0.5, // 50% do aviso prévio
        decimoTerceiro: true,
        feriasVencidas: true,
        feriasProporcionais: true,
        multaFGTS: true,
        percentualMultaFGTS: 0.20,  // 20%
        saqueFGTS: true,            // Limitado a 80%
        seguroDesemprego: false,
    }
};

/**
 * Calcula o número de dias do aviso prévio proporcional.
 * Lei 12.506/2011: 30 dias + 3 dias por ano de serviço, máximo 90 dias.
 *
 * @param {number} anosServico — Anos completos de serviço.
 * @returns {number} Dias de aviso prévio (30 a 90).
 */
export function calcularDiasAvisoPrevio(anosServico) {
    const anos = Math.max(0, Math.floor(Number(anosServico) || 0));
    // O primeiro ano já dá direito a 30 dias; a partir do 2º, +3 por ano
    const diasAdicionais = anos >= 1 ? (anos) * 3 : 0;
    return Math.min(90, 30 + diasAdicionais);
}

/**
 * Calcula o tempo de serviço em anos e meses entre duas datas.
 *
 * @param {string|Date} dataAdmissao
 * @param {string|Date} dataDemissao
 * @returns {{ anos: number, meses: number, diasRestantes: number, mesesTotais: number }}
 */
export function calcularTempoServico(dataAdmissao, dataDemissao) {
    const inicio = new Date(dataAdmissao);
    const fim = new Date(dataDemissao);

    if (isNaN(inicio.getTime()) || isNaN(fim.getTime()) || fim < inicio) {
        return { anos: 0, meses: 0, diasRestantes: 0, mesesTotais: 0 };
    }

    let anos = fim.getFullYear() - inicio.getFullYear();
    let meses = fim.getMonth() - inicio.getMonth();
    let dias = fim.getDate() - inicio.getDate();

    if (dias < 0) {
        meses--;
        // Dias no mês anterior ao mês de demissão
        const mesAnterior = new Date(fim.getFullYear(), fim.getMonth(), 0);
        dias += mesAnterior.getDate();
    }
    if (meses < 0) {
        anos--;
        meses += 12;
    }

    const mesesTotais = anos * 12 + meses;

    return { anos, meses, diasRestantes: dias, mesesTotais };
}

/**
 * Calcula os meses proporcionais para 13º salário.
 * Regra: mês com 15 ou mais dias trabalhados conta como mês integral.
 *
 * @param {string|Date} dataAdmissao
 * @param {string|Date} dataDemissao
 * @returns {number} Meses proporcionais (1 a 12).
 */
export function calcularMeses13o(dataAdmissao, dataDemissao) {
    const inicio = new Date(dataAdmissao);
    const fim = new Date(dataDemissao);
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) return 0;

    const anoRef = fim.getFullYear();
    // Início do período: 1º de janeiro do ano da demissão ou data de admissão (o que for maior)
    const inicioAno = new Date(anoRef, 0, 1);
    const periodoInicio = inicio > inicioAno ? inicio : inicioAno;

    let meses = 0;
    for (let m = periodoInicio.getMonth(); m <= fim.getMonth(); m++) {
        const inicioMes = new Date(anoRef, m, 1);
        const fimMes = new Date(anoRef, m + 1, 0);

        const de = periodoInicio > inicioMes ? periodoInicio : inicioMes;
        const ate = fim < fimMes ? fim : fimMes;

        const diasNoMes = Math.floor((ate - de) / (1000 * 60 * 60 * 24)) + 1;
        if (diasNoMes >= 15) meses++;
    }

    return Math.min(12, meses);
}

/**
 * Calcula meses proporcionais de férias no período aquisitivo atual.
 *
 * @param {string|Date} dataAdmissao
 * @param {string|Date} dataDemissao
 * @returns {{ mesesProporcionais: number, temFeriasVencidasAutomatico: boolean }}
 */
export function calcularProporcionalFerias(dataAdmissao, dataDemissao) {
    const inicio = new Date(dataAdmissao);
    const fim = new Date(dataDemissao);
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
        return { mesesProporcionais: 0, temFeriasVencidasAutomatico: false };
    }

    const ts = calcularTempoServico(dataAdmissao, dataDemissao);
    const temVencidas = ts.mesesTotais >= 12;

    // Meses proporcionais: os avos restantes após o último período aquisitivo completo
    const mesesProp = ts.mesesTotais % 12;
    // Se sobram dias >= 15, conta como mais 1 mês
    const mesesFinais = ts.diasRestantes >= 15 ? mesesProp + 1 : mesesProp;

    return {
        mesesProporcionais: Math.min(12, mesesFinais),
        temFeriasVencidasAutomatico: temVencidas
    };
}

/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  FUNÇÃO PRINCIPAL: Cálculo Completo da Rescisão Contratual │
 * └─────────────────────────────────────────────────────────────┘
 *
 * @param {Object} params
 * @param {number} params.salarioBase            — Salário mensal bruto.
 * @param {string} params.motivo                 — Chave do MOTIVOS_RESCISAO.
 * @param {string} params.dataAdmissao           — Data de admissão (YYYY-MM-DD).
 * @param {string} params.dataDemissao           — Data de demissão (YYYY-MM-DD).
 * @param {number} params.diasTrabalhadosMes     — Dias trabalhados no mês da rescisão.
 * @param {boolean} params.temFeriasVencidas     — Se há período aquisitivo completo vencido.
 * @param {number} params.saldoFGTS              — Saldo estimado do FGTS para multa.
 * @param {string} params.tipoAvisoPrevio        — 'indenizado', 'trabalhado', 'dispensado'.
 * @param {number} [params.dependentesIR=0]      — Nº de dependentes para dedução IRRF.
 *
 * @returns {Object} Resultado detalhado com verbas, deduções e líquido.
 */
export function calcularRescisao({
    salarioBase,
    motivo,
    dataAdmissao,
    dataDemissao,
    diasTrabalhadosMes,
    temFeriasVencidas = false,
    saldoFGTS = 0,
    tipoAvisoPrevio = 'indenizado',
    dependentesIR = 0
}) {
    const salario = Math.max(0, Number(salarioBase) || 0);
    const dias = Math.max(0, Math.min(30, Number(diasTrabalhadosMes) || 0));
    const fgts = Math.max(0, Number(saldoFGTS) || 0);
    const deps = Math.max(0, Math.floor(Number(dependentesIR) || 0));

    const regras = MOTIVOS_RESCISAO[motivo] || MOTIVOS_RESCISAO.SEM_JUSTA_CAUSA;
    const tempoServico = calcularTempoServico(dataAdmissao, dataDemissao);
    const meses13 = calcularMeses13o(dataAdmissao, dataDemissao);
    const propFerias = calcularProporcionalFerias(dataAdmissao, dataDemissao);

    // ═══ CÁLCULO DAS VERBAS ═══════════════════════════════════════

    // 1. Saldo de Salário
    const saldoSalario = regras.saldoSalario ? (salario / 30) * dias : 0;

    // 2. Aviso Prévio
    let diasAvisoPrevio = 0;
    let valorAvisoPrevio = 0;
    if (regras.avisoPrevio && tipoAvisoPrevio !== 'dispensado') {
        diasAvisoPrevio = calcularDiasAvisoPrevio(tempoServico.anos);
        valorAvisoPrevio = (salario / 30) * diasAvisoPrevio * regras.avisoPreviewPercentual;
        // Se trabalhado na demissão por pedido, o empregado deve cumprir ou desconta
        if (motivo === 'PEDIDO_DEMISSAO' && tipoAvisoPrevio === 'indenizado') {
            // Desconto se não cumprir (negativo)
            valorAvisoPrevio = -valorAvisoPrevio;
        }
    }

    // 3. 13º Salário Proporcional
    const valor13o = regras.decimoTerceiro ? (salario / 12) * meses13 : 0;

    // 4. Férias Vencidas + 1/3
    const usarFeriasVencidas = temFeriasVencidas || propFerias.temFeriasVencidasAutomatico;
    const valorFeriasVencidas = (regras.feriasVencidas && usarFeriasVencidas)
        ? salario + (salario / 3)
        : 0;

    // 5. Férias Proporcionais + 1/3
    const valorFeriasProporcionais = regras.feriasProporcionais
        ? ((salario / 12) * propFerias.mesesProporcionais) + (((salario / 12) * propFerias.mesesProporcionais) / 3)
        : 0;

    // 6. Multa FGTS
    const valorMultaFGTS = regras.multaFGTS ? fgts * regras.percentualMultaFGTS : 0;

    // ═══ TOTAIS ═══════════════════════════════════════════════════

    // Verbas tributáveis (incidem INSS e IRRF): saldo salário, 13º, aviso indenizado
    // Verbas indenizatórias (não tributáveis): férias + 1/3, multa FGTS
    const totalVerbasRescisoriaBruto = saldoSalario
        + Math.max(0, valorAvisoPrevio)
        + valor13o
        + valorFeriasVencidas
        + valorFeriasProporcionais
        + valorMultaFGTS;

    // Base tributável para INSS/IRRF (exclui férias e multa FGTS que são indenizatórias)
    const baseTributavel = saldoSalario
        + (tipoAvisoPrevio === 'trabalhado' ? Math.max(0, valorAvisoPrevio) : 0);
    // Nota: Aviso prévio indenizado não sofre INSS/IRRF (natureza indenizatória)
    // 13º tem tributação separada pelo INSS (calculado à parte na prática)

    // INSS sobre base tributável
    const inss = calcularINSS(baseTributavel);

    // IRRF sobre base = tributável − INSS − dependentes
    const baseIRRF = baseTributavel - inss.valor - (deps * DEDUCAO_DEPENDENTE_IRRF);
    const irrf = calcularIRRF(Math.max(0, baseIRRF));

    // INSS sobre 13º (cálculo separado)
    const inss13 = calcularINSS(valor13o);
    const baseIRRF13 = valor13o - inss13.valor - (deps * DEDUCAO_DEPENDENTE_IRRF);
    const irrf13 = calcularIRRF(Math.max(0, baseIRRF13));

    // Total de deduções
    const totalDeducoes = inss.valor + irrf.valor + inss13.valor + irrf13.valor
        + (valorAvisoPrevio < 0 ? Math.abs(valorAvisoPrevio) : 0);

    // Líquido a receber
    const liquidoRescisao = totalVerbasRescisoriaBruto - totalDeducoes;

    // ═══ VERBAS DETALHADAS ════════════════════════════════════════

    const verbas = [
        { nome: 'Saldo de Salário', valor: saldoSalario, detalhe: `${dias} dias trabalhados`, ativo: regras.saldoSalario, tipo: 'provento' },
        { nome: 'Aviso Prévio', valor: Math.abs(valorAvisoPrevio), detalhe: `${diasAvisoPrevio} dias (${tipoAvisoPrevio})${regras.avisoPreviewPercentual < 1 ? ' — 50%' : ''}`, ativo: regras.avisoPrevio && tipoAvisoPrevio !== 'dispensado', tipo: valorAvisoPrevio >= 0 ? 'provento' : 'desconto' },
        { nome: '13º Salário Proporcional', valor: valor13o, detalhe: `${meses13}/12 avos`, ativo: regras.decimoTerceiro, tipo: 'provento' },
        { nome: 'Férias Vencidas + 1/3', valor: valorFeriasVencidas, detalhe: 'Período aquisitivo completo', ativo: regras.feriasVencidas && usarFeriasVencidas, tipo: 'provento' },
        { nome: 'Férias Proporcionais + 1/3', valor: valorFeriasProporcionais, detalhe: `${propFerias.mesesProporcionais}/12 avos`, ativo: regras.feriasProporcionais, tipo: 'provento' },
        { nome: 'Multa Rescisória FGTS', valor: valorMultaFGTS, detalhe: `${(regras.percentualMultaFGTS * 100).toFixed(0)}% sobre R$ ${fgts.toFixed(2)}`, ativo: regras.multaFGTS, tipo: 'provento' },
    ];

    const deducoes = [
        { nome: 'INSS (Saldo + Aviso)', valor: inss.valor, detalhe: `Alíquota efetiva: ${inss.aliquotaEfetiva.toFixed(2)}%`, ativo: inss.valor > 0, tipo: 'desconto' },
        { nome: 'IRRF (Saldo + Aviso)', valor: irrf.valor, detalhe: `Faixa ${irrf.faixa}`, ativo: irrf.valor > 0, tipo: 'desconto' },
        { nome: 'INSS sobre 13º', valor: inss13.valor, detalhe: `Alíquota efetiva: ${inss13.aliquotaEfetiva.toFixed(2)}%`, ativo: inss13.valor > 0, tipo: 'desconto' },
        { nome: 'IRRF sobre 13º', valor: irrf13.valor, detalhe: `Faixa ${irrf13.faixa}`, ativo: irrf13.valor > 0, tipo: 'desconto' },
    ];

    if (valorAvisoPrevio < 0) {
        deducoes.push({
            nome: 'Desconto Aviso Prévio (não cumprido)',
            valor: Math.abs(valorAvisoPrevio),
            detalhe: `${diasAvisoPrevio} dias não trabalhados`,
            ativo: true,
            tipo: 'desconto'
        });
    }

    return {
        // Identificação
        motivo,
        motivoLabel: regras.label,
        tempoServico,
        diasAvisoPrevio,
        meses13,
        mesesFeriasProporcionais: propFerias.mesesProporcionais,

        // Valores
        saldoSalario,
        valorAvisoPrevio,
        valor13o,
        valorFeriasVencidas,
        valorFeriasProporcionais,
        valorMultaFGTS,

        // Totais
        totalVerbasRescisoriaBruto,
        totalDeducoes,
        liquidoRescisao,

        // Detalhamento
        verbas,
        deducoes,

        // Informações complementares
        saqueFGTS: regras.saqueFGTS,
        seguroDesemprego: regras.seguroDesemprego,
    };
}

/**
 * Simula e compara os 4 cenários de desligamento para os mesmos parâmetros contratuais.
 *
 * @param {Object} paramsBase — Parâmetros informados no formulário de rescisão.
 * @returns {Array<Object>} Comparativo estruturado dos 4 motivos.
 */
export function compararCenariosRescisao(paramsBase) {
    const motivos = [
        { chave: 'SEM_JUSTA_CAUSA', nome: 'Sem Justa Causa', cor: 'sky', tag: 'Maior Liquidez' },
        { chave: 'PEDIDO_DEMISSAO', nome: 'Pedido de Demissão', cor: 'amber', tag: 'Iniciativa Empregado' },
        { chave: 'JUSTA_CAUSA', nome: 'Justa Causa (Art. 482)', cor: 'rose', tag: 'Falta Grave' },
        { chave: 'ACORDO_MUTUO', nome: 'Acordo Mútuo (Art. 484-A)', cor: 'emerald', tag: 'Consensual' },
    ];

    return motivos.map(m => {
        const res = calcularRescisao({
            ...paramsBase,
            motivo: m.chave,
            // No acordo mútuo, aviso prévio é 50%; no pedido, se o tipo for trabalhado, cumpre
            tipoAvisoPrevio: m.chave === 'JUSTA_CAUSA' ? 'dispensado' : paramsBase.tipoAvisoPrevio
        });

        // Custo estimado para a empresa (Bruto + Multa FGTS)
        const custoEmpresa = res.totalVerbasRescisoriaBruto + (m.chave === 'SEM_JUSTA_CAUSA' ? res.valorMultaFGTS : (m.chave === 'ACORDO_MUTUO' ? res.valorMultaFGTS : 0));

        return {
            chave: m.chave,
            nome: m.nome,
            cor: m.cor,
            tag: m.tag,
            resultado: res,
            liquido: res.liquidoRescisao,
            bruto: res.totalVerbasRescisoriaBruto,
            deducoes: res.totalDeducoes,
            multaFGTS: res.valorMultaFGTS,
            saqueFGTS: res.saqueFGTS,
            seguroDesemprego: res.seguroDesemprego,
            custoEmpresa
        };
    });
}


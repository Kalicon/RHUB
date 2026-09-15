/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Módulo de Folha de Pagamento em Lote (Batch Payroll & Analytics)
 * Processamento Client-Side, Encargos Patronais e Dashboard Consolidado
 * ═══════════════════════════════════════════════════════════════════════
 */

import { calcularINSS, calcularIRRF } from './tabelas.js';
import { obterConfigCCT, calcularATS } from '../data/cct_config.js';

export const CONFIG_EMPRESA_PADRAO = {
    razaoSocial: 'EMPRESA DEMONSTRAÇÃO LTDA',
    cnpj: '12.345.678/0001-90',
    optanteSimples: false,    // Se true, INSS Patronal e Terceiros são isentos (Anexos I, II, III, V)
    aliquotaRat: 2.0,         // Riscos Ambientais do Trabalho (1% a 3%)
    fatorFap: 1.0,            // Fator Acidentário de Prevenção (0.5 a 2.0)
    aliquotaTerceiros: 5.8,   // Sistema S / Outras Entidades (ex: SESC, SENAC, SEBRAE, INCRA)
    mesReferencia: 'Setembro / 2026'
};

/**
 * Processa uma lista de colaboradores e calcula a folha completa
 * com proventos, descontos, salário líquido e encargos patronais da empresa.
 * 
 * @param {Array<object>} colaboradores 
 * @param {object} configEmpresa 
 * @returns {object} { resultados, resumo }
 */
export function processarFolhaLote(colaboradores = [], configEmpresa = {}) {
    const config = { ...CONFIG_EMPRESA_PADRAO, ...configEmpresa };
    const cct = obterConfigCCT();

    const resultados = [];

    let totalBruto = 0;
    let totalLiquido = 0;
    let totalInssEmpregados = 0;
    let totalIrrfEmpregados = 0;
    let totalFgts = 0;
    let totalInssPatronal = 0;
    let totalRatFap = 0;
    let totalTerceiros = 0;
    let totalProvisao13 = 0;
    let totalProvisaoFerias = 0;
    let totalCustoEmpresa = 0;

    colaboradores.forEach((colab, index) => {
        const matricula = colab.matricula || String(index + 1).padStart(3, '0');
        const nome = colab.nome || `Colaborador ${index + 1}`;
        const cargo = colab.cargo || 'Geral';
        const salarioBase = parseFloat(colab.salarioBase) || 0;
        const horasExtras50 = parseFloat(colab.horasExtras50) || 0;
        const horasExtras100 = parseFloat(colab.horasExtras100) || 0;
        const faltasDias = parseFloat(colab.faltasDias) || 0;
        const dependentes = parseInt(colab.dependentes, 10) || 0;
        const pensao = parseFloat(colab.pensao) || 0;
        const anosServico = parseFloat(colab.anosServico) || 0;
        const descontoVt = colab.descontoVt === true || colab.descontoVt === 'sim' || colab.descontoVt === 'SIM';

        // 1. Proventos
        const valorHoraNormal = salarioBase / 220;

        // Horas extras com taxa CCT se houver
        const taxaHe50 = cct.ativo ? (cct.horasExtras50Percentual || 50) : 50;
        const taxaHe100 = cct.ativo ? (cct.horasExtras100Percentual || 100) : 100;

        const totalHe50 = horasExtras50 * (valorHoraNormal * (1 + taxaHe50 / 100));
        const totalHe100 = horasExtras100 * (valorHoraNormal * (1 + taxaHe100 / 100));

        // DSR s/ horas extras (padrão 25 úteis e 5 repousos)
        const totalVariaveis = totalHe50 + totalHe100;
        const dsrHe = totalVariaveis > 0 ? (totalVariaveis / 25) * (cct.ativo && cct.sabadoComoDsr ? 9 : 5) : 0;

        // Adicional por Tempo de Serviço (CCT)
        const valorAts = cct.ativo ? calcularATS(salarioBase, anosServico, cct) : 0;

        const totalProventosBrutos = salarioBase + totalHe50 + totalHe100 + dsrHe + valorAts;

        // 2. Descontos
        const valorDiaSalario = salarioBase / 30;
        const valorFaltas = faltasDias * valorDiaSalario;

        // Base tributável INSS
        const baseCalculoInss = Math.max(0, totalProventosBrutos - valorFaltas);
        const resInss = calcularINSS(baseCalculoInss);
        const valorInss = resInss.valor;

        // Base tributável IRRF
        const baseCalculoIrrf = Math.max(0, baseCalculoInss - valorInss);
        const resIrrf = calcularIRRF(baseCalculoIrrf, dependentes, pensao, 0);
        const valorIrrf = resIrrf.valor;

        // Desconto de Vale-Transporte (máx 6% sobre salário base)
        const valorVtDesconto = descontoVt ? Math.min(salarioBase * 0.06, 350.00) : 0;

        const totalDescontos = valorFaltas + valorInss + valorIrrf + valorVtDesconto;
        const salarioLiquido = Math.max(0, totalProventosBrutos - totalDescontos);

        // 3. Encargos Patronais da Empresa
        const valorFgts = baseCalculoInss * 0.08;

        let inssPatronal = 0;
        let terceiros = 0;
        let ratFap = 0;

        if (!config.optanteSimples) {
            inssPatronal = baseCalculoInss * 0.20; // 20% INSS Patronal
            const aliquotaRatEfetiva = (config.aliquotaRat * config.fatorFap) / 100;
            ratFap = baseCalculoInss * aliquotaRatEfetiva;
            terceiros = baseCalculoInss * (config.aliquotaTerceiros / 100);
        }

        // Provisões mensais (1/12 avos)
        const provisao13 = totalProventosBrutos * (1 / 12); // 8.33%
        const provisaoFerias = totalProventosBrutos * (4 / 3) * (1 / 12); // 11.11%
        const encargosProvisoes = !config.optanteSimples 
            ? (provisao13 + provisaoFerias) * (0.08 + 0.20 + (config.aliquotaRat * config.fatorFap / 100) + (config.aliquotaTerceiros / 100))
            : (provisao13 + provisaoFerias) * 0.08;

        const custoEmpresa = totalProventosBrutos + valorFgts + inssPatronal + ratFap + terceiros + provisao13 + provisaoFerias + encargosProvisoes;

        // Acumular
        totalBruto += totalProventosBrutos;
        totalLiquido += salarioLiquido;
        totalInssEmpregados += valorInss;
        totalIrrfEmpregados += valorIrrf;
        totalFgts += valorFgts;
        totalInssPatronal += inssPatronal;
        totalRatFap += ratFap;
        totalTerceiros += terceiros;
        totalProvisao13 += provisao13;
        totalProvisaoFerias += provisaoFerias;
        totalCustoEmpresa += custoEmpresa;

        resultados.push({
            matricula,
            nome,
            cargo,
            salarioBase,
            horasExtras50,
            horasExtras100,
            faltasDias,
            dependentes,
            totalHe50,
            totalHe100,
            dsrHe,
            valorAts,
            totalProventosBrutos,
            valorFaltas,
            valorInss,
            aliquotaEfetivaInss: resInss.aliquotaEfetiva,
            valorIrrf,
            aliquotaEfetivaIrrf: resIrrf.aliquotaEfetiva,
            valorVtDesconto,
            totalDescontos,
            salarioLiquido,
            // Encargos
            valorFgts,
            inssPatronal,
            ratFap,
            terceiros,
            provisao13,
            provisaoFerias,
            custoEmpresa
        });
    });

    const resumo = {
        totalColaboradores: colaboradores.length,
        totalBruto,
        totalLiquido,
        totalInssEmpregados,
        totalIrrfEmpregados,
        totalFgts,
        totalInssPatronal,
        totalRatFap,
        totalTerceiros,
        totalTributosGoverno: totalInssEmpregados + totalIrrfEmpregados + totalFgts + totalInssPatronal + totalRatFap + totalTerceiros,
        totalProvisoes: totalProvisao13 + totalProvisaoFerias,
        totalCustoEmpresa
    };

    return { resultados, resumo, config };
}

/**
 * Gera um lote de demonstração com 8 colaboradores pré-configurados
 * @returns {Array<object>}
 */
export function gerarDemonstracaoFolha() {
    return [
        { matricula: '001', nome: 'Mariana Costa Silva', cargo: 'Gerente de RH', salarioBase: 8500, horasExtras50: 10, horasExtras100: 0, faltasDias: 0, dependentes: 2, descontoVt: false, anosServico: 5 },
        { matricula: '002', nome: 'Carlos Eduardo Santos', cargo: 'Desenvolvedor Pleno', salarioBase: 6200, horasExtras50: 15, horasExtras100: 4, faltasDias: 0, dependentes: 1, descontoVt: false, anosServico: 3 },
        { matricula: '003', nome: 'Ana Paula Ferreira', cargo: 'Analista Financeiro', salarioBase: 4200, horasExtras50: 0, horasExtras100: 0, faltasDias: 1, dependentes: 0, descontoVt: true, anosServico: 2 },
        { matricula: '004', nome: 'Lucas Oliveira Lima', cargo: 'Assistente Administrativo', salarioBase: 2500, horasExtras50: 8, horasExtras100: 0, faltasDias: 0, dependentes: 1, descontoVt: true, anosServico: 1 },
        { matricula: '005', nome: 'Beatriz Almeida Rocha', cargo: 'Designer UI/UX', salarioBase: 5000, horasExtras50: 5, horasExtras100: 0, faltasDias: 0, dependentes: 0, descontoVt: false, anosServico: 2 },
        { matricula: '006', nome: 'Rafael Nogueira Mendes', cargo: 'Operador de Logística', salarioBase: 1980, horasExtras50: 20, horasExtras100: 8, faltasDias: 0, dependentes: 3, descontoVt: true, anosServico: 4 },
        { matricula: '007', nome: 'Juliana Castro Souza', cargo: 'Recepcionista', salarioBase: 1650, horasExtras50: 0, horasExtras100: 0, faltasDias: 2, dependentes: 0, descontoVt: true, anosServico: 1 },
        { matricula: '008', nome: 'Fernando Albuquerque', cargo: 'Coordenador de TI', salarioBase: 9800, horasExtras50: 0, horasExtras100: 0, faltasDias: 0, dependentes: 2, descontoVt: false, anosServico: 6 }
    ];
}

/**
 * Converte string CSV para array de objetos estruturado
 * @param {string} csvText 
 * @returns {Array<object>}
 */
export function parsearCsvFolha(csvText) {
    if (!csvText || typeof csvText !== 'string') return [];
    const linhas = csvText.split(/\r?\n/).filter(l => l.trim() !== '');
    if (linhas.length < 2) return [];

    // Cabeçalho
    const cabecalho = linhas[0].split(/[;,]/).map(c => c.trim().toLowerCase());

    const colaboradores = [];
    for (let i = 1; i < linhas.length; i++) {
        const valores = linhas[i].split(/[;,]/).map(v => v.trim().replace(/^["']|["']$/g, ''));
        if (valores.length === 0 || !valores[0]) continue;

        const colab = {
            matricula: String(i).padStart(3, '0'),
            nome: valores[cabecalho.indexOf('nome')] || `Colaborador ${i}`,
            cargo: valores[cabecalho.indexOf('cargo')] || 'Geral',
            salarioBase: parseFloat(valores[cabecalho.indexOf('salariobase')]) || 0,
            horasExtras50: parseFloat(valores[cabecalho.indexOf('horasextras50')]) || 0,
            horasExtras100: parseFloat(valores[cabecalho.indexOf('horasextras100')]) || 0,
            faltasDias: parseFloat(valores[cabecalho.indexOf('faltasdias')]) || 0,
            dependentes: parseInt(valores[cabecalho.indexOf('dependentes')], 10) || 0,
            descontoVt: (valores[cabecalho.indexOf('descontovt')] || '').toLowerCase() === 'sim',
            anosServico: parseFloat(valores[cabecalho.indexOf('anosservico')]) || 0
        };

        if (colab.salarioBase > 0) {
            colaboradores.push(colab);
        }
    }

    return colaboradores;
}

/**
 * Gera o texto CSV padrão para o modelo de planilha
 * @returns {string}
 */
export function gerarCsvTemplate() {
    return 'Nome;Cargo;SalarioBase;HorasExtras50;HorasExtras100;FaltasDias;Dependentes;DescontoVT;AnosServico\n' +
           'João da Silva;Analista;4500.00;10;0;0;1;sim;2\n' +
           'Maria Oliveira;Coordenadora;7800.00;0;0;0;2;nao;4\n' +
           'Pedro Santos;Assistente;2100.00;15;4;1;0;sim;1';
}

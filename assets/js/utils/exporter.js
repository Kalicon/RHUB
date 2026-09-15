/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Módulo de Exportação Excel (.xlsx) e Resumo Textual
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Gera planilhas profissionais estruturadas para Microsoft Excel / Calc
 * utilizando a biblioteca SheetJS (XLSX).
 *
 * Cada planilha inclui:
 *   1. Cabeçalho oficial RHUB com dados da Empresa e Colaborador
 *   2. Data e hora da apuração e fundamentação legal
 *   3. Parâmetros informados (dados de entrada)
 *   4. Demonstrativo detalhado de proventos e deduções
 *   5. Memória de cálculo passo a passo auditável
 * ═══════════════════════════════════════════════════════════════════════
 */

import { formatCurrency, formatNumber } from './formatters.js';
import { getDadosCorporativos } from './storage.js';

/**
 * Retorna a data/hora formatada no padrão brasileiro (DD/MM/AAAA HH:mm)
 */
function getDataHoraAtual() {
    const agora = new Date();
    return agora.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

/**
 * Injeta o bloco com os dados de Empresa, Colaborador e Cargo se informados.
 */
function injetarDadosCorporativos(linhas) {
    const corp = getDadosCorporativos();
    if (corp.empresa || corp.colaborador) {
        linhas.push(['Empresa / Empregador:', corp.empresa || 'Não informado', 'Colaborador:', corp.colaborador || 'Não informado']);
        if (corp.cargo) {
            linhas.push(['Cargo / Função:', corp.cargo, '', '']);
        }
        linhas.push(['', '', '', '']);
    }
}

/**
 * Salva a planilha usando SheetJS ou dispara fallback em CSV caso XLSX não esteja disponível.
 */
function salvarPlanilha(linhas, nomeArquivo, nomeAba = 'Cálculo RHUB') {
    if (typeof window.XLSX === 'undefined') {
        console.warn('SheetJS (XLSX) não encontrado. Gerando CSV com BOM.');
        const csvContent = '\uFEFF' + linhas.map(row => 
            row.map(cell => {
                const str = String(cell ?? '');
                return str.includes(';') || str.includes('\n') || str.includes('"')
                    ? `"${str.replace(/"/g, '""')}"`
                    : str;
            }).join(';')
        ).join('\r\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${nomeArquivo}.csv`;
        link.click();
        return;
    }

    const wb = window.XLSX.utils.book_new();
    const ws = window.XLSX.utils.aoa_to_sheet(linhas);

    // Definir larguras de colunas adequadas
    ws['!cols'] = [
        { wch: 38 }, // Coluna A (Rótulo / Descrição)
        { wch: 25 }, // Coluna B (Valor / Dado)
        { wch: 45 }, // Coluna C (Fórmula / Detalhes)
        { wch: 20 }, // Coluna D (Resultado)
    ];

    window.XLSX.utils.book_append_sheet(wb, ws, nomeAba);
    window.XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
}

// ─────────────────────────────────────────────────────────────────────
// 1. EXPORTAÇÃO — ADICIONAL NOTURNO
// ─────────────────────────────────────────────────────────────────────
export function exportarNoturnoExcel(params, res) {
    const dataHora = getDataHoraAtual();
    const linhas = [
        ['RHUB — DEPARTAMENTO PESSOAL OPEN SOURCE', '', '', ''],
        ['RELATÓRIO DE CÁLCULO DE ADICIONAL NOTURNO & DSR', '', '', ''],
        ['Data/Hora de Emissão:', dataHora, 'Base Legal:', 'Art. 73 CLT / Súmula 172 TST'],
        ['', '', '', ''],
    ];

    injetarDadosCorporativos(linhas);

    linhas.push(
        ['═══ 1. PARÂMETROS INFORMADOS ═══', '', '', ''],
        ['Salário Base Mensal', formatCurrency(params.salarioBase), '', ''],
        ['Divisor Mensal (Carga Horária)', `${params.divisorMensal}h`, '', ''],
        ['Percentual do Adicional', `${params.percentualAdicional}%`, 'Mínimo CLT: 20%', ''],
        ['Horas Noturnas no Mês (Relógio)', `${params.horasNoturnasRelogio}h`, '', ''],
        ['Aplicação da Hora Ficta (52m30s)', params.aplicarHoraFicta ? 'Sim (Fator 1,1429)' : 'Não (Hora normal 60m)', 'Art. 73, § 1º CLT', ''],
        ['Dias Úteis no Mês', params.diasUteis, '', ''],
        ['Domingos e Feriados (DSRs)', params.domingosFeriados, '', ''],
        ['', '', '', ''],
        ['═══ 2. DEMONSTRATIVO DE RESULTADOS ═══', '', '', ''],
        ['Valor da Hora Normal', formatCurrency(res.valorHoraNormal), '', ''],
        ['Adicional Noturno por Hora', formatCurrency(res.adicionalPorHora), '', ''],
        ['Horas Noturnas Computadas (Ficta)', `${formatNumber(res.horasComputadas, 4)}h`, '', ''],
        ['Total de Adicional Noturno', formatCurrency(res.totalAdicionalNoturno), '', ''],
        ['Reflexo no DSR (Lei 605/49)', formatCurrency(res.valorDsr), '', ''],
        ['--------------------------------', '------------------', '', ''],
        ['TOTAL GERAL DE PROVENTOS NOTURNOS', formatCurrency(res.totalGeralProventos), '', ''],
        ['', '', '', ''],
        ['═══ 3. MEMÓRIA DE CÁLCULO AUDITÁVEL ═══', '', '', ''],
        ['Passo', 'Descrição', 'Fórmula', 'Resultado']
    );

    res.memoriaCalculo.forEach(p => {
        const val = p.titulo.toLowerCase().includes('hora') && !p.titulo.toLowerCase().includes('adicional')
            ? `${formatNumber(p.resultado, 4)}h`
            : formatCurrency(p.resultado);
        linhas.push([`Passo ${p.passo}: ${p.titulo}`, p.descricao, p.formula, val]);
    });

    salvarPlanilha(linhas, `RHUB_Adicional_Noturno_${new Date().toISOString().split('T')[0]}`, 'Adicional Noturno');
}

// ─────────────────────────────────────────────────────────────────────
// 2. EXPORTAÇÃO — RESCISÃO CONTRATUAL
// ─────────────────────────────────────────────────────────────────────
export function exportarRescisaoExcel(params, res) {
    const dataHora = getDataHoraAtual();
    const linhas = [
        ['RHUB — DEPARTAMENTO PESSOAL OPEN SOURCE', '', '', ''],
        ['DEMONSTRATIVO DE RESCISÃO DE CONTRATO DE TRABALHO', '', '', ''],
        ['Data/Hora de Emissão:', dataHora, 'Base Legal:', 'Art. 477 CLT / Lei 12.506/2011'],
        ['', '', '', ''],
    ];

    injetarDadosCorporativos(linhas);

    linhas.push(
        ['═══ 1. DADOS CONTRATUAIS INFORMADOS ═══', '', '', ''],
        ['Motivo do Desligamento', res.motivoLabel, '', ''],
        ['Salário Base', formatCurrency(params.salarioBase), '', ''],
        ['Data de Admissão', params.dataAdmissao, '', ''],
        ['Data de Demissão', params.dataDemissao, '', ''],
        ['Tempo de Serviço Apurado', `${res.tempoServico.anos} anos e ${res.tempoServico.meses} meses`, '', ''],
        ['Dias Trabalhados no Mês', params.diasTrabalhadosMes, '', ''],
        ['Tipo de Aviso Prévio', String(params.tipoAvisoPrevio || '').toUpperCase(), '', ''],
        ['Dias de Aviso Prévio (Lei 12.506)', `${res.diasAvisoPrevio} dias`, '', ''],
        ['Férias Vencidas Anteriores', params.temFeriasVencidas ? 'Sim' : 'Não', '', ''],
        ['Saldo FGTS Informado', formatCurrency(params.saldoFGTS), '', ''],
        ['Dependentes para IRRF', params.dependentesIR, '', ''],
        ['', '', '', ''],
        ['═══ 2. DISCRIMINAÇÃO DAS VERBAS RESCISÓRIAS ═══', '', '', ''],
        ['Verba / Parcela', 'Tipo', 'Base de Cálculo / Detalhe', 'Valor']
    );

    // Proventos
    res.verbas.filter(v => v.tipo === 'provento' && v.ativo).forEach(v => {
        linhas.push([v.nome, 'Provento (+)', v.detalhe, formatCurrency(v.valor)]);
    });

    linhas.push(['SUBTOTAL PROVENTOS BRUTOS', '', '', formatCurrency(res.totalVerbasRescisoriaBruto)]);
    linhas.push(['', '', '', '']);

    // Deduções
    linhas.push(['═══ 3. DEDUÇÕES PREVIDENCIÁRIAS E FISCAIS ═══', '', '', '']);
    res.deducoes.concat(res.verbas.filter(v => v.tipo === 'desconto' && v.ativo)).forEach(d => {
        linhas.push([d.nome, 'Desconto (−)', d.detalhe, formatCurrency(d.valor)]);
    });

    linhas.push(['SUBTOTAL DEDUÇÕES', '', '', formatCurrency(res.totalDeducoes)]);
    linhas.push(['--------------------------------', '------------------', '------------------', '------------------']);
    linhas.push(['VALOR LÍQUIDO A RECEBER', '', '', formatCurrency(res.liquidoRescisao)]);
    linhas.push(['', '', '', '']);

    // Direitos adicionais
    linhas.push(['═══ 4. DIREITOS E FGTS ═══', '', '', '']);
    linhas.push(['Direito ao Saque do FGTS?', res.saqueFGTS ? 'SIM (Disponível para saque)' : 'NÃO', '', '']);
    linhas.push(['Direito ao Seguro-Desemprego?', res.seguroDesemprego ? 'SIM (Encaminhamento permitido)' : 'NÃO', '', '']);

    salvarPlanilha(linhas, `RHUB_Rescisao_${new Date().toISOString().split('T')[0]}`, 'Rescisão Contratual');
}

// ─────────────────────────────────────────────────────────────────────
// 3. EXPORTAÇÃO — FALTAS E ATRASOS
// ─────────────────────────────────────────────────────────────────────
export function exportarFaltasExcel(params, res) {
    const dataHora = getDataHoraAtual();
    const linhas = [
        ['RHUB — DEPARTAMENTO PESSOAL OPEN SOURCE', '', '', ''],
        ['RELATÓRIO DE APURAÇÃO DE FALTAS, ATRASOS E DSR', '', '', ''],
        ['Data/Hora de Emissão:', dataHora, 'Base Legal:', 'Art. 462 e 130 CLT / Lei 605/49'],
        ['', '', '', ''],
    ];

    injetarDadosCorporativos(linhas);

    linhas.push(
        ['═══ 1. PARÂMETROS INFORMADOS ═══', '', '', ''],
        ['Salário Base Mensal', formatCurrency(params.salarioBase), '', ''],
        ['Divisor Mensal', `${params.divisorMensal}h`, '', ''],
        ['Valor do Dia de Trabalho', formatCurrency(res.valorDia), 'Salário ÷ 30', ''],
        ['Valor da Hora de Trabalho', formatCurrency(res.valorHora), 'Salário ÷ Divisor', ''],
        ['Dias de Falta Injustificada', `${params.diasFalta} dia(s)`, '', ''],
        ['Horas de Atraso no Mês', `${params.horasAtraso} hora(s)`, '', ''],
        ['DSRs Perdidos na Semana', `${params.dsrAfetados} descanso(s)`, 'Lei 605/49, Art. 6º', ''],
        ['Faltas no Período Aquisitivo', `${params.faltasPeriodoAquisitivo} falta(s)`, 'Simulação Art. 130 CLT', ''],
        ['', '', '', ''],
        ['═══ 2. DESCONTOS NO SALÁRIO DO MÊS ═══', '', '', ''],
        ['Desconto por Faltas', formatCurrency(res.descontoFaltas), `${params.diasFalta} dias × ${formatCurrency(res.valorDia)}`, ''],
        ['Desconto por Horas de Atraso', formatCurrency(res.descontoAtrasos), `${params.horasAtraso}h × ${formatCurrency(res.valorHora)}`, ''],
        ['Desconto por Perda de DSR', formatCurrency(res.descontoDSR), `${params.dsrAfetados} DSR × ${formatCurrency(res.valorDia)}`, ''],
        ['--------------------------------', '------------------', '', ''],
        ['TOTAL DE DESCONTOS NO MÊS', formatCurrency(res.totalDescontos), '', ''],
        ['SALÁRIO LÍQUIDO APÓS DESCONTOS', formatCurrency(res.salarioAposDescontos), 'Salário Base − Total Descontos', ''],
        ['', '', '', ''],
        ['═══ 3. IMPACTO NAS FÉRIAS (ART. 130 CLT) ═══', '', '', ''],
        ['Enquadramento Legal', res.impactoFerias.label, '', ''],
        ['Dias de Férias a que tem direito', `${res.impactoFerias.diasFerias} dias`, '', ''],
        ['Perda do Direito a Férias?', res.impactoFerias.perdeuDireito ? 'SIM (Mais de 32 faltas injustificadas)' : 'NÃO', '', ''],
        ['', '', '', ''],
        ['═══ 4. MEMÓRIA DE CÁLCULO AUDITÁVEL ═══', '', '', ''],
        ['Passo', 'Descrição', 'Fórmula', 'Resultado']
    );

    res.memoriaCalculo.forEach(p => {
        linhas.push([`Passo ${p.passo}: ${p.titulo}`, p.descricao, p.formula, formatCurrency(p.resultado)]);
    });

    salvarPlanilha(linhas, `RHUB_Faltas_Atrasos_${new Date().toISOString().split('T')[0]}`, 'Faltas e Atrasos');
}

// ─────────────────────────────────────────────────────────────────────
// 4. EXPORTAÇÃO — FÉRIAS & 13º SALÁRIO
// ─────────────────────────────────────────────────────────────────────
export function exportarFeriasExcel(params, resFerias, res13o) {
    const dataHora = getDataHoraAtual();
    const linhas = [
        ['RHUB — DEPARTAMENTO PESSOAL OPEN SOURCE', '', '', ''],
        ['RELATÓRIO DE CÁLCULO DE FÉRIAS E 13º SALÁRIO', '', '', ''],
        ['Data/Hora de Emissão:', dataHora, 'Base Legal:', 'Art. 129-145 CLT / Lei 4.090/62'],
        ['', '', '', ''],
    ];

    injetarDadosCorporativos(linhas);

    linhas.push(
        ['═══ 1. PARÂMETROS INFORMADOS ═══', '', '', ''],
        ['Salário Base Mensal', formatCurrency(params.salarioBase), '', ''],
        ['Dias de Férias Gozadas', `${params.diasFerias} dias`, '', ''],
        ['Abono Pecuniário (Venda 1/3)', params.abonoPecuniario ? 'Sim (10 dias)' : 'Não', 'Art. 143 CLT', ''],
        ['Férias em Dobro', params.feriasEmDobro ? 'Sim' : 'Não', 'Art. 137 CLT', ''],
        ['Meses Trabalhados no Ano (13º)', `${params.mesesTrabalhados}/12 avos`, 'Lei 4.090/62', ''],
        ['Dependentes para IRRF', params.dependentesIR, '', ''],
        ['', '', '', ''],
        ['═══ 2. DISCRIMINAÇÃO DE FÉRIAS ═══', '', '', ''],
        ['Remuneração Básica de Férias', formatCurrency(resFerias.remuneracaoFerias), `${params.diasFerias} dias`, ''],
        ['1/3 Constitucional de Férias', formatCurrency(resFerias.tercoConstitucional), 'Art. 7º, XVII CF', ''],
        ['Valor do Abono Pecuniário (10 dias)', formatCurrency(resFerias.valorAbonoPecuniario), params.abonoPecuniario ? 'Indenizado' : 'Não optou', ''],
        ['1/3 Constitucional do Abono', formatCurrency(resFerias.tercoAbonoPecuniario), params.abonoPecuniario ? 'Indenizado' : 'Não optou', ''],
        ['TOTAL BRUTO DE FÉRIAS', formatCurrency(resFerias.totalBrutoFerias), '', ''],
        ['(-) Desconto de INSS sobre Férias', formatCurrency(resFerias.descontoINSS), 'Tabela Progressiva 2024', ''],
        ['(-) Desconto de IRRF sobre Férias', formatCurrency(resFerias.descontoIRRF), 'Tabela Progressiva 2024', ''],
        ['TOTAL LÍQUIDO DE FÉRIAS', formatCurrency(resFerias.liquidoFerias), '', ''],
        ['', '', '', ''],
        ['═══ 3. DISCRIMINAÇÃO DO 13º SALÁRIO ═══', '', '', ''],
        ['Valor Bruto do 13º Salário', formatCurrency(res13o.valor13oBruto), `${params.mesesTrabalhados}/12 avos`, ''],
        ['(-) Desconto de INSS sobre 13º', formatCurrency(res13o.descontoINSS), 'Tabela Progressiva 2024', ''],
        ['(-) Desconto de IRRF sobre 13º', formatCurrency(res13o.descontoIRRF), 'Tabela Progressiva 2024', ''],
        ['TOTAL LÍQUIDO DO 13º SALÁRIO', formatCurrency(res13o.liquido13o), '', ''],
        ['', '', '', ''],
        ['═══ 4. CONSOLIDAÇÃO DOS PROVENTOS ═══', '', '', ''],
        ['Total Bruto Consolidado (Férias + 13º)', formatCurrency(resFerias.totalBrutoFerias + res13o.valor13oBruto), '', ''],
        ['Total de Deduções Previdenciárias/Fiscais', formatCurrency(resFerias.totalDeducoes + res13o.totalDeducoes), '', ''],
        ['TOTAL LÍQUIDO A RECEBER (FÉRIAS + 13º)', formatCurrency(resFerias.liquidoFerias + res13o.liquido13o), '', '']
    );

    salvarPlanilha(linhas, `RHUB_Ferias_13o_${new Date().toISOString().split('T')[0]}`, 'Férias e 13º');
}

// ─────────────────────────────────────────────────────────────────────
// 5. EXPORTAÇÃO — SALÁRIO LÍQUIDO / HOLERITE MENSAL
// ─────────────────────────────────────────────────────────────────────
export function exportarLiquidoExcel(params, res) {
    const dataHora = getDataHoraAtual();
    const linhas = [
        ['RHUB — DEPARTAMENTO PESSOAL OPEN SOURCE', '', '', ''],
        ['DEMONSTRATIVO DE PAGAMENTO MENSAL — HOLERITE', '', '', ''],
        ['Data/Hora de Emissão:', dataHora, 'Base Legal:', 'Art. 457 a 467 CLT / MP 1.206/2024'],
        ['', '', '', ''],
    ];

    injetarDadosCorporativos(linhas);

    linhas.push(
        ['═══ 1. PARÂMETROS CONTRATUAIS ═══', '', '', ''],
        ['Salário Base Mensal', formatCurrency(params.salarioBase), '', ''],
        ['Divisor Mensal', `${params.divisorMensal}h`, '', ''],
        ['Dependentes IRRF', params.dependentesIR, '', ''],
        ['Base de Cálculo do INSS', formatCurrency(res.baseINSS), '', ''],
        ['Base de Cálculo do IRRF', formatCurrency(res.baseIRRF), '', ''],
        ['FGTS Depositado (8% - Empresa)', formatCurrency(res.fgtsMes), 'Não descontado do trabalhador', ''],
        ['', '', '', ''],
        ['═══ 2. RUBRICAS DO CONTRACHEQUE (HOLERITE) ═══', '', '', ''],
        ['Cód.', 'Descrição da Rubrica', 'Referência', 'Proventos (+)', 'Descontos (−)']
    );

    // Proventos
    res.rubricasProventos.forEach(p => {
        linhas.push([p.codigo, p.nome, p.referencia, formatCurrency(p.valor), '']);
    });

    // Descontos
    res.rubricasDescontos.forEach(d => {
        linhas.push([d.codigo, d.nome, d.referencia, '', formatCurrency(d.valor)]);
    });

    linhas.push(
        ['--------------------------------', '------------------', '------------------', '------------------', '------------------'],
        ['TOTAIS CONSOLIDADOS', '', '', formatCurrency(res.totalBruto), formatCurrency(res.totalDescontos)],
        ['', '', '', '', ''],
        ['VALOR LÍQUIDO A RECEBER', '', '', '', formatCurrency(res.salarioLiquido)],
        ['', '', '', '', ''],
        ['═══ 3. MEMÓRIA DE CÁLCULO AUDITÁVEL ═══', '', '', '', ''],
        ['Passo', 'Descrição', 'Fórmula', 'Resultado', '']
    );

    res.memoriaCalculo.forEach(p => {
        linhas.push([`Passo ${p.passo}: ${p.titulo}`, p.descricao, p.formula, formatCurrency(p.resultado), '']);
    });

    salvarPlanilha(linhas, `RHUB_Holerite_Salario_Liquido_${new Date().toISOString().split('T')[0]}`, 'Holerite Mensal');
}

// ─────────────────────────────────────────────────────────────────────
// 6. EXPORTAÇÃO EXCEL: SIMULADOR CLT VS. PJ & CUSTOS
// ─────────────────────────────────────────────────────────────────────
export function exportarCltPjExcel(resultado) {
    const linhas = [
        ['RHUB — SISTEMA DE DEPARTAMENTO PESSOAL & CLT BRASILEIRA'],
        ['RELATÓRIO COMPARATIVO: CONTRATAÇÃO CLT VS. PRESTAÇÃO DE SERVIÇOS PJ'],
        [`Data da Apuração: ${getDataHoraAtual()}`],
        ['Base Legal: CLT, Lei 8.036/90 (FGTS), Lei 8.212/91 e LC 123/2006 (Simples Nacional)'],
        ['-----------------------------------------------------------------------------------------']
    ];

    injetarDadosCorporativos(linhas);

    const p = resultado.parametros;
    const emp = resultado.empresaClt;
    const trab = resultado.trabalhadorClt;
    const pj = resultado.pjSimulado;
    const be = resultado.pjBreakEven;

    linhas.push(
        ['═══ 1. PARÂMETROS DA SIMULAÇÃO ═══', '', '', ''],
        ['Salário Base CLT Nominal', formatCurrency(p.salarioBase), 'Regime da Empresa', p.regimeTributario === 'simples' ? 'Simples Nacional (Isento Cota Patronal)' : 'Lucro Presumido / Real'],
        ['Dependentes IRRF', p.dependentes, 'Benefícios Mensais Empresa', formatCurrency(p.totalBeneficiosEmpresa)],
        ['Alíquota Simples PJ', `${p.aliquotaSimplesPj}%`, 'Faturamento PJ Simulado', formatCurrency(p.faturamentoPjSimulado)],
        ['', '', '', ''],
        ['═══ 2. CUSTO TOTAL DA EMPRESA (CONTRATAÇÃO CLT) ═══', '', '', ''],
        ['Item de Custo', 'Valor Mensal', '% do Salário Base', 'Detalhamento'],
        ['Salário Base Contratual', formatCurrency(emp.salarioBase), '100,0%', 'Remuneração nominal em carteira'],
        ['FGTS Mensal (8%)', formatCurrency(emp.fgtsMensal), '8,0%', 'Depósito mensal obrigatório'],
        ['Provisão de 13º Salário (1/12)', formatCurrency(emp.provisao13), '8,3%', 'Provisão mensal acumulada'],
        ['Provisão de Férias e 1/3 (1/12 + 1/36)', formatCurrency(emp.provisaoFerias + emp.provisaoTercoFerias), '11,1%', 'Provisão de descanso remunerado'],
        ['FGTS s/ Provisões (13º e Férias)', formatCurrency(emp.fgtsSobreProvisoes), '1,6%', 'Incidência de 8% sobre provisões'],
        ['Encargos Patronais (INSS 20% + RAT + Terceiros)', formatCurrency(emp.totalEncargosPatronais + emp.encargosSobreProvisoes), p.regimeTributario === 'simples' ? '0,0% (Isento)' : '27,8%+', 'Previdência patronal e Sistema S'],
        ['Benefícios Concedidos (VR/VA, Saúde, etc.)', formatCurrency(emp.beneficiosEmpresa), '-', 'Auxílios e seguros corporativos'],
        ['CUSTO TOTAL MENSAL EMPRESA', formatCurrency(emp.custoTotalMensal), `${(emp.multiplicadorCusto * 100).toFixed(1)}%`, 'Desembolso total mensal'],
        ['CUSTO TOTAL ANUALIZADO', formatCurrency(emp.custoTotalAnual), '', '12 meses consolidados'],
        ['', '', '', ''],
        ['═══ 3. PODER DE COMPRA REAL DO TRABALHADOR CLT ═══', '', '', ''],
        ['Direito / Provento', 'Valor Mensal Equivalente', 'Observação', ''],
        ['Salário Líquido em Folha (Conta Corrente)', formatCurrency(trab.salarioLiquidoEmFolha), 'Após INSS e IRRF 2024', ''],
        ['13º Salário Líquido Mensalizado', formatCurrency(trab.decimoTerceiroLiquidoMensal), '1/12 do 13º líquido', ''],
        ['Adicional de Férias Líquido Mensalizado', formatCurrency(trab.adicionalFeriasLiquidoMensal), '1/12 do adicional de férias líquido', ''],
        ['FGTS Acumulado (Patrimônio)', formatCurrency(trab.fgtsAcumuladoMensal), '8% depositado mensalmente', ''],
        ['Benefícios Líquidos Recebidos', formatCurrency(trab.beneficiosRecebidosMensal), 'VR, VA, Saúde pagos pela empresa', ''],
        ['PODER DE COMPRA MENSAL CONSOLIDADO', formatCurrency(trab.poderCompraTotalMensal), 'Totalidade de rendimentos e patrimônio', ''],
        ['', '', '', ''],
        ['═══ 4. CENÁRIO PRESTAÇÃO DE SERVIÇOS PJ ═══', '', '', ''],
        ['Rubrica PJ', 'Valor Simulado', 'Detalhamento Fiscal / Operacional', ''],
        ['Faturamento Bruto Mensal', formatCurrency(pj.faturamentoBruto), 'Emissão de Nota Fiscal de Serviços', ''],
        ['DAS Simples Nacional', formatCurrency(pj.dasSimples), `Alíquota aplicada de ${p.aliquotaSimplesPj}%`, ''],
        ['Pró-Labore Bruto', formatCurrency(pj.proLaboreBruto), 'Definido para conformidade Fator R', ''],
        ['INSS s/ Pró-Labore (11%)', formatCurrency(pj.inssProLabore), 'Contribuição previdenciária individual', ''],
        ['IRRF s/ Pró-Labore', formatCurrency(pj.irrfProLabore), 'Retenção na fonte tabela progressiva', ''],
        ['Distribuição de Lucros Isenta', formatCurrency(pj.distribuicaoLucros), 'Livre de impostos para sócio/titular', ''],
        ['Custo com Contabilidade PJ', formatCurrency(pj.custoContabilidade), 'Honorários contábeis mensais', ''],
        ['Benefícios Pagos por Conta Própria', formatCurrency(pj.custoBeneficiosProprios), 'Plano de saúde / alimentação particular', ''],
        ['SOBRA LÍQUIDA REAL NO BOLSO (PJ)', formatCurrency(pj.liquidoRealNoBolso), 'Renda disponível real do profissional', ''],
        ['', '', '', ''],
        ['═══ 5. DIAGNÓSTICO & EQUIVALÊNCIA ═══', '', '', ''],
        ['Faturamento PJ para Empatar (Break-Even)', formatCurrency(be.faturamentoNecessario), `${be.multiplicadorSalario.toFixed(2)}x o salário base CLT`, ''],
        ['Diferença Mensal (PJ Simulado vs CLT)', formatCurrency(pj.diferencaVsPoderCompraClt), pj.isVantajosoPj ? 'PJ é mais vantajoso' : 'CLT é mais vantajoso', ''],
        ['Percentual de Diferença', `${pj.percentualDiferenca.toFixed(1)}%`, '', ''],
        ['', '', '', ''],
        ['═══ 6. MEMÓRIA DE CÁLCULO AUDITÁVEL ═══', '', '', ''],
        ['Passo', 'Título', 'Fórmula', 'Resultado']
    );

    resultado.memoriaCalculo.forEach(m => {
        linhas.push([`Passo ${m.passo}: ${m.titulo}`, m.formula, m.detalhe, m.resultado]);
    });

    salvarPlanilha(linhas, `RHUB_Comparativo_CLT_vs_PJ_${new Date().toISOString().split('T')[0]}`, 'CLT vs PJ');
}

// ─────────────────────────────────────────────────────────────────────
// 7. EXPORTAÇÃO EXCEL: BANCO DE HORAS & COMPENSAÇÃO (Art. 59 CLT)
// ─────────────────────────────────────────────────────────────────────
export function exportarBancoHorasExcel(resultado) {
    const linhas = [
        ['RHUB — DEMONSTRATIVO DE QUITAÇÃO DE BANCO DE HORAS', '', '', ''],
        ['Base Legal: Art. 59, §§ 2º, 3º e 5º da CLT & Súmula 172 do TST', '', '', ''],
        ['Data e Hora da Apuração:', getDataHoraAtual(), '', ''],
        ['', '', '', '']
    ];

    injetarDadosCorporativos(linhas);

    linhas.push(
        ['═══ 1. PARÂMETROS INFORMADOS ═══', '', '', ''],
        ['Salário Base Mensal', formatCurrency(resultado.salarioBase), '', ''],
        ['Divisor Mensal Contratual', `${resultado.divisorMensal}h`, '', ''],
        ['Saldo de Horas no Banco', `${resultado.saldoHoras}h`, '', ''],
        ['Tipo de Saldo', resultado.isCredito ? 'Crédito (Horas Extras a Pagar)' : 'Débito (Horas Não Trabalhadas a Descontar)', '', ''],
        ['Tipo de Acordo', resultado.tipoAcordo === 'individual' ? 'Acordo Individual (Prazo 6 meses)' : 'Acordo Coletivo (Prazo 1 ano)', '', ''],
        ['Adicional de Hora Extra', `${resultado.percentualAdicional}%`, '', ''],
        ['Dias Úteis no Mês', resultado.diasUteis, '', ''],
        ['Domingos e Feriados (DSR)', resultado.domingosFeriados, '', ''],
        ['', '', '', ''],
        ['═══ 2. APURAÇÃO FINANCEIRA ═══', '', '', ''],
        ['Valor da Hora Normal', formatCurrency(resultado.valorHoraNormal), '', ''],
        ['Valor da Hora com Adicional', formatCurrency(resultado.valorHoraExtra), '', ''],
        ['Total do Saldo de Horas', formatCurrency(resultado.totalHoras), '', ''],
        ['Reflexo no DSR (Súmula 172 TST)', formatCurrency(resultado.valorDsr), '', ''],
        ['TOTAL GERAL DA APURAÇÃO', formatCurrency(resultado.totalGeral), resultado.isCredito ? 'A Pagar ao Colaborador' : 'A Descontar em Folha/Rescisão', ''],
        ['', '', '', ''],
        ['═══ 3. MEMÓRIA DE CÁLCULO AUDITÁVEL ═══', '', '', ''],
        ['Passo', 'Título', 'Fórmula', 'Resultado']
    );

    resultado.memoriaCalculo.forEach(m => {
        linhas.push([`Passo ${m.passo}: ${m.titulo}`, m.formula, m.descricao, formatCurrency(m.resultado)]);
    });

    salvarPlanilha(linhas, `RHUB_Banco_Horas_${new Date().toISOString().split('T')[0]}`, 'Banco de Horas');
}

// ─────────────────────────────────────────────────────────────────────
// 8. EXPORTAÇÃO EXCEL: PARTICIPAÇÃO NOS LUCROS E RESULTADOS (PLR)
// ─────────────────────────────────────────────────────────────────────
export function exportarPlrExcel(resultado) {
    const linhas = [
        ['RHUB — DEMONSTRATIVO DE PARTICIPAÇÃO NOS LUCROS E RESULTADOS (PLR)', '', '', ''],
        ['Base Legal: Lei 10.101/2000, Lei 12.832/2013 & Tabela IRRF PLR da Receita Federal', '', '', ''],
        ['Data e Hora da Apuração:', getDataHoraAtual(), '', ''],
        ['', '', '', '']
    ];

    injetarDadosCorporativos(linhas);

    linhas.push(
        ['═══ 1. VALORES INFORMADOS & ANTECIPAÇÃO ═══', '', '', ''],
        ['Valor Bruto Total da PLR', formatCurrency(resultado.valorBrutoPLR), '', ''],
        ['Antecipação Paga Anteriormente (1ª Parcela)', formatCurrency(resultado.antecipacaoPaga), '', ''],
        ['Saldo Bruto a Pagar nesta Parcela', formatCurrency(resultado.saldoBrutoPagar), '', ''],
        ['', '', '', ''],
        ['═══ 2. TRIBUTAÇÃO EXCLUSIVA NA FONTE (IRRF PLR) ═══', '', '', ''],
        ['Faixa Aplicada da Tabela Oficial', resultado.faixaIRRF, '', ''],
        ['Alíquota Nominal da Faixa', `${resultado.aliquotaNominal}%`, '', ''],
        ['Dedução da Faixa', formatCurrency(resultado.deducaoIRRF), '', ''],
        ['Alíquota Efetiva Real', `${resultado.aliquotaEfetiva.toFixed(2)}%`, '', ''],
        ['IRRF Total Retido na Fonte', formatCurrency(resultado.irrfTotalDevido), '', ''],
        ['IRRF a Reter Nesta Parcela', formatCurrency(resultado.irrfAReter), '', ''],
        ['VALOR LÍQUIDO A RECEBER PELO COLABORADOR', formatCurrency(resultado.liquidoTotal), 'Isento de INSS e FGTS', ''],
        ['', '', '', ''],
        ['═══ 3. ECONOMIA TRIBUTÁRIA CORPORATIVA (ISENÇÕES LEGAIS) ═══', '', '', ''],
        ['FGTS Não Incidente (8%)', formatCurrency(resultado.fgtsEconomizado), 'Economia da Empresa', ''],
        ['INSS Patronal Não Incidente (20%)', formatCurrency(resultado.inssPatronalEconomizado), 'Economia da Empresa', ''],
        ['ECONOMIA TOTAL EM ENCARGOS TRABALHISTAS', formatCurrency(resultado.economiaTotalEmpresa), 'Vantagem da PLR vs Salário/Bônus', ''],
        ['', '', '', ''],
        ['═══ 4. MEMÓRIA DE CÁLCULO AUDITÁVEL ═══', '', '', ''],
        ['Passo', 'Título', 'Fórmula', 'Resultado']
    );

    resultado.memoriaCalculo.forEach(m => {
        linhas.push([`Passo ${m.passo}: ${m.titulo}`, m.formula, m.descricao, typeof m.resultado === 'number' ? formatCurrency(m.resultado) : m.resultado]);
    });

    salvarPlanilha(linhas, `RHUB_PLR_${new Date().toISOString().split('T')[0]}`, 'PLR');
}

// ─────────────────────────────────────────────────────────────────────
// 9. EXPORTAÇÃO EXCEL: TELETRABALHO & AJUDA DE CUSTO (CLT)
// ─────────────────────────────────────────────────────────────────────
export function exportarTeletrabalhoExcel(resultado) {
    const linhas = [
        ['RHUB — DEMONSTRATIVO DE AJUDA DE CUSTO PARA TELETRABALHO', '', '', ''],
        ['Base Legal: Art. 75-A a 75-E da CLT (Lei 13.467/2017 e Lei 14.442/2022)', '', '', ''],
        ['Data e Hora da Apuração:', getDataHoraAtual(), '', ''],
        ['', '', '', '']
    ];

    injetarDadosCorporativos(linhas);

    linhas.push(
        ['═══ 1. PARÂMETROS DE HOME OFFICE ═══', '', '', ''],
        ['Fatura Mensal de Internet Residencial', formatCurrency(resultado.faturaInternet), '', ''],
        ['Percentual Alocado ao Trabalho', `${resultado.percentualInternet}%`, '', ''],
        ['Potência dos Equipamentos (PC/Monitor)', `${resultado.potenciaEquipamentosWatts} W`, '', ''],
        ['Horas de Trabalho por Dia', `${resultado.horasTrabalhoDia}h`, '', ''],
        ['Tarifa de Energia Elétrica', `R$ ${resultado.tarifaEnergiaKwh.toFixed(2)} / kWh`, '', ''],
        ['Dias em Home Office no Mês', `${resultado.diasHomeOffice} dias`, '', ''],
        ['Auxílio Desgaste de Equipamentos / Ergonomia', formatCurrency(resultado.parcelaEquipamentos), '', ''],
        ['', '', '', ''],
        ['═══ 2. COMPOSIÇÃO DA AJUDA DE CUSTO SUGERIDA ═══', '', '', ''],
        ['Parcela de Internet Proporcional', formatCurrency(resultado.parcelaInternet), 'Sem natureza salarial', ''],
        ['Parcela de Energia Elétrica (Consumo)', formatCurrency(resultado.parcelaEnergia), `${resultado.consumoKwhMes.toFixed(2)} kWh consumidos`, ''],
        ['Auxílio Infraestrutura / Equipamentos', formatCurrency(resultado.parcelaEquipamentos), 'Art. 75-D CLT', ''],
        ['TOTAL DA AJUDA DE CUSTO MENSAL', formatCurrency(resultado.totalAjudaCusto), 'Isento de INSS, FGTS e IRRF', ''],
        ['', '', '', ''],
        ['═══ 3. BALANÇO COM VALE-TRANSPORTE PRESENCIAL ═══', '', '', ''],
        ['Tarifa Diária de Vale-Transporte', formatCurrency(resultado.valorVTDiario), '', ''],
        ['Total de VT Economizado no Mês', formatCurrency(resultado.vtEconomizado), '', ''],
        ['Saldo Líquido para a Empresa', formatCurrency(resultado.saldoEmpresa), resultado.empresaEconomizou ? 'Economia Positiva para a Empresa' : 'Custo Superior ao VT', ''],
        ['', '', '', ''],
        ['═══ 4. MEMÓRIA DE CÁLCULO AUDITÁVEL ═══', '', '', ''],
        ['Passo', 'Título', 'Fórmula', 'Resultado']
    );

    resultado.memoriaCalculo.forEach(m => {
        linhas.push([`Passo ${m.passo}: ${m.titulo}`, m.formula, m.descricao, typeof m.resultado === 'number' ? formatCurrency(m.resultado) : m.resultado]);
    });

    salvarPlanilha(linhas, `RHUB_Teletrabalho_${new Date().toISOString().split('T')[0]}`, 'Teletrabalho');
}

// ─────────────────────────────────────────────────────────────────────
// 10. EXPORTAÇÃO EXCEL: EQUIPARAÇÃO SALARIAL & PASSIVO (Art. 461 CLT)
// ─────────────────────────────────────────────────────────────────────
export function exportarEquiparacaoExcel(resultado) {
    const linhas = [
        ['RHUB — DEMONSTRATIVO DE EQUIPARAÇÃO SALARIAL & PASSIVO TRABALHISTA', '', '', ''],
        ['Base Legal: Art. 461 CLT, Súmula 6 TST e Lei 14.611/2023 (Igualdade Salarial)', '', '', ''],
        ['Data e Hora da Apuração:', getDataHoraAtual(), '', ''],
        ['', '', '', '']
    ];

    injetarDadosCorporativos(linhas);

    linhas.push(
        ['═══ 1. PARÂMETROS COMPARATIVOS ═══', '', '', ''],
        ['Salário Atual do Colaborador (Reclamante)', formatCurrency(resultado.salarioReclamante), '', ''],
        ['Salário do Paradigma (Equiparando)', formatCurrency(resultado.salarioParadigma), '', ''],
        ['Diferença Salarial Mensal', formatCurrency(resultado.diferencaMensal), '', ''],
        ['Período Apurado (Meses Imprescritos)', `${resultado.mesesPeriodo} meses`, '', ''],
        ['', '', '', ''],
        ['═══ 2. DISCRIMINAÇÃO DO PASSIVO & REFLEXOS LEGAIS ═══', '', '', ''],
        ['Total Nominal das Diferenças Salariais', formatCurrency(resultado.totalDiferencaNominal), '', ''],
        ['Reflexos em 13º Salário', formatCurrency(resultado.reflexo13o), '', ''],
        ['Reflexos em Férias + 1/3 Constitucional', formatCurrency(resultado.reflexoFeriasTerco), '', ''],
        ['Subtotal Remuneratório', formatCurrency(resultado.subtotalRemuneratorio), '', ''],
        ['Reflexos em Depósitos de FGTS (8%)', formatCurrency(resultado.valorFGTS), '', ''],
        ['Multa Rescisória de 40% s/ FGTS', formatCurrency(resultado.valorMultaFGTS), '', ''],
        ['Multa por Discriminação (Lei 14.611/2023)', formatCurrency(resultado.multaDiscriminacao), resultado.multaDiscriminacao > 0 ? 'Aplicada (10x novo salário)' : 'Não aplicável', ''],
        ['PASSIVO TRABALHISTA TOTAL ESTIMADO', formatCurrency(resultado.passivoTotal), '', ''],
        ['', '', '', ''],
        ['═══ 3. MEMÓRIA DE CÁLCULO AUDITÁVEL ═══', '', '', ''],
        ['Passo', 'Título', 'Fórmula', 'Resultado']
    );

    resultado.memoriaCalculo.forEach(m => {
        linhas.push([`Passo ${m.passo}: ${m.titulo}`, m.formula, m.descricao, typeof m.resultado === 'number' ? formatCurrency(m.resultado) : m.resultado]);
    });

    salvarPlanilha(linhas, `RHUB_Equiparacao_Salarial_${new Date().toISOString().split('T')[0]}`, 'Equiparação Salarial');
}

// ─────────────────────────────────────────────────────────────────────
// 11. UTILITÁRIO: COPIAR RESUMO PARA ÁREA DE TRANSFERÊNCIA
// ─────────────────────────────────────────────────────────────────────
export async function copiarTextoClipboard(texto) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(texto);
            return true;
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = texto;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        }
    } catch (err) {
        console.error('Falha ao copiar:', err);
        return false;
    }
}

// ─────────────────────────────────────────────────────────────────────
// 12. EXPORTAÇÃO — FOLHA DE PAGAMENTO EM LOTE (CONSOLIDADA)
// ─────────────────────────────────────────────────────────────────────
export function exportarFolhaLoteXLSX(dadosLote, resumo, configEmpresa = {}) {
    const dataHora = getDataHoraAtual();
    const linhas = [
        ['RHUB — DEPARTAMENTO PESSOAL OPEN SOURCE', '', '', '', '', '', '', '', '', ''],
        ['FOLHA DE PAGAMENTO MENSAL CONSOLIDADA — EM LOTE', '', '', '', '', '', '', '', '', ''],
        ['Empresa:', configEmpresa.razaoSocial || 'EMPRESA DEMONSTRAÇÃO LTDA', 'CNPJ:', configEmpresa.cnpj || '12.345.678/0001-90', 'Emissão:', dataHora, '', '', '', ''],
        ['Regime:', configEmpresa.optanteSimples ? 'Simples Nacional' : 'Lucro Presumido / Real', 'Mês Ref:', configEmpresa.mesReferencia || 'Setembro/2026', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
        ['═══ RESUMO EXECUTIVO DA FOLHA ═══', '', '', '', '', '', '', '', '', ''],
        ['Total de Colaboradores:', resumo.totalColaboradores, '', '', '', '', '', '', '', ''],
        ['Total Folha Bruta (Proventos):', formatCurrency(resumo.totalBruto), '', '', '', '', '', '', '', ''],
        ['Total Folha Líquida (A Pagar):', formatCurrency(resumo.totalLiquido), '', '', '', '', '', '', '', ''],
        ['Total INSS Empregados Retido:', formatCurrency(resumo.totalInssEmpregados), '', '', '', '', '', '', '', ''],
        ['Total IRRF Empregados Retido:', formatCurrency(resumo.totalIrrfEmpregados), '', '', '', '', '', '', '', ''],
        ['Total FGTS Mensal (8%):', formatCurrency(resumo.totalFgts), '', '', '', '', '', '', '', ''],
        ['Total INSS Patronal (20%):', formatCurrency(resumo.totalInssPatronal), '', '', '', '', '', '', '', ''],
        ['Total RAT/FAP da Empresa:', formatCurrency(resumo.totalRatFap), '', '', '', '', '', '', '', ''],
        ['Total Terceiros / Sistema S:', formatCurrency(resumo.totalTerceiros), '', '', '', '', '', '', '', ''],
        ['Total Tributos Gerados (Gov):', formatCurrency(resumo.totalTributosGoverno), '', '', '', '', '', '', '', ''],
        ['Custo Efetivo Total Empresa:', formatCurrency(resumo.totalCustoEmpresa), '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
        ['═══ DISCRIMINAÇÃO INDIVIDUAL POR COLABORADOR ═══', '', '', '', '', '', '', '', '', ''],
        [
            'Matrícula', 'Nome Completo', 'Cargo', 'Salário Base', 'H. Extras (R$)', 'DSR Extras',
            'Faltas (R$)', 'INSS (R$)', 'IRRF (R$)', 'Salário Líquido', 'FGTS (R$)', 'Custo Empresa (R$)'
        ]
    ];

    dadosLote.forEach(colab => {
        linhas.push([
            colab.matricula,
            colab.nome,
            colab.cargo,
            formatCurrency(colab.salarioBase),
            formatCurrency(colab.totalHe50 + colab.totalHe100),
            formatCurrency(colab.dsrHe),
            formatCurrency(colab.valorFaltas),
            formatCurrency(colab.valorInss),
            formatCurrency(colab.valorIrrf),
            formatCurrency(colab.salarioLiquido),
            formatCurrency(colab.valorFgts),
            formatCurrency(colab.custoEmpresa)
        ]);
    });

    salvarPlanilha(linhas, `RHUB_Folha_Lote_${new Date().toISOString().split('T')[0]}`, 'Folha Consolidada');
}

/**
 * Dispara o download do template CSV pré-formatado
 */
export function baixarTemplateCsvFolha(conteudoCsv) {
    const blob = new Blob(['\ufeff' + conteudoCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'RHUB_Modelo_Colaboradores.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}



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
// 6. UTILITÁRIO: COPIAR RESUMO PARA ÁREA DE TRANSFERÊNCIA
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

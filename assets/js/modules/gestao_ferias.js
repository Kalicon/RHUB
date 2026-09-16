/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Módulo de Gestão de Férias (HRMS Fase 02)
 * Períodos Aquisitivos, Agendamento, Provisão Financeira e Alertas
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Legislação:
 *   • Art. 129–145 CLT — Férias anuais remuneradas
 *   • Art. 130 CLT — Tabela proporcional de férias × faltas
 *   • Art. 134 § 1º CLT — Fracionamento em até 3 períodos
 *   • Art. 134 § 3º CLT — Vedação de início em véspera de repouso
 *   • Art. 137 CLT — Férias em dobro (período concessivo expirado)
 *   • Art. 143 CLT — Abono pecuniário (conversão 1/3 em dinheiro)
 *   • Art. 145 CLT — Pagamento até 2 dias antes do início
 * ═══════════════════════════════════════════════════════════════════════
 */

import { calcularINSS, calcularIRRF, DEDUCAO_DEPENDENTE_IRRF } from './tabelas.js';

/**
 * Tabela do Art. 130 CLT — Dias de férias em função das faltas injustificadas
 * no período aquisitivo.
 * @param {number} faltasInjustificadas
 * @returns {number} Dias de direito a férias
 */
export function calcularDiasDisponiveis(faltasInjustificadas = 0) {
    const faltas = Math.max(0, Math.floor(Number(faltasInjustificadas) || 0));
    if (faltas <= 5) return 30;
    if (faltas <= 14) return 24;
    if (faltas <= 23) return 18;
    if (faltas <= 32) return 12;
    return 0; // Mais de 32 faltas: perde o direito a férias
}

/**
 * Gera todos os períodos aquisitivos (PA) de um colaborador desde sua admissão.
 * 
 * Cada PA = 12 meses contados da admissão.
 * Cada Período Concessivo (PC) = 12 meses seguintes ao PA.
 * Se o PC expirou sem gozo → Art. 137 (férias em dobro).
 *
 * @param {string} dataAdmissaoStr 'YYYY-MM-DD'
 * @param {string} [dataBaseStr] 'YYYY-MM-DD' (padrão: hoje)
 * @param {Array} [feriasConcedidas=[]] Array de objetos { periodoAquisitivoInicio, status }
 * @returns {Array} Array de períodos aquisitivos com status calculado
 */
export function calcularPeriodosAquisitivos(dataAdmissaoStr, dataBaseStr, feriasConcedidas = []) {
    if (!dataAdmissaoStr) return [];

    const admissao = new Date(dataAdmissaoStr + 'T00:00:00');
    const base = dataBaseStr ? new Date(dataBaseStr + 'T00:00:00') : new Date();

    if (isNaN(admissao.getTime()) || isNaN(base.getTime()) || base < admissao) return [];

    const periodos = [];
    let cursor = new Date(admissao);
    let numero = 1;

    while (cursor < base) {
        const paInicio = new Date(cursor);
        const paFim = new Date(cursor);
        paFim.setFullYear(paFim.getFullYear() + 1);
        paFim.setDate(paFim.getDate() - 1);

        const pcInicio = new Date(paFim);
        pcInicio.setDate(pcInicio.getDate() + 1);
        const pcFim = new Date(pcInicio);
        pcFim.setFullYear(pcFim.getFullYear() + 1);
        pcFim.setDate(pcFim.getDate() - 1);

        // Verificar se o PA está completo (12 meses decorridos)
        const paCompleto = base >= paFim;

        // Verificar se existe agendamento de férias para este PA
        const paInicioStr = paInicio.toISOString().split('T')[0];
        const feriasDoPa = feriasConcedidas.filter(f =>
            f.periodoAquisitivoInicio === paInicioStr &&
            (f.status === 'concluida' || f.status === 'em_gozo' || f.status === 'agendada')
        );

        let status = 'aberto'; // Acumulando meses
        let alertaDobro = false;

        if (paCompleto) {
            if (feriasDoPa.length > 0) {
                const todasConcluidas = feriasDoPa.every(f => f.status === 'concluida');
                status = todasConcluidas ? 'gozado' : 'parcialmente_gozado';
                if (feriasDoPa.some(f => f.status === 'agendada')) status = 'agendado';
            } else if (base > pcFim) {
                status = 'vencido';
                alertaDobro = true;
            } else {
                status = 'disponivel';
            }
        }

        // Meses acumulados no PA (para provisão)
        const diffMeses = paCompleto
            ? 12
            : Math.max(0, (base.getFullYear() - paInicio.getFullYear()) * 12 + (base.getMonth() - paInicio.getMonth()));

        periodos.push({
            numero,
            paInicio: paInicioStr,
            paFim: paFim.toISOString().split('T')[0],
            pcInicio: pcInicio.toISOString().split('T')[0],
            pcFim: pcFim.toISOString().split('T')[0],
            paCompleto,
            mesesAcumulados: Math.min(12, diffMeses),
            status,
            alertaDobro,
            feriasConcedidas: feriasDoPa
        });

        cursor.setFullYear(cursor.getFullYear() + 1);
        numero++;

        // Segurança: limitar a 30 períodos
        if (numero > 30) break;
    }

    return periodos;
}

/**
 * Verifica se há colaboradores com férias vencidas (Art. 137 CLT).
 * @param {Array} colaboradores Array de colaboradores do cadastro
 * @param {Array} todasFerias Array de todos os agendamentos de férias
 * @param {string} [dataBaseStr] Data base para cálculo
 * @returns {Array} Array de alertas { colaboradorId, nome, paInicio, paFim, pcFim, diasVencidos }
 */
export function verificarAlertaFeriasVencidas(colaboradores, todasFerias = [], dataBaseStr) {
    const alertas = [];
    const base = dataBaseStr ? new Date(dataBaseStr + 'T00:00:00') : new Date();

    for (const c of colaboradores) {
        const adm = c.admissao || c.dataAdmissao;
        if (c.status === 'Desligado' || !adm) continue;

        const feriasDo = todasFerias.filter(f => f.colaboradorId === c.id);
        const pas = calcularPeriodosAquisitivos(adm, dataBaseStr, feriasDo);

        for (const pa of pas) {
            if (pa.alertaDobro) {
                const pcFim = new Date(pa.pcFim + 'T00:00:00');
                const diasVencidos = Math.floor((base.getTime() - pcFim.getTime()) / (1000 * 60 * 60 * 24));

                alertas.push({
                    colaboradorId: c.id,
                    nome: c.nome,
                    matricula: c.matricula,
                    paInicio: pa.paInicio,
                    paFim: pa.paFim,
                    pcFim: pa.pcFim,
                    diasVencidos
                });
            }
        }
    }

    return alertas;
}

/**
 * Valida um agendamento de férias contra as regras da CLT.
 * @param {object} params
 * @param {number} params.diasDireito Dias de direito (30, 24, 18, 12)
 * @param {boolean} params.abonoPecuniario Se vende 1/3 dos dias
 * @param {Array<object>} params.periodos Array de { dias, dataInicio }
 * @returns {object} { valido, erros, avisos, cronograma, diasGozo, diasAbono }
 */
export function validarAgendamentoFerias({
    diasDireito = 30,
    abonoPecuniario = false,
    periodos = []
}) {
    const erros = [];
    const avisos = [];

    const diasAbono = abonoPecuniario ? Math.floor(diasDireito / 3) : 0;
    const diasGozo = diasDireito - diasAbono;

    // Filtrar períodos válidos
    const periodosValidos = periodos
        .map(p => ({ dias: parseInt(p.dias, 10) || 0, dataInicio: p.dataInicio || '' }))
        .filter(p => p.dias > 0);

    const qtdPeriodos = periodosValidos.length;
    const somaDias = periodosValidos.reduce((acc, p) => acc + p.dias, 0);

    // 1. Quantidade de períodos (Art. 134 § 1º: até 3)
    if (qtdPeriodos > 3) {
        erros.push('O Art. 134, § 1º da CLT permite o fracionamento em no máximo 3 períodos.');
    }

    if (qtdPeriodos === 0) {
        erros.push('Defina pelo menos um período de férias.');
    }

    // 2. Soma dos dias
    if (somaDias !== diasGozo && qtdPeriodos > 0) {
        erros.push(`A soma dos períodos (${somaDias} dias) deve ser igual aos dias de gozo (${diasGozo} dias).`);
    }

    // 3. Regras de duração mínima quando fracionado
    if (qtdPeriodos > 1) {
        const temMaiorQue14 = periodosValidos.some(p => p.dias >= 14);
        if (!temMaiorQue14) {
            erros.push('Pelo menos um dos períodos deve ter no mínimo 14 dias corridos (Art. 134, § 1º).');
        }

        const temMenorQue5 = periodosValidos.some(p => p.dias < 5);
        if (temMenorQue5) {
            erros.push('Nenhum período pode ser inferior a 5 dias corridos (Art. 134, § 1º).');
        }
    }

    // 4. Vedação de início em quinta/sexta (Art. 134 § 3º)
    const cronograma = [];
    for (const p of periodosValidos) {
        if (p.dataInicio) {
            const dt = new Date(p.dataInicio + 'T00:00:00');
            if (!isNaN(dt.getTime())) {
                const diaSemana = dt.getDay();
                if (diaSemana === 4 || diaSemana === 5) {
                    avisos.push(`Período de ${p.dias} dias iniciando em ${diaSemana === 4 ? 'quinta' : 'sexta'}-feira viola o Art. 134, § 3º CLT.`);
                }

                const dtFim = new Date(dt);
                dtFim.setDate(dtFim.getDate() + p.dias - 1);
                const dtRetorno = new Date(dtFim);
                dtRetorno.setDate(dtRetorno.getDate() + 1);

                // Pagamento: 2 dias antes do início (Art. 145)
                const dtPagamento = new Date(dt);
                dtPagamento.setDate(dtPagamento.getDate() - 2);

                cronograma.push({
                    dias: p.dias,
                    dataInicio: p.dataInicio,
                    dataFim: dtFim.toISOString().split('T')[0],
                    dataRetorno: dtRetorno.toISOString().split('T')[0],
                    dataLimitePagamento: dtPagamento.toISOString().split('T')[0]
                });
            }
        }
    }

    return {
        valido: erros.length === 0,
        diasDireito,
        diasGozo,
        diasAbono,
        qtdPeriodos,
        somaDias,
        erros,
        avisos,
        cronograma
    };
}

/**
 * Calcula o valor financeiro detalhado de um agendamento de férias.
 * @param {object} params
 * @param {number} params.salarioBase
 * @param {number} params.diasFerias Dias de gozo
 * @param {boolean} params.abonoPecuniario
 * @param {boolean} params.feriasEmDobro
 * @param {number} params.dependentesIR
 * @returns {object} { bruto, terco, abono, tercoAbono, deducoes, liquido, detalhamento }
 */
export function calcularValorFerias({
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

    let valorBase = valorDia * dias;
    let terco = valorBase / 3;
    const multiplicador = feriasEmDobro ? 2 : 1;

    valorBase *= multiplicador;
    terco *= multiplicador;

    let diasAbono = 0;
    let valorAbono = 0;
    let tercoAbono = 0;

    if (abonoPecuniario) {
        diasAbono = Math.floor(dias / 3);
        valorAbono = valorDia * diasAbono * multiplicador;
        tercoAbono = valorAbono / 3;
    }

    const totalBruto = valorBase + terco + valorAbono + tercoAbono;

    // Base tributável (abono pecuniário é isento de INSS/IRRF)
    const baseTributavel = valorBase + terco;
    const inss = calcularINSS(baseTributavel);
    const baseIRRF = baseTributavel - inss.valor - (deps * DEDUCAO_DEPENDENTE_IRRF);
    const irrf = calcularIRRF(Math.max(0, baseIRRF));

    const totalDeducoes = inss.valor + irrf.valor;
    const liquido = totalBruto - totalDeducoes;

    return {
        salarioBase: salario,
        diasFerias: dias,
        diasAbono,
        feriasEmDobro,
        valorBase: Math.round(valorBase * 100) / 100,
        tercoConstitucional: Math.round(terco * 100) / 100,
        valorAbono: Math.round(valorAbono * 100) / 100,
        tercoAbono: Math.round(tercoAbono * 100) / 100,
        totalBruto: Math.round(totalBruto * 100) / 100,
        inss,
        irrf,
        totalDeducoes: Math.round(totalDeducoes * 100) / 100,
        liquido: Math.round(liquido * 100) / 100
    };
}

/**
 * Calcula a provisão financeira mensal de férias para um conjunto de colaboradores.
 * Provisão = (Salário + 1/3) / 12 × meses acumulados no PA aberto.
 *
 * @param {Array} colaboradores Array de colaboradores do cadastro
 * @param {Array} todasFerias Array de todos os agendamentos
 * @param {string} [dataBaseStr]
 * @returns {object} { totalProvisao, porDepartamento, detalhamento }
 */
export function calcularProvisaoFerias(colaboradores, todasFerias = [], dataBaseStr) {
    const detalhamento = [];
    const porDepartamento = {};
    let totalProvisao = 0;

    for (const c of colaboradores) {
        const adm = c.admissao || c.dataAdmissao;
        if (c.status === 'Desligado' || !adm) continue;

        const salario = Number(c.salarioBase) || 0;
        const feriasDo = todasFerias.filter(f => f.colaboradorId === c.id);
        const pas = calcularPeriodosAquisitivos(adm, dataBaseStr, feriasDo);

        // Provisionar apenas PAs abertos ou disponíveis (não gozados)
        let provisaoColab = 0;
        for (const pa of pas) {
            if (pa.status === 'aberto' || pa.status === 'disponivel' || pa.status === 'vencido') {
                const meses = pa.mesesAcumulados;
                // Provisão = (salário + 1/3) / 12 × meses acumulados
                const provisaoPa = ((salario + salario / 3) / 12) * meses;
                provisaoColab += provisaoPa;
            }
        }

        provisaoColab = Math.round(provisaoColab * 100) / 100;

        const depto = c.departamento || 'Geral';
        if (!porDepartamento[depto]) porDepartamento[depto] = 0;
        porDepartamento[depto] += provisaoColab;
        totalProvisao += provisaoColab;

        detalhamento.push({
            colaboradorId: c.id,
            nome: c.nome,
            departamento: depto,
            salarioBase: salario,
            provisao: provisaoColab,
            periodosAbertos: pas.filter(p => p.status !== 'gozado').length
        });
    }

    // Arredondar departamentos
    for (const depto in porDepartamento) {
        porDepartamento[depto] = Math.round(porDepartamento[depto] * 100) / 100;
    }

    return {
        totalProvisao: Math.round(totalProvisao * 100) / 100,
        porDepartamento,
        detalhamento
    };
}

/**
 * Gera dados para a timeline/mapa anual de férias.
 * @param {Array} colaboradores
 * @param {Array} todasFerias Agendamentos com periodos[]
 * @param {number} ano Ano para exibição (ex: 2026)
 * @returns {Array} Array de { colaborador, barras[] } para renderização
 */
export function gerarMapaAnualFerias(colaboradores, todasFerias = [], ano = new Date().getFullYear()) {
    const mapaAnual = [];
    const anoInicio = new Date(ano, 0, 1);
    const anoFim = new Date(ano, 11, 31);

    for (const c of colaboradores) {
        if (c.status === 'Desligado') continue;

        const feriasDo = todasFerias.filter(f => f.colaboradorId === c.id);
        const barras = [];

        for (const f of feriasDo) {
            if (!f.periodos || !Array.isArray(f.periodos)) continue;

            for (const p of f.periodos) {
                if (!p.dataInicio || !p.dataFim) continue;
                const dtInicio = new Date(p.dataInicio + 'T00:00:00');
                const dtFim = new Date(p.dataFim + 'T00:00:00');

                // Verificar se o período se sobrepõe ao ano selecionado
                if (dtFim < anoInicio || dtInicio > anoFim) continue;

                // Calcular posição percentual no ano (0-100%)
                const inicioClamp = Math.max(dtInicio.getTime(), anoInicio.getTime());
                const fimClamp = Math.min(dtFim.getTime(), anoFim.getTime());
                const totalDiasAno = (anoFim.getTime() - anoInicio.getTime()) / (1000 * 60 * 60 * 24);

                const leftPct = ((inicioClamp - anoInicio.getTime()) / (1000 * 60 * 60 * 24)) / totalDiasAno * 100;
                const widthPct = ((fimClamp - inicioClamp) / (1000 * 60 * 60 * 24) + 1) / totalDiasAno * 100;

                let cor = 'bg-blue-500'; // agendada
                if (f.status === 'concluida') cor = 'bg-emerald-500';
                if (f.status === 'em_gozo') cor = 'bg-amber-500';
                if (f.feriasEmDobro) cor = 'bg-rose-500';

                barras.push({
                    leftPct: Math.round(leftPct * 100) / 100,
                    widthPct: Math.max(0.5, Math.round(widthPct * 100) / 100),
                    cor,
                    dias: p.dias || Math.ceil((fimClamp - inicioClamp) / (1000 * 60 * 60 * 24)) + 1,
                    dataInicio: p.dataInicio,
                    dataFim: p.dataFim,
                    status: f.status
                });
            }
        }

        mapaAnual.push({
            colaboradorId: c.id,
            nome: c.nome,
            matricula: c.matricula,
            avatarBg: c.avatarBg || '#3b82f6',
            iniciais: c.iniciais || c.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase(),
            barras
        });
    }

    return mapaAnual;
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Módulo de Gestão de Ponto Eletrônico & Espelho de Ponto (Fase 03)
 * Portaria MTE 671/2021 & Artigos 58, 59, 71 e 73 da CLT
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Regras Legais:
 *   • Art. 58 CLT — Jornada normal de até 8h diárias e 44h semanais
 *   • Art. 58 § 1º CLT — Tolerância de até 5 min por batida, máx. 10 min/dia
 *   • Art. 59 CLT — Horas extras a 50% (dias úteis) e 100% (DSR / Feriados)
 *   • Art. 71 CLT — Intervalo intrajornada (mínimo de 1h para jornadas > 6h)
 *   • Art. 73 CLT — Horário noturno (22h às 5h) com redução ficta de 52m30s
 *   • Lei 605/1949 — Descanso Semanal Remunerado (DSR)
 *   • Portaria MTE 671/2021 — Relatório Espelho de Ponto Eletrônico
 * ═══════════════════════════════════════════════════════════════════════
 */

// Fator de redução da hora noturna (60 min / 52.5 min = 1.142857)
export const FATOR_HORA_FICTA = 60 / 52.5;

// Feriados Nacionais Fixos no Brasil (mês-dia)
export const FERIADOS_NACIONAIS_FIXOS = [
    '01-01', // Confraternização Universal
    '04-21', // Tiradentes
    '05-01', // Dia Mundial do Trabalho
    '09-07', // Independência do Brasil
    '10-12', // Nossa Senhora Aparecida
    '11-02', // Finados
    '11-15', // Proclamação da República
    '11-20', // Dia Nacional de Zumbi e da Consciência Negra
    '12-25'  // Natal
];

/**
 * Converte string de horário 'HH:MM' em minutos desde a meia-noite.
 * @param {string} horaStr 'HH:MM'
 * @returns {number|null} Minutos ou null se inválido
 */
export function converterHoraParaMinutos(horaStr) {
    if (!horaStr || typeof horaStr !== 'string' || !horaStr.includes(':')) return null;
    const [h, m] = horaStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return (h * 60) + m;
}

/**
 * Converte minutos para string formatada 'HH:MM'.
 * @param {number} totalMinutos
 * @param {boolean} [incluirSinal=false]
 * @returns {string} 'HH:MM' ou '+HH:MM' / '-HH:MM'
 */
export function converterMinutosParaHora(totalMinutos, incluirSinal = false) {
    if (totalMinutos === null || totalMinutos === undefined || isNaN(totalMinutos)) return '00:00';
    const negativo = totalMinutos < 0;
    const absMin = Math.abs(Math.round(totalMinutos));
    const h = Math.floor(absMin / 60);
    const m = absMin % 60;
    const formatada = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    if (incluirSinal) {
        return negativo ? `-${formatada}` : `+${formatada}`;
    }
    return formatada;
}

/**
 * Verifica se uma data é feriado nacional fixo.
 * @param {number} ano
 * @param {number} mes 1 a 12
 * @param {number} dia 1 a 31
 * @returns {boolean}
 */
export function verificarFeriado(ano, mes, dia) {
    const mm = String(mes).padStart(2, '0');
    const dd = String(dia).padStart(2, '0');
    return FERIADOS_NACIONAIS_FIXOS.includes(`${mm}-${dd}`);
}

/**
 * Calcula os minutos de trabalho compreendidos no período noturno (22:00 às 05:00)
 * e aplica o fator de hora ficta reduzida (Art. 73 CLT).
 * @param {number} iniMin Minuto inicial (0 a 1440)
 * @param {number} fimMin Minuto final (0 a 1440 ou > 1440 se virada de noite)
 * @returns {number} Minutos noturnos fictos convertidos
 */
export function calcularMinutosNoturnosFictos(iniMin, fimMin) {
    if (iniMin === null || fimMin === null || fimMin <= iniMin) return 0;

    let minutosNoturnosReais = 0;

    // Janela 1: 00:00 a 05:00 (0 a 300 min)
    const inicioMadrugada = Math.max(iniMin, 0);
    const fimMadrugada = Math.min(fimMin, 300);
    if (fimMadrugada > inicioMadrugada) {
        minutosNoturnosReais += (fimMadrugada - inicioMadrugada);
    }

    // Janela 2: 22:00 a 24:00 (1320 a 1440 min)
    const inicioNoite = Math.max(iniMin, 1320);
    const fimNoite = Math.min(fimMin, 1440);
    if (fimNoite > inicioNoite) {
        minutosNoturnosReais += (fimNoite - inicioNoite);
    }

    // Janela 3: Para turnos que passam da meia-noite (fimMin > 1440) até as 5:00 do dia seguinte (1440 a 1740 min)
    if (fimMin > 1440) {
        const inicioProxMadrugada = Math.max(iniMin, 1440);
        const fimProxMadrugada = Math.min(fimMin, 1740);
        if (fimProxMadrugada > inicioProxMadrugada) {
            minutosNoturnosReais += (fimProxMadrugada - inicioProxMadrugada);
        }
    }

    // Aplicar a hora ficta reduzida do Art. 73 CLT (1h normal = 52m30s noturna)
    return Math.round(minutosNoturnosReais * FATOR_HORA_FICTA);
}

/**
 * Gera a grade de dias mensal completa para um colaborador específico com base
 * na sua escala de trabalho contratual (5x2, 6x1 ou 12x36).
 *
 * @param {object} colaborador
 * @param {number} ano
 * @param {number} mes 1 a 12
 * @returns {Array<object>} Array de dias estruturados
 */
export function gerarGradeMensalPonto(colaborador = {}, ano, mes) {
    const totalDias = new Date(ano, mes, 0).getDate();
    const escala = colaborador.escala || '5x2';
    const entradaPadrao = colaborador.horarioEntrada || '08:00';
    const saidaPadrao = colaborador.horarioSaida || '17:48';
    const intervaloPadrao = colaborador.intervalo || '01:00';

    // Determinar horário de almoço padrão
    const minEntrada = converterHoraParaMinutos(entradaPadrao) || 480;
    const minIntervalo = converterHoraParaMinutos(intervaloPadrao) || 60;
    const minSaidaAlmoco = minEntrada + 240; // 4 horas de trabalho
    const minRetornoAlmoco = minSaidaAlmoco + minIntervalo;

    const almocoSaidaPadrao = converterMinutosParaHora(minSaidaAlmoco);
    const almocoRetornoPadrao = converterMinutosParaHora(minRetornoAlmoco);

    // Calcular minutos previstos por dia útil de acordo com a escala
    let minutosPrevistosPadrao = 528; // 8h48min para escala 5x2 (44h semanais)
    if (escala === '6x1') {
        minutosPrevistosPadrao = 440; // 7h20min para escala 6x1 (44h semanais)
    } else if (escala === '12x36') {
        minutosPrevistosPadrao = 720; // 12 horas de trabalho
    }

    const nomesDiasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const dias = [];

    for (let dia = 1; dia <= totalDias; dia++) {
        const dt = new Date(ano, mes - 1, dia);
        const diaSemanaNum = dt.getDay(); // 0 = Domingo, 6 = Sábado
        const diaSemana = nomesDiasSemana[diaSemanaNum];
        const dataIso = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

        const isFeriado = verificarFeriado(ano, mes, dia);
        let tipoDia = 'util';

        if (isFeriado) {
            tipoDia = 'feriado';
        } else if (escala === '5x2') {
            if (diaSemanaNum === 0 || diaSemanaNum === 6) tipoDia = 'dsr';
        } else if (escala === '6x1') {
            if (diaSemanaNum === 0) tipoDia = 'dsr';
        } else if (escala === '12x36') {
            // Em escala 12x36 alterna dia de trabalho e folga
            tipoDia = (dia % 2 === 1) ? 'util' : 'folga_12x36';
        }

        const previstoMinutos = (tipoDia === 'util') ? minutosPrevistosPadrao : 0;

        dias.push({
            dia,
            dataIso,
            diaSemana,
            diaSemanaNum,
            tipoDia,
            previstoMinutos,
            previstoFormatado: converterMinutosParaHora(previstoMinutos),
            horarioPrevisto: {
                e1: tipoDia === 'util' ? entradaPadrao : '',
                s1: tipoDia === 'util' ? almocoSaidaPadrao : '',
                e2: tipoDia === 'util' ? almocoRetornoPadrao : '',
                s2: tipoDia === 'util' ? saidaPadrao : ''
            },
            // Marcações reais do ponto
            e1: '',
            s1: '',
            e2: '',
            s2: '',
            justificativa: '',
            observacao: '',
            // Totais calculados
            trabalhadosMinutos: 0,
            trabalhadosFormatado: '00:00',
            intervaloMinutos: 0,
            intervaloFormatado: '00:00',
            he50Minutos: 0,
            he50Formatado: '00:00',
            he100Minutos: 0,
            he100Formatado: '00:00',
            noturnoMinutos: 0,
            noturnoFormatado: '00:00',
            saldoMinutos: 0,
            saldoFormatado: '00:00',
            status: tipoDia === 'util' ? 'pendente' : 'folga'
        });
    }

    return dias;
}

/**
 * Calcula a apuração detalhada de um único dia de ponto com base nas batidas e regras da CLT.
 *
 * @param {object} params
 * @param {string} params.e1 'HH:MM'
 * @param {string} params.s1 'HH:MM'
 * @param {string} params.e2 'HH:MM'
 * @param {string} params.s2 'HH:MM'
 * @param {number} [params.previstoMinutos=0]
 * @param {string} [params.tipoDia='util'] 'util', 'dsr', 'feriado', 'folga_12x36'
 * @param {string} [params.justificativa='']
 * @returns {object} Resultado do dia com horas normais, HE 50%, HE 100%, noturno e saldo
 */
export function calcularDiaPonto({
    e1 = '',
    s1 = '',
    e2 = '',
    s2 = '',
    previstoMinutos = 0,
    tipoDia = 'util',
    justificativa = ''
}) {
    const minE1 = converterHoraParaMinutos(e1);
    const minS1 = converterHoraParaMinutos(s1);
    const minE2 = converterHoraParaMinutos(e2);
    const minS2 = converterHoraParaMinutos(s2);

    // Se houver justificativa legal abonatória (ex: Atestado Médico Art. 473 CLT)
    if (justificativa && justificativa.toLowerCase().includes('atestado')) {
        return {
            trabalhadosMinutos: previstoMinutos,
            trabalhadosFormatado: converterMinutosParaHora(previstoMinutos),
            intervaloMinutos: 60,
            intervaloFormatado: '01:00',
            he50Minutos: 0,
            he50Formatado: '00:00',
            he100Minutos: 0,
            he100Formatado: '00:00',
            noturnoMinutos: 0,
            noturnoFormatado: '00:00',
            saldoMinutos: 0,
            saldoFormatado: '00:00',
            status: 'justificado',
            descricaoStatus: 'Atestado Médico (Art. 473 CLT)'
        };
    }

    // Se for DSR ou folga sem marcações
    if ((tipoDia === 'dsr' || tipoDia === 'feriado' || tipoDia === 'folga_12x36') && minE1 === null) {
        return {
            trabalhadosMinutos: 0,
            trabalhadosFormatado: '00:00',
            intervaloMinutos: 0,
            intervaloFormatado: '00:00',
            he50Minutos: 0,
            he50Formatado: '00:00',
            he100Minutos: 0,
            he100Formatado: '00:00',
            noturnoMinutos: 0,
            noturnoFormatado: '00:00',
            saldoMinutos: 0,
            saldoFormatado: '00:00',
            status: 'folga',
            descricaoStatus: tipoDia === 'feriado' ? 'Feriado Nacional' : 'Descanso Semanal (DSR)'
        };
    }

    // Se for dia útil sem marcações
    if (minE1 === null && minS2 === null) {
        return {
            trabalhadosMinutos: 0,
            trabalhadosFormatado: '00:00',
            intervaloMinutos: 0,
            intervaloFormatado: '00:00',
            he50Minutos: 0,
            he50Formatado: '00:00',
            he100Minutos: 0,
            he100Formatado: '00:00',
            noturnoMinutos: 0,
            noturnoFormatado: '00:00',
            saldoMinutos: -previstoMinutos,
            saldoFormatado: converterMinutosParaHora(-previstoMinutos, true),
            status: 'falta',
            descricaoStatus: 'Falta Injustificada'
        };
    }

    // Calcular tempos de turno
    let turno1 = 0;
    if (minE1 !== null && minS1 !== null) {
        turno1 = minS1 >= minE1 ? (minS1 - minE1) : (minS1 + 1440 - minE1);
    }

    let turno2 = 0;
    if (minE2 !== null && minS2 !== null) {
        turno2 = minS2 >= minE2 ? (minS2 - minE2) : (minS2 + 1440 - minE2);
    }

    // Se fez turno único direto (sem intervalo)
    if (minE1 !== null && minS1 === null && minE2 === null && minS2 !== null) {
        turno1 = minS2 >= minE1 ? (minS2 - minE1) : (minS2 + 1440 - minE1);
        turno2 = 0;
    }

    let intervaloRealizado = 0;
    if (minS1 !== null && minE2 !== null) {
        intervaloRealizado = minE2 >= minS1 ? (minE2 - minS1) : (minE2 + 1440 - minS1);
    }

    let minutosTrabalhadosBrutos = turno1 + turno2;

    // Apuração de adicional noturno nos turnos realizados (Art. 73 CLT)
    let noturnoMinutos = 0;
    if (minE1 !== null && minS1 !== null) {
        noturnoMinutos += calcularMinutosNoturnosFictos(minE1, minS1 >= minE1 ? minS1 : minS1 + 1440);
    }
    if (minE2 !== null && minS2 !== null) {
        noturnoMinutos += calcularMinutosNoturnosFictos(minE2, minS2 >= minE2 ? minS2 : minS2 + 1440);
    }

    // ─── Regra de Tolerância do Art. 58 § 1º da CLT ────────────
    // Variação de até 5 minutos por marcação e máximo de 10 minutos diários.
    // Se a diferença entre o trabalhado e o previsto for de até 10 minutos,
    // considera-se exatamente a jornada prevista (nem hora extra, nem desconto).
    let minutosTrabalhadosAjustados = minutosTrabalhadosBrutos;
    const diferencaMinutos = minutosTrabalhadosBrutos - previstoMinutos;

    if (tipoDia === 'util' && Math.abs(diferencaMinutos) <= 10 && minutosTrabalhadosBrutos > 0) {
        minutosTrabalhadosAjustados = previstoMinutos;
    }

    let he50Minutos = 0;
    let he100Minutos = 0;
    let saldoMinutos = 0;
    let status = 'normal';
    let descricaoStatus = 'Jornada Cumprida';

    if (tipoDia === 'dsr' || tipoDia === 'feriado') {
        // Trabalho em DSR ou feriado: 100% de adicional (Art. 59 CLT)
        he100Minutos = minutosTrabalhadosBrutos;
        saldoMinutos = minutosTrabalhadosBrutos;
        status = 'he100';
        descricaoStatus = `Trabalho em ${tipoDia === 'feriado' ? 'Feriado' : 'DSR'} (HE 100%)`;
    } else {
        saldoMinutos = minutosTrabalhadosAjustados - previstoMinutos;

        if (saldoMinutos > 0) {
            he50Minutos = saldoMinutos;
            status = 'he50';
            descricaoStatus = `Hora Extra 50% (+${converterMinutosParaHora(he50Minutos)})`;
        } else if (saldoMinutos < 0) {
            status = 'atraso';
            descricaoStatus = `Atraso / Saída Antecipada (-${converterMinutosParaHora(Math.abs(saldoMinutos))})`;
        }
    }

    return {
        trabalhadosMinutos: minutosTrabalhadosAjustados,
        trabalhadosFormatado: converterMinutosParaHora(minutosTrabalhadosAjustados),
        intervaloMinutos: intervaloRealizado,
        intervaloFormatado: converterMinutosParaHora(intervaloRealizado),
        he50Minutos,
        he50Formatado: converterMinutosParaHora(he50Minutos),
        he100Minutos,
        he100Formatado: converterMinutosParaHora(he100Minutos),
        noturnoMinutos,
        noturnoFormatado: converterMinutosParaHora(noturnoMinutos),
        saldoMinutos,
        saldoFormatado: converterMinutosParaHora(saldoMinutos, true),
        status,
        descricaoStatus
    };
}

/**
 * Consolida os totais mensais de uma grade de ponto e calcula as estimativas financeiras
 * para integração com a Folha de Pagamento em Lote e Banco de Horas.
 *
 * @param {Array<object>} diasPonto
 * @param {number} salarioBase
 * @param {number} [divisorMensal=220]
 * @returns {object} Resumo consolidado do mês
 */
export function calcularResumoMensalPonto(diasPonto = [], salarioBase = 0, divisorMensal = 220) {
    const salario = Math.max(0, Number(salarioBase) || 0);
    const divisor = divisorMensal || 220;
    const valorHoraNormal = salario > 0 ? (salario / divisor) : 0;

    let totalPrevistoMin = 0;
    let totalTrabalhadoMin = 0;
    let totalHE50Min = 0;
    let totalHE100Min = 0;
    let totalNoturnoMin = 0;
    let totalSaldoMin = 0;
    let diasTrabalhados = 0;
    let diasFalta = 0;
    let diasAtestado = 0;

    for (const d of diasPonto) {
        totalPrevistoMin += (d.previstoMinutos || 0);
        totalTrabalhadoMin += (d.trabalhadosMinutos || 0);
        totalHE50Min += (d.he50Minutos || 0);
        totalHE100Min += (d.he100Minutos || 0);
        totalNoturnoMin += (d.noturnoMinutos || 0);
        totalSaldoMin += (d.saldoMinutos || 0);

        if (d.trabalhadosMinutos > 0) diasTrabalhados++;
        if (d.status === 'falta') diasFalta++;
        if (d.status === 'justificado') diasAtestado++;
    }

    // Conversões para horas decimais
    const horasPrevistasDec = totalPrevistoMin / 60;
    const horasTrabalhadasDec = totalTrabalhadoMin / 60;
    const horasHE50Dec = totalHE50Min / 60;
    const horasHE100Dec = totalHE100Min / 60;
    const horasNoturnasDec = totalNoturnoMin / 60;
    const horasSaldoDec = totalSaldoMin / 60;

    // Valores monetários estimados
    const valorHE50 = horasHE50Dec * valorHoraNormal * 1.5;
    const valorHE100 = horasHE100Dec * valorHoraNormal * 2.0;
    const valorNoturno = horasNoturnasDec * valorHoraNormal * 0.2;
    const totalEventosPonto = valorHE50 + valorHE100 + valorNoturno;

    return {
        diasTrabalhados,
        diasFalta,
        diasAtestado,
        totaisMinutos: {
            previsto: totalPrevistoMin,
            trabalhado: totalTrabalhadoMin,
            he50: totalHE50Min,
            he100: totalHE100Min,
            noturno: totalNoturnoMin,
            saldo: totalSaldoMin
        },
        totaisFormatados: {
            previsto: converterMinutosParaHora(totalPrevistoMin),
            trabalhado: converterMinutosParaHora(totalTrabalhadoMin),
            he50: converterMinutosParaHora(totalHE50Min),
            he100: converterMinutosParaHora(totalHE100Min),
            noturno: converterMinutosParaHora(totalNoturnoMin),
            saldo: converterMinutosParaHora(totalSaldoMin, true)
        },
        horasDecimais: {
            previsto: Math.round(horasPrevistasDec * 100) / 100,
            trabalhado: Math.round(horasTrabalhadasDec * 100) / 100,
            he50: Math.round(horasHE50Dec * 100) / 100,
            he100: Math.round(horasHE100Dec * 100) / 100,
            noturno: Math.round(horasNoturnasDec * 100) / 100,
            saldo: Math.round(horasSaldoDec * 100) / 100
        },
        valoresEstimados: {
            valorHoraNormal: Math.round(valorHoraNormal * 100) / 100,
            valorHE50: Math.round(valorHE50 * 100) / 100,
            valorHE100: Math.round(valorHE100 * 100) / 100,
            valorNoturno: Math.round(valorNoturno * 100) / 100,
            totalProventosPonto: Math.round(totalEventosPonto * 100) / 100
        }
    };
}

/**
 * Preenche a grade mensal com marcações fictícias realistas para demonstração comercial
 * e testes públicos em conformidade com a LGPD (sem nomes ou dados reais).
 *
 * @param {Array<object>} gradeDias
 * @param {object} colaborador
 * @returns {Array<object>} Grade preenchida e calculada
 */
export function gerarMarcacoesDemonstrativas(gradeDias = [], colaborador = {}) {
    const e1Padrao = colaborador.horarioEntrada || '08:00';
    const s2Padrao = colaborador.horarioSaida || '17:48';
    const minEntrada = converterHoraParaMinutos(e1Padrao) || 480;
    const minSaidaAlmoco = minEntrada + 240;
    const minRetornoAlmoco = minSaidaAlmoco + 60;

    const s1Padrao = converterMinutosParaHora(minSaidaAlmoco);
    const e2Padrao = converterMinutosParaHora(minRetornoAlmoco);

    return gradeDias.map(dia => {
        if (dia.tipoDia !== 'util') return dia;

        // Variações aleatórias controladas para parecer registro real de biometria
        let e1 = e1Padrao;
        let s1 = s1Padrao;
        let e2 = e2Padrao;
        let s2 = s2Padrao;
        let justificativa = '';

        if (dia.dia === 8) {
            // Dia com 45 minutos de Hora Extra (50%)
            const minExtra = converterHoraParaMinutos(s2Padrao) + 45;
            s2 = converterMinutosParaHora(minExtra);
        } else if (dia.dia === 15) {
            // Dia de Atestado Médico (Art. 473 CLT)
            e1 = '';
            s1 = '';
            e2 = '';
            s2 = '';
            justificativa = 'Atestado Médico (Consulta)';
        } else if (dia.dia % 5 === 0) {
            // Pequena variação de +3 minutos dentro da tolerância do Art. 58 § 1º
            const minEntradaVar = converterHoraParaMinutos(e1Padrao) + 3;
            e1 = converterMinutosParaHora(minEntradaVar);
        }

        const calculo = calcularDiaPonto({
            e1,
            s1,
            e2,
            s2,
            previstoMinutos: dia.previstoMinutos,
            tipoDia: dia.tipoDia,
            justificativa
        });

        return {
            ...dia,
            e1,
            s1,
            e2,
            s2,
            justificativa,
            ...calculo
        };
    });
}

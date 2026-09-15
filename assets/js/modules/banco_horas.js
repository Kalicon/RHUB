/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Módulo de Cálculo de Banco de Horas & Compensação (CLT)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Fundamentação Legal:
 *   • Art. 59, § 2º CLT — Banco de horas por acordo ou convenção coletiva (prazo 1 ano)
 *   • Art. 59, § 5º CLT — Banco de horas por acordo individual escrito (prazo 6 meses)
 *   • Art. 59, § 3º CLT — Na rescisão sem compensação, pagamento com adicional mínimo de 50%
 *   • Súmula 172 TST   — Cômputo das horas extras habituais no DSR
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Calcula a quitação ou apuração de saldo de Banco de Horas.
 *
 * @param {Object} params
 * @param {number} params.salarioBase          — Salário base mensal (R$).
 * @param {number} [params.divisorMensal=220]  — Carga horária mensal contratual (220, 200, 180).
 * @param {number} params.saldoHoras           — Quantidade de horas no saldo (horas decimais, ex: 15.5h).
 * @param {'credito'|'debito'} [params.tipoSaldo='credito'] — 'credito' (saldo positivo do empregado) ou 'debito' (horas em falta).
 * @param {number} [params.percentualAdicional=50] — Adicional de hora extra (% - mín. legal de 50%).
 * @param {number} [params.diasUteis=25]       — Dias úteis do mês de apuração para DSR.
 * @param {number} [params.domingosFeriados=5] — Domingos e feriados do mês para DSR.
 * @param {'individual'|'coletivo'} [params.tipoAcordo='individual'] — Tipo de pactuação (6 meses ou 1 ano).
 *
 * @returns {Object} Detalhamento financeiro, reflexos e memória de cálculo.
 */
export function calcularBancoHoras({
    salarioBase,
    divisorMensal = 220,
    saldoHoras = 0,
    tipoSaldo = 'credito',
    percentualAdicional = 50,
    diasUteis = 25,
    domingosFeriados = 5,
    tipoAcordo = 'individual'
}) {
    const salario = Math.max(0, Number(salarioBase) || 0);
    const divisor = Math.max(1, Number(divisorMensal) || 220);
    const horas = Math.max(0, Number(saldoHoras) || 0);
    const adicional = Math.max(0, Number(percentualAdicional) || 50);
    const du = Math.max(1, Number(diasUteis) || 25);
    const df = Math.max(0, Number(domingosFeriados) || 5);
    const isCredito = tipoSaldo === 'credito';

    // 1. Valor da Hora Normal
    const valorHoraNormal = salario / divisor;

    // 2. Fator e Valor da Hora com Adicional (para Crédito)
    const fatorAdicional = 1 + (adicional / 100);
    const valorHoraExtra = valorHoraNormal * fatorAdicional;

    // 3. Totais Principais
    let totalHoras = 0;
    let valorDsr = 0;

    if (isCredito) {
        // Horas extras acumuladas a pagar
        totalHoras = horas * valorHoraExtra;
        // Reflexo no DSR (Súmula 172 TST)
        valorDsr = (totalHoras / du) * df;
    } else {
        // Horas devidas pelo colaborador (desconto simples na rescisão/fechamento)
        totalHoras = horas * valorHoraNormal;
        valorDsr = 0;
    }

    const totalGeral = isCredito ? (totalHoras + valorDsr) : totalHoras;

    // 4. Memória de Cálculo Passo a Passo
    const memoriaCalculo = [
        {
            passo: 1,
            titulo: 'Valor da Hora Normal',
            descricao: 'Art. 64 CLT — Salário base dividido pela jornada contratual mensal.',
            formula: `R$ ${salario.toFixed(2)} ÷ ${divisor}h`,
            resultado: valorHoraNormal
        },
        {
            passo: 2,
            titulo: isCredito ? `Valor da Hora Extra (+${adicional}%)` : 'Valor da Hora para Desconto',
            descricao: isCredito 
                ? `Art. 59, § 3º CLT — Saldo credor pago com acréscimo de ${adicional}%.` 
                : 'Desconto de horas não trabalhadas pelo valor da hora simples.',
            formula: isCredito 
                ? `R$ ${valorHoraNormal.toFixed(2)} × ${fatorAdicional.toFixed(2)}` 
                : `R$ ${valorHoraNormal.toFixed(2)} (hora simples)`,
            resultado: isCredito ? valorHoraExtra : valorHoraNormal
        },
        {
            passo: 3,
            titulo: isCredito ? 'Total do Saldo de Horas Extras' : 'Total do Desconto de Horas Devidas',
            descricao: `${horas.toFixed(2)} hora(s) apurada(s) no saldo.`,
            formula: isCredito 
                ? `${horas.toFixed(2)}h × R$ ${valorHoraExtra.toFixed(2)}` 
                : `${horas.toFixed(2)}h × R$ ${valorHoraNormal.toFixed(2)}`,
            resultado: totalHoras
        }
    ];

    if (isCredito) {
        memoriaCalculo.push({
            passo: 4,
            titulo: 'Reflexo no DSR (Descanso Semanal Remunerado)',
            descricao: 'Súmula 172 do TST — (Total Horas Extras ÷ Dias Úteis) × Domingos e Feriados.',
            formula: `(R$ ${totalHoras.toFixed(2)} ÷ ${du}) × ${df}`,
            resultado: valorDsr
        });
        memoriaCalculo.push({
            passo: 5,
            titulo: 'Total Geral a Receber pelo Colaborador',
            descricao: 'Saldo em horas extras + reflexo no descanso semanal remunerado.',
            formula: `R$ ${totalHoras.toFixed(2)} + R$ ${valorDsr.toFixed(2)}`,
            resultado: totalGeral
        });
    } else {
        memoriaCalculo.push({
            passo: 4,
            titulo: 'Total do Desconto em Folha / Rescisão',
            descricao: 'Valor das horas a débito não compensadas dentro do período pactuado.',
            formula: `R$ ${totalHoras.toFixed(2)}`,
            resultado: totalGeral
        });
    }

    // Regras de conformidade
    const prazoMaximoCompensacao = tipoAcordo === 'individual' ? '6 meses (Art. 59, § 5º)' : '1 ano (Art. 59, § 2º)';

    return {
        salarioBase: salario,
        divisorMensal: divisor,
        saldoHoras: horas,
        tipoSaldo,
        isCredito,
        percentualAdicional: adicional,
        diasUteis: du,
        domingosFeriados: df,
        tipoAcordo,
        prazoMaximoCompensacao,
        valorHoraNormal,
        valorHoraExtra: isCredito ? valorHoraExtra : 0,
        totalHoras,
        valorDsr,
        totalGeral,
        memoriaCalculo
    };
}

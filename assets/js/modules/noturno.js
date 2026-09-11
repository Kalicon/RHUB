/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Módulo de Cálculo de Adicional Noturno (CLT Brasileira)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Lógica Matemática Pura — 100% desacoplada do DOM.
 *
 * Legislação e Jurisprudência Aplicada:
 *   • Art. 73, caput da CLT — Adicional mínimo de 20% sobre a hora diurna.
 *   • Art. 73, § 1º da CLT  — Hora ficta noturna de 52 min e 30 seg.
 *   • Súmula nº 60, II do TST — Prorrogação da jornada noturna.
 *   • Súmula nº 172 do TST e Lei nº 605/1949 — Reflexo habitual no DSR.
 *
 * Todas as funções retornam objetos puros (sem efeitos colaterais),
 * permitindo testes unitários isolados e reutilização em qualquer módulo.
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─── Constante: Fator Oficial de Redução da Hora Noturna ───────────────
// 1 hora noturna = 52 minutos e 30 segundos (52,5 minutos).
// Fator = 60 / 52.5 = 1.142857142857...
// Cada hora cronológica no período 22h–05h equivale a 1.142857 horas pagas.
export const FATOR_HORA_FICTA = 60 / 52.5;

/**
 * Converte horas cronológicas (relógio) em horas fictas noturnas.
 *
 * @param {number} horasRelogio — Horas físicas entre 22h e 05h.
 * @returns {number} Horas noturnas com redução legal (Art. 73, § 1º CLT).
 *
 * @example
 *   calcularHorasFictas(7) // → 8.0 (7 horas do relógio = 8 horas pagas)
 */
export function calcularHorasFictas(horasRelogio) {
    if (typeof horasRelogio !== 'number' || horasRelogio <= 0) return 0;
    return horasRelogio * FATOR_HORA_FICTA;
}

/**
 * Calcula o valor da hora normal de trabalho.
 * Art. 64 CLT: Salário ÷ Divisor correspondente à jornada.
 *
 * @param {number} salarioBase — Salário mensal bruto (R$).
 * @param {number} divisorMensal — 220 (44h/sem), 200 (40h/sem), 180 (36h/sem).
 * @returns {number} Valor monetário de 1 hora normal.
 */
export function calcularValorHoraNormal(salarioBase, divisorMensal = 220) {
    if (!salarioBase || salarioBase <= 0 || !divisorMensal || divisorMensal <= 0) return 0;
    return salarioBase / divisorMensal;
}

/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  FUNÇÃO PRINCIPAL: Cálculo Completo do Adicional Noturno   │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Recebe os parâmetros trabalhistas e retorna um objeto detalhado
 * contendo todos os valores intermediários e a memória de cálculo.
 *
 * @param {Object} params
 * @param {number} params.salarioBase           — Salário mensal bruto (R$).
 * @param {number} [params.divisorMensal=220]   — Carga horária mensal.
 * @param {number} [params.percentualAdicional=20] — % do adicional (CLT mín: 20%).
 * @param {number} params.horasNoturnasRelogio  — Total de horas noturnas no relógio (no mês).
 * @param {boolean}[params.aplicarHoraFicta=true] — Aplica redução ficta (urbano) ou não (rural).
 * @param {number} [params.diasUteis=22]        — Dias úteis do mês de referência.
 * @param {number} [params.domingosFeriados=8]  — Repousos remunerados (domingos + feriados).
 *
 * @returns {Object} Resultado completo com memória de cálculo.
 */
export function calcularAdicionalNoturno({
    salarioBase,
    divisorMensal = 220,
    percentualAdicional = 20,
    horasNoturnasRelogio,
    aplicarHoraFicta = true,
    diasUteis = 22,
    domingosFeriados = 8
}) {
    // ── 1. Sanitização de Entradas ─────────────────────────────
    const salario      = Math.max(0, Number(salarioBase) || 0);
    const divisor      = Math.max(1, Number(divisorMensal) || 220);
    const taxa         = Math.max(0, Math.min(100, Number(percentualAdicional) || 20)) / 100;
    const horasRelogio = Math.max(0, Number(horasNoturnasRelogio) || 0);
    const uteis        = Math.max(1, Number(diasUteis) || 22);
    const repousos     = Math.max(0, Number(domingosFeriados) || 0);

    // ── 2. Valor da Hora Normal (Art. 64 CLT) ──────────────────
    const valorHoraNormal = salario / divisor;

    // ── 3. Horas Noturnas Computadas (Art. 73, § 1º CLT) ──────
    const horasComputadas = aplicarHoraFicta
        ? horasRelogio * FATOR_HORA_FICTA
        : horasRelogio;

    // ── 4. Adicional por Hora (Art. 73 caput CLT) ──────────────
    // Se hora normal = R$ 15,00 e taxa = 20%, adicional = R$ 3,00
    const adicionalPorHora = valorHoraNormal * taxa;

    // ── 5. Total Bruto de Adicional Noturno ────────────────────
    const totalAdicionalNoturno = horasComputadas * adicionalPorHora;

    // ── 6. Reflexo no DSR (Lei 605/49 + Súmula 172 TST) ───────
    // Fórmula: (Total Noturno / Dias Úteis) × Domingos e Feriados
    const valorDsr = uteis > 0
        ? (totalAdicionalNoturno / uteis) * repousos
        : 0;

    // ── 7. Total Geral ─────────────────────────────────────────
    const totalGeralProventos = totalAdicionalNoturno + valorDsr;

    // ── 8. Memória de Cálculo (Transparência para Auditoria) ───
    const memoriaCalculo = [
        {
            passo: 1,
            titulo: 'Valor da Hora Normal',
            descricao: 'Art. 64 CLT — Salário Base ÷ Divisor Mensal',
            formula: `R$ ${salario.toFixed(2)} ÷ ${divisor}h`,
            resultado: valorHoraNormal
        },
        {
            passo: 2,
            titulo: 'Horas Noturnas Computadas',
            descricao: aplicarHoraFicta
                ? 'Art. 73, § 1º CLT — Redução ficta (52min30s → fator 1,142857)'
                : 'Hora normal de 60 minutos (rural ou convenção)',
            formula: aplicarHoraFicta
                ? `${horasRelogio.toFixed(2)}h × ${FATOR_HORA_FICTA.toFixed(6)}`
                : `${horasRelogio.toFixed(2)}h (sem redução)`,
            resultado: horasComputadas
        },
        {
            passo: 3,
            titulo: 'Adicional por Hora Noturna',
            descricao: `Art. 73 CLT — ${(taxa * 100).toFixed(0)}% sobre o valor da hora normal`,
            formula: `R$ ${valorHoraNormal.toFixed(4)} × ${(taxa * 100).toFixed(0)}%`,
            resultado: adicionalPorHora
        },
        {
            passo: 4,
            titulo: 'Total do Adicional Noturno',
            descricao: 'Horas computadas × Adicional por hora',
            formula: `${horasComputadas.toFixed(4)}h × R$ ${adicionalPorHora.toFixed(4)}`,
            resultado: totalAdicionalNoturno
        },
        {
            passo: 5,
            titulo: 'Reflexo no DSR',
            descricao: 'Súmula 172 TST + Lei 605/49 — Proporcionalidade mensal',
            formula: `(R$ ${totalAdicionalNoturno.toFixed(2)} ÷ ${uteis} dias úteis) × ${repousos} repousos`,
            resultado: valorDsr
        },
        {
            passo: 6,
            titulo: 'Total Geral dos Proventos',
            descricao: 'Adicional Noturno + Reflexo no DSR',
            formula: `R$ ${totalAdicionalNoturno.toFixed(2)} + R$ ${valorDsr.toFixed(2)}`,
            resultado: totalGeralProventos
        }
    ];

    return {
        // Entradas processadas
        salarioBase: salario,
        divisorMensal: divisor,
        percentualAdicional: taxa * 100,
        horasRelogio,
        aplicarHoraFicta,
        diasUteis: uteis,
        domingosFeriados: repousos,

        // Resultados calculados
        valorHoraNormal,
        horasComputadas,
        adicionalPorHora,
        totalAdicionalNoturno,
        valorDsr,
        totalGeralProventos,

        // Auditoria
        memoriaCalculo
    };
}

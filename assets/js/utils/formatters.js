/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Utilitários de Formatação (BRL, Horas, Números)
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Formata valor numérico para Real Brasileiro (R$ 1.500,00)
 */
export function formatCurrency(value) {
    if (typeof value !== 'number' || isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

/**
 * Converte texto monetário brasileiro (ex: "3.300,00") para float.
 */
export function parseCurrency(input) {
    if (typeof input === 'number') return isNaN(input) ? 0 : input;
    if (!input || typeof input !== 'string') return 0;
    const clean = input.replace(/R\$\s?/g, '').trim().replace(/\./g, '').replace(',', '.');
    const val = parseFloat(clean);
    return isNaN(val) ? 0 : val;
}

/**
 * Formata número com separadores pt-BR.
 */
export function formatNumber(value, decimals = 2) {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

/**
 * Converte horas decimais para formato legível (ex: 7.5 → "7h 30min").
 */
export function formatHoursMinutes(decimalHours) {
    if (typeof decimalHours !== 'number' || decimalHours <= 0) return '0h 00min';
    const hours = Math.floor(decimalHours);
    let minutes = Math.round((decimalHours - hours) * 60);
    if (minutes === 60) return `${hours + 1}h 00min`;
    return `${hours}h ${String(minutes).padStart(2, '0')}min`;
}

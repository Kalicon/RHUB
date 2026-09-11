/**
 * Funções de Validação e Sanitização de Entradas
 * RHUB - Calculadora de Departamento Pessoal
 */

/**
 * Valida se um número está dentro de um intervalo aceitável
 * @param {number} value 
 * @param {number} min 
 * @param {number} max 
 * @returns {boolean}
 */
export function isNumberInRange(value, min, max) {
    if (isNaN(value)) return false;
    return value >= min && value <= max;
}

/**
 * Sanitiza valores de percentual (padrão 20%, mínimo 0%, máximo 100%)
 * @param {number} percent 
 * @returns {number}
 */
export function sanitizePercent(percent) {
    const val = Number(percent);
    if (isNaN(val) || val < 0) return 20;
    if (val > 100) return 100;
    return val;
}

/**
 * Sanitiza a carga horária / divisor mensal
 * @param {number} divisor 
 * @returns {number}
 */
export function sanitizeDivisor(divisor) {
    const validDivisors = [220, 200, 180, 150, 120];
    const val = Number(divisor);
    return validDivisors.includes(val) ? val : 220;
}

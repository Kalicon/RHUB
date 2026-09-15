/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Módulo de Teletrabalho / Home Office & Ajuda de Custo (CLT)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Fundamentação Legal:
 *   • Art. 75-A a 75-E da CLT (Lei 13.467/2017 e Lei 14.442/2022)
 *   • Art. 75-D, Parágrafo Único CLT — O reembolso de despesas comprovadas
 *     ou ajuda de custo de infraestrutura NÃO integra a remuneração do
 *     empregado, não incide INSS nem FGTS e é isento de IRRF.
 *   • Lei 7.418/85 — Desobrigação do fornecimento de Vale-Transporte nos
 *     dias de efetivo teletrabalho / trabalho remoto.
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Calcula a ajuda de custo de teletrabalho, consumo de energia/internet
 * e comparativo com o Vale-Transporte.
 *
 * @param {Object} params
 * @param {number} [params.faturaInternet=120]           — Fatura mensal de banda larga residencial (R$).
 * @param {number} [params.percentualInternet=50]        — % da internet alocada para o expediente (% - padrão 50%).
 * @param {number} [params.potenciaEquipamentosWatts=250]— Potência dos equipamentos de trabalho em Watts (PC + monitores).
 * @param {number} [params.horasTrabalhoDia=8]          — Horas diárias em frente ao computador (padrão 8h).
 * @param {number} [params.tarifaEnergiaKwh=0.85]       — Custo do kWh na concessionária local (R$ - média nacional ~0.85).
 * @param {number} [params.diasHomeOffice=22]           — Dias úteis trabalhados em home office no mês.
 * @param {number} [params.auxilioErgonomiaEquip=0]     — Auxílio mensal para desgaste de computador próprio (BYOD) ou ergonomia.
 * @param {number} [params.valorVTDiario=10.0]          — Custo diário de Vale-Transporte (ida + volta) se fosse presencial.
 *
 * @returns {Object} Detalhamento da ajuda de custo, economia de VT e memória de cálculo.
 */
export function calcularTeletrabalho({
    faturaInternet = 120,
    percentualInternet = 50,
    potenciaEquipamentosWatts = 250,
    horasTrabalhoDia = 8,
    tarifaEnergiaKwh = 0.85,
    diasHomeOffice = 22,
    auxilioErgonomiaEquip = 0,
    valorVTDiario = 10.0
}) {
    const internet = Math.max(0, Number(faturaInternet) || 0);
    const percInternet = Math.min(100, Math.max(0, Number(percentualInternet) || 50));
    const potenciaW = Math.max(0, Number(potenciaEquipamentosWatts) || 250);
    const horasDia = Math.max(0, Number(horasTrabalhoDia) || 8);
    const tarifa = Math.max(0, Number(tarifaEnergiaKwh) || 0.85);
    const dias = Math.max(0, Number(diasHomeOffice) || 0);
    const auxEquip = Math.max(0, Number(auxilioErgonomiaEquip) || 0);
    const vtDiario = Math.max(0, Number(valorVTDiario) || 0);

    // 1. Parcela de Internet
    // Proporção de uso profissional ajustada aos dias de home office no mês comercial (22 dias)
    const fatorPresencaMes = dias > 0 ? Math.min(1, dias / 22) : 0;
    const parcelaInternet = (internet * (percInternet / 100)) * fatorPresencaMes;

    // 2. Parcela de Energia Elétrica
    // Consumo (kWh) = (Potência em Watts ÷ 1000) × Horas por Dia × Dias de Home Office
    const potenciaKw = potenciaW / 1000;
    const consumoKwhMes = potenciaKw * horasDia * dias;
    const parcelaEnergia = consumoKwhMes * tarifa;

    // 3. Parcela de Equipamento / Ergonomia
    const parcelaEquipamentos = auxEquip;

    // 4. Total da Ajuda de Custo Mensal
    const totalAjudaCusto = parcelaInternet + parcelaEnergia + parcelaEquipamentos;

    // 5. Comparativo com Vale-Transporte Presencial
    const vtEconomizado = vtDiario * dias;
    const saldoEmpresa = vtEconomizado - totalAjudaCusto;

    // 6. Memória de Cálculo Auditável
    const memoriaCalculo = [
        {
            passo: 1,
            titulo: 'Reembolso Proporcional de Internet',
            descricao: `Fatura de R$ ${internet.toFixed(2)} com ${percInternet}% de alocação profissional em ${dias} dia(s) remoto(s).`,
            formula: `(R$ ${internet.toFixed(2)} × ${percInternet}%) × (${dias}/22 dias)`,
            resultado: parcelaInternet
        },
        {
            passo: 2,
            titulo: 'Consumo & Reembolso de Energia Elétrica',
            descricao: `${potenciaW}W (${potenciaKw.toFixed(3)} kW) × ${horasDia}h/dia × ${dias} dias = ${consumoKwhMes.toFixed(2)} kWh a R$ ${tarifa.toFixed(2)}/kWh.`,
            formula: `${consumoKwhMes.toFixed(2)} kWh × R$ ${tarifa.toFixed(2)}`,
            resultado: parcelaEnergia
        },
        {
            passo: 3,
            titulo: 'Auxílio Equipamento & Infraestrutura',
            descricao: 'Art. 75-D CLT — Auxílio para ergonomia ou uso de computador pessoal do empregado.',
            formula: `R$ ${parcelaEquipamentos.toFixed(2)}`,
            resultado: parcelaEquipamentos
        },
        {
            passo: 4,
            titulo: 'Ajuda de Custo Total Sugerida',
            descricao: 'Art. 75-D, Parágrafo Único CLT — Isento de encargos (0% INSS, 0% FGTS e 0% IRRF).',
            formula: `R$ ${parcelaInternet.toFixed(2)} + R$ ${parcelaEnergia.toFixed(2)} + R$ ${parcelaEquipamentos.toFixed(2)}`,
            resultado: totalAjudaCusto
        },
        {
            passo: 5,
            titulo: 'Balanço com Economia de Vale-Transporte',
            descricao: `${dias} dias sem necessidade de transporte público (tarifa diária R$ ${vtDiario.toFixed(2)}).`,
            formula: `VT Economizado: R$ ${vtEconomizado.toFixed(2)} — Ajuda de Custo: R$ ${totalAjudaCusto.toFixed(2)}`,
            resultado: saldoEmpresa
        }
    ];

    return {
        faturaInternet: internet,
        percentualInternet: percInternet,
        parcelaInternet,
        potenciaEquipamentosWatts: potenciaW,
        horasTrabalhoDia: horasDia,
        tarifaEnergiaKwh: tarifa,
        diasHomeOffice: dias,
        consumoKwhMes,
        parcelaEnergia,
        parcelaEquipamentos,
        totalAjudaCusto,
        valorVTDiario: vtDiario,
        vtEconomizado,
        saldoEmpresa,
        empresaEconomizou: saldoEmpresa > 0,
        memoriaCalculo
    };
}

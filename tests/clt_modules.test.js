import { describe, it, expect } from 'vitest';
import { calcularAdicionalNoturno } from '../assets/js/modules/noturno.js';
import { calcularRescisao, compararCenariosRescisao } from '../assets/js/modules/rescisao.js';
import { calcularFaltas, consultarImpactoFerias } from '../assets/js/modules/faltas.js';
import { calcularFerias, calcular13o, validarFracionamentoFerias } from '../assets/js/modules/ferias.js';
import { calcularSalarioLiquido } from '../assets/js/modules/liquido.js';
import { calcularCustosCltPj } from '../assets/js/modules/clt_pj.js';
import { calcularINSS, calcularIRRF } from '../assets/js/modules/tabelas.js';
import { calcularBancoHoras } from '../assets/js/modules/banco_horas.js';
import { calcularPLR, calcularIRRF_PLR } from '../assets/js/modules/plr.js';
import { calcularTeletrabalho } from '../assets/js/modules/teletrabalho.js';
import { calcularEquiparacao } from '../assets/js/modules/equiparacao.js';
import { processarFolhaLote, parsearCsvFolha } from '../assets/js/modules/folha_lote.js';
import { calcularATS } from '../assets/js/data/cct_config.js';
import { obterRubrica, listarTodasRubricas } from '../assets/js/data/esocial_rubricas.js';
import {
    validarCPF,
    mascararCPF,
    mascararPIS,
    calcularTempoDeCasa,
    verificarContratoExperiencia,
    converterParaItemFolha,
    converterParaItemHolerite
} from '../assets/js/modules/colaboradores.js';
import {
    calcularDiasDisponiveis,
    calcularPeriodosAquisitivos,
    verificarAlertaFeriasVencidas,
    validarAgendamentoFerias,
    calcularValorFerias,
    calcularProvisaoFerias,
    gerarMapaAnualFerias
} from '../assets/js/modules/gestao_ferias.js';

describe('RHUB — Suíte de Testes da Legislação Trabalhista (CLT)', () => {

    describe('1. Módulo Adicional Noturno (Art. 73 CLT & Súmula 172 TST)', () => {
        it('deve calcular corretamente a hora ficta noturna de 52m30s (fator 1.142857)', () => {
            const res = calcularAdicionalNoturno({
                salarioBase: 3000,
                divisorMensal: 220,
                percentualAdicional: 20,
                horasNoturnasRelogio: 40,
                aplicarHoraFicta: true,
                diasUteis: 25,
                domingosFeriados: 5
            });

            expect(res.valorHoraNormal).toBeCloseTo(13.636, 2);
            expect(res.horasComputadas).toBeCloseTo(40 * (60 / 52.5), 2); // ~45.71h
            expect(res.totalAdicionalNoturno).toBeGreaterThan(0);
            expect(res.valorDsr).toBeCloseTo((res.totalAdicionalNoturno / 25) * 5, 2);
            expect(res.totalGeralProventos).toBeCloseTo(res.totalAdicionalNoturno + res.valorDsr, 2);
            expect(res.memoriaCalculo.length).toBe(6);
        });

        it('deve zerar os adicionais quando as horas noturnas forem 0', () => {
            const res = calcularAdicionalNoturno({
                salarioBase: 2500,
                divisorMensal: 220,
                percentualAdicional: 20,
                horasRelogio: 0,
                aplicarHoraFicta: true,
                diasUteis: 26,
                domingosFeriados: 4
            });

            expect(res.horasComputadas).toBe(0);
            expect(res.totalAdicionalNoturno).toBe(0);
            expect(res.valorDsr).toBe(0);
            expect(res.totalGeralProventos).toBe(0);
        });
    });

    describe('2. Módulo Rescisão Contratual (Art. 477, Lei 12.506/2011)', () => {
        it('deve calcular demissão sem justa causa com aviso prévio proporcional e multa FGTS', () => {
            const res = calcularRescisao({
                salarioBase: 4000,
                motivo: 'SEM_JUSTA_CAUSA',
                dataAdmissao: '2021-01-01',
                dataDemissao: '2024-01-01', // 3 anos completos = 30 + (3*3) = 39 dias
                diasTrabalhadosMes: 30,
                temFeriasVencidas: false,
                saldoFGTS: 10000,
                tipoAvisoPrevio: 'indenizado',
                dependentesIR: 0
            });

            expect(res.diasAvisoPrevio).toBe(39);
            expect(res.valorMultaFGTS).toBe(4000); // 40% sobre 10000
            expect(res.liquidoRescisao).toBeGreaterThan(0);
            expect(res.saqueFGTS).toBe(true);
            expect(res.seguroDesemprego).toBe(true);
        });

        it('deve zerar multa de FGTS e seguro no pedido de demissão', () => {
            const res = calcularRescisao({
                salarioBase: 4000,
                motivo: 'PEDIDO_DEMISSAO',
                dataAdmissao: '2023-01-01',
                dataDemissao: '2023-12-31',
                diasTrabalhadosMes: 30,
                temFeriasVencidas: false,
                saldoFGTS: 5000,
                tipoAvisoPrevio: 'trabalhado',
                dependentesIR: 0
            });

            expect(res.valorMultaFGTS).toBe(0);
            expect(res.saqueFGTS).toBe(false);
            expect(res.seguroDesemprego).toBe(false);
        });

        it('deve comparar os 4 cenários simultâneos de rescisão', () => {
            const comparacao = compararCenariosRescisao({
                salarioBase: 5000,
                dataAdmissao: '2022-01-01',
                dataDemissao: '2024-01-01',
                diasTrabalhadosMes: 30,
                temFeriasVencidas: false,
                saldoFGTS: 8000,
                tipoAvisoPrevio: 'indenizado',
                dependentesIR: 0
            });

            expect(comparacao.length).toBe(4);
            const semJusta = comparacao.find(c => c.chave === 'SEM_JUSTA_CAUSA');
            const justaCausa = comparacao.find(c => c.chave === 'JUSTA_CAUSA');
            expect(semJusta.liquido).toBeGreaterThan(justaCausa.liquido);
        });
    });

    describe('3. Módulo Faltas e DSR (Lei 605/1949 & Art. 130 CLT)', () => {
        it('deve calcular desconto de faltas integrais e perda do DSR semanal', () => {
            const res = calcularFaltas({
                salarioBase: 3000,
                divisorMensal: 220,
                diasFalta: 2,
                horasAtraso: 0,
                dsrAfetados: 2,
                faltasPeriodoAquisitivo: 2
            });

            expect(res.descontoFaltas).toBeCloseTo((3000 / 30) * 2, 2); // R$ 200,00
            expect(res.descontoDSR).toBeCloseTo((3000 / 30) * 2, 2); // R$ 200,00
            expect(res.totalDescontos).toBeCloseTo(400, 2);
            expect(res.salarioAposDescontos).toBeCloseTo(2600, 2);
        });

        it('deve aplicar a tabela progressiva de perda de férias conforme Art. 130 da CLT', () => {
            const res6Faltas = consultarImpactoFerias(6);
            expect(res6Faltas.diasFerias).toBe(24); // 6 a 14 faltas = 24 dias

            const res15Faltas = consultarImpactoFerias(15);
            expect(res15Faltas.diasFerias).toBe(18); // 15 a 23 faltas = 18 dias

            const res33Faltas = consultarImpactoFerias(33);
            expect(res33Faltas.diasFerias).toBe(0); // mais de 32 faltas = perde o direito
            expect(res33Faltas.perdeuDireito).toBe(true);
        });
    });

    describe('4. Módulo Férias & 13º Salário (Art. 129 a 145 CLT & Lei 4.090/1962)', () => {
        it('deve calcular férias integrais com 1/3 constitucional e abono pecuniário', () => {
            const res = calcularFerias({
                salarioBase: 6000,
                diasFerias: 30,
                abonoPecuniario: true,
                feriasEmDobro: false,
                dependentesIR: 0
            });

            expect(res.valorAbono).toBeGreaterThan(0); // 10 dias vendidos
            expect(res.tercoAbono).toBeGreaterThan(0);
            expect(res.totalBrutoFerias).toBeGreaterThan(6000);
            expect(res.liquidoFerias).toBeGreaterThan(0);
        });

        it('deve calcular 13º integral e proporcional com desconto correto', () => {
            const res = calcular13o({
                salarioBase: 6000,
                mesesTrabalhados: 6,
                dependentesIR: 0
            });

            expect(res.valor13oBruto).toBe(3000); // 6/12 avos
            expect(res.inss.valor).toBeGreaterThan(0);
            expect(res.liquido13o).toBeLessThan(3000);
        });
    });

    describe('5. Módulo Salário Líquido & Encargos (INSS e IRRF 2024)', () => {
        it('deve calcular INSS progressivo 2024 de acordo com as 4 faixas legais', () => {
            const inssPiso = calcularINSS(1412.00);
            expect(inssPiso.valor).toBeCloseTo(1412 * 0.075, 2); // 7.5%

            const inssTeto = calcularINSS(10000.00);
            expect(inssTeto.valor).toBeCloseTo(908.85, 1); // Teto máximo INSS 2024
        });

        it('deve calcular IRRF progressivo com dedução por dependente', () => {
            const irrfIsento = calcularIRRF(2200, 0, 165);
            expect(irrfIsento.valor).toBe(0);

            const irrfComDep = calcularIRRF(6000, 2, 600);
            expect(irrfComDep.valor).toBeGreaterThan(0);
        });

        it('deve limitar o desconto de Vale Transporte ao teto de 6% do salário base', () => {
            const res = calcularSalarioLiquido({
                salarioBase: 5000,
                optanteVT: true,
                custoRealVT: 500 // Custo real é maior que 6% (300)
            });

            const itemVT = res.rubricasDescontos.find(d => d.nome.includes('Vale Transporte'));
            expect(itemVT).toBeDefined();
            expect(itemVT.valor).toBe(300); // 6% de 5000 = 300
        });
    });

    describe('6. Módulo CLT vs. PJ & Custo Efetivo da Empresa', () => {
        it('deve calcular o custo total de um empregado CLT no Lucro Presumido/Real (INSS patronal 20%)', () => {
            const res = calcularCustosCltPj({
                salarioBase: 5000,
                regimeTributario: 'lucro_presumido_real',
                aliquotaRat: 2.0,
                fap: 1.0,
                aliquotaTerceiros: 5.8,
                dependentesIrrf: 0,
                beneficios: {
                    vrVa: 1000,
                    saude: 300,
                    seguroVida: 0,
                    previdenciaPrivada: 0,
                    outros: 0
                },
                aliquotaSimplesPj: 6.0,
                proLaborePercent: 28,
                custoContadorPj: 300,
                beneficiosPjProprios: 0,
                faturamentoPjInformado: 0
            });

            expect(res.empresaClt.inssPatronal).toBe(1000); // 20% de 5000
            expect(res.empresaClt.fgtsMensal).toBe(400); // 8% de 5000
            expect(res.empresaClt.custoTotalMensal).toBeGreaterThan(5000 * 1.6); // Encargos + Provisões + Benefícios
            expect(res.pjBreakEven.faturamentoNecessario).toBeGreaterThan(5000);
            expect(res.trabalhadorClt.poderCompraTotalMensal).toBeGreaterThan(0);
            expect(res.memoriaCalculo.length).toBe(5);
        });

        it('deve isentar INSS patronal e terceiros no Simples Nacional (Anexos I a III e V)', () => {
            const res = calcularCustosCltPj({
                salarioBase: 4000,
                regimeTributario: 'simples',
                aliquotaRat: 2.0,
                fap: 1.0,
                aliquotaTerceiros: 5.8,
                dependentesIrrf: 0,
                beneficios: {},
                aliquotaSimplesPj: 6.0,
                proLaborePercent: 28,
                custoContadorPj: 250,
                beneficiosPjProprios: 0,
                faturamentoPjInformado: 0
            });

            expect(res.empresaClt.inssPatronal).toBe(0);
            expect(res.empresaClt.terceirosPatronal).toBe(0);
            expect(res.empresaClt.custoTotalMensal).toBeLessThan(4000 * 1.6);
        });
    });

    describe('7. Módulo Banco de Horas & Compensação (Art. 59 CLT & Súmula 172 TST)', () => {
        it('deve calcular quitação de saldo credor com adicional de 50% e reflexo no DSR', () => {
            const res = calcularBancoHoras({
                salarioBase: 4400,
                divisorMensal: 220,
                saldoHoras: 20,
                tipoSaldo: 'credito',
                percentualAdicional: 50,
                diasUteis: 25,
                domingosFeriados: 5
            });

            expect(res.valorHoraNormal).toBe(20); // 4400 / 220
            expect(res.valorHoraExtra).toBe(30);  // 20 * 1.5
            expect(res.totalHoras).toBe(600);     // 20h * 30
            expect(res.valorDsr).toBeCloseTo((600 / 25) * 5, 2); // 120
            expect(res.totalGeral).toBeCloseTo(720, 2);
            expect(res.memoriaCalculo.length).toBe(5);
        });

        it('deve calcular desconto de horas a débito pelo valor da hora simples sem adicional', () => {
            const res = calcularBancoHoras({
                salarioBase: 3300,
                divisorMensal: 220,
                saldoHoras: 10,
                tipoSaldo: 'debito'
            });

            expect(res.valorHoraNormal).toBe(15);
            expect(res.totalHoras).toBe(150); // 10h * 15
            expect(res.valorDsr).toBe(0);     // Sem DSR no débito
            expect(res.totalGeral).toBe(150);
        });
    });

    describe('8. Módulo PLR — Participação nos Lucros (Lei 10.101/2000)', () => {
        it('deve isentar IRRF na faixa até R$ 7.640,80 e comprovar isenção de INSS e FGTS', () => {
            const res = calcularPLR({
                valorBrutoPLR: 7000
            });

            expect(res.irrfTotalDevido).toBe(0);
            expect(res.liquidoTotal).toBe(7000);
            expect(res.fgtsEconomizado).toBe(7000 * 0.08); // R$ 560 que a empresa não paga de FGTS
            expect(res.inssPatronalEconomizado).toBe(7000 * 0.20); // R$ 1.400 que a empresa não paga de INSS patronal
        });

        it('deve aplicar a tabela progressiva exclusiva da Receita Federal para faixas superiores', () => {
            const res = calcularPLR({
                valorBrutoPLR: 15000 // Faixa de 22.5% c/ dedução de 2304.76
            });

            const irrfEsperado = (15000 * 0.225) - 2304.76;
            expect(res.irrfTotalDevido).toBeCloseTo(irrfEsperado, 2);
            expect(res.liquidoTotal).toBeCloseTo(15000 - irrfEsperado, 2);
            expect(res.aliquotaNominal).toBe(22.5);
        });
    });

    describe('9. Módulo Teletrabalho & Ajuda de Custo (Art. 75-A a 75-E CLT)', () => {
        it('deve apurar rateio de internet e consumo de energia com isenção de encargos trabalhistas', () => {
            const res = calcularTeletrabalho({
                faturaInternet: 120,
                percentualInternet: 50,
                potenciaEquipamentosWatts: 250,
                horasTrabalhoDia: 8,
                tarifaEnergiaKwh: 0.80,
                diasHomeOffice: 22,
                auxilioErgonomiaEquip: 50,
                valorVTDiario: 12
            });

            expect(res.parcelaInternet).toBe(60); // 120 * 50% * 1.0
            // Consumo: 0.25 kW * 8h * 22 dias = 44 kWh * 0.80 = R$ 35,20
            expect(res.parcelaEnergia).toBeCloseTo(35.20, 2);
            expect(res.totalAjudaCusto).toBeCloseTo(60 + 35.20 + 50, 2); // R$ 145,20
            expect(res.vtEconomizado).toBe(12 * 22); // R$ 264,00
            expect(res.saldoEmpresa).toBeGreaterThan(0); // Empresa economizou com relação ao VT
            expect(res.empresaEconomizou).toBe(true);
        });
    });

    describe('10. Módulo Equiparação Salarial (Art. 461 CLT & Lei 14.611/2023)', () => {
        it('deve calcular a diferença mensal, reflexos em 13º, férias + 1/3 e FGTS 8%', () => {
            const res = calcularEquiparacao({
                salarioReclamante: 3000,
                salarioParadigma: 5000,
                mesesPeriodo: 12,
                incluir13o: true,
                incluirFeriasTerco: true,
                incluirFGTS: true,
                incluirMultaFGTS: false,
                discriminacaoGenero: false
            });

            expect(res.diferencaMensal).toBe(2000);
            expect(res.totalDiferencaNominal).toBe(24000); // 2000 * 12
            expect(res.reflexo13o).toBe(2000); // 1/12 * 12 = 1 salário
            expect(res.reflexoFeriasTerco).toBeCloseTo(2000 * (4 / 3), 2); // 2666.67
            const subtotal = 24000 + 2000 + (2000 * (4 / 3));
            expect(res.subtotalRemuneratorio).toBeCloseTo(subtotal, 2);
            expect(res.valorFGTS).toBeCloseTo(subtotal * 0.08, 2);
            expect(res.passivoTotal).toBeCloseTo(subtotal + (subtotal * 0.08), 2);
        });

        it('deve aplicar a multa de 10x o novo salário na discriminação de gênero (Lei 14.611/2023)', () => {
            const res = calcularEquiparacao({
                salarioReclamante: 4000,
                salarioParadigma: 6000,
                mesesPeriodo: 6,
                discriminacaoGenero: true
            });

            expect(res.multaDiscriminacao).toBe(60000); // 10 * 6000
            expect(res.passivoTotal).toBeGreaterThan(60000);
        });
    });

    describe('11. Módulo Fracionamento de Férias e Calendário CLT (Art. 134 e 143 CLT)', () => {
        it('deve validar com sucesso um fracionamento legal em 2 períodos (ex: 15 + 15 dias)', () => {
            const res = validarFracionamentoFerias({
                diasTotaisDireito: 30,
                venderAbono: false,
                periodos: [15, 15],
                dataInicio1: '2026-10-05' // Segunda-feira
            });

            expect(res.valido).toBe(true);
            expect(res.erros.length).toBe(0);
            expect(res.qtdPeriodos).toBe(2);
            expect(res.cronograma.length).toBe(2);
            expect(res.cronograma[0].dataLimitePagamento).toBe('2026-10-03'); // 2 dias antes (Art. 145 CLT)
        });

        it('deve validar fracionamento em 3 períodos com regra dos 14 dias respeitada (ex: 14 + 8 + 8 dias)', () => {
            const res = validarFracionamentoFerias({
                diasTotaisDireito: 30,
                venderAbono: false,
                periodos: [14, 8, 8]
            });

            expect(res.valido).toBe(true);
            expect(res.somaDias).toBe(30);
        });

        it('deve rejeitar fracionamento onde nenhum período tenha pelo menos 14 dias (ex: 10 + 10 + 10 dias)', () => {
            const res = validarFracionamentoFerias({
                diasTotaisDireito: 30,
                venderAbono: false,
                periodos: [10, 10, 10]
            });

            expect(res.valido).toBe(false);
            expect(res.erros.some(e => e.includes('14 dias'))).toBe(true);
        });

        it('deve rejeitar fracionamento onde algum período seja menor que 5 dias (ex: 20 + 6 + 4 dias)', () => {
            const res = validarFracionamentoFerias({
                diasTotaisDireito: 30,
                venderAbono: false,
                periodos: [20, 6, 4]
            });

            expect(res.valido).toBe(false);
            expect(res.erros.some(e => e.includes('5 dias'))).toBe(true);
        });

        it('deve emitir aviso quando as férias começarem em quinta ou sexta-feira (Art. 134, § 3º CLT)', () => {
            const res = validarFracionamentoFerias({
                diasTotaisDireito: 30,
                venderAbono: false,
                periodos: [15, 15],
                dataInicio1: '2026-10-09' // Sexta-feira
            });

            expect(res.avisos.length).toBeGreaterThan(0);
            expect(res.avisos[0]).toContain('sexta-feira');
        });
    });

    describe('12. Módulo Folha de Pagamento em Lote & Encargos Patronais', () => {
        it('deve processar múltiplos colaboradores e calcular encargos patronais (Lucro Presumido)', () => {
            const colaboradores = [
                { matricula: '001', nome: 'Colaborador A', cargo: 'Dev', salarioBase: 5000, horasExtras50: 0, faltasDias: 0, dependentes: 0 },
                { matricula: '002', nome: 'Colaborador B', cargo: 'Designer', salarioBase: 3000, horasExtras50: 10, faltasDias: 0, dependentes: 1 }
            ];

            const { resultados, resumo } = processarFolhaLote(colaboradores, {
                optanteSimples: false,
                aliquotaRat: 2.0,
                fatorFap: 1.0,
                aliquotaTerceiros: 5.8
            });

            expect(resumo.totalColaboradores).toBe(2);
            expect(resumo.totalBruto).toBeGreaterThan(8000);
            expect(resumo.totalLiquido).toBeGreaterThan(6000);
            expect(resumo.totalFgts).toBeGreaterThan(0);
            expect(resumo.totalInssPatronal).toBeGreaterThan(0); // 20%
            expect(resumo.totalCustoEmpresa).toBeGreaterThan(resumo.totalBruto);
            expect(resultados.length).toBe(2);
        });

        it('deve isentar INSS Patronal e Terceiros para empresas optantes do Simples Nacional', () => {
            const colaboradores = [
                { matricula: '001', nome: 'Colaborador Simples', salarioBase: 4000 }
            ];

            const { resumo } = processarFolhaLote(colaboradores, { optanteSimples: true });

            expect(resumo.totalInssPatronal).toBe(0);
            expect(resumo.totalRatFap).toBe(0);
            expect(resumo.totalTerceiros).toBe(0);
            expect(resumo.totalFgts).toBeCloseTo(4000 * 0.08, 2);
        });

        it('deve fazer o parse correto de CSV de colaboradores', () => {
            const csv = 'Nome;Cargo;SalarioBase;HorasExtras50;HorasExtras100;FaltasDias;Dependentes;DescontoVT;AnosServico\n' +
                        'Maria Silva;Gerente;7000;0;0;0;1;nao;3';
            const colabs = parsearCsvFolha(csv);

            expect(colabs.length).toBe(1);
            expect(colabs[0].nome).toBe('Maria Silva');
            expect(colabs[0].salarioBase).toBe(7000);
            expect(colabs[0].dependentes).toBe(1);
        });
    });

    describe('13. Gestor de Convenção Coletiva (CCT/ACT & ATS)', () => {
        it('deve calcular corretamente o Adicional por Tempo de Serviço (Quinquênio = 5 anos)', () => {
            const configQuinquenio = {
                ativo: true,
                tipoAts: 'QUINQUENIO',
                percentualAtsPorPeriodo: 5.0
            };

            // 11 anos de casa = 2 quinquênios = 10%
            const ats = calcularATS(4000, 11, configQuinquenio);
            expect(ats).toBe(400); // 10% de 4000
        });

        it('deve retornar 0 quando a convenção coletiva estiver inativa', () => {
            const configInativo = {
                ativo: false,
                tipoAts: 'ANUENIO',
                percentualAtsPorPeriodo: 1.0
            };

            const ats = calcularATS(5000, 5, configInativo);
            expect(ats).toBe(0);
        });
    });

    describe('14. Mapeamento de Rubricas eSocial (Tabela S-1010)', () => {
        it('deve localizar rubricas padrão e conter incidências de INSS, FGTS e IRRF', () => {
            const rubricaSalario = obterRubrica('1000');
            expect(rubricaSalario).not.toBeNull();
            expect(rubricaSalario.nome).toContain('Salário');
            expect(rubricaSalario.incidencias.inss.codigo).toBe('11');
            expect(rubricaSalario.incidencias.fgts.codigo).toBe('11');
            expect(rubricaSalario.incidencias.irrf.codigo).toBe('11');

            const rubricaPlr = obterRubrica('1600');
            expect(rubricaPlr).not.toBeNull();
            expect(rubricaPlr.incidencias.inss.codigo).toBe('00'); // Isento de INSS
            expect(rubricaPlr.incidencias.fgts.codigo).toBe('00'); // Isento de FGTS
            expect(rubricaPlr.incidencias.irrf.codigo).toBe('31'); // Tributação exclusiva

            const todas = listarTodasRubricas();
            expect(todas.length).toBeGreaterThanOrEqual(10);
        });
    });

    describe('15. Gestão de Colaboradores (Dossiê Digital, Validações & Conversores)', () => {
        it('deve validar CPF com algoritmo oficial dos dois dígitos verificadores', () => {
            // CPFs válidos conhecidos
            expect(validarCPF('52998224725')).toBe(true);
            expect(validarCPF('529.982.247-25')).toBe(true);
            expect(validarCPF('12345678909')).toBe(true);

            // CPFs com repetição inválida
            expect(validarCPF('111.111.111-11')).toBe(false);
            expect(validarCPF('000.000.000-00')).toBe(false);

            // CPFs com dígito verificador incorreto
            expect(validarCPF('529.982.247-00')).toBe(false);
            expect(validarCPF('123.456.789-01')).toBe(false);
            expect(validarCPF('')).toBe(false);
            expect(validarCPF('123')).toBe(false);
        });

        it('deve mascarar corretamente CPF e PIS', () => {
            expect(mascararCPF('52998224725')).toBe('529.982.247-25');
            expect(mascararPIS('12345678901')).toBe('123.45678.90-1');
        });

        it('deve calcular o tempo de casa com precisão em anos, meses e dias', () => {
            const tempo = calcularTempoDeCasa('2022-01-10', '2024-03-15');
            expect(tempo.anos).toBe(2);
            expect(tempo.meses).toBe(2);
            expect(tempo.dias).toBe(5);
            expect(tempo.textoFormatado).toContain('2 anos');
            expect(tempo.textoFormatado).toContain('2 meses');
            expect(tempo.textoFormatado).toContain('5 dias');
        });

        it('deve verificar o contrato de experiência e seus marcos de 45 e 90 dias', () => {
            // Contrato indeterminado
            const indet = verificarContratoExperiencia('2024-01-01', 'CLT Indeterminado');
            expect(indet.emExperiencia).toBe(false);

            // Contrato de experiência recente (ex: admitido há 10 dias)
            const hoje = new Date();
            const d10 = new Date(hoje.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const expRecente = verificarContratoExperiencia(d10, 'Experiência (45+45 dias)');
            expect(expRecente.emExperiencia).toBe(true);
            expect(expRecente.diasDecorridos).toBe(10);
            expect(expRecente.diasPara45).toBe(35);
            expect(expRecente.statusExperiencia).toContain('1º Período');
        });

        it('deve converter colaborador para item de folha em lote com todos os atributos', () => {
            const c = {
                id: 10,
                matricula: 'RH-010',
                nome: 'Carlos Silva',
                cargo: 'Analista Financeiro',
                departamento: 'Financeiro',
                salarioBase: 5000,
                dependentesIR: 2,
                filhosSalarioFamilia: 1,
                optanteVT: true,
                custoDiarioVT: 9.60,
                adicionalPericulosidade: true,
                adicionalInsalubridade: '20'
            };

            const itemFolha = converterParaItemFolha(c);
            expect(itemFolha.matricula).toBe('RH-010');
            expect(itemFolha.salarioBase).toBe(5000);
            expect(itemFolha.periculosidade).toBe(true);
            expect(itemFolha.insalubridadePerc).toBe(20);
            expect(itemFolha.dependentes).toBe(2);
        });

        it('deve converter colaborador para payload do holerite oficial com adicionais calculados', () => {
            const c = {
                id: 20,
                matricula: 'RH-020',
                nome: 'Mariana Costa',
                cargo: 'Operadora de Produção',
                salarioBase: 3000,
                adicionalPericulosidade: true,
                adicionalInsalubridade: '20'
            };

            const itemHolerite = converterParaItemHolerite(c, { razaoSocial: 'Fabrica Brasil S/A' }, 'Agosto / 2026');
            expect(itemHolerite.colaborador.nome).toBe('Mariana Costa');
            expect(itemHolerite.referencia).toBe('Agosto / 2026');
            
            const proventos = itemHolerite.proventos;
            expect(proventos.some(p => p.codigo === '1000' && p.valor === 3000)).toBe(true);
            expect(proventos.some(p => p.codigo === '1091' && p.valor === 900)).toBe(true);
            expect(proventos.some(p => p.codigo === '1090' && p.valor === 282.40)).toBe(true);
        });
    });

    describe('16. Gestão e Escala de Férias (Períodos Aquisitivos, Agendamento & Provisão)', () => {
        it('deve aplicar com exatidão a tabela do Art. 130 da CLT para faltas injustificadas', () => {
            expect(calcularDiasDisponiveis(0)).toBe(30);
            expect(calcularDiasDisponiveis(3)).toBe(30);
            expect(calcularDiasDisponiveis(5)).toBe(30);
            expect(calcularDiasDisponiveis(6)).toBe(24);
            expect(calcularDiasDisponiveis(14)).toBe(24);
            expect(calcularDiasDisponiveis(15)).toBe(18);
            expect(calcularDiasDisponiveis(23)).toBe(18);
            expect(calcularDiasDisponiveis(24)).toBe(12);
            expect(calcularDiasDisponiveis(32)).toBe(12);
            expect(calcularDiasDisponiveis(33)).toBe(0); // Perde o direito
            expect(calcularDiasDisponiveis(50)).toBe(0);
        });

        it('deve calcular corretamente os períodos aquisitivos (PA) e concessivos (PC)', () => {
            // Admissão: 10/01/2023, data-base: 15/03/2026
            const pas = calcularPeriodosAquisitivos('2023-01-10', '2026-03-15');
            expect(pas.length).toBe(4);

            // PA 1: 10/01/2023 a 09/01/2024
            expect(pas[0].paInicio).toBe('2023-01-10');
            expect(pas[0].paFim).toBe('2024-01-09');
            expect(pas[0].pcInicio).toBe('2024-01-10');
            expect(pas[0].pcFim).toBe('2025-01-09');
            expect(pas[0].paCompleto).toBe(true);
            // Sem gozo e base (2026-03-15) > pcFim (2025-01-09) -> Vencido com alerta de dobra
            expect(pas[0].status).toBe('vencido');
            expect(pas[0].alertaDobro).toBe(true);

            // PA 4: em aberto (acumulando)
            expect(pas[3].status).toBe('aberto');
            expect(pas[3].paCompleto).toBe(false);
        });

        it('deve marcar PA como gozado ou agendado quando houver agendamentos correspondentes', () => {
            const feriasConcedidas = [
                { periodoAquisitivoInicio: '2023-01-10', status: 'concluida' },
                { periodoAquisitivoInicio: '2024-01-10', status: 'agendada' }
            ];

            const pas = calcularPeriodosAquisitivos('2023-01-10', '2026-03-15', feriasConcedidas);
            expect(pas[0].status).toBe('gozado');
            expect(pas[0].alertaDobro).toBe(false);
            expect(pas[1].status).toBe('agendado');
        });

        it('deve identificar colaboradores com férias vencidas (Art. 137 CLT)', () => {
            const colaboradores = [
                { id: 1, nome: 'João Antigo', admissao: '2022-01-01', status: 'Ativo', matricula: '001' },
                { id: 2, nome: 'Maria Nova', admissao: '2025-11-01', status: 'Ativo', matricula: '002' }
            ];

            const alertas = verificarAlertaFeriasVencidas(colaboradores, [], '2026-03-15');
            expect(alertas.length).toBeGreaterThanOrEqual(1);
            expect(alertas[0].colaboradorId).toBe(1);
            expect(alertas[0].diasVencidos).toBeGreaterThan(0);
        });

        it('deve validar o fracionamento legal conforme Art. 134, § 1º e § 3º da CLT', () => {
            // Fracionamento legal: 14 + 8 + 8 = 30 dias (início numa segunda-feira: 2026-06-01)
            const resValido = validarAgendamentoFerias({
                diasDireito: 30,
                abonoPecuniario: false,
                periodos: [
                    { dias: 14, dataInicio: '2026-06-01' },
                    { dias: 8, dataInicio: '2026-09-01' },
                    { dias: 8, dataInicio: '2026-12-01' }
                ]
            });
            expect(resValido.valido).toBe(true);
            expect(resValido.erros.length).toBe(0);

            // Fracionamento ilegal: nenhum período >= 14 dias (10 + 10 + 10)
            const resIlegal1 = validarAgendamentoFerias({
                diasDireito: 30,
                abonoPecuniario: false,
                periodos: [
                    { dias: 10, dataInicio: '2026-06-01' },
                    { dias: 10, dataInicio: '2026-09-01' },
                    { dias: 10, dataInicio: '2026-12-01' }
                ]
            });
            expect(resIlegal1.valido).toBe(false);
            expect(resIlegal1.erros.some(e => e.includes('14 dias corridos'))).toBe(true);

            // Fracionamento ilegal: período menor que 5 dias (15 + 11 + 4)
            const resIlegal2 = validarAgendamentoFerias({
                diasDireito: 30,
                abonoPecuniario: false,
                periodos: [
                    { dias: 15, dataInicio: '2026-06-01' },
                    { dias: 11, dataInicio: '2026-09-01' },
                    { dias: 4, dataInicio: '2026-12-01' }
                ]
            });
            expect(resIlegal2.valido).toBe(false);
            expect(resIlegal2.erros.some(e => e.includes('inferior a 5 dias'))).toBe(true);

            // Aviso de início em sexta-feira (Art. 134 § 3º: 2026-06-05 é sexta)
            const resSexta = validarAgendamentoFerias({
                diasDireito: 30,
                abonoPecuniario: false,
                periodos: [
                    { dias: 30, dataInicio: '2026-06-05' }
                ]
            });
            expect(resSexta.avisos.some(a => a.includes('sexta-feira'))).toBe(true);
        });

        it('deve calcular os valores monetários de férias com 1/3, abono pecuniário e dobra legal', () => {
            // Férias integrais padrão: 3.000 salário base
            const calc1 = calcularValorFerias({
                salarioBase: 3000,
                diasFerias: 30,
                abonoPecuniario: false,
                feriasEmDobro: false
            });
            expect(calc1.valorBase).toBe(3000);
            expect(calc1.tercoConstitucional).toBe(1000);
            expect(calc1.totalBruto).toBe(4000);
            expect(calc1.liquido).toBeLessThan(4000);
            expect(calc1.inss.valor).toBeGreaterThan(0);

            // Férias em dobro (Art. 137 CLT)
            const calcDobro = calcularValorFerias({
                salarioBase: 3000,
                diasFerias: 30,
                abonoPecuniario: false,
                feriasEmDobro: true
            });
            expect(calcDobro.valorBase).toBe(6000);
            expect(calcDobro.tercoConstitucional).toBe(2000);
            expect(calcDobro.totalBruto).toBe(8000);

            // Férias com Abono Pecuniário (10 dias de venda - Art. 143 CLT)
            const calcAbono = calcularValorFerias({
                salarioBase: 3000,
                diasFerias: 30,
                abonoPecuniario: true,
                feriasEmDobro: false
            });
            expect(calcAbono.diasAbono).toBe(10);
            expect(calcAbono.valorAbono).toBe(1000); // 10 dias de salário
            expect(calcAbono.tercoAbono).toBeCloseTo(333.33, 2);
        });

        it('deve calcular a provisão contábil de férias proporcional por colaborador e departamento', () => {
            const colaboradores = [
                { id: 1, nome: 'Carlos', salarioBase: 6000, admissao: '2025-01-01', departamento: 'Engenharia', status: 'Ativo' },
                { id: 2, nome: 'Ana', salarioBase: 3000, admissao: '2025-01-01', departamento: 'RH', status: 'Ativo' }
            ];

            // 1 ano decorrido (12 meses):
            // Carlos: (6000 + 2000) = 8000
            // Ana: (3000 + 1000) = 4000
            const res = calcularProvisaoFerias(colaboradores, [], '2026-01-01');
            expect(res.porDepartamento['Engenharia']).toBe(8000);
            expect(res.porDepartamento['RH']).toBe(4000);
            expect(res.totalProvisao).toBe(12000);
        });

        it('deve gerar os dados da timeline anual de férias com cálculo percentual correto', () => {
            const colaboradores = [
                { id: 1, nome: 'Roberto Alves', status: 'Ativo', matricula: '001', iniciais: 'RA' }
            ];
            const todasFerias = [
                {
                    colaboradorId: 1,
                    status: 'agendada',
                    periodos: [
                        { dias: 30, dataInicio: '2026-01-01', dataFim: '2026-01-30' }
                    ]
                }
            ];

            const mapa = gerarMapaAnualFerias(colaboradores, todasFerias, 2026);
            expect(mapa.length).toBe(1);
            expect(mapa[0].barras.length).toBe(1);
            expect(mapa[0].barras[0].leftPct).toBeCloseTo(0, 0);
            expect(mapa[0].barras[0].widthPct).toBeGreaterThan(5);
            expect(mapa[0].barras[0].cor).toBe('bg-blue-500');
        });
    });
});


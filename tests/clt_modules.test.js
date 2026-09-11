import { describe, it, expect } from 'vitest';
import { calcularAdicionalNoturno } from '../assets/js/modules/noturno.js';
import { calcularRescisao, compararCenariosRescisao } from '../assets/js/modules/rescisao.js';
import { calcularFaltas, consultarImpactoFerias } from '../assets/js/modules/faltas.js';
import { calcularFerias, calcular13o } from '../assets/js/modules/ferias.js';
import { calcularSalarioLiquido } from '../assets/js/modules/liquido.js';
import { calcularCustosCltPj } from '../assets/js/modules/clt_pj.js';
import { calcularINSS, calcularIRRF } from '../assets/js/modules/tabelas.js';

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
});

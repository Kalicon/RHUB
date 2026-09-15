/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Gerador de Documentos Oficiais em PDF (Holerite & TRCT)
 * Renderização vetorial e download 100% Client-Side
 * ═══════════════════════════════════════════════════════════════════════
 */

import { formatarMoeda, formatarData } from './formatters.js';
import { obterRubrica } from '../data/esocial_rubricas.js';

/**
 * Gera o HTML oficial do Recibo de Pagamento (Holerite / Contracheque)
 * @param {object} dados 
 * @returns {string} HTML estilizado
 */
export function construirHtmlHolerite({
    empresa = {},
    colaborador = {},
    referencia = '',
    proventos = [],
    descontos = [],
    bases = {}
}) {
    const razaoSocial = empresa.razaoSocial || 'EMPRESA DEMONSTRAÇÃO LTDA';
    const cnpj = empresa.cnpj || '00.000.000/0001-91';
    const endereco = empresa.endereco || 'São Paulo - SP';

    const nome = colaborador.nome || 'Colaborador RHUB';
    const cargo = colaborador.cargo || 'Analista';
    const cbo = colaborador.cbo || '4110-10';
    const matricula = colaborador.matricula || '001';
    const admissao = colaborador.admissao || '01/01/2024';

    const totalVencimentos = proventos.reduce((acc, p) => acc + (p.valor || 0), 0);
    const totalDescontos = descontos.reduce((acc, d) => acc + (d.valor || 0), 0);
    const valorLiquido = totalVencimentos - totalDescontos;

    const linhasHtml = [];

    // Mesclar proventos e descontos para a tabela padrão
    const maxLinhas = Math.max(proventos.length, descontos.length, 6);
    for (let i = 0; i < maxLinhas; i++) {
        const prov = proventos[i];
        const desc = descontos[i];

        if (prov) {
            linhasHtml.push(`
                <tr class="border-b border-gray-200 text-[11px]">
                    <td class="py-1 px-2 font-mono text-gray-600">${prov.codigo || '1000'}</td>
                    <td class="py-1 px-2 font-medium text-gray-800">${prov.descricao}</td>
                    <td class="py-1 px-2 text-right font-mono text-gray-600">${prov.referencia || ''}</td>
                    <td class="py-1 px-2 text-right font-mono text-gray-900 font-semibold">${formatarMoeda(prov.valor)}</td>
                    <td class="py-1 px-2 text-right font-mono text-gray-400">—</td>
                </tr>
            `);
        }
        if (desc) {
            linhasHtml.push(`
                <tr class="border-b border-gray-200 text-[11px]">
                    <td class="py-1 px-2 font-mono text-gray-600">${desc.codigo || '9201'}</td>
                    <td class="py-1 px-2 font-medium text-gray-800">${desc.descricao}</td>
                    <td class="py-1 px-2 text-right font-mono text-gray-600">${desc.referencia || ''}</td>
                    <td class="py-1 px-2 text-right font-mono text-gray-400">—</td>
                    <td class="py-1 px-2 text-right font-mono text-red-700 font-semibold">${formatarMoeda(desc.valor)}</td>
                </tr>
            `);
        }
    }

    return `
    <div id="holerite-document" style="width: 210mm; min-height: 148mm; padding: 10mm; background: #fff; color: #1f2937; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; box-sizing: border-box; font-size: 11px;">
        <!-- Cabeçalho da Empresa -->
        <div style="border: 1px solid #9ca3af; border-radius: 4px; padding: 8px; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h2 style="margin: 0; font-size: 14px; font-weight: 700; color: #111827; text-transform: uppercase;">${razaoSocial}</h2>
                    <p style="margin: 2px 0 0 0; font-size: 10px; color: #4b5563;">CNPJ: ${cnpj} &bull; ${endereco}</p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 12px; font-weight: 700; color: #1e3a8a; text-transform: uppercase;">Recibo de Pagamento a Empregado</div>
                    <div style="font-size: 11px; font-weight: 600; color: #374151;">Referência: ${referencia || 'Mês Atual'}</div>
                </div>
            </div>
        </div>

        <!-- Identificação do Empregado -->
        <div style="border: 1px solid #9ca3af; border-radius: 4px; padding: 8px; margin-bottom: 8px; background: #f9fafb;">
            <div style="display: grid; grid-template-columns: 80px 1fr 140px 100px; gap: 8px; font-size: 10px;">
                <div><span style="color: #6b7280; display: block;">Código</span><strong style="font-size: 11px;">${matricula}</strong></div>
                <div><span style="color: #6b7280; display: block;">Nome do Funcionário</span><strong style="font-size: 11px;">${nome}</strong></div>
                <div><span style="color: #6b7280; display: block;">Função / CBO</span><strong style="font-size: 11px;">${cargo} (${cbo})</strong></div>
                <div><span style="color: #6b7280; display: block;">Admissão</span><strong style="font-size: 11px;">${admissao}</strong></div>
            </div>
        </div>

        <!-- Grade de Rubricas -->
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #9ca3af; margin-bottom: 8px;">
            <thead>
                <tr style="background: #e5e7eb; border-bottom: 1px solid #9ca3af; font-size: 10px; text-transform: uppercase; color: #374151;">
                    <th style="padding: 4px 8px; text-align: left; width: 60px;">Cód.</th>
                    <th style="padding: 4px 8px; text-align: left;">Descrição da Rubrica</th>
                    <th style="padding: 4px 8px; text-align: right; width: 70px;">Ref.</th>
                    <th style="padding: 4px 8px; text-align: right; width: 95px;">Vencimentos</th>
                    <th style="padding: 4px 8px; text-align: right; width: 95px;">Descontos</th>
                </tr>
            </thead>
            <tbody>
                ${linhasHtml.join('')}
            </tbody>
        </table>

        <!-- Totais e Líquido -->
        <div style="display: grid; grid-template-columns: 1fr 200px; gap: 8px; margin-bottom: 8px;">
            <div style="border: 1px solid #9ca3af; border-radius: 4px; padding: 6px; font-size: 10px; display: flex; flex-direction: column; justify-content: space-between;">
                <span style="color: #4b5563;">Mensagem / Observações:</span>
                <span style="color: #6b7280; font-size: 9px;">Documento emitido via RHUB — Departamento Pessoal &bull; Conformidade CLT / eSocial</span>
            </div>
            <div style="border: 1px solid #9ca3af; border-radius: 4px; padding: 6px; background: #f3f4f6;">
                <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px;">
                    <span>Total Vencimentos:</span>
                    <strong>${formatarMoeda(totalVencimentos)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 4px;">
                    <span>Total Descontos:</span>
                    <strong style="color: #991b1b;">${formatarMoeda(totalDescontos)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; border-top: 1px solid #9ca3af; padding-top: 4px;">
                    <strong>Valor Líquido:</strong>
                    <strong style="color: #1e3a8a; font-size: 13px;">${formatarMoeda(valorLiquido)}</strong>
                </div>
            </div>
        </div>

        <!-- Bases de Cálculo e Encargos -->
        <div style="border: 1px solid #9ca3af; border-radius: 4px; padding: 6px; margin-bottom: 12px; background: #fafafa; font-size: 9px;">
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; text-align: center;">
                <div><span style="color: #6b7280; display: block;">Salário Base</span><strong>${formatarMoeda(bases.salarioBase || 0)}</strong></div>
                <div><span style="color: #6b7280; display: block;">Sal. Contr. INSS</span><strong>${formatarMoeda(bases.baseInss || 0)}</strong></div>
                <div><span style="color: #6b7280; display: block;">Base Cálc. FGTS</span><strong>${formatarMoeda(bases.baseFgts || 0)}</strong></div>
                <div><span style="color: #6b7280; display: block;">FGTS do Mês (8%)</span><strong>${formatarMoeda(bases.fgtsMes || 0)}</strong></div>
                <div><span style="color: #6b7280; display: block;">Base Cálc. IRRF</span><strong>${formatarMoeda(bases.baseIrrf || 0)}</strong></div>
                <div><span style="color: #6b7280; display: block;">Faixa IRRF</span><strong>${bases.faixaIrrf || 'Isento'}</strong></div>
            </div>
        </div>

        <!-- Canhoto de Quitação e Assinatura -->
        <div style="border-top: 1px dashed #6b7280; padding-top: 8px; font-size: 9px; color: #4b5563;">
            <p style="margin: 0 0 10px 0;">RECEBI DA EMPRESA ACIMA A IMPORTÂNCIA LÍQUIDA ESPECIFICADA NESTE RECIBO, CORRESPONDENTE À QUITAÇÃO DO PERÍODO TRABALHADO.</p>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 15px;">
                <div style="border-top: 1px solid #374151; width: 140px; text-align: center; padding-top: 2px;">DATA ___/___/______</div>
                <div style="border-top: 1px solid #374151; width: 280px; text-align: center; padding-top: 2px;">ASSINATURA DO FUNCIONÁRIO</div>
            </div>
        </div>
    </div>
    `;
}

/**
 * Gera o HTML oficial do Termo de Rescisão do Contrato de Trabalho (TRCT)
 * @param {object} dados 
 * @returns {string}
 */
export function construirHtmlTRCT({
    empresa = {},
    trabalhador = {},
    contrato = {},
    verbas = [],
    deducoes = []
}) {
    const totalVerbas = verbas.reduce((acc, v) => acc + (v.valor || 0), 0);
    const totalDeducoes = deducoes.reduce((acc, d) => acc + (d.valor || 0), 0);
    const liquido = totalVerbas - totalDeducoes;

    return `
    <div id="trct-document" style="width: 210mm; min-height: 297mm; padding: 12mm; background: #fff; color: #111827; font-family: 'Inter', -apple-system, sans-serif; box-sizing: border-box; font-size: 10px; line-height: 1.4;">
        <!-- Cabeçalho MTE -->
        <div style="text-align: center; border-bottom: 2px solid #1f2937; padding-bottom: 6px; margin-bottom: 10px;">
            <h1 style="margin: 0; font-size: 14px; font-weight: 800; text-transform: uppercase;">MINISTÉRIO DO TRABALHO E EMPREGO — MTE</h1>
            <h2 style="margin: 2px 0 0 0; font-size: 12px; font-weight: 700; color: #1e40af;">TERMO DE RESCISÃO DO CONTRATO DE TRABALHO (TRCT)</h2>
            <span style="font-size: 9px; color: #6b7280;">PORTARIA Nº 1.057/2012 / ART. 477 DA CLT</span>
        </div>

        <!-- Bloco Empregador -->
        <div style="border: 1px solid #9ca3af; margin-bottom: 8px; padding: 6px; background: #f9fafb;">
            <strong style="display: block; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; margin-bottom: 4px; color: #1f2937;">IDENTIFICAÇÃO DO EMPREGADOR</strong>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
                <div><span style="color: #6b7280; display: block;">01 CNPJ/CEI</span><strong>${empresa.cnpj || '00.000.000/0001-91'}</strong></div>
                <div style="grid-column: span 2;"><span style="color: #6b7280; display: block;">02 Razão Social/Nome</span><strong>${empresa.razaoSocial || 'EMPRESA DEMONSTRAÇÃO LTDA'}</strong></div>
            </div>
        </div>

        <!-- Bloco Trabalhador -->
        <div style="border: 1px solid #9ca3af; margin-bottom: 8px; padding: 6px; background: #f9fafb;">
            <strong style="display: block; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; margin-bottom: 4px; color: #1f2937;">IDENTIFICAÇÃO DO TRABALHADOR</strong>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 6px;">
                <div><span style="color: #6b7280; display: block;">10 PIS/PASEP</span><strong>${trabalhador.pis || '123.45678.90-1'}</strong></div>
                <div style="grid-column: span 2;"><span style="color: #6b7280; display: block;">11 Nome Completo</span><strong>${trabalhador.nome || 'COLABORADOR RESCINDIDO'}</strong></div>
                <div><span style="color: #6b7280; display: block;">15 CPF</span><strong>${trabalhador.cpf || '000.000.000-00'}</strong></div>
            </div>
        </div>

        <!-- Bloco Contrato -->
        <div style="border: 1px solid #9ca3af; margin-bottom: 8px; padding: 6px;">
            <strong style="display: block; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; margin-bottom: 4px; color: #1f2937;">DADOS DO CONTRATO E AFASTAMENTO</strong>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
                <div><span style="color: #6b7280; display: block;">21 Causa do Afastamento</span><strong>${contrato.motivo || 'SEM JUSTA CAUSA'}</strong></div>
                <div><span style="color: #6b7280; display: block;">24 Data de Admissão</span><strong>${contrato.dataAdmissao || '01/01/2022'}</strong></div>
                <div><span style="color: #6b7280; display: block;">26 Data de Afastamento</span><strong>${contrato.dataDemissao || '15/09/2026'}</strong></div>
                <div><span style="color: #6b7280; display: block;">28 Última Remuneração</span><strong>${formatarMoeda(contrato.salarioBase || 0)}</strong></div>
            </div>
        </div>

        <!-- Verbas Rescisórias -->
        <div style="border: 1px solid #9ca3af; margin-bottom: 8px;">
            <div style="background: #e5e7eb; padding: 4px 6px; font-weight: 700; border-bottom: 1px solid #9ca3af;">DISCRIMINAÇÃO DAS VERBAS RESCISÓRIAS (PROVENTOS)</div>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 1px solid #e5e7eb; font-size: 9px; color: #4b5563;">
                        <th style="padding: 3px 6px; text-align: left; width: 60px;">Campo</th>
                        <th style="padding: 3px 6px; text-align: left;">Rubrica Rescisória</th>
                        <th style="padding: 3px 6px; text-align: right; width: 100px;">Valor (R$)</th>
                    </tr>
                </thead>
                <tbody>
                    ${verbas.map(v => `
                        <tr style="border-bottom: 1px solid #f3f4f6;">
                            <td style="padding: 3px 6px; font-mono; color: #6b7280;">${v.campo || '50'}</td>
                            <td style="padding: 3px 6px; font-weight: 600;">${v.descricao}</td>
                            <td style="padding: 3px 6px; text-align: right; font-weight: 700;">${formatarMoeda(v.valor)}</td>
                        </tr>
                    `).join('')}
                    <tr style="background: #f9fafb; font-weight: 700;">
                        <td colspan="2" style="padding: 4px 6px; text-align: right;">Total Bruto das Verbas:</td>
                        <td style="padding: 4px 6px; text-align: right; color: #1e3a8a;">${formatarMoeda(totalVerbas)}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Deduções -->
        <div style="border: 1px solid #9ca3af; margin-bottom: 10px;">
            <div style="background: #e5e7eb; padding: 4px 6px; font-weight: 700; border-bottom: 1px solid #9ca3af;">DEDUÇÕES LEGAIS (DESCONTOS)</div>
            <table style="width: 100%; border-collapse: collapse;">
                <tbody>
                    ${deducoes.map(d => `
                        <tr style="border-bottom: 1px solid #f3f4f6;">
                            <td style="padding: 3px 6px; width: 60px; font-mono; color: #6b7280;">${d.campo || '100'}</td>
                            <td style="padding: 3px 6px; font-weight: 600;">${d.descricao}</td>
                            <td style="padding: 3px 6px; text-align: right; font-weight: 700; color: #b91c1c; width: 100px;">${formatarMoeda(d.valor)}</td>
                        </tr>
                    `).join('')}
                    <tr style="background: #f9fafb; font-weight: 700;">
                        <td colspan="2" style="padding: 4px 6px; text-align: right;">Total das Deduções:</td>
                        <td style="padding: 4px 6px; text-align: right; color: #b91c1c;">${formatarMoeda(totalDeducoes)}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Líquido Final -->
        <div style="border: 2px solid #1e3a8a; border-radius: 4px; padding: 8px; background: #eff6ff; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <span style="font-size: 12px; font-weight: 700; text-transform: uppercase;">Valor Líquido da Rescisão a Pagar:</span>
            <span style="font-size: 16px; font-weight: 800; color: #1e3a8a;">${formatarMoeda(liquido)}</span>
        </div>

        <!-- Termo de Quitação -->
        <div style="border: 1px solid #9ca3af; padding: 8px; font-size: 9px; line-height: 1.5; color: #374151;">
            <p style="margin: 0 0 20px 0;">Foi realizado o efetivo pagamento das verbas rescisórias supra especificadas, dando-se plena e mútua quitação das parcelas expressamente discriminadas neste Termo de Rescisão, nos termos do Art. 477 da CLT.</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: center; padding-top: 15px;">
                <div>
                    <div style="border-top: 1px solid #374151; padding-top: 4px;">ASSINATURA DO EMPREGADOR / PREPOSTO</div>
                </div>
                <div>
                    <div style="border-top: 1px solid #374151; padding-top: 4px;">ASSINATURA DO TRABALHADOR</div>
                </div>
            </div>
        </div>
    </div>
    `;
}

/**
 * Dispara o download em PDF utilizando a biblioteca html2pdf.js
 * @param {string} htmlContent 
 * @param {string} filename 
 */
export async function baixarDocumentoPDF(htmlContent, filename = 'documento.pdf') {
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    const elemento = container.firstElementChild;

    if (window.html2pdf) {
        const opt = {
            margin: 5,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            await window.html2pdf().set(opt).from(elemento).save();
        } catch (e) {
            console.error('Erro no html2pdf:', e);
            fallbackImpressao(htmlContent);
        } finally {
            document.body.removeChild(container);
        }
    } else {
        document.body.removeChild(container);
        fallbackImpressao(htmlContent);
    }
}

/**
 * Fallback via janela de impressão do navegador
 */
function fallbackImpressao(htmlContent) {
    const win = window.open('', '_blank');
    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Impressão de Documento — RHUB</title>
            <style>
                @page { margin: 10mm; size: A4 portrait; }
                body { margin: 0; font-family: sans-serif; }
            </style>
        </head>
        <body onload="window.print();">
            ${htmlContent}
        </body>
        </html>
    `);
    win.document.close();
}

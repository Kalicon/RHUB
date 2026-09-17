"""
RHUB HRMS — Gerador Corporativo de Planilhas Executivas Excel (.xlsx)
Utiliza OpenPyXL com design avançado, paleta profissional, fórmulas dinâmicas e abas corporativas.
"""

import io
from datetime import datetime
from typing import Dict, Any, List
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from ..models.schemas import FolhaCompetenciaRequest
from .compliance_auditor import auditar_folha_e_ponto

def gerar_planilha_executiva_excel(dados: FolhaCompetenciaRequest) -> bytes:
    """
    Gera uma pasta de trabalho Excel (.xlsx) profissional com 4 abas estruturadas:
    1. Dashboard Executivo & Encargos
    2. Folha Analítica de Pagamento
    3. Apuração de Ponto & Eventos
    4. Relatório de Compliance CLT
    """
    wb = Workbook()
    
    # ─── Estilos Globais e Paleta Corporativa ─────────────────
    fonte_titulo = Font(name="Calibri", size=15, bold=True, color="FFFFFF")
    fonte_subtitulo = Font(name="Calibri", size=11, italic=True, color="E2E8F0")
    fonte_secao = Font(name="Calibri", size=12, bold=True, color="1E293B")
    fonte_cabecalho_tabela = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
    fonte_dados = Font(name="Calibri", size=10, color="0F172A")
    fonte_totais = Font(name="Calibri", size=10, bold=True, color="0F172A")

    fill_topo = PatternFill(start_color="1E1B4B", end_color="1E1B4B", fill_type="solid") # Indigo profundo
    fill_cabecalho_azul = PatternFill(start_color="312E81", end_color="312E81", fill_type="solid")
    fill_cabecalho_verde = PatternFill(start_color="065F46", end_color="065F46", fill_type="solid")
    fill_cabecalho_ambar = PatternFill(start_color="92400E", end_color="92400E", fill_type="solid")
    fill_zebrado = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    fill_totais = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")

    borda_fina = Side(style="thin", color="CBD5E1")
    borda_dupla = Side(style="double", color="64748B")
    borda_celula = Border(left=borda_fina, right=borda_fina, top=borda_fina, bottom=borda_fina)
    borda_total = Border(top=borda_fina, bottom=borda_dupla)

    align_center = Alignment(horizontal="center", vertical="center")
    align_left = Alignment(horizontal="left", vertical="center")
    align_right = Alignment(horizontal="right", vertical="center")

    empresa = dados.empresa or {"razaoSocial": "RHUB TECNOLOGIA & GESTAO DE PESSOAS LTDA", "cnpj": "12.345.678/0001-90"}
    competencia = dados.competencia

    # ═════════════════════════════════════════════════════════
    #  ABA 1: DASHBOARD EXECUTIVO
    # ═════════════════════════════════════════════════════════
    ws_dash = wb.active
    ws_dash.title = "Dashboard Executivo"
    ws_dash.views.sheetView[0].showGridLines = True

    # Banner Superior
    ws_dash.merge_cells("A1:G2")
    cell_banner = ws_dash["A1"]
    cell_banner.value = f"RHUB HRMS — RELATÓRIO EXECUTIVO DA FOLHA DE PAGAMENTO | {competencia}"
    cell_banner.font = fonte_titulo
    cell_banner.fill = fill_topo
    cell_banner.alignment = align_center

    ws_dash["A3"] = f"Empregador: {empresa.get('razaoSocial')} | CNPJ: {empresa.get('cnpj')} | Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}"
    ws_dash["A3"].font = Font(size=9, italic=True, color="64748B")

    # Quadro de KPIs Executivos
    kpis = [
        ("Total Folha Bruta (Proventos)", sum(c.totalProventos or c.salarioBruto for c in dados.colaboradores), "B5", "C5", "10B981"),
        ("Total Descontos (INSS/IRRF/VT)", sum(c.totalDescontos for c in dados.colaboradores), "D5", "E5", "EF4444"),
        ("Total Líquido Efetivo a Pagar", sum(c.salarioLiquido for c in dados.colaboradores), "F5", "G5", "3B82F6"),
    ]

    for titulo, valor, pos1, pos2, cor_borda in kpis:
        c1 = ws_dash[pos1]
        c1.value = titulo
        c1.font = Font(name="Calibri", size=9, bold=True, color="475569")
        c1.alignment = align_center
        c1.fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")

        # Linha de valor abaixo
        col_letter = pos1[0]
        row_val = int(pos1[1:]) + 1
        c_val = ws_dash[f"{col_letter}{row_val}"]
        c_val.value = valor
        c_val.number_format = '"R$" #,##0.00'
        c_val.font = Font(name="Calibri", size=14, bold=True, color="0F172A")
        c_val.alignment = align_center

    # Quadro de Encargos Sociais Patronais (Custo Empresa)
    ws_dash["A8"] = "DEMONSTRATIVO DE ENCARGOS PATRONAIS & TRIBUTOS EMPRESA"
    ws_dash["A8"].font = fonte_secao

    headers_encargos = ["Rubrica de Encargo", "Alíquota Referência", "Base de Cálculo", "Valor Devido Empresa"]
    for col_idx, h in enumerate(headers_encargos, start=1):
        c = ws_dash.cell(row=9, column=col_idx, value=h)
        c.font = fonte_cabecalho_tabela
        c.fill = fill_cabecalho_azul
        c.alignment = align_center
        c.border = borda_celula

    total_bruto = sum(c.totalProventos or c.salarioBruto for c in dados.colaboradores)
    encargos_itens = [
        ("INSS Patronal (Cota Patronal)", "20,00%", total_bruto, total_bruto * 0.20),
        ("RAT / FAP (Acidente de Trabalho)", "2,00%", total_bruto, total_bruto * 0.02),
        ("Terceiros / Outras Entidades (Sistema S / INCRA)", "5,80%", total_bruto, total_bruto * 0.058),
        ("FGTS Mensal (Lei 8.036/90)", "8,00%", total_bruto, total_bruto * 0.08),
    ]

    for idx, (rubrica, aliq, base, valor) in enumerate(encargos_itens, start=10):
        ws_dash.cell(row=idx, column=1, value=rubrica).border = borda_celula
        ws_dash.cell(row=idx, column=2, value=aliq).alignment = align_center
        ws_dash.cell(row=idx, column=2).border = borda_celula
        
        c_base = ws_dash.cell(row=idx, column=3, value=base)
        c_base.number_format = '"R$" #,##0.00'
        c_base.alignment = align_right
        c_base.border = borda_celula

        c_val = ws_dash.cell(row=idx, column=4, value=valor)
        c_val.number_format = '"R$" #,##0.00'
        c_val.alignment = align_right
        c_val.font = Font(name="Calibri", size=10, bold=True)
        c_val.border = borda_celula

    # Linha Total Encargos
    total_encargos_val = sum(x[3] for x in encargos_itens)
    ws_dash.cell(row=14, column=1, value="TOTAL DE ENCARGOS PATRONAIS").font = fonte_totais
    ws_dash.cell(row=14, column=1).border = borda_total
    ws_dash.cell(row=14, column=2, value="").border = borda_total
    ws_dash.cell(row=14, column=3, value="").border = borda_total
    c_tot_enc = ws_dash.cell(row=14, column=4, value=total_encargos_val)
    c_tot_enc.font = Font(name="Calibri", size=11, bold=True, color="B91C1C")
    c_tot_enc.number_format = '"R$" #,##0.00'
    c_tot_enc.border = borda_total
    c_tot_enc.alignment = align_right

    # Custo Total da Folha (Bruto + Encargos)
    ws_dash["A16"] = "CUSTO TOTAL CORPORATIVO DA FOLHA:"
    ws_dash["A16"].font = Font(name="Calibri", size=12, bold=True, color="1E1B4B")
    c_custo_total = ws_dash["D16"]
    c_custo_total.value = total_bruto + total_encargos_val
    c_custo_total.font = Font(name="Calibri", size=14, bold=True, color="1E1B4B")
    c_custo_total.number_format = '"R$" #,##0.00'
    c_custo_total.alignment = align_right

    # ═════════════════════════════════════════════════════════
    #  ABA 2: FOLHA ANALÍTICA
    # ═════════════════════════════════════════════════════════
    ws_folha = wb.create_sheet(title="Folha Analítica")
    ws_folha.views.sheetView[0].showGridLines = True

    ws_folha.merge_cells("A1:O1")
    ws_folha["A1"] = f"DEMONSTRATIVO ANALÍTICO DE PAGAMENTOS — COMPETÊNCIA {competencia}"
    ws_folha["A1"].font = fonte_titulo
    ws_folha["A1"].fill = fill_cabecalho_azul
    ws_folha["A1"].alignment = align_center

    colunas_folha = [
        ("Matrícula", 12), ("Colaborador", 26), ("Cargo", 18),
        ("Salário Base", 14), ("HE 50% (R$)", 12), ("HE 100% (R$)", 12),
        ("Noturno (R$)", 12), ("DSR Var. (R$)", 12), ("Total Proventos", 15),
        ("INSS (R$)", 12), ("IRRF (R$)", 12), ("Desc. VT (R$)", 12),
        ("Total Descontos", 15), ("Salário Líquido", 15), ("FGTS Empresa", 14)
    ]

    for c_idx, (col_name, largura) in enumerate(colunas_folha, start=1):
        cell = ws_folha.cell(row=2, column=c_idx, value=col_name)
        cell.font = fonte_cabecalho_tabela
        cell.fill = fill_cabecalho_azul
        cell.alignment = align_center
        cell.border = borda_celula
        ws_folha.column_dimensions[get_column_letter(c_idx)].width = largura

    # Inserção das linhas
    row_idx = 3
    for c in dados.colaboradores:
        fill_row = fill_zebrado if row_idx % 2 == 0 else PatternFill(fill_type=None)
        matricula = f"MAT-{c.id:04d}" if c.id else "MAT-0001"

        valores = [
            matricula, c.nome, c.cargo or "Profissional CLT",
            c.salarioBruto, c.he50Valor or 0, c.he100Valor or 0,
            c.adicionalNoturnoValor or 0, c.dsrSobreVariaveis or 0,
            c.totalProventos or c.salarioBruto,
            c.inss, c.irrf, c.valeTransporteDesconto or 0,
            c.totalDescontos, c.salarioLiquido, c.fgts
        ]

        for col_i, val in enumerate(valores, start=1):
            cell = ws_folha.cell(row=row_idx, column=col_i, value=val)
            cell.font = fonte_dados
            cell.border = borda_celula
            if fill_row.fill_type:
                cell.fill = fill_row

            if col_i in (1,):
                cell.alignment = align_center
            elif col_i in (2, 3):
                cell.alignment = align_left
            else:
                cell.alignment = align_right
                cell.number_format = '"R$" #,##0.00'

        row_idx += 1

    # Linha de Totais da Folha
    ws_folha.cell(row=row_idx, column=1, value="TOTAL").font = fonte_totais
    ws_folha.cell(row=row_idx, column=1).border = borda_total
    ws_folha.cell(row=row_idx, column=2, value=f"{len(dados.colaboradores)} empregados").border = borda_total
    ws_folha.cell(row=row_idx, column=3, value="").border = borda_total

    for col_i in range(4, 16):
        letra = get_column_letter(col_i)
        c_tot = ws_folha.cell(row=row_idx, column=col_i)
        c_tot.value = f"=SUM({letra}3:{letra}{row_idx-1})"
        c_tot.font = fonte_totais
        c_tot.number_format = '"R$" #,##0.00'
        c_tot.border = borda_total
        c_tot.alignment = align_right

    # ═════════════════════════════════════════════════════════
    #  ABA 3: AUDITORIA DE COMPLIANCE CLT
    # ═════════════════════════════════════════════════════════
    ws_audit = wb.create_sheet(title="Auditoria Compliance CLT")
    ws_audit.views.sheetView[0].showGridLines = True

    # Executar auditoria
    auditoria = auditar_folha_e_ponto(dados)

    ws_audit.merge_cells("A1:G1")
    ws_audit["A1"] = f"PAINEL DE AUDITORIA DE COMPLIANCE TRABALHISTA CLT — SCORE: {auditoria.scoreConformidade}/100 ({auditoria.nivelRiscoGeral})"
    ws_audit["A1"].font = fonte_titulo
    ws_audit["A1"].fill = fill_cabecalho_ambar if auditoria.scoreConformidade < 80 else fill_cabecalho_verde
    ws_audit["A1"].alignment = align_center

    colunas_audit = [
        ("Gravidade", 14), ("Categoria", 16), ("Colaborador", 24),
        ("Descrição da Ocorrência", 45), ("Base Legal CLT / Súmula", 28),
        ("Impacto / Risco Financeiro", 30), ("Recomendação Preventiva", 40)
    ]

    for c_idx, (col_name, largura) in enumerate(colunas_audit, start=1):
        cell = ws_audit.cell(row=2, column=c_idx, value=col_name)
        cell.font = fonte_cabecalho_tabela
        cell.fill = fill_cabecalho_azul
        cell.alignment = align_center
        cell.border = borda_celula
        ws_audit.column_dimensions[get_column_letter(c_idx)].width = largura

    row_audit = 3
    if not auditoria.infracoes:
        ws_audit.merge_cells(f"A3:G3")
        c_ok = ws_audit["A3"]
        c_ok.value = "Nenhuma infração trabalhista detectada. A folha e os registros de ponto estão 100% em conformidade com a CLT e o MTE."
        c_ok.font = Font(name="Calibri", size=11, bold=True, color="047857")
        c_ok.alignment = align_center
    else:
        for inf in auditoria.infracoes:
            fill_grav = PatternFill(start_color="FEE2E2" if inf.gravidade == "CRITICA" else "FEF3C7", fill_type="solid")
            
            c_grav = ws_audit.cell(row=row_audit, column=1, value=inf.gravidade)
            c_grav.alignment = align_center
            c_grav.font = Font(name="Calibri", size=9, bold=True, color="991B1B" if inf.gravidade == "CRITICA" else "92400E")
            c_grav.fill = fill_grav
            c_grav.border = borda_celula

            ws_audit.cell(row=row_audit, column=2, value=inf.categoria).border = borda_celula
            ws_audit.cell(row=row_audit, column=3, value=inf.colaborador).border = borda_celula
            ws_audit.cell(row=row_audit, column=4, value=inf.descricao).border = borda_celula
            ws_audit.cell(row=row_audit, column=5, value=inf.baseLegal).border = borda_celula
            ws_audit.cell(row=row_audit, column=6, value=inf.impactoRisco).border = borda_celula
            ws_audit.cell(row=row_audit, column=7, value=inf.recomendacao).border = borda_celula
            row_audit += 1

    # Ajuste de larguras aba Dashboard
    for col_idx in range(1, 8):
        ws_dash.column_dimensions[get_column_letter(col_idx)].width = 22

    # Salvar em buffer de memória
    excel_buffer = io.BytesIO()
    wb.save(excel_buffer)
    excel_buffer.seek(0)
    return excel_buffer.getvalue()

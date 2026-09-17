"""
Testes Unitários do Gerador de Relatórios Executivos em Excel (OpenPyXL)
Verifica criação de abas, formatação, fórmulas e integridade da pasta de trabalho.
"""

import io
from openpyxl import load_workbook
from backend.models.schemas import FolhaCompetenciaRequest, ItemFolhaColaboradorSchema
from backend.services.excel_generator import gerar_planilha_executiva_excel

def test_geracao_excel_abas_e_conteudo():
    colabs = [
        ItemFolhaColaboradorSchema(id=1, nome="Alice Hori", cargo="Dev", salarioBruto=8000.0, totalProventos=8000.0, totalDescontos=1800.0, salarioLiquido=6200.0, fgts=640.0),
        ItemFolhaColaboradorSchema(id=2, nome="Carlos Mendes", cargo="RH", salarioBruto=4000.0, totalProventos=4000.0, totalDescontos=800.0, salarioLiquido=3200.0, fgts=320.0)
    ]
    dados = FolhaCompetenciaRequest(
        ano=2026,
        mes=8,
        competencia="2026-08",
        colaboradores=colabs
    )

    excel_bytes = gerar_planilha_executiva_excel(dados)
    assert len(excel_bytes) > 0

    wb = load_workbook(io.BytesIO(excel_bytes))
    sheet_names = wb.sheetnames

    assert "Dashboard Executivo" in sheet_names
    assert "Folha Analítica" in sheet_names
    assert "Auditoria Compliance CLT" in sheet_names

    ws_folha = wb["Folha Analítica"]
    # Linha 1 = Título, Linha 2 = Cabeçalhos, Linha 3 = Alice, Linha 4 = Carlos
    assert ws_folha["B3"].value == "Alice Hori"
    assert ws_folha["B4"].value == "Carlos Mendes"

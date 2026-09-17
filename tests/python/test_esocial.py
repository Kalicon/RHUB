"""
Testes Unitários da Geração de Eventos eSocial XML (Layout v. S-1.2 / S-1.3)
Verifica tags, estrutura XML, namespaces e empacotamento ZIP.
"""

import zipfile
import io
from lxml import etree
from backend.models.schemas import FolhaCompetenciaRequest, ItemFolhaColaboradorSchema
from backend.services.esocial_generator import (
    gerar_evento_s1000,
    gerar_evento_s1010_tabela_rubricas,
    gerar_evento_s1200_remuneracao,
    gerar_evento_s1210_pagamento,
    gerar_pacote_esocial_zip
)

def test_geracao_s1000_empregador():
    empresa = {"cnpj": "12.345.678/0001-90", "razaoSocial": "EMPRESA TESTE LTDA"}
    xml_str = gerar_evento_s1000(empresa)
    assert "evtInfoEmpregador" in xml_str
    assert "12345678" in xml_str # 8 primeiros dígitos do CNPJ
    # Validar que é XML bem formado
    root = etree.fromstring(xml_str.encode("utf-8"))
    assert root is not None

def test_geracao_s1010_rubricas():
    empresa = {"cnpj": "12.345.678/0001-90"}
    xml_str = gerar_evento_s1010_tabela_rubricas(empresa)
    assert "evtTabRubrica" in xml_str
    assert "1000" in xml_str # Código Salário Base
    assert "1003" in xml_str # Código HE 50%
    root = etree.fromstring(xml_str.encode("utf-8"))
    assert root is not None

def test_geracao_s1200_e_s1210():
    empresa = {"cnpj": "12.345.678/0001-90"}
    item = ItemFolhaColaboradorSchema(
        id=101,
        nome="Carla Souza",
        salarioBruto=5000.00,
        he50Valor=200.00,
        totalProventos=5200.00,
        inss=550.00,
        irrf=320.00,
        totalDescontos=870.00,
        salarioLiquido=4330.00
    )
    xml_s1200 = gerar_evento_s1200_remuneracao(empresa, "2026-08", item)
    assert "evtRemun" in xml_s1200
    assert "5000.00" in xml_s1200
    assert "200.00" in xml_s1200

    xml_s1210 = gerar_evento_s1210_pagamento(empresa, "2026-08", item)
    assert "evtPgtos" in xml_s1210
    assert "4330.00" in xml_s1210

def test_pacote_esocial_zip():
    empresa = {"cnpj": "12.345.678/0001-90", "razaoSocial": "RHUB LTDA"}
    colaborador = ItemFolhaColaboradorSchema(id=1, nome="Ana", salarioBruto=3000.00, salarioLiquido=2600.00)
    dados = FolhaCompetenciaRequest(
        ano=2026,
        mes=8,
        competencia="2026-08",
        empresa=empresa,
        colaboradores=[colaborador]
    )

    zip_bytes = gerar_pacote_esocial_zip(dados)
    assert len(zip_bytes) > 0

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        nomes = zf.namelist()
        assert "S-1000_Empregador.xml" in nomes
        assert "S-1010_TabelaRubricas.xml" in nomes
        assert any(n.startswith("S-1200_") for n in nomes)
        assert any(n.startswith("S-1210_") for n in nomes)

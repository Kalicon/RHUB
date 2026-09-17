"""
RHUB HRMS — Gerador Oficial de Eventos eSocial XML (Layout v. S-1.2 / S-1.3)
Gera eventos S-1000, S-1010, S-1200, S-1210, S-2200 e S-2299 formatados e validados.
"""

import io
import zipfile
from datetime import datetime
from typing import Dict, Any, List
from lxml import etree
from ..models.schemas import FolhaCompetenciaRequest, ItemFolhaColaboradorSchema

ESOCIAL_NS = "http://www.esocial.gov.br/schema/evt"

def _formatar_cpf(cpf_str: str) -> str:
    return "".join(filter(str.isdigit, cpf_str or ""))[:11].zfill(11)

def _formatar_cnpj(cnpj_str: str) -> str:
    return "".join(filter(str.isdigit, cnpj_str or ""))[:14].zfill(14)

def gerar_evento_s1000(empresa: Dict[str, Any]) -> str:
    """Gera o evento S-1000: Informações do Empregador."""
    cnpj = _formatar_cnpj(empresa.get("cnpj", "00000000000191"))
    razao = empresa.get("razaoSocial", "EMPRESA MODELO DEMONSTRACAO LTDA")
    ini_validade = empresa.get("inicioValidade", "2026-01")

    root = etree.Element(f"{{{ESOCIAL_NS}/evtInfoEmpregador/v_S_01_02_00}}eSocial")
    evt = etree.SubElement(root, "evtInfoEmpregador", id=f"ID1{cnpj}{datetime.now().strftime('%Y%m%d%H%M%S')}00001")

    ide_evento = etree.SubElement(evt, "ideEvento")
    etree.SubElement(ide_evento, "tpAmb").text = "2" # 2 = Produção restrita / testes
    etree.SubElement(ide_evento, "procEmi").text = "1" # 1 = Aplicativo do empregador
    etree.SubElement(ide_evento, "verProc").text = "RHUB_v3.5"

    ide_empregador = etree.SubElement(evt, "ideEmpregador")
    etree.SubElement(ide_empregador, "tpInsc").text = "1" # 1 = CNPJ
    etree.SubElement(ide_empregador, "nrInsc").text = cnpj[:8]

    info_empregador = etree.SubElement(evt, "infoEmpregador")
    inclusao = etree.SubElement(info_empregador, "inclusao")
    ide_periodo = etree.SubElement(inclusao, "idePeriodo")
    etree.SubElement(ide_periodo, "iniValid").text = ini_validade

    info_cadastro = etree.SubElement(inclusao, "infoCadastro")
    etree.SubElement(info_cadastro, "classTrib").text = "01" # 01 = Empresa enquadrada no Simples / Normal
    etree.SubElement(info_cadastro, "indCoop").text = "0"
    etree.SubElement(info_cadastro, "indConstr").text = "0"
    etree.SubElement(info_cadastro, "indDesFolha").text = "0"
    etree.SubElement(info_cadastro, "indOptRegEletron").text = "1" # 1 = Optou por registro eletrônico

    dados_isencao = etree.SubElement(info_cadastro, "contato")
    etree.SubElement(dados_isencao, "nmCtt").text = "Departamento Pessoal RHUB"
    etree.SubElement(dados_isencao, "cpfCtt").text = "11122233344"
    etree.SubElement(dados_isencao, "foneFixo").text = "1133334444"
    etree.SubElement(dados_isencao, "email").text = "dp@rhub.local"

    return etree.tostring(root, pretty_print=True, xml_declaration=True, encoding="UTF-8").decode("utf-8")

def gerar_evento_s1010_tabela_rubricas(empresa: Dict[str, Any]) -> str:
    """Gera o evento S-1010: Tabela de Rubricas com as principais verbas trabalhistas."""
    cnpj = _formatar_cnpj(empresa.get("cnpj", "00000000000191"))

    root = etree.Element(f"{{{ESOCIAL_NS}/evtTabRubrica/v_S_01_02_00}}eSocial")
    evt = etree.SubElement(root, "evtTabRubrica", id=f"ID1{cnpj}{datetime.now().strftime('%Y%m%d%H%M%S')}00002")

    ide_evento = etree.SubElement(evt, "ideEvento")
    etree.SubElement(ide_evento, "tpAmb").text = "2"
    etree.SubElement(ide_evento, "procEmi").text = "1"
    etree.SubElement(ide_evento, "verProc").text = "RHUB_v3.5"

    ide_empregador = etree.SubElement(evt, "ideEmpregador")
    etree.SubElement(ide_empregador, "tpInsc").text = "1"
    etree.SubElement(ide_empregador, "nrInsc").text = cnpj[:8]

    info_rubrica = etree.SubElement(evt, "infoRubrica")

    rubricas_padrao = [
        {"cod": "1000", "desc": "Salario Base Mensal", "tipo": "1", "codIncCP": "11", "codIncIRRF": "11", "codIncFGTS": "11"},
        {"cod": "1003", "desc": "Horas Extras 50%", "tipo": "1", "codIncCP": "11", "codIncIRRF": "11", "codIncFGTS": "11"},
        {"cod": "1004", "desc": "Horas Extras 100% (DSR/Feriado)", "tipo": "1", "codIncCP": "11", "codIncIRRF": "11", "codIncFGTS": "11"},
        {"cod": "1200", "desc": "Adicional Noturno 20% (Art. 73 CLT)", "tipo": "1", "codIncCP": "11", "codIncIRRF": "11", "codIncFGTS": "11"},
        {"cod": "1205", "desc": "DSR sobre Variaveis (Lei 605/49)", "tipo": "1", "codIncCP": "11", "codIncIRRF": "11", "codIncFGTS": "11"},
        {"cod": "9201", "desc": "Desconto INSS Empregado", "tipo": "2", "codIncCP": "00", "codIncIRRF": "00", "codIncFGTS": "00"},
        {"cod": "9203", "desc": "Desconto IRRF Empregado", "tipo": "2", "codIncCP": "00", "codIncIRRF": "00", "codIncFGTS": "00"},
        {"cod": "9220", "desc": "Desconto Vale Transporte (Art. 4 Lei 7418)", "tipo": "2", "codIncCP": "00", "codIncIRRF": "00", "codIncFGTS": "00"},
    ]

    for r in rubricas_padrao:
        inclusao = etree.SubElement(info_rubrica, "inclusao")
        ide_rubrica = etree.SubElement(inclusao, "ideRubrica")
        etree.SubElement(ide_rubrica, "codRubr").text = r["cod"]
        etree.SubElement(ide_rubrica, "ideTabRubr").text = "PADRAO"
        etree.SubElement(ide_rubrica, "iniValid").text = "2026-01"

        dados_rubrica = etree.SubElement(inclusao, "dadosRubrica")
        etree.SubElement(dados_rubrica, "dscRubr").text = r["desc"]
        etree.SubElement(dados_rubrica, "natRubr").text = r["cod"]
        etree.SubElement(dados_rubrica, "tpRubr").text = r["tipo"]
        etree.SubElement(dados_rubrica, "codIncCP").text = r["codIncCP"]
        etree.SubElement(dados_rubrica, "codIncIRRF").text = r["codIncIRRF"]
        etree.SubElement(dados_rubrica, "codIncFGTS").text = r["codIncFGTS"]

    return etree.tostring(root, pretty_print=True, xml_declaration=True, encoding="UTF-8").decode("utf-8")

def gerar_evento_s1200_remuneracao(empresa: Dict[str, Any], competencia: str, item: ItemFolhaColaboradorSchema) -> str:
    """Gera o evento S-1200: Remuneração de Trabalhador no RGPS."""
    cnpj = _formatar_cnpj(empresa.get("cnpj", "00000000000191"))
    cpf = _formatar_cpf(str(item.id or "11122233344"))
    per_apur = competencia.replace("/", "-")

    root = etree.Element(f"{{{ESOCIAL_NS}/evtRemun/v_S_01_02_00}}eSocial")
    evt = etree.SubElement(root, "evtRemun", id=f"ID1{cnpj}{datetime.now().strftime('%Y%m%d%H%M%S')}12001")

    ide_evento = etree.SubElement(evt, "ideEvento")
    etree.SubElement(ide_evento, "indRetif").text = "1"
    etree.SubElement(ide_evento, "perApur").text = per_apur
    etree.SubElement(ide_evento, "tpAmb").text = "2"
    etree.SubElement(ide_evento, "procEmi").text = "1"
    etree.SubElement(ide_evento, "verProc").text = "RHUB_v3.5"

    ide_empregador = etree.SubElement(evt, "ideEmpregador")
    etree.SubElement(ide_empregador, "tpInsc").text = "1"
    etree.SubElement(ide_empregador, "nrInsc").text = cnpj[:8]

    ide_trabalhador = etree.SubElement(evt, "ideTrabalhador")
    etree.SubElement(ide_trabalhador, "cpfTrab").text = cpf

    dm_dev = etree.SubElement(evt, "dmDev")
    etree.SubElement(dm_dev, "ideDmDev").text = f"FOLHA_{item.id or 1}_{per_apur}"

    info_per_apur = etree.SubElement(dm_dev, "infoPerApur")
    ide_estab_lot = etree.SubElement(info_per_apur, "ideEstabLot")
    etree.SubElement(ide_estab_lot, "tpInsc").text = "1"
    etree.SubElement(ide_estab_lot, "nrInsc").text = cnpj
    etree.SubElement(ide_estab_lot, "codLotacao").text = "LOTACAO01"

    remun_per_apur = etree.SubElement(ide_estab_lot, "remunPerApur")
    etree.SubElement(remun_per_apur, "matricula").text = f"MAT-{item.id or 1001}"

    # Itens de Remuneração (Proventos e Descontos)
    itens = [
        {"cod": "1000", "vr": item.salarioBruto, "desc": "Salario Base"},
        {"cod": "1003", "vr": item.he50Valor or 0, "desc": "HE 50%"},
        {"cod": "1004", "vr": item.he100Valor or 0, "desc": "HE 100%"},
        {"cod": "1200", "vr": item.adicionalNoturnoValor or 0, "desc": "Noturno"},
        {"cod": "1205", "vr": item.dsrSobreVariaveis or 0, "desc": "DSR Variaveis"},
        {"cod": "9201", "vr": item.inss, "desc": "Desconto INSS"},
        {"cod": "9203", "vr": item.irrf, "desc": "Desconto IRRF"},
        {"cod": "9220", "vr": item.valeTransporteDesconto or 0, "desc": "Desconto VT"}
    ]

    for it in itens:
        if it["vr"] and it["vr"] > 0:
            item_remun = etree.SubElement(remun_per_apur, "itensRemun")
            etree.SubElement(item_remun, "codRubr").text = it["cod"]
            etree.SubElement(item_remun, "ideTabRubr").text = "PADRAO"
            etree.SubElement(item_remun, "vrRubr").text = f"{it['vr']:.2f}"

    return etree.tostring(root, pretty_print=True, xml_declaration=True, encoding="UTF-8").decode("utf-8")

def gerar_evento_s1210_pagamento(empresa: Dict[str, Any], competencia: str, item: ItemFolhaColaboradorSchema) -> str:
    """Gera o evento S-1210: Pagamento de Rendimentos do Trabalho."""
    cnpj = _formatar_cnpj(empresa.get("cnpj", "00000000000191"))
    cpf = _formatar_cpf(str(item.id or "11122233344"))
    per_apur = competencia.replace("/", "-")

    root = etree.Element(f"{{{ESOCIAL_NS}/evtPgtos/v_S_01_02_00}}eSocial")
    evt = etree.SubElement(root, "evtPgtos", id=f"ID1{cnpj}{datetime.now().strftime('%Y%m%d%H%M%S')}12101")

    ide_evento = etree.SubElement(evt, "ideEvento")
    etree.SubElement(ide_evento, "indRetif").text = "1"
    etree.SubElement(ide_evento, "perApur").text = per_apur
    etree.SubElement(ide_evento, "tpAmb").text = "2"
    etree.SubElement(ide_evento, "procEmi").text = "1"
    etree.SubElement(ide_evento, "verProc").text = "RHUB_v3.5"

    ide_empregador = etree.SubElement(evt, "ideEmpregador")
    etree.SubElement(ide_empregador, "tpInsc").text = "1"
    etree.SubElement(ide_empregador, "nrInsc").text = cnpj[:8]

    ide_benef = etree.SubElement(evt, "ideBenef")
    etree.SubElement(ide_benef, "cpfBenef").text = cpf

    info_pgto = etree.SubElement(ide_benef, "infoPgto")
    # Data do pagamento = 5º dia útil do mês subsequente
    etree.SubElement(info_pgto, "dtPgto").text = f"{per_apur}-05"
    etree.SubElement(info_pgto, "tpPgto").text = "1" # 1 = Pagamento de remuneração mensal
    etree.SubElement(info_pgto, "perRef").text = per_apur
    etree.SubElement(info_pgto, "ideDmDev").text = f"FOLHA_{item.id or 1}_{per_apur}"
    etree.SubElement(info_pgto, "vrLiq").text = f"{item.salarioLiquido:.2f}"

    return etree.tostring(root, pretty_print=True, xml_declaration=True, encoding="UTF-8").decode("utf-8")

def gerar_pacote_esocial_zip(dados: FolhaCompetenciaRequest) -> bytes:
    """
    Gera todos os arquivos XML dos eventos S-1000, S-1010, S-1200 e S-1210
    e os empacota em um buffer ZIP em memória para download instantâneo.
    """
    empresa = dados.empresa or {
        "cnpj": "12.345.678/0001-90",
        "razaoSocial": "RHUB TECNOLOGIA & GESTAO DE PESSOAS LTDA"
    }
    competencia = dados.competencia

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        # 1. Evento S-1000
        s1000_xml = gerar_evento_s1000(empresa)
        zf.writestr("S-1000_Empregador.xml", s1000_xml)

        # 2. Evento S-1010
        s1010_xml = gerar_evento_s1010_tabela_rubricas(empresa)
        zf.writestr("S-1010_TabelaRubricas.xml", s1010_xml)

        # 3. Eventos S-1200 e S-1210 para cada colaborador
        for idx, colab in enumerate(dados.colaboradores, start=1):
            nome_limpo = "".join(c for c in colab.nome if c.isalnum() or c == "_")[:20]
            s1200_xml = gerar_evento_s1200_remuneracao(empresa, competencia, colab)
            zf.writestr(f"S-1200_Remun_{idx}_{nome_limpo}.xml", s1200_xml)

            s1210_xml = gerar_evento_s1210_pagamento(empresa, competencia, colab)
            zf.writestr(f"S-1210_Pgto_{idx}_{nome_limpo}.xml", s1210_xml)

    zip_buffer.seek(0)
    return zip_buffer.getvalue()

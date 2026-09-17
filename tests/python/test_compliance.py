"""
Testes Unitários da Suíte de Compliance Trabalhista CLT (Python / Pytest)
Verifica regras dos Artigos 59, 66, 71, 137 da CLT e Lei 605/1949.
"""

import pytest
from backend.models.schemas import FolhaCompetenciaRequest, ItemFolhaColaboradorSchema, DiaPontoSchema, FolhaPontoSchema
from backend.services.compliance_auditor import auditar_folha_e_ponto

def test_auditoria_sem_infracoes():
    """Folha com jornada e remuneração normais deve ter score 100 e 0 infrações."""
    colaborador = ItemFolhaColaboradorSchema(
        id=1,
        nome="Lucas Silva",
        cargo="Analista",
        salarioBruto=3500.00,
        totalProventos=3500.00,
        inss=350.00,
        irrf=120.00,
        totalDescontos=470.00,
        salarioLiquido=3030.00,
        fgts=280.00
    )
    dias = [
        DiaPontoSchema(dia=1, tipoDia="util", previstoMinutos=528, trabalhadosMinutos=528, e1="08:00", s1="12:00", e2="13:00", s2="17:48"),
        DiaPontoSchema(dia=2, tipoDia="util", previstoMinutos=528, trabalhadosMinutos=528, e1="08:00", s1="12:00", e2="13:00", s2="17:48")
    ]
    dados = FolhaCompetenciaRequest(
        ano=2026,
        mes=8,
        competencia="2026-08",
        colaboradores=[colaborador],
        pontos=[FolhaPontoSchema(colaboradorId=1, ano=2026, mes=8, dias=dias)]
    )

    res = auditar_folha_e_ponto(dados)
    assert res.scoreConformidade == 100
    assert res.nivelRiscoGeral == "BAIXO"
    assert res.totalInfracoes == 0
    assert len(res.infracoes) == 0

def test_auditoria_excesso_horas_extras_art59():
    """Jornada suplementar diária superior a 2 horas (120 min) deve gerar infração do Art. 59."""
    dias = [
        DiaPontoSchema(dia=1, tipoDia="util", previstoMinutos=528, trabalhadosMinutos=680, he50Minutos=152, e1="08:00", s1="12:00", e2="13:00", s2="20:20")
    ]
    dados = FolhaCompetenciaRequest(
        ano=2026,
        mes=8,
        competencia="2026-08",
        pontos=[FolhaPontoSchema(colaboradorId=1, ano=2026, mes=8, dias=dias)]
    )

    res = auditar_folha_e_ponto(dados)
    assert res.totalInfracoes >= 1
    infracao_he = next((i for i in res.infracoes if i.categoria == "Jornada"), None)
    assert infracao_he is not None
    assert "Art. 59" in infracao_he.baseLegal
    assert res.scoreConformidade < 100

def test_auditoria_intervalo_intrajornada_suprimido_art71():
    """Jornada > 6h com intervalo menor que 1h deve gerar infração do Art. 71 § 4º."""
    # Entrada 08:00, Saída 1: 12:00, Entrada 2: 12:30 (intervalo de 30 min em vez de 60 min), Saída 2: 17:48
    dias = [
        DiaPontoSchema(dia=1, tipoDia="util", previstoMinutos=528, trabalhadosMinutos=558, e1="08:00", s1="12:00", e2="12:30", s2="17:48")
    ]
    dados = FolhaCompetenciaRequest(
        ano=2026,
        mes=8,
        competencia="2026-08",
        pontos=[FolhaPontoSchema(colaboradorId=1, ano=2026, mes=8, dias=dias)]
    )

    res = auditar_folha_e_ponto(dados)
    infracao_intrajornada = next((i for i in res.infracoes if i.categoria == "Intervalo"), None)
    assert infracao_intrajornada is not None
    assert "Art. 71" in infracao_intrajornada.baseLegal
    assert infracao_intrajornada.gravidade == "CRITICA"

def test_auditoria_descanso_interjornada_violado_art66():
    """Descanso entre dois dias menor que 11h (660 min) deve gerar infração do Art. 66."""
    dias = [
        DiaPontoSchema(dia=1, tipoDia="util", previstoMinutos=528, trabalhadosMinutos=528, e1="08:00", s1="12:00", e2="13:00", s2="22:00"),
        DiaPontoSchema(dia=2, tipoDia="util", previstoMinutos=528, trabalhadosMinutos=528, e1="06:00", s1="12:00", e2="13:00", s2="15:48")
        # Saída dia 1 às 22:00 (1320 min), entrada dia 2 às 06:00 (360 min) -> Descanso de 8h (480 min < 660 min)
    ]
    dados = FolhaCompetenciaRequest(
        ano=2026,
        mes=8,
        competencia="2026-08",
        pontos=[FolhaPontoSchema(colaboradorId=1, ano=2026, mes=8, dias=dias)]
    )

    res = auditar_folha_e_ponto(dados)
    infracao_interjornada = next((i for i in res.infracoes if i.categoria == "Descanso"), None)
    assert infracao_interjornada is not None
    assert "Art. 66" in infracao_interjornada.baseLegal

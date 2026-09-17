"""
Testes Unitários de People Analytics Preditivo & Inteligência de RH (Item 04)
Valida Fator de Bradford (B = S^2 * D), Projeção Orçamentária 12M e Turnover Risk Index.
"""

import pytest
from backend.models.schemas import (
    PrevisaoOrcamentariaRequest,
    ItemFolhaColaboradorSchema,
    DiaPontoSchema,
    FolhaPontoSchema
)
from backend.services.people_analytics import (
    calcular_previsao_orcamentaria_12m,
    calcular_absenteismo_bradford,
    calcular_matriz_risco_turnover
)

def test_calculo_fator_bradford_matematica():
    """Valida a fórmula do Fator de Bradford: B = S^2 * D."""
    # Colaborador A: 1 único afastamento contínuo de 5 dias -> S=1, D=5 -> B = 1^2 * 5 = 5
    dias_a = [
        DiaPontoSchema(dia=1, status="falta"),
        DiaPontoSchema(dia=2, status="falta"),
        DiaPontoSchema(dia=3, status="falta"),
        DiaPontoSchema(dia=4, status="falta"),
        DiaPontoSchema(dia=5, status="falta"),
    ]
    # Colaborador B: 5 ausências intermitentes de 1 dia -> S=5, D=5 -> B = 5^2 * 5 = 125
    dias_b = [
        DiaPontoSchema(dia=1, status="falta"),
        DiaPontoSchema(dia=2, status="normal"),
        DiaPontoSchema(dia=3, status="falta"),
        DiaPontoSchema(dia=4, status="normal"),
        DiaPontoSchema(dia=5, status="falta"),
        DiaPontoSchema(dia=6, status="normal"),
        DiaPontoSchema(dia=7, status="falta"),
        DiaPontoSchema(dia=8, status="normal"),
        DiaPontoSchema(dia=9, status="falta"),
    ]

    colabs = [
        ItemFolhaColaboradorSchema(id=1, nome="Colaborador A", cargo="Analista", salarioBruto=3000.0),
        ItemFolhaColaboradorSchema(id=2, nome="Colaborador B", cargo="Analista", salarioBruto=3000.0)
    ]
    pontos = [
        FolhaPontoSchema(colaboradorId=1, ano=2026, mes=8, dias=dias_a),
        FolhaPontoSchema(colaboradorId=2, ano=2026, mes=8, dias=dias_b)
    ]

    res = calcular_absenteismo_bradford(colabs, pontos)
    item_a = next(x for x in res.colaboradores if x.colaboradorId == 1)
    item_b = next(x for x in res.colaboradores if x.colaboradorId == 2)

    assert item_a.spellsAusencia == 1
    assert item_a.diasAusencia == 5
    assert item_a.fatorBradford == 5
    assert item_a.nivelImpacto == "BAIXO"

    assert item_b.spellsAusencia == 5
    assert item_b.diasAusencia == 5
    assert item_b.fatorBradford == 125
    assert item_b.nivelImpacto == "MEDIO"

def test_previsao_orcamentaria_12m_com_dissidio():
    """Valida a projeção de 12 meses com dissídio a partir de maio (mês 5) e picos de 13º."""
    colabs = [
        ItemFolhaColaboradorSchema(id=1, nome="Ana", salarioBruto=10000.00)
    ]
    # Dissídio de 10% a partir de maio (mês 5)
    req = PrevisaoOrcamentariaRequest(
        colaboradores=colabs,
        percentualDissidio=10.0,
        mesDataBase=5,
        regimeTributario="presumido", # ~35.8% de encargos
        aliquotaRat=2.0,
        fatorFap=1.0,
        aliquotaTerceiros=5.8
    )

    res = calcular_previsao_orcamentaria_12m(req)
    assert len(res.meses) == 12

    # Meses 1 a 4 devem ter salário base de R$ 10.000,00
    for m in range(0, 4):
        assert res.meses[m].salarioBaseTotal == 10000.00
        assert res.meses[m].dissidioAplicado == 0.0

    # A partir de maio (mês 5, índice 4), salário base deve ser R$ 11.000,00 (+10%)
    for m in range(4, 12):
        assert res.meses[m].salarioBaseTotal == 11000.00
        assert res.meses[m].dissidioAplicado == 1000.00

    # Novembro e Dezembro devem ter eventos especiais de 13º e desembolso maior
    mes_nov = res.meses[10] # Novembro (11)
    mes_dez = res.meses[11] # Dezembro (12)
    assert "13º" in (mes_nov.eventoEspecial or "")
    assert "13º" in (mes_dez.eventoEspecial or "")
    assert mes_nov.desembolsoTotal > res.meses[0].desembolsoTotal

    assert res.custoTotalAnual > 0
    assert res.mediaMensal == round(res.custoTotalAnual / 12.0, 2)

def test_turnover_risk_index():
    """Valida o cálculo do Turnover Risk Index (TRI) e distribuição de risco."""
    colabs = [
        # Colaborador com horas extras massivas e salário defasado -> Alto/Crítico
        ItemFolhaColaboradorSchema(
            id=1,
            nome="Dev Sobrecarga",
            cargo="Junior",
            salarioBruto=2000.00,
            he50Horas=30.0,
            he50Valor=800.00,
            totalProventos=2800.00,
            totalDescontos=1100.00,
            salarioLiquido=1700.00
        ),
        # Colaborador com salário alto e jornada equilibrada -> Baixo
        ItemFolhaColaboradorSchema(
            id=2,
            nome="Gerente Estável",
            cargo="Gerente",
            salarioBruto=12000.00,
            he50Horas=0.0,
            he50Valor=0.0,
            totalProventos=12000.00,
            totalDescontos=2500.00,
            salarioLiquido=9500.00
        )
    ]

    res = calcular_matriz_risco_turnover(colabs)
    assert res.totalColaboradores == 2
    dev_risco = next(x for x in res.rankingColaboradores if x.colaboradorId == 1)
    gerente_risco = next(x for x in res.rankingColaboradores if x.colaboradorId == 2)

    assert dev_risco.scoreRisco > gerente_risco.scoreRisco
    assert len(dev_risco.fatoresPrincipais) > 0
    assert dev_risco.acaoRecomendada != ""

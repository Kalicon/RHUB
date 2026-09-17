"""
RHUB HRMS — Robô de Compliance e Auditoria Trabalhista (CLT & MTE)
Audita pontos, folhas, escalas, férias e contratos para detecção de passivos e infrações.
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta
from ..models.schemas import (
    FolhaCompetenciaRequest,
    AuditoriaComplianceResponse,
    InfracaoCompliance,
    DiaPontoSchema
)

def _hora_para_minutos(hora_str: str) -> int | None:
    if not hora_str or ":" not in hora_str:
        return None
    try:
        h, m = hora_str.split(":")[:2]
        return int(h) * 60 + int(m)
    except Exception:
        return None

def auditar_folha_e_ponto(dados: FolhaCompetenciaRequest) -> AuditoriaComplianceResponse:
    """
    Executa auditoria trabalhista detalhada cruzando os dados da folha de pagamento
    e das folhas de ponto dos colaboradores da competência.
    """
    infracoes: List[InfracaoCompliance] = []
    resumo_cat: Dict[str, int] = {
        "Jornada": 0,
        "Intervalo": 0,
        "Descanso": 0,
        "Ferias": 0,
        "Remuneracao": 0
    }

    passivo_acumulado_estimado = 0.0

    # 1. Auditoria das Folhas de Ponto Diárias
    pontos_map: Dict[int, List[DiaPontoSchema]] = {}
    for fp in (dados.pontos or []):
        pontos_map[fp.colaboradorId] = fp.dias

    # Criar mapeamento de colaboradores
    colabs_map = {c.id: c for c in dados.colaboradores if c.id is not None}

    # Se não houver colaboradores mapeados, auditar apenas os registros de pontos disponíveis
    for colab_id, dias in pontos_map.items():
        colab = colabs_map.get(colab_id)
        nome_colab = colab.nome if colab else f"Colaborador #{colab_id}"
        salario_colab = colab.salarioBruto if colab else 2200.0
        valor_hora = salario_colab / 220.0

        dias_consecutivos_trabalhados = 0
        saida_dia_anterior_minutos: int | None = None

        for dia in dias:
            # Art. 59 CLT — Excesso de Horas Extras Diárias (> 2h/dia = > 120 min)
            total_he_dia = (dia.he50Minutos or 0) + (dia.he100Minutos or 0)
            if total_he_dia > 120:
                horas_excedentes = (total_he_dia - 120) / 60.0
                passivo_estimado = horas_excedentes * valor_hora * 1.5
                passivo_acumulado_estimado += passivo_estimado
                resumo_cat["Jornada"] += 1
                infracoes.append(InfracaoCompliance(
                    gravidade="CRITICA" if total_he_dia > 180 else "MEDIA",
                    categoria="Jornada",
                    colaborador=nome_colab,
                    descricao=f"Excesso de horas extras no dia {dia.dia}: {total_he_dia} min apurados (limite legal é de 120 min / 2h por dia).",
                    baseLegal="Art. 59 caput da CLT & Art. 75 da CLT",
                    impactoRisco=f"Multa administrativa do MTE e passivo de sobrejornada habitual estimada em R$ {passivo_estimado:.2f}.",
                    recomendacao="Ajustar escala ou admitir banco de horas homologado em CCT/ACT para compensação formal."
                ))

            # Art. 71 CLT — Supressão ou Redução de Intervalo Intrajornada
            # Para jornadas > 6h (360 min), intervalo mínimo obrigatório de 1h (60 min)
            if dia.trabalhadosMinutos and dia.trabalhadosMinutos > 360:
                s1_min = _hora_para_minutos(dia.s1 or "")
                e2_min = _hora_para_minutos(dia.e2 or "")
                if s1_min is not None and e2_min is not None:
                    intervalo_realizado = e2_min - s1_min
                    if 0 < intervalo_realizado < 50: # Tolerância de até 10min em convenção
                        minutos_suprimidos = 60 - intervalo_realizado
                        passivo_intrajornada = (minutos_suprimidos / 60.0) * valor_hora * 1.5
                        passivo_acumulado_estimado += passivo_intrajornada
                        resumo_cat["Intervalo"] += 1
                        infracoes.append(InfracaoCompliance(
                            gravidade="CRITICA",
                            categoria="Intervalo",
                            colaborador=nome_colab,
                            descricao=f"Intervalo intrajornada reduzido no dia {dia.dia}: realizou apenas {intervalo_realizado} min (mínimo obrigatório é de 60 min).",
                            baseLegal="Art. 71, § 4º da CLT (Lei 13.467/2017)",
                            impactoRisco=f"Indenização obrigatória do período suprimido com adicional de 50% (passivo estimado R$ {passivo_intrajornada:.2f}).",
                            recomendacao="Orientar o colaborador para cumprimento rigoroso do intervalo intrajornada mínimo de 1 hora."
                        ))

            # Art. 66 CLT — Intervalo Interjornada de no mínimo 11h consecutivas
            e1_min = _hora_para_minutos(dia.e1 or "")
            if saida_dia_anterior_minutos is not None and e1_min is not None:
                # Descanso entre saída do dia anterior (após 1440 min) e entrada hoje
                tempo_descanso = (1440 - saida_dia_anterior_minutos) + e1_min
                if tempo_descanso < 660: # 11 horas = 660 minutos
                    min_violados = 660 - tempo_descanso
                    passivo_interjornada = (min_violados / 60.0) * valor_hora * 1.5
                    passivo_acumulado_estimado += passivo_interjornada
                    resumo_cat["Descanso"] += 1
                    infracoes.append(InfracaoCompliance(
                        gravidade="MEDIA",
                        categoria="Descanso",
                        colaborador=nome_colab,
                        descricao=f"Descanso interjornada inferior a 11h entre o dia anterior e o dia {dia.dia}: apenas {tempo_descanso // 60}h{tempo_descanso % 60}m de descanso.",
                        baseLegal="Art. 66 da CLT & Súmula 110 do TST / OJ 355 SDI-1",
                        impactoRisco=f"Horas de descanso suprimidas devem ser remuneradas como extraordinárias (R$ {passivo_interjornada:.2f}).",
                        recomendacao="Replanejar as escalas de fechamento e abertura para garantir intervalo de 11h livres."
                    ))

            # Atualizar saída para o próximo dia
            s2_min = _hora_para_minutos(dia.s2 or "")
            saida_dia_anterior_minutos = s2_min if s2_min is not None else _hora_para_minutos(dia.s1 or "")

            # Súmula 146 TST / Art. 67 CLT — Trabalho por mais de 6 dias consecutivos sem folga
            if dia.trabalhadosMinutos and dia.trabalhadosMinutos > 0:
                dias_consecutivos_trabalhados += 1
                if dias_consecutivos_trabalhados > 6:
                    resumo_cat["Descanso"] += 1
                    passivo_acumulado_estimado += valor_hora * 8.0 * 2.0
                    infracoes.append(InfracaoCompliance(
                        gravidade="CRITICA",
                        categoria="Descanso",
                        colaborador=nome_colab,
                        descricao=f"Trabalho consecutivo sem DSR no dia {dia.dia} ({dias_consecutivos_trabalhados}º dia seguido sem descanso semanal).",
                        baseLegal="Art. 67 da CLT, Lei 605/1949 & Súmula 146 do TST",
                        impactoRisco="Pagamento em dobro do descanso semanal trabalhado e auto de infração da fiscalização trabalhista.",
                        recomendacao="Conceder folga compensatória imediata dentro da mesma semana."
                    ))
            else:
                dias_consecutivos_trabalhados = 0

    # 2. Auditoria da Folha de Pagamento em Lote
    for c in dados.colaboradores:
        # Verificação de Salário Mínimo / Piso
        salario_minimo_nacional = 1518.00 # Projeção vigente
        if c.salarioBruto < salario_minimo_nacional and c.salarioBruto > 0:
            resumo_cat["Remuneracao"] += 1
            infracoes.append(InfracaoCompliance(
                gravidade="CRITICA",
                categoria="Remuneracao",
                colaborador=c.nome,
                descricao=f"Salário base contratual (R$ {c.salarioBruto:.2f}) inferior ao salário mínimo nacional vigente (R$ {salario_minimo_nacional:.2f}).",
                baseLegal="Art. 7º, IV da Constituição Federal & Art. 76 da CLT",
                impactoRisco="Diferenças salariais retroativas com reflexos em FGTS, 13º e férias.",
                recomendacao="Atualizar o salário base para respeitar o piso nacional ou piso da CCT da categoria."
            ))

        # Verificação de Desconto Excessivo (Margem consignada / Art. 462 CLT)
        if c.salarioBruto > 0:
            percentual_desconto = (c.totalDescontos / c.totalProventos) if c.totalProventos > 0 else 0
            if percentual_desconto > 0.70:
                resumo_cat["Remuneracao"] += 1
                infracoes.append(InfracaoCompliance(
                    gravidade="MEDIA",
                    categoria="Remuneracao",
                    colaborador=c.nome,
                    descricao=f"Volume de descontos ({percentual_desconto*100:.1f}%) excede o limite prudencial de retenção salarial.",
                    baseLegal="Art. 462 da CLT & Princípio da Intangibilidade Salarial",
                    impactoRisco="Risco de nulidade dos descontos e dever de restituição.",
                    recomendacao="Revisar adiantamentos e autorizações de desconto em folha."
                ))

    # Cálculo do Score de Conformidade Geral
    # 100 pontos iniciais.
    # Crítica = -15 pontos, Média = -7 pontos, Leve = -3 pontos
    total_criticas = sum(1 for i in infracoes if i.gravidade == "CRITICA")
    total_medias = sum(1 for i in infracoes if i.gravidade == "MEDIA")
    total_leves = sum(1 for i in infracoes if i.gravidade == "LEVE")

    penalidade = (total_criticas * 15) + (total_medias * 7) + (total_leves * 3)
    score = max(0, min(100, 100 - penalidade))

    if score >= 90:
        nivel_risco = "BAIXO"
    elif score >= 70:
        nivel_risco = "MEDIO"
    elif score >= 50:
        nivel_risco = "ALTO"
    else:
        nivel_risco = "CRITICO"

    return AuditoriaComplianceResponse(
        scoreConformidade=score,
        nivelRiscoGeral=nivel_risco,
        totalColaboradoresAuditados=len(dados.colaboradores) or len(pontos_map) or 1,
        totalInfracoes=len(infracoes),
        infracoesCriticas=total_criticas,
        infracoesMedias=total_medias,
        infracoesLeves=total_leves,
        estimativaPassivoRisco=round(passivo_acumulado_estimado, 2),
        infracoes=infracoes,
        resumoCategorias=resumo_cat
    )

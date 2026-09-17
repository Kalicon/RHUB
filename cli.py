"""
RHUB HRMS — Interface de Linha de Comando (CLI Corporativa)
Comandos baseados em Click e Rich para Auditoria CLT, eSocial, Excel e Servidor.
"""

import os
import sys
import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import print as rprint

from backend.models.schemas import FolhaCompetenciaRequest, ItemFolhaColaboradorSchema, DiaPontoSchema, FolhaPontoSchema
from backend.services.compliance_auditor import auditar_folha_e_ponto
from backend.services.esocial_generator import gerar_evento_s1000, gerar_evento_s1010_tabela_rubricas, gerar_evento_s1200_remuneracao, gerar_evento_s1210_pagamento
from backend.services.excel_generator import gerar_planilha_executiva_excel
from backend.services.backup_service import salvar_backup_dados, listar_backups_locais

console = Console()

def _obter_dados_demonstracao() -> FolhaCompetenciaRequest:
    """Gera dados consistentes para execução de auditorias e testes via CLI."""
    empresa = {
        "razaoSocial": "RHUB TECNOLOGIA & GESTAO DE PESSOAS LTDA",
        "cnpj": "12.345.678/0001-90"
    }

    colaboradores = [
        ItemFolhaColaboradorSchema(
            id=1,
            nome="Alice Hori",
            cargo="Engenheira de Software Senior",
            salarioBruto=8500.00,
            he50Horas=2.0,
            he50Valor=115.91,
            he100Horas=0.0,
            he100Valor=0.0,
            adicionalNoturnoValor=0.0,
            dsrSobreVariaveis=23.18,
            inss=951.62,
            irrf=1082.40,
            valeTransporteDesconto=0.0,
            outrosDescontos=0.0,
            totalProventos=8639.09,
            totalDescontos=2034.02,
            salarioLiquido=6605.07,
            fgts=691.13
        ),
        ItemFolhaColaboradorSchema(
            id=2,
            nome="Carlos Mendes",
            cargo="Analista de Recursos Humanos",
            salarioBruto=4200.00,
            he50Horas=1.5,
            he50Valor=43.00,
            he100Horas=0.0,
            he100Valor=0.0,
            adicionalNoturnoValor=0.0,
            dsrSobreVariaveis=8.60,
            inss=412.30,
            irrf=182.10,
            valeTransporteDesconto=252.00,
            outrosDescontos=0.0,
            totalProventos=4251.60,
            totalDescontos=846.40,
            salarioLiquido=3405.20,
            fgts=340.13
        ),
        ItemFolhaColaboradorSchema(
            id=3,
            nome="Mariana Costa",
            cargo="Operadora de Suporte",
            salarioBruto=2200.00,
            he50Horas=4.0,
            he50Valor=60.00,
            he100Horas=0.0,
            he100Valor=0.0,
            adicionalNoturnoValor=0.0,
            dsrSobreVariaveis=12.00,
            inss=178.20,
            irrf=0.0,
            valeTransporteDesconto=132.00,
            outrosDescontos=0.0,
            totalProventos=2272.00,
            totalDescontos=310.20,
            salarioLiquido=1961.80,
            fgts=181.76
        )
    ]

    # Simular ponto com 1 ocorrência de HE excessiva para teste do auditor
    dias_ponto = [
        DiaPontoSchema(dia=1, tipoDia="util", previstoMinutos=528, trabalhadosMinutos=528, e1="08:00", s1="12:00", e2="13:00", s2="17:48"),
        DiaPontoSchema(dia=2, tipoDia="util", previstoMinutos=528, trabalhadosMinutos=660, he50Minutos=132, e1="08:00", s1="12:00", e2="13:00", s2="20:00"), # > 2h de HE
        DiaPontoSchema(dia=3, tipoDia="util", previstoMinutos=528, trabalhadosMinutos=528, e1="08:00", s1="12:00", e2="13:00", s2="17:48"),
    ]

    pontos = [
        FolhaPontoSchema(colaboradorId=3, ano=2026, mes=8, competencia="2026-08", dias=dias_ponto)
    ]

    return FolhaCompetenciaRequest(
        ano=2026,
        mes=8,
        competencia="2026-08",
        empresa=empresa,
        colaboradores=colaboradores,
        pontos=pontos
    )

@click.group()
def cli():
    """RHUB HRMS — Suíte de Automação & Compliance Trabalhista CLT."""
    pass

@cli.command()
@click.option("--competencia", default="2026-08", help="Competência (AAAA-MM)")
def audit(competencia):
    """Executa o Robô de Compliance Trabalhista CLT e gera diagnóstico completo."""
    console.print(Panel.fit(
        "[bold cyan]RHUB HRMS — ROBÔ DE AUDITORIA E COMPLIANCE CLT[/bold cyan]\n"
        "[italic white]Inspeção profunda de horas extras, intervalos, DSR e passivos trabalhistas.[/italic white]",
        border_style="blue"
    ))

    dados = _obter_dados_demonstracao()
    dados.competencia = competencia
    
    with console.status("[bold green]Auditando folhas de ponto e folha em lote..."):
        res = auditar_folha_e_ponto(dados)

    cor_score = "green" if res.scoreConformidade >= 90 else ("yellow" if res.scoreConformidade >= 70 else "red")
    console.print(f"\n[bold]Score de Conformidade:[/] [{cor_score}]{res.scoreConformidade}/100[/] | [bold]Nível de Risco:[/] [{cor_score}]{res.nivelRiscoGeral}[/]")
    console.print(f"[bold]Passivo Trabalhista Estimado:[/] [bold red]R$ {res.estimativaPassivoRisco:,.2f}[/]\n")

    table = Table(title=f"Apontamentos de Auditoria — {competencia}", show_header=True, header_style="bold magenta")
    table.add_column("Gravidade", style="bold", width=12)
    table.add_column("Categoria", width=12)
    table.add_column("Colaborador", width=20)
    table.add_column("Ocorrência / Base Legal", width=38)
    table.add_column("Recomendação", width=35)

    if not res.infracoes:
        console.print("[bold green][OK] Nenhuma infração detectada! Folha 100% em conformidade com a CLT.[/bold green]")
    else:
        for inf in res.infracoes:
            cor_grav = "red" if inf.gravidade == "CRITICA" else ("yellow" if inf.gravidade == "MEDIA" else "blue")
            table.add_row(
                f"[{cor_grav}]{inf.gravidade}[/]",
                inf.categoria,
                inf.colaborador,
                f"{inf.descricao}\n[italic cyan]{inf.baseLegal}[/italic cyan]",
                inf.recomendacao
            )
        console.print(table)

@cli.command()
@click.option("--port", default=8000, help="Porta TCP do servidor FastAPI")
def serve(port):
    """Inicia o Microserviço FastAPI local para interligação com o frontend."""
    console.print(f"[bold green]Iniciando RHUB Python Engine na porta {port}...[/bold green]")
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=port, reload=True)

@cli.command()
@click.option("--output-dir", default="dist/esocial", help="Diretório de destino dos arquivos XML")
def esocial(output_dir):
    """Gera arquivos XML do eSocial (S-1000, S-1010, S-1200 e S-1210)."""
    os.makedirs(output_dir, exist_ok=True)
    dados = _obter_dados_demonstracao()

    console.print(f"[bold cyan]Gerando eventos oficiais eSocial em '{output_dir}'...[/bold cyan]")

    s1000 = gerar_evento_s1000(dados.empresa)
    with open(os.path.join(output_dir, "S-1000_Empregador.xml"), "w", encoding="utf-8") as f:
        f.write(s1000)

    s1010 = gerar_evento_s1010_tabela_rubricas(dados.empresa)
    with open(os.path.join(output_dir, "S-1010_TabelaRubricas.xml"), "w", encoding="utf-8") as f:
        f.write(s1010)

    for idx, c in enumerate(dados.colaboradores, start=1):
        nome_limpo = "".join(x for x in c.nome if x.isalnum())
        s1200 = gerar_evento_s1200_remuneracao(dados.empresa, dados.competencia, c)
        with open(os.path.join(output_dir, f"S-1200_{idx}_{nome_limpo}.xml"), "w", encoding="utf-8") as f:
            f.write(s1200)

        s1210 = gerar_evento_s1210_pagamento(dados.empresa, dados.competencia, c)
        with open(os.path.join(output_dir, f"S-1210_{idx}_{nome_limpo}.xml"), "w", encoding="utf-8") as f:
            f.write(s1210)

    console.print(f"[bold green][OK] Eventos eSocial gerados com sucesso em '{output_dir}'![/bold green]")

@cli.command()
@click.option("--output", default="dist/rhub_folha_executiva.xlsx", help="Caminho do arquivo Excel")
def report(output):
    """Gera a pasta de trabalho Excel corporativa multi-abas via OpenPyXL."""
    os.makedirs(os.path.dirname(output) or ".", exist_ok=True)
    dados = _obter_dados_demonstracao()

    console.print("[bold cyan]Gerando planilha executiva Excel (.xlsx) com OpenPyXL...[/bold cyan]")
    excel_bytes = gerar_planilha_executiva_excel(dados)
    with open(output, "wb") as f:
        f.write(excel_bytes)

    console.print(f"[bold green][OK] Planilha executiva gravada com sucesso em '{output}' ({len(excel_bytes)} bytes)![/bold green]")

@cli.command()
def backup():
    """Realiza snapshot imediato de backup local com compactação e timestamp."""
    dados = _obter_dados_demonstracao().model_dump()
    res = salvar_backup_dados(dados)
    console.print(f"[bold green][OK] Backup realizado com sucesso:[/] {res['arquivo']} ({res['tamanhoBytes']} bytes)")

@cli.command()
def backups():
    """Lista todos os snapshots de backup salvos no disco."""
    lista = listar_backups_locais()
    table = Table(title="Backups Locais Armazenados", show_header=True, header_style="bold cyan")
    table.add_column("Arquivo", style="bold")
    table.add_column("Tamanho")
    table.add_column("Data de Criação")

    for b in lista:
        table.add_row(b["nome"], f"{b['tamanho']:,} bytes", b["criadoEm"])
    console.print(table)

@cli.command()
@click.option("--dissidio", default=5.5, help="Percentual de Dissídio Sindicato CCT (%)")
@click.option("--data-base", default=5, help="Mês da Data-Base CCT (1 a 12)")
def analytics(dissidio, data_base):
    """Executa os modelos de People Analytics Preditivo (Orçamento 12M, Bradford e Turnover)."""
    console.print(Panel.fit(
        "[bold cyan]RHUB HRMS — PEOPLE ANALYTICS PREDITIVO & INTELIGÊNCIA DE RH[/bold cyan]\n"
        "[italic white]Modelagem Orçamentária 12 Meses, Fator de Bradford e Turnover Risk Index (TRI).[/italic white]",
        border_style="blue"
    ))

    dados = _obter_dados_demonstracao()
    from backend.services.people_analytics import (
        calcular_previsao_orcamentaria_12m,
        calcular_absenteismo_bradford,
        calcular_matriz_risco_turnover
    )
    from backend.models.schemas import PrevisaoOrcamentariaRequest

    # 1. Projeção Orçamentária
    req_orc = PrevisaoOrcamentariaRequest(
        colaboradores=dados.colaboradores,
        percentualDissidio=float(dissidio),
        mesDataBase=int(data_base),
        regimeTributario="presumido"
    )
    orc = calcular_previsao_orcamentaria_12m(req_orc)

    console.print(f"\n[bold green]1. PROJEÇÃO ORÇAMENTÁRIA DA FOLHA (12 MESES) — DISSÍDIO {dissidio:.1f}% EM MÊS {data_base}[/bold green]")
    console.print(f"[bold]Custo Total Anual Projetado:[/] [bold cyan]R$ {orc.custoTotalAnual:,.2f}[/] | [bold]Média Mensal:[/] R$ {orc.mediaMensal:,.2f}")
    console.print(f"[bold]Pico de Desembolso:[/] [bold magenta]{orc.picoDesembolsoMes}[/] (R$ {orc.picoDesembolsoValor:,.2f}) | [bold]Impacto Dissídio:[/] R$ {orc.impactoDissidioAnual:,.2f}\n")

    t_orc = Table(title="Fluxo Orçamentário Mensal Projetado", show_header=True, header_style="bold magenta")
    t_orc.add_column("Mês", width=12)
    t_orc.add_column("Salário Base", justify="right")
    t_orc.add_column("Dissídio", justify="right")
    t_orc.add_column("Encargos Patronais", justify="right")
    t_orc.add_column("Desembolso Total", justify="right", style="bold")
    t_orc.add_column("Evento Especial", style="italic yellow")

    for mes in orc.meses:
        t_orc.add_row(
            mes.mesNome,
            f"R$ {mes.salarioBaseTotal:,.2f}",
            f"+R$ {mes.dissidioAplicado:,.2f}" if mes.dissidioAplicado > 0 else "—",
            f"R$ {mes.encargosPatronais:,.2f}",
            f"R$ {mes.desembolsoTotal:,.2f}",
            mes.eventoEspecial or ""
        )
    console.print(t_orc)

    # 2. Fator de Bradford
    abs_res = calcular_absenteismo_bradford(dados.colaboradores, dados.pontos)
    console.print(f"\n[bold green]2. AUDITORIA DE ABSENTEÍSMO & FATOR DE BRADFORD (B = S² × D)[/bold green]")
    console.print(f"[bold]Taxa Global de Absenteísmo:[/] [bold]{abs_res.taxaGlobalAbsenteismo}%[/] | [bold]Horas Perdidas:[/] {abs_res.totalHorasPerdidas}h\n")

    t_brad = Table(title="Ranking de Fator de Bradford por Colaborador", show_header=True, header_style="bold cyan")
    t_brad.add_column("Colaborador", width=20)
    t_brad.add_column("Spells (S)", justify="center")
    t_brad.add_column("Dias (D)", justify="center")
    t_brad.add_column("Fator Bradford (B)", justify="center", style="bold")
    t_brad.add_column("Impacto", justify="center")
    t_brad.add_column("Ação Recomendada", width=38)

    for b in abs_res.colaboradores:
        cor_imp = "red" if b.nivelImpacto in ("CRITICO", "ALTO") else ("yellow" if b.nivelImpacto == "MEDIO" else "green")
        t_brad.add_row(
            b.nome,
            str(b.spellsAusencia),
            str(b.diasAusencia),
            f"[{cor_imp}]{b.fatorBradford}[/]",
            f"[{cor_imp}]{b.nivelImpacto}[/]",
            b.recomendacao
        )
    console.print(t_brad)

    # 3. Turnover Risk Index
    tri_res = calcular_matriz_risco_turnover(dados.colaboradores)
    console.print(f"\n[bold green]3. MATRIZ PREDITIVA DE TURNOVER & RETENÇÃO (TRI: 0 a 100)[/bold green]")
    console.print(f"[bold]Score Médio da Organização:[/] {tri_res.scoreMedioOrganizacao}/100 ({tri_res.nivelRiscoGeral}) | [bold]Em Risco Alto/Crítico:[/] [bold red]{tri_res.colaboradoresEmRiscoAlto}[/]\n")

    t_tri = Table(title="Matriz de Risco de Desligamento e Ações de Retenção", show_header=True, header_style="bold blue")
    t_tri.add_column("Colaborador / Cargo", width=26)
    t_tri.add_column("Score TRI", justify="center", style="bold")
    t_tri.add_column("Nível de Risco", justify="center")
    t_tri.add_column("Fatores Principais de Atrito", width=34)
    t_tri.add_column("Plano Preventivo de Retenção", width=34)

    for tri in tri_res.rankingColaboradores:
        cor_tri = "red" if tri.nivelRisco in ("CRITICO", "ALTO") else ("yellow" if tri.nivelRisco == "MODERADO" else "green")
        t_tri.add_row(
            f"{tri.nome}\n[italic]{tri.cargo}[/italic]",
            f"[{cor_tri}]{tri.scoreRisco}[/]",
            f"[{cor_tri}]{tri.nivelRisco}[/]",
            " • " + "\n • ".join(tri.fatoresPrincipais),
            tri.acaoRecomendada
        )
    console.print(t_tri)

if __name__ == "__main__":
    cli()

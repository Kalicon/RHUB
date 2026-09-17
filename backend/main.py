"""
RHUB HRMS — Servidor Microserviço FastAPI & Automação Python (v3.5)
Endpoints para Auditoria CLT, eSocial XML, Excel Avançado e Backups.
"""

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

from .models.schemas import (
    FolhaCompetenciaRequest,
    AuditoriaComplianceResponse
)
from .services.compliance_auditor import auditar_folha_e_ponto
from .services.esocial_generator import gerar_pacote_esocial_zip
from .services.excel_generator import gerar_planilha_executiva_excel
from .services.backup_service import salvar_backup_dados, listar_backups_locais

app = FastAPI(
    title="RHUB HRMS Automation API",
    description="Motor Python para Auditoria CLT, eSocial XML, Relatórios Excel e Automação de DP",
    version="3.5.0"
)

# Habilitar CORS total para permitir fetch a partir de http://localhost:8095 e origens locais
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def healthcheck():
    """Verifica se o motor de automação Python está ativo e operando."""
    return {
        "status": "online",
        "motor": "RHUB Python Engine",
        "versao": "3.5.0",
        "python": "3.13",
        "modulosAtivos": [
            "Auditoria CLT (Art. 59, 66, 71, 137)",
            "eSocial XML Generator (S-1000/1010/1200/1210)",
            "Gerador Executivo OpenPyXL",
            "Backup Automatizado com Retencao"
        ]
    }

@app.post("/api/compliance/audit", response_model=AuditoriaComplianceResponse)
def endpoint_auditar_compliance(dados: FolhaCompetenciaRequest):
    """Executa a auditoria trabalhista completa da competência informada."""
    try:
        resultado = auditar_folha_e_ponto(dados)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar auditoria de compliance: {str(e)}")

@app.post("/api/esocial/generate-zip")
def endpoint_gerar_esocial_zip(dados: FolhaCompetenciaRequest):
    """Gera pacote compactado (.zip) com XMLs dos eventos eSocial S-1000, S-1010, S-1200 e S-1210."""
    try:
        zip_bytes = gerar_pacote_esocial_zip(dados)
        nome_arquivo = f"esocial_pacote_{dados.competencia.replace('/', '-')}.zip"
        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={nome_arquivo}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar pacote eSocial: {str(e)}")

@app.post("/api/relatorios/excel")
def endpoint_gerar_excel(dados: FolhaCompetenciaRequest):
    """Gera pasta de trabalho Excel (.xlsx) executiva corporativa via OpenPyXL."""
    try:
        excel_bytes = gerar_planilha_executiva_excel(dados)
        nome_arquivo = f"rhub_folha_executiva_{dados.competencia.replace('/', '-')}.xlsx"
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={nome_arquivo}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar planilha executiva: {str(e)}")

@app.post("/api/backup/save")
def endpoint_salvar_backup(payload: Dict[str, Any]):
    """Salva um snapshot dos dados do sistema no diretório de backups locais."""
    try:
        resultado = salvar_backup_dados(payload)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar backup: {str(e)}")

@app.get("/api/backup/list")
def endpoint_listar_backups():
    """Retorna a lista de backups locais disponíveis."""
    try:
        return {"backups": listar_backups_locais()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar backups: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

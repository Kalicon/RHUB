"""
RHUB HRMS — Serviço de Backup Automatizado e Retenção
Realiza snapshots do banco de dados e arquivos locais com data/hora e compactação.
"""

import os
import json
import zipfile
from datetime import datetime
from typing import Dict, Any, List

BACKUP_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backups")

def garantir_diretorio_backup() -> str:
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR, exist_ok=True)
    return BACKUP_DIR

def salvar_backup_dados(dados: Dict[str, Any], prefixo: str = "rhub_backup") -> Dict[str, Any]:
    """Salva um snapshot JSON e gera arquivo compactado com timestamp."""
    diretorio = garantir_diretorio_backup()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    nome_base = f"{prefixo}_{timestamp}"
    
    caminho_json = os.path.join(diretorio, f"{nome_base}.json")
    with open(caminho_json, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)

    # Compactar em .zip
    caminho_zip = os.path.join(diretorio, f"{nome_base}.zip")
    with zipfile.ZipFile(caminho_zip, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.write(caminho_json, arcname=f"{nome_base}.json")

    # Retenção: manter os 10 backups mais recentes
    arquivos = sorted([f for f in os.listdir(diretorio) if f.endswith(".zip")])
    if len(arquivos) > 10:
        for arq_velho in arquivos[:-10]:
            try:
                os.remove(os.path.join(diretorio, arq_velho))
                json_velho = os.path.join(diretorio, arq_velho.replace(".zip", ".json"))
                if os.path.exists(json_velho):
                    os.remove(json_velho)
            except Exception:
                pass

    tamanho_bytes = os.path.getsize(caminho_zip)
    return {
        "sucesso": True,
        "arquivo": os.path.basename(caminho_zip),
        "caminhoCompleto": caminho_zip,
        "tamanhoBytes": tamanho_bytes,
        "timestamp": timestamp,
        "totalBackupsDisponiveis": len(os.listdir(diretorio))
    }

def listar_backups_locais() -> List[Dict[str, Any]]:
    """Lista todos os backups armazenados no diretório local."""
    diretorio = garantir_diretorio_backup()
    backups = []
    for f in sorted(os.listdir(diretorio), reverse=True):
        if f.endswith(".zip"):
            caminho = os.path.join(diretorio, f)
            backups.append({
                "nome": f,
                "tamanho": os.path.getsize(caminho),
                "criadoEm": datetime.fromtimestamp(os.path.getctime(caminho)).strftime("%d/%m/%Y %H:%M:%S")
            })
    return backups

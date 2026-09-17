"""
RHUB HRMS — Schemas Pydantic v2
Modelos de validação de dados para Colaboradores, Ponto, Folha, eSocial e Auditoria.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ColaboradorSchema(BaseModel):
    id: Optional[int] = None
    nome: str
    cpf: str
    matricula: Optional[str] = None
    cargo: Optional[str] = None
    departamento: Optional[str] = None
    salarioBase: float = Field(default=0.0, ge=0)
    dataAdmissao: Optional[str] = None
    status: Optional[str] = "Ativo"
    regimeContratual: Optional[str] = "CLT"
    escala: Optional[str] = "5x2"
    horarioEntrada: Optional[str] = "08:00"
    horarioSaida: Optional[str] = "17:48"
    intervalo: Optional[str] = "01:00"
    dependentesIR: Optional[int] = 0
    valeTransporte: Optional[bool] = False
    insalubridade: Optional[str] = "Nenhum"
    periculosidade: Optional[bool] = False
    cargoConfianca: Optional[bool] = False

class DiaPontoSchema(BaseModel):
    dia: int
    data: Optional[str] = None
    diaSemana: Optional[str] = None
    tipoDia: Optional[str] = "util" # util, dsr, feriado
    previstoMinutos: Optional[int] = 528
    e1: Optional[str] = ""
    s1: Optional[str] = ""
    e2: Optional[str] = ""
    s2: Optional[str] = ""
    trabalhadosMinutos: Optional[int] = 0
    he50Minutos: Optional[int] = 0
    he100Minutos: Optional[int] = 0
    noturnoMinutos: Optional[int] = 0
    saldoMinutos: Optional[int] = 0
    status: Optional[str] = "normal"
    justificativa: Optional[str] = ""

class FolhaPontoSchema(BaseModel):
    colaboradorId: int
    ano: int
    mes: int
    competencia: Optional[str] = None
    dias: List[DiaPontoSchema] = []

class ItemFolhaColaboradorSchema(BaseModel):
    id: Optional[int] = None
    nome: str
    cargo: Optional[str] = None
    salarioBruto: float = 0.0
    he50Horas: Optional[float] = 0.0
    he50Valor: Optional[float] = 0.0
    he100Horas: Optional[float] = 0.0
    he100Valor: Optional[float] = 0.0
    adicionalNoturnoValor: Optional[float] = 0.0
    dsrSobreVariaveis: Optional[float] = 0.0
    inss: float = 0.0
    irrf: float = 0.0
    valeTransporteDesconto: Optional[float] = 0.0
    outrosDescontos: Optional[float] = 0.0
    totalProventos: float = 0.0
    totalDescontos: float = 0.0
    salarioLiquido: float = 0.0
    fgts: float = 0.0
    inssPatronal: Optional[float] = 0.0

class FolhaCompetenciaRequest(BaseModel):
    ano: int
    mes: int
    competencia: str
    colaboradores: List[ItemFolhaColaboradorSchema] = []
    pontos: Optional[List[FolhaPontoSchema]] = []
    empresa: Optional[Dict[str, Any]] = None

class InfracaoCompliance(BaseModel):
    gravidade: str # 'CRITICA', 'MEDIA', 'LEVE', 'CONFORME'
    categoria: str # 'Jornada', 'Intervalo', 'Descanso', 'Ferias', 'Remuneracao'
    colaborador: str
    matricula: Optional[str] = None
    descricao: str
    baseLegal: str # ex: 'Art. 59 CLT', 'Art. 71 CLT'
    impactoRisco: str
    recomendacao: str

class AuditoriaComplianceResponse(BaseModel):
    scoreConformidade: int # 0 a 100
    nivelRiscoGeral: str # 'BAIXO', 'MEDIO', 'ALTO', 'CRITICO'
    totalColaboradoresAuditados: int
    totalInfracoes: int
    infracoesCriticas: int
    infracoesMedias: int
    infracoesLeves: int
    estimativaPassivoRisco: float
    infracoes: List[InfracaoCompliance]
    resumoCategorias: Dict[str, int]

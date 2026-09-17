# RHUB — Sistema Integrado de Departamento Pessoal, Compliance CLT & Automação de RH

[![Vitest CI](https://github.com/Kalicon/RHUB/actions/workflows/test.yml/badge.svg)](https://github.com/Kalicon/RHUB/actions/workflows/test.yml)
[![Licença MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-blue.svg)](LICENSE)
[![Python 3.13](https://img.shields.io/badge/Python-3.13-3776AB.svg?logo=python&logoColor=white)](backend/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141-009688.svg?logo=fastapi&logoColor=white)](backend/)
[![IndexedDB v3](https://img.shields.io/badge/IndexedDB-v3_Offline--First-orange.svg)](assets/js/data/db.js)

O **RHUB** é uma solução corporativa de alta fidelidade para cálculo, auditoria e automação de Departamento Pessoal e Recursos Humanos, desenvolvida estritamente em conformidade com o **Decreto-Lei nº 5.452/1943 (CLT)**, a **Portaria MTE 671/2021 (Ponto Eletrônico)**, as normas da **Receita Federal do Brasil (RFB)** e o **Manual de Orientação do eSocial (MOS)**.

---

## 🌐 Acesso à Aplicação

- **Aplicação Web (GitHub Pages):** [kalicon.github.io/RHUB](https://kalicon.github.io/RHUB/)
- **Microserviço Local (FastAPI):** `http://127.0.0.1:8000/docs` (Swagger UI)

---

## 🏛️ Arquitetura do Sistema

```text
RHUB/
├── assets/                     <- Frontend SPA e Motor de Domínio Web
│   ├── css/
│   │   └── custom.css          <- Design System, Glassmorphism, Dark Mode e Impressão
│   ├── data/
│   │   ├── db.js               <- IndexedDB v3 (Colaboradores, Férias e Pontos)
│   │   ├── cct_config.js       <- Gestor de Convenções Coletivas CCT/ACT e ATS
│   │   └── esocial_rubricas.js <- Catálogo oficial de rubricas e incidências S-1010
│   ├── js/
│   │   ├── app.js              <- Controller SPA, Router Hash e Integração Python
│   │   ├── modules/
│   │   │   ├── colaboradores.js<- Dossiê Digital, LGPD e Contratos
│   │   │   ├── gestao_ferias.js<- Escala Anual de Férias e Provisões Contábeis
│   │   │   ├── gestao_ponto.js <- Ponto Eletrônico (Portaria MTE 671/2021)
│   │   │   ├── folha_lote.js   <- Folha de Pagamento em Lote & People Analytics
│   │   │   ├── liquido.js      <- Salário Líquido (faixas progressivas RFB/MPS)
│   │   │   ├── rescisao.js     <- Comparador simultâneo de 4 cenários rescisórios
│   │   │   ├── ferias.js       <- Férias, 13º e fracionamento do Art. 134 CLT
│   │   │   ├── noturno.js      <- Adicional Noturno e hora ficta reduzida (Art. 73)
│   │   │   ├── faltas.js       <- Faltas, DSR e tabela progressiva do Art. 130
│   │   │   ├── clt_pj.js       <- Simulador CLT vs. PJ e custo efetivo da empresa
│   │   │   ├── banco_horas.js  <- Compensação semestral/anual do Art. 59 CLT
│   │   │   ├── plr.js          <- Participação nos Lucros (Lei 10.101/00)
│   │   │   ├── teletrabalho.js <- Teletrabalho e ajuda de custo (Art. 75-A CLT)
│   │   │   └── equiparacao.js  <- Equiparação Salarial (Lei 14.611/2023)
│   │   └── utils/
│   │       ├── pdf_generator.js<- Emissor vetorial de Holerites e TRCT
│   │       ├── formatters.js   <- Formatadores monetários BRL (R$) e horas
│   │       └── exporter.js     <- Exportador em planilhas XLSX e CSV
├── backend/                    <- RHUB Python Automation Engine (FastAPI 3.13)
│   ├── main.py                 <- Servidor REST API e Endpoints de Automação
│   ├── cli.py                  <- CLI Corporativa interativa via Click e Rich
│   ├── models/schemas.py       <- Modelos Pydantic v2
│   └── services/
│       ├── compliance_auditor.py <- Robô de Auditoria e Passivo Trabalhista CLT
│       ├── esocial_generator.py  <- Gerador de XMLs eSocial (S-1000 a S-1210)
│       ├── excel_generator.py    <- Planilhas Executivas Avançadas (OpenPyXL)
│       └── backup_service.py     <- Snapshots e retenção de backups locais
├── tests/
│   ├── clt_modules.test.js     <- 54 Testes unitários com Vitest
│   └── python/                 <- 9 Testes unitários com Pytest
├── index.html                  <- Aplicação Single-Page completa
└── cli.py                      <- Ponto de entrada da CLI para o terminal
```

---

## ⚖️ Módulos e Fundamentação Legal

| Módulo | Regras e Entregas Principais | Base Legal |
|---|---|---|
| **Dossiê de Colaboradores** | Gestão de contratos, admissão, jornada contratual, dependentes e LGPD | CLT e Lei 13.709/18 |
| **Gestão e Escala de Férias** | Acompanhamento de períodos aquisitivos/concessivos, mapa anual e provisões | Art. 129 a 145 da CLT |
| **Ponto Eletrônico & Espelho** | Apuração diária, tolerância legal (Art. 58 § 1º), HE 50%/100%, hora noturna ficta e PDF oficial | Portaria MTE 671/2021 & Art. 74 CLT |
| **Robô de Compliance CLT** | Inspeção algorítmica de horas extras (>2h), intervalos (<1h), interjornada (<11h) e cálculo de passivo | Art. 59, 66, 71 da CLT e Súmulas TST |
| **Gerador de Eventos eSocial** | Emissão de arquivos XML S-1000, S-1010, S-1200 e S-1210 validados estruturalmente | Layout eSocial v. S-1.2 / S-1.3 |
| **Folha em Lote & Analytics** | Fechamento mensal consolidado, rateio de encargos patronais (INSS, RAT, FAP, Terceiros) e Holerites PDF | Lei 8.212/91 e Decreto 3.048/99 |
| **Salário Líquido** | Composição de proventos e descontos, faixas progressivas de INSS e IRRF | Portaria Interministerial MPS/MF |
| **Rescisão Contratual** | Simulador comparativo de 4 modalidades rescisórias simultâneas e emissão do TRCT | Art. 477 da CLT & Lei 12.506/11 |
| **Adicional Noturno** | Redução ficta de 52m30s (fator 1,142857) e reflexos no DSR | Art. 73 CLT & Súmula 60/172 TST |
| **Faltas e Atrasos** | Desconto em dias/horas, reflexo no DSR e escala progressiva de perda de férias | Art. 130 e 462 da CLT |
| **CLT vs. PJ & Custos** | Encargos patronais, Simples Nacional (Anexos III e V, Fator R) e Break-Even | LC 123/2006 |
| **Banco de Horas** | Compensação individual semestral ou coletiva anual e quitação rescisória | Art. 59 §§ 2º e 5º da CLT |
| **PLR** | Tributação exclusiva na fonte por tabela progressiva anual e isenção previdenciária | Lei 10.101/2000 |
| **Teletrabalho** | Ajuda de custo, infraestrutura e ergonomia | Art. 75-A a 75-E da CLT |
| **Equiparação Salarial** | Cálculo de diferenças e penalidades por discriminação salarial | Art. 461 CLT & Lei 14.611/2023 |

---

## 💻 Como Executar Localmente

### 1. Aplicação Web
Basta iniciar um servidor estático:
```bash
python -m http.server 8095
```
Acesse no navegador: `http://localhost:8095`

### 2. Motor de Automação Python (FastAPI & CLI)
Instale as dependências:
```bash
pip install fastapi uvicorn pydantic openpyxl lxml rich click pytest
```

Execute o servidor de automação:
```bash
python cli.py serve
```

Ou execute a auditoria diretamente pelo terminal:
```bash
python cli.py audit
```

---

## 🧪 Testes Automatizados

### Testes da Legislação Trabalhista no Frontend (Vitest)
```bash
npm test
```
*54 testes unitários cobrindo 100% dos cálculos trabalhistas da CLT.*

### Testes da Camada de Automação Python (Pytest)
```bash
pytest tests/python/ -v
```
*9 testes unitários validando compliance CLT, geração de XMLs eSocial e relatórios OpenPyXL.*

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte o arquivo [LICENSE](LICENSE) para obter mais informações.

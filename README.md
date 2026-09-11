# 💼 RHUB — Suíte de Cálculos de Departamento Pessoal & CLT Open Source

![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)
![PWA Ready](https://img.shields.io/badge/PWA-Installable_|_Offline-6366f1.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-CDN-06B6D4.svg)
![GSAP](https://img.shields.io/badge/GSAP-3.12-88CE02.svg)
![SheetJS](https://img.shields.io/badge/SheetJS-0.20_Excel-107C41.svg)
![Vanilla JS](https://img.shields.io/badge/JavaScript-ES6_Modules-F7DF1E.svg)
![CLT](https://img.shields.io/badge/CLT-Atualizada_2024-green.svg)
![GitHub Pages](https://img.shields.io/badge/deploy-GitHub_Pages-brightgreen.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-orange.svg)

> **Calculadora e Suíte de Gestão Trabalhista Moderna para a CLT Brasileira.**  
> 100% client-side, instalável como PWA (offline), suporte a Dark Mode, animações GSAP CountUp, exportação em Excel (.xlsx), impressão em formato de documento executivo e zero dependência de servidor ou banco de dados.  
> Projetada para profissionais de Recursos Humanos, Departamento Pessoal, contadores, peritos e advogados trabalhistas.

---

## ✨ Recursos e Destaques

- 📱 **Progressive Web App (PWA)**: Funciona 100% offline via Service Worker, instalável no celular e computador.
- 🏢 **Identidade Corporativa Personalizada**: Modal de configuração de Empresa, CNPJ, Colaborador e Cargo, inseridos automaticamente nas impressões e planilhas Excel.
- 📊 **5 Módulos de Cálculo Especializados**:
  1. **Adicional Noturno & DSR**: Hora noturna ficta (52min30s / fator 1,142857), prorrogação e DSR (Súmula 172 TST).
  2. **Rescisão de Contrato CLT**: 4 modalidades de rescisão, aviso prévio proporcional (Lei 12.506), 13º, férias, FGTS (8% + 40%/20%) e INSS/IRRF.
  3. **Faltas e Atrasos**: Desconto em dias (`Salário ÷ 30`), horas de atraso, perda do DSR semanal e tabela progressiva de perda de férias (Art. 130 CLT).
  4. **Férias & 13º Salário**: Período aquisitivo, 1/3 constitucional, abono pecuniário (venda de 10 dias), dobra (férias vencidas) e avos de 13º.
  5. **Salário Líquido (Holerite Mensal)**: Vencimentos (Salário base, Horas Extras 50%/100%, adicional noturno, DSR, insalubridade 10%/20%/40%, periculosidade 30%) e descontos reais (INSS progressivo, IRRF progressivo c/ dependentes, Vale Transporte teto 6%, VR/VA, saúde, pensão).
- ⚖️ **Comparador de 4 Cenários de Rescisão**: Matriz visual comparando lado a lado *Sem Justa Causa*, *Pedido de Demissão*, *Justa Causa* e *Acordo Mútuo (Art. 484-A)* com valor líquido do empregado e custo total para a empresa.
- 📥 **Exportação Completa para Excel (.xlsx)**: Gera planilhas profissionais estruturadas com cabeçalho corporativo, dados da simulação e detalhamento dos cálculos.
- 🖨️ **Impressão / PDF Executivo**: Folha de estilo `@media print` que remove a interface web e gera relatórios limpos com cabeçalho da empresa e assinatura.
- 🕒 **Histórico de Simulações**: Drawer lateral com as últimas 15 simulações salvas no `localStorage`, restauráveis com 1 clique.
- 🎨 **Design System Moderno**: Tailwind CSS, Dark Mode, GSAP CountUp nos números e layout responsivo desktop/mobile.

---

## 🎨 Stack Tecnológica

| Camada            | Tecnologia                             | Descrição                                         |
| ----------------- | -------------------------------------- | ------------------------------------------------- |
| **Estrutura**     | HTML5 Semântico                        | Acessibilidade WAI-ARIA e SEO estruturado         |
| **Estilização**   | Tailwind CSS (via CDN Play)            | Design utility-first com Dark Mode por classe     |
| **Lógica**        | JavaScript Vanilla (ES6 Modules)       | Módulos puros, testáveis, zero backend            |
| **Animações**     | GSAP 3.12 (via CDN)                    | Efeito CountUp nos valores monetários             |
| **Planilhas**     | SheetJS / xlsx 0.20 (via CDN)          | Criação de arquivos `.xlsx` no navegador          |
| **Offline / PWA** | Service Worker & Web App Manifest      | Cache-first para navegação offline completa       |
| **Deploy**        | GitHub Pages + GitHub Actions          | CI/CD automático, hospedagem estática gratuita    |

---

## 📁 Estrutura do Repositório

```text
RHUB/
├── .github/workflows/
│   └── pages.yml               ← CI/CD de deploy automático no GitHub Pages
├── assets/
│   ├── css/
│   │   ├── custom.css          ← Estilos do drawer, comparador, orbes e temas
│   │   └── print.css           ← Folha de estilo de impressão executiva e PDF
│   ├── js/
│   │   ├── app.js              ← Controller SPA, PWA lifecycle, router e GSAP
│   │   ├── modules/
│   │   │   ├── noturno.js      ← Adicional Noturno, hora ficta e DSR
│   │   │   ├── rescisao.js     ← Rescisão CLT e Comparador de 4 Cenários
│   │   │   ├── faltas.js       ← Faltas, atrasos, DSR e escala Art. 130
│   │   │   ├── ferias.js       ← Férias, 1/3, abono, dobra e 13º salário
│   │   │   ├── liquido.js      ← Salário Líquido completo (holerite mensal)
│   │   │   └── tabelas.js      ← Tabelas progressivas de INSS e IRRF 2024
│   │   └── utils/
│   │       ├── exporter.js     ← Gerador de Excel (.xlsx) para todos os módulos
│   │       ├── storage.js      ← Gerenciador de LocalStorage (Empresa e Histórico)
│   │       ├── formatters.js   ← Formatação BRL (R$), decimais e datas
│   │       └── validators.js   ← Sanitização e validação de entradas
│   └── img/
│       ├── logo.svg            ← Logo vetorial do RHUB
│       ├── icon-192.svg        ← Ícone PWA 192x192
│       └── icon-512.svg        ← Ícone PWA 512x512
├── manifest.json               ← Manifesto PWA (instalável)
├── sw.js                       ← Service Worker com cache-first e offline
├── index.html                  ← Aplicação Single-Page com 5 módulos
├── LICENSE                     ← Licença MIT
└── README.md                   ← Documentação técnica completa
```

---

## ⚖️ Fundamentação Legal dos Módulos

| Módulo | Regras Principais | Base Legal |
|--------|-------------------|------------|
| **Adicional Noturno** | Horário 22h às 05h, hora ficta reduzida (52min30s / fator 1,142857), adicional mín. 20%, DSR s/ noturno | Art. 73 da CLT, Lei 605/49, Súmulas 60 e 172 do TST |
| **Rescisão Contratual** | Sem justa causa, pedido de demissão, justa causa, acordo mútuo (Art. 484-A), aviso prévio proporcional (Lei 12.506/11), saque e multa FGTS | Art. 477, 482 e 484-A da CLT, Lei 12.506/2011, Lei 8.036/90 |
| **Faltas e Atrasos** | Desconto em dias (`Salário ÷ 30`), horas de atraso, perda do DSR semanal, escala progressiva de perda de férias | Art. 130 e 462 da CLT, Lei 605/49, Súmula 366 do TST |
| **Férias & 13º Salário** | Férias proporcionais e vencidas, 1/3 constitucional, abono pecuniário (venda de 10 dias), dobra por atraso e avos de 13º | Art. 129 a 145 da CLT, Art. 7º, XVII da CF/88, Lei 4.090/62 |
| **Salário Líquido (Holerite)** | Composição de proventos (HE 50%/100%, insalubridade, periculosidade, DSR), desconto de VT teto 6%, previdência e IRRF | Portaria Interministerial MPS/MF nº 2/2024, MP 1.206/2024, Lei 7.418/85 |
| **Tabelas Previdenciárias e Fiscais** | INSS por faixas progressivas (7,5%, 9%, 12%, 14%), dedução por dependente (R$ 189,59) e faixas do IRRF 2024 | Tabela Oficial da Receita Federal e Ministério da Previdência Social |

---

## 🚀 Como Executar Localmente

Como o projeto utiliza **ES6 Modules nativos**, basta servi-lo via HTTP local:

```bash
# Opção 1: Python 3
python -m http.server 8086

# Opção 2: Node.js
npx serve .

# Opção 3: Extensão "Live Server" do VS Code
```

Acesse no seu navegador: **http://localhost:8086**

---

## 🌐 Publicação no GitHub Pages (Passo a Passo)

O projeto está pronto para ser publicado em 1 minuto:

1. Suba este repositório para a sua conta no GitHub (`git push origin main`).
2. No seu repositório no GitHub, clique em **Settings** (Configurações).
3. Na barra lateral esquerda, clique em **Pages**.
4. Em **Build and deployment → Source**, selecione **Deploy from a branch**.
5. Em **Branch**, selecione `main` e a pasta `/ (root)`, depois clique em **Save**.
6. Em instantes, o GitHub fornecerá a URL pública do seu app (ex: `https://seu-usuario.github.io/RHUB/`).

O repositório já conta com o workflow `.github/workflows/pages.yml` configurado para automatizar deploys a cada commit.

---

## 📱 Instalação como App (PWA)

- **No Google Chrome / Edge (Desktop)**: Clique no ícone de instalação na barra de endereços ou no botão **Instalar App** no menu lateral.
- **No Android (Chrome)**: Toque nos três pontos do navegador e selecione **"Adicionar à tela inicial"** ou **"Instalar aplicativo"**.
- **No iOS (Safari)**: Toque no botão de compartilhamento e selecione **"Adicionar à Tela de Início"**.

O app funcionará normalmente mesmo sem conexão com a internet!

---

## 📄 Licença

Distribuído sob a licença **MIT**. Livre para uso pessoal, corporativo e modificações.


# RHUB — Manual de Uso & Guia Prático de Operação

> **Guia completo de utilização da Suíte de Cálculos de Departamento Pessoal & CLT Brasileira.**  
> Aplicável a analistas de RH, assistentes de DP, contadores, diretores financeiros, peritos e advogados trabalhistas.

---

## Sumário

1. [Visão Geral & Filosofia da Ferramenta](#1-visão-geral--filosofia-da-ferramenta)
2. [Configuração Inicial: Identidade Corporativa](#2-configuração-inicial-identidade-corporativa)
3. [Como Usar os 10 Módulos de Cálculo](#3-como-usar-os-10-módulos-de-cálculo)
   - [Módulo 1: Adicional Noturno & DSR](#módulo-1-adicional-noturno--dsr)
   - [Módulo 2: Rescisão Contratual & Comparador](#módulo-2-rescisão-contratual--comparador)
   - [Módulo 3: Faltas, Atrasos & Impacto em Férias](#módulo-3-faltas-atrasos--impacto-em-férias)
   - [Módulo 4: Férias & 13º Salário](#módulo-4-férias--13º-salário)
   - [Módulo 5: Salário Líquido (Holerite Mensal)](#módulo-5-salário-líquido-holerite-mensal)
   - [Módulo 6: Simulador CLT vs. PJ & Custos](#módulo-6-simulador-clt-vs-pj--custos)
   - [Módulo 7: Banco de Horas & Compensação](#módulo-7-banco-de-horas--compensação)
   - [Módulo 8: Participação nos Lucros e Resultados (PLR)](#módulo-8-participação-nos-lucros-e-resultados-plr)
   - [Módulo 9: Teletrabalho & Ajuda de Custo](#módulo-9-teletrabalho--ajuda-de-custo)
   - [Módulo 10: Equiparação Salarial & Passivo](#módulo-10-equiparação-salarial--passivo)
4. [Recursos Globais & Produtividade](#4-recursos-globais--produtividade)
   - [Exportação em Planilhas Excel (.xlsx)](#exportação-em-planilhas-excel-xlsx)
   - [Impressão Executiva & Geração de PDF](#impressão-executiva--geração-de-pdf)
   - [Compartilhamento por Link (Deep Linking)](#compartilhamento-por-link-deep-linking)
   - [Histórico Local & Backup / Restauração JSON](#histórico-local--backup--restauração-json)
   - [Instalação como Aplicativo (PWA Offline)](#instalação-como-aplicativo-pwa-offline)
   - [Guia & Glossário da CLT](#guia--glossário-da-clt)
   - [Central de Desafios & Sugestões](#central-de-desafios--sugestões)

---

## 1. Visão Geral & Filosofia da Ferramenta

O **RHUB** foi desenvolvido para resolver as dores mais comuns da rotina trabalhista: cálculos lentos, divergências em regras sindicais, falta de transparência na memória de cálculo e insegurança jurídica na tomada de decisões.

### Pilares Fundamentais:
- **100% Client-Side**: Todos os dados e cálculos são processados estritamente no seu próprio navegador. Nenhum salário, CNPJ ou dado pessoal é enviado para servidores externos, garantindo conformidade absoluta com a LGPD.
- **Transparência Matemática (Auditabilidade)**: Cada módulo conta com um acordeão de **Memória de Cálculo Passo a Passo**, exibindo as fórmulas legais, alíquotas e artigos da CLT que fundamentam o resultado.
- **Operação Offline**: Instalável no computador ou celular via tecnologia PWA, permitindo uso contínuo mesmo sem conexão à internet.

---

## 2. Configuração Inicial: Identidade Corporativa

Para que as suas planilhas Excel e relatórios de impressão saiam com aparência executiva timbrada:

1. Na **barra superior** da aplicação, clique no botão **Identidade Corporativa** (ícone de crachá/empresa).
2. No modal aberto, preencha:
   - **Razão Social / Nome da Empresa**: Ex: *Acme Indústria e Comércio Ltda*
   - **CNPJ da Empresa**: Ex: *12.345.678/0001-90*
   - **Nome do Colaborador**: Ex: *João da Silva Santos*
   - **Cargo / Função**: Ex: *Assistente Administrativo*
3. Clique em **Salvar Identidade**.

> **Dica**: Esses dados ficam salvos com segurança no seu `localStorage` e serão injetados automaticamente no topo de todas as planilhas Excel geradas e no cabeçalho dos relatórios de impressão.

---

## 3. Como Usar os 10 Módulos de Cálculo

### Módulo 1: Adicional Noturno & DSR
*Base Legal: Art. 73 da CLT, Lei 605/49 e Súmulas 60 e 172 do TST.*

- **Quando usar**: Para apurar horas trabalhadas entre 22h e 05h (ou prorrogações após as 05h da manhã).
- **Como preencher**:
  1. Informe o **Salário Base Mensal** e escolha o **Divisor Mensal** (220h para jornada de 44h semanais, 200h para 40h ou 180h para 36h).
  2. Defina o **Percentual do Adicional** (o mínimo legal da CLT é 20%, mas convenções coletivas podem fixar 25%, 30%, etc.).
  3. Preencha as **Horas Noturnas Relógio** apontadas no ponto.
  4. Mantenha ativada a opção **Hora Noturna Ficta (52m30s)** para que o sistema converta automaticamente as horas de relógio pelo fator legal de `1,142857` (Art. 73, § 1º CLT).
  5. Informe a quantidade de **Dias Úteis** e **Domingos/Feriados** do mês para apuração precisa do reflexo de DSR (Súmula 172 TST).
- **Resultado Obtido**: Valor da hora normal, hora com adicional, total do adicional noturno e reflexo no descanso semanal remunerado.

---

### Módulo 2: Rescisão Contratual & Comparador
*Base Legal: Art. 477, 482 e 484-A da CLT, Lei 12.506/2011 e Lei 8.036/90.*

- **Quando usar**: Para simular o termo de rescisão de contrato de trabalho (TRCT), estimar custos rescisórios e comparar cenários.
- **Como preencher**:
  1. Escolha a **Modalidade de Rescisão**:
     - *Sem Justa Causa*: Aviso indenizado/trabalhado, saque do FGTS com multa de 40% e direito a seguro-desemprego.
     - *Pedido de Demissão*: Sem saque ou multa de FGTS e sem seguro-desemprego.
     - *Demissão por Justa Causa (Art. 482)*: Apenas saldo de salário e férias vencidas com 1/3.
     - *Acordo Mútuo (Art. 484-A)*: Metade do aviso prévio indenizado, multa FGTS reduzida a 20% e saque de até 80% do saldo FGTS.
  2. Preencha as datas de **Admissão** e **Demissão**: o sistema calcula automaticamente a quantidade de anos completos e a quantidade exata de dias de **Aviso Prévio Proporcional** pela Lei 12.506/2011 (3 dias extras por ano completo trabalhado, até o teto de 90 dias).
  3. Informe os **Dias Trabalhados no Mês do Desligamento**, saldo para fins rescisórios do **FGTS** e se existem **Férias Vencidas**.
- **Super Recurso — Comparador de 4 Cenários**:
  - Clique no botão **Comparar Cenários**.
  - O RHUB abrirá um modal com um **Gráfico de Barras Chart.js** e uma tabela lado a lado demonstrando quanto o colaborador recebe e quanto a empresa gasta em cada uma das 4 modalidades simultâneas.

---

### Módulo 3: Faltas, Atrasos & Impacto em Férias
*Base Legal: Art. 130 e 462 da CLT, Lei 605/49 e Súmula 366 do TST.*

- **Quando usar**: No fechamento mensal da folha de ponto para descontar faltas injustificadas, atrasos acumulados, perdas de DSR e verificar a redução de dias de férias.
- **Como preencher**:
  1. Insira o salário base e divisor.
  2. Preencha os **Dias de Falta Injustificada** (o desconto é calculado pelo dia comercial: `Salário ÷ 30`).
  3. Informe as **Horas Efetivas de Atraso** (descontadas pelo valor da hora simples).
  4. Informe os **DSRs Afetados** (conforme a Lei 605/49, o empregado que falta injustificadamente perde a remuneração do repouso semanal remunerado daquela semana).
  5. Insira a quantidade de **Faltas no Período Aquisitivo**: o sistema consulta em tempo real a tabela progressiva do **Art. 130 da CLT**, alertando se o colaborador ainda tem direito aos 30 dias de férias, se caiu para 24, 18 ou 12 dias, ou se **perdeu integralmente o direito a férias** (mais de 32 faltas).

---

### Módulo 4: Férias & 13º Salário
*Base Legal: Art. 129 a 145 da CLT, Art. 7º, XVII da CF/88 e Lei 4.090/62.*

- **Quando usar**: Para calcular o recibo de férias com antecedência legal (pagamento até 2 dias antes do início do gozo) e apurações da 1ª e 2ª parcelas do 13º salário.
- **Como preencher**:
  - **Férias**:
    1. Informe o salário base e a quantidade de **Dias de Gozo** (30, 24, 18 ou 12 dias).
    2. Ative **Abono Pecuniário (Art. 143 CLT)** se o colaborador solicitou a venda de 1/3 dos dias de férias (10 dias convertidos em dinheiro com adicional de 1/3 isento de INSS).
    3. Ative **Férias em Dobro (Art. 137 CLT)** caso as férias estejam sendo concedidas após o término do período concessivo.
    4. Informe a quantidade de **Dependentes** para apuração do IRRF.
  - **13º Salário**:
    1. Informe a quantidade de **Meses Trabalhados (Avos)** no ano (mínimo 15 dias trabalhados no mês civil para computar 1 avo).
    2. Veja a divisão da 1ª parcela (sem desconto de INSS/IRRF) e 2ª parcela (com descontos fiscais e previdenciários).

---

### Módulo 5: Salário Líquido (Holerite Mensal)
*Base Legal: Portaria Interministerial MPS/MF nº 2/2024, MP 1.206/2024 e Lei 7.418/85.*

- **Quando usar**: Para simulação completa do contracheque mensal de qualquer categoria profissional.
- **Como preencher**:
  1. **Vencimentos / Proventos**:
     - Salário base mensal.
     - Quantidade de Horas Extras a 50% e Horas Extras a 100%.
     - Adicional noturno e reflexo de DSR (caso se aplique).
     - Adicional de **Insalubridade** (10% mínimo, 20% médio ou 40% máximo sobre o Salário Mínimo legal de R$ 1.412,00).
     - Adicional de **Periculosidade** (30% sobre o salário base, Art. 193 CLT).
  2. **Descontos Legais & Benefícios**:
     - Quantidade de dependentes para dedução de R$ 189,59 cada na base do IRRF.
     - Opção de **Vale-Transporte**: o sistema aplica estritamente a Lei 7.418/85, limitando o desconto ao **teto de 6% do salário base** (se o custo do VT for menor, desconta apenas o custo real).
     - Coparticipação em Vale Refeição / Alimentação (VR/VA), plano de assistência médica e pensão alimentícia.
- **Gráfico Donut**: Mostra visualmente a distribuição percentual entre Salário Líquido, INSS, IRRF e Benefícios.

---

### Módulo 6: Simulador CLT vs. PJ & Custos
*Base Legal: Lei 8.212/91, LC 123/2006 (Simples Nacional) e Art. 7º da CF/88.*

- **Quando usar**: Na contratação ou negociação de propostas de trabalho, permitindo saber o custo total para a empresa e a renda real no bolso do colaborador.
- **Como preencher**:
  1. Informe o **Salário CLT Proposto** e o **Regime Tributário da Empresa**:
     - *Simples Nacional (Anexos I a III e V)*: Isento de cota patronal de 20% e terceiros.
     - *Lucro Presumido / Real*: Custo integral com INSS Patronal (20%), RAT ajustado pelo FAP e Terceiros/Sistema S (5,8%).
  2. Insira o pacote de benefícios corporativos (VR/VA mensal, plano de saúde, seguro de vida, etc.).
  3. No bloco PJ, configure o **Anexo do Simples Nacional** (Anexo III 6% ou Anexo V 15,5%), Fator R c/ pró-labore de 28%, honorários contábeis e benefícios pagos por conta própria.
- **O que o sistema calcula automaticamente**:
  - **Custo Total da Empresa no CLT**: Encargos + Provisões mensais de 13º, Férias + 1/3 e FGTS + Benefícios.
  - **Poder de Compra Real do Colaborador CLT**: Salário líquido somado aos benefícios e provisões mensais.
  - **Break-Even Automático**: Aponta o valor exato de **Faturamento PJ mensal** necessário para que o profissional tenha a mesma renda líquida disponível que teria na CLT.

---

### Módulo 7: Banco de Horas & Compensação
*Base Legal: Art. 59, §§ 2º, 3º e 5º da CLT e Súmula 172 do TST.*

- **Quando usar**: No fechamento semestral ou anual do banco de horas, ou na rescisão contratual com saldo remanescente.
- **Como preencher**:
  1. Informe o salário base e divisor.
  2. Digite o **Saldo de Horas** acumulado (ex: `16` ou `22.5`).
  3. Selecione a **Natureza do Saldo**:
     - *Crédito (Horas Extras a Pagar)*: Horas trabalhadas a mais pelo empregado. O sistema calcula a hora extra com adicional legal de 50% (ou CCT), soma o reflexo de DSR e gera o montante a ser pago em holerite.
     - *Débito (Horas Não Trabalhadas)*: Horas devidas pelo empregado que não foram compensadas no prazo pactuado. O sistema desconta o valor da hora simples.
  4. Indique o **Tipo de Acordo**: *Acordo Individual Escrito* (validade máxima de 6 meses) ou *Acordo / Convenção Coletiva* (validade de até 1 ano).

---

### Módulo 8: Participação nos Lucros e Resultados (PLR)
*Base Legal: Lei 10.101/2000, Lei 12.832/2013 e Tabela IRRF PLR da Receita Federal.*

- **Quando usar**: No pagamento semestral ou anual de bônus por metas, PLR ou PPR corporativo.
- **Como preencher**:
  1. Insira o **Valor Bruto da PLR**.
  2. Se houver antecipação (1ª parcela paga anteriormente no mesmo ano-calendário), insira o valor pago e o IRRF já retido.
- **Destaque de Economia**:
  - O sistema aplica a **Tabela Progressiva Exclusiva de IRRF da PLR** (isenta até R$ 7.640,80).
  - O RHUB demonstra claramente que **NÃO incide INSS empregado, NÃO incide INSS patronal (20%) e NÃO incide FGTS (8%)**, exibindo o valor exato da economia tributária gerada para a empresa em comparação com o pagamento de um bônus salarial comum.

---

### Módulo 9: Teletrabalho & Ajuda de Custo
*Base Legal: Art. 75-A a 75-E da CLT e Lei 14.442/2022.*

- **Quando usar**: Para formalizar a política de Home Office / Trabalho Híbrido e definir um reembolso mensal justo e juridicamente seguro.
- **Como preencher**:
  1. Preencha o valor da **Fatura Mensal de Internet Residencial** e o **Percentual Alocado ao Trabalho** (padrão sugerido: 50%).
  2. Indique a quantidade de **Dias em Home Office no Mês** e as **Horas Trabalhadas por Dia**.
  3. Preencha a **Tarifa de Energia Elétrica (R$/kWh)** da sua concessionária local e a potência média dos equipamentos (PC + telas).
  4. Adicione eventuais ajudas de custo para desgaste de equipamento próprio (BYOD) ou manutenção ergonômica.
  5. Insira o valor da tarifa diária de Vale-Transporte que a empresa gastaria se o colaborador fosse presencialmente.
- **Segurança Jurídica**: O sistema fundamenta que, conforme o Art. 75-D, Parágrafo Único da CLT, essa verba tem natureza estritamente indenizatória, **não compõe a remuneração, não sofre descontos de INSS/FGTS e é isenta de IRRF**.

---

### Módulo 10: Equiparação Salarial & Passivo Trabalhista
*Base Legal: Art. 461 da CLT, Súmula 6 do TST e Lei 14.611/2023.*

- **Quando usar**: Em auditorias de compliance trabalhista, acordos preventivos ou cálculos periciais de passivo judicial.
- **Como preencher**:
  1. Insira o **Salário Atual do Colaborador (Reclamante)** e o **Salário do Paradigma (Equiparando)**.
  2. Digite a quantidade de **Meses no Período Imprescrito** (respeitando a prescrição quinquenal de até 60 meses, conforme o Art. 7º, XXIX da CF/88).
  3. Marque os reflexos legais desejados: *13º Salário*, *Férias + 1/3*, *FGTS (8%)* e *Multa Rescisória de 40%*.
  4. Marque a opção **Penalidade Lei 14.611/2023 (Discriminação Salarial de Gênero/Raça)** se for o caso: o sistema adiciona a multa administrativa de 10 vezes o novo salário devido ao empregado discriminado.

---

## 4. Recursos Globais & Produtividade

### Exportação em Planilhas Excel (.xlsx)
Em qualquer um dos 10 módulos, clique no botão **Excel** (no canto superior do painel ou na barra superior).
- O arquivo `.xlsx` é gerado instantaneamente no seu navegador via SheetJS.
- A planilha já vem com formatação monetária padrão BRL, dados da sua empresa/colaborador, parâmetros de entrada e a memória de cálculo completa.

### Impressão Executiva & Geração de PDF
Clique no botão **Imprimir** em qualquer módulo.
- A folha de estilo `@media print` remove automaticamente menus, barras de rolagem, orbes e botões.
- É gerado um documento executivo em folha A4 contendo o cabeçalho timbrado com os dados corporativos da empresa, o extrato detalhado do cálculo e um campo oficial de visto/assinatura para arquivamento no dossiê do colaborador.
- Para salvar em PDF, basta selecionar **"Salvar como PDF"** na caixa de diálogo de impressão do seu navegador.

### Compartilhamento por Link (Deep Linking)
Precisa enviar uma simulação para um gestor, cliente ou colega?
- Clique no botão **Link** no módulo correspondente.
- O RHUB gera e copia para a sua área de transferência um link especial contendo os parâmetros codificados no hash da URL (ex: `...#clt-pj?salario=5000&regime=simples`).
- Quando a outra pessoa abrir esse link, a aplicação abrirá diretamente no módulo certo com todos os campos preenchidos e calculados!

### Histórico Local & Backup / Restauração JSON
- Clique no botão de **Histórico** na barra superior (ícone de relógio).
- Um drawer lateral exibirá as últimas 15 simulações salvas no seu navegador.
- Clique em qualquer simulação para restaurar instantaneamente todos os valores na tela.
- **Backup & Restauração**:
  - Clique em **Exportar Backup JSON** para salvar todas as suas simulações e dados da empresa em um arquivo local.
  - Para migrar de computador ou restaurar seus dados, clique em **Restaurar Backup** e selecione o arquivo `.json`.

### Instalação como Aplicativo (PWA Offline)
- **No Google Chrome / Microsoft Edge (PC/Mac)**: Clique no botão **Instalar App** que aparece na barra lateral do RHUB ou no ícone de instalação na barra de endereços do navegador.
- **No Android (Chrome)**: Toque nos três pontinhos no canto superior direito e selecione **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.
- **No iPhone / iPad (Safari)**: Toque no botão de compartilhamento e escolha **"Adicionar à Tela de Início"**.
- Uma vez instalado, o RHUB ganha um ícone próprio no seu sistema operacional, abre em janela independente (sem barras do navegador) e funciona perfeitamente sem conexão com a internet.

### Guia & Glossário da CLT
- Clique no botão **Glossário CLT** na barra superior.
- Pesquise instantaneamente por artigos (ex: *Art. 477*, *Art. 130*, *Art. 59*), súmulas do TST ou palavras-chave (ex: *insalubridade*, *aviso prévio*, *hora noturna*).
- O modal exibe um resumo simplificado da regra e o seu impacto prático na rotina do DP.

### Central de Desafios & Sugestões
- Clique no ícone de **Lâmpada** na barra superior para acessar a Central de Desafios.
- Proponha regras sindicais complexas da sua categoria ou reporte dúvidas abrindo uma Issue oficial no repositório do GitHub diretamente do aplicativo, com modelo padronizado em Markdown.

---

## 5. Licença & Informações Legais

O **RHUB** é um software livre e de código aberto distribuído sob a licença **MIT**. Você é livre para utilizá-lo comercialmente, em consultorias, escritórios contábeis, departamentos jurídicos ou adaptá-lo às necessidades da sua organização.

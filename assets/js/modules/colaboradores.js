/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Lógica de Domínio & Gestão de Colaboradores (RHMS)
 * Validações Legais, Prazos Contratuais e Conversores de Integração
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Validação rigorosa de CPF via algoritmo dos dois dígitos verificadores.
 * @param {string} cpfStr 
 * @returns {boolean}
 */
export function validarCPF(cpfStr) {
    if (!cpfStr) return false;
    const clean = String(cpfStr).replace(/\D/g, '');
    if (clean.length !== 11) return false;

    // Bloqueia repetições conhecidas (111.111.111-11, etc.)
    if (/^(\d)\1{10}$/.test(clean)) return false;

    // Validação do 1º dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(clean.charAt(i), 10) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(clean.charAt(9), 10)) return false;

    // Validação do 2º dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(clean.charAt(i), 10) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(clean.charAt(10), 10)) return false;

    return true;
}

/**
 * Aplica máscara visual de CPF (000.000.000-00).
 * @param {string} val 
 * @returns {string}
 */
export function mascararCPF(val) {
    if (!val) return '';
    const clean = String(val).replace(/\D/g, '').slice(0, 11);
    return clean
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Aplica máscara visual de PIS/PASEP (000.00000.00-0).
 * @param {string} val 
 * @returns {string}
 */
export function mascararPIS(val) {
    if (!val) return '';
    const clean = String(val).replace(/\D/g, '').slice(0, 11);
    return clean
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{5})(\d)/, '$1.$2')
        .replace(/(\d{2})(\d{1})$/, '$1-$2');
}

/**
 * Calcula o tempo de serviço exato (anos, meses e dias) a partir da data de admissão.
 * @param {string} dataAdmissaoStr 'YYYY-MM-DD'
 * @param {string} [dataBaseStr] 'YYYY-MM-DD' (padrão hoje)
 * @returns {object} { anos, meses, dias, textoFormatado }
 */
export function calcularTempoDeCasa(dataAdmissaoStr, dataBaseStr) {
    if (!dataAdmissaoStr) {
        return { anos: 0, meses: 0, dias: 0, textoFormatado: 'Data não informada' };
    }

    const admissao = new Date(dataAdmissaoStr + 'T00:00:00');
    const base = dataBaseStr ? new Date(dataBaseStr + 'T00:00:00') : new Date();

    if (isNaN(admissao.getTime()) || isNaN(base.getTime()) || base < admissao) {
        return { anos: 0, meses: 0, dias: 0, textoFormatado: 'Recém admitido' };
    }

    let anos = base.getFullYear() - admissao.getFullYear();
    let meses = base.getMonth() - admissao.getMonth();
    let dias = base.getDate() - admissao.getDate();

    if (dias < 0) {
        meses--;
        // Pega dias do mês anterior
        const ultimoDiaMesAnterior = new Date(base.getFullYear(), base.getMonth(), 0).getDate();
        dias += ultimoDiaMesAnterior;
    }

    if (meses < 0) {
        anos--;
        meses += 12;
    }

    const partes = [];
    if (anos > 0) partes.push(`${anos} ${anos === 1 ? 'ano' : 'anos'}`);
    if (meses > 0) partes.push(`${meses} ${meses === 1 ? 'mês' : 'meses'}`);
    if (dias > 0 || partes.length === 0) partes.push(`${dias} ${dias === 1 ? 'dia' : 'dias'}`);

    return {
        anos,
        meses,
        dias,
        textoFormatado: partes.join(', ')
    };
}

/**
 * Analisa a situação do Contrato de Experiência (CLT Art. 445 e 451: máx 90 dias).
 * Tipicamente: 45 dias + 45 dias, ou 30 dias + 60 dias.
 * 
 * @param {string} dataAdmissaoStr 'YYYY-MM-DD'
 * @param {string} [tipoContrato='CLT Indeterminado']
 * @returns {object} { emExperiencia, diasDecorridos, diasPara45, diasPara90, statusExperiencia }
 */
export function verificarContratoExperiencia(dataAdmissaoStr, tipoContrato = 'CLT Indeterminado') {
    if (!dataAdmissaoStr || !tipoContrato.toLowerCase().includes('experiência')) {
        return {
            emExperiencia: false,
            diasDecorridos: 0,
            statusExperiencia: 'Contrato por tempo indeterminado'
        };
    }

    const admissao = new Date(dataAdmissaoStr + 'T00:00:00');
    const hoje = new Date();
    const diffTime = hoje.getTime() - admissao.getTime();
    const diasDecorridos = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    const diasPara45 = 45 - diasDecorridos;
    const diasPara90 = 90 - diasDecorridos;

    let statusExperiencia = '';
    let emExperiencia = true;

    if (diasDecorridos <= 45) {
        statusExperiencia = `1º Período: restam ${diasPara45} dias para os primeiros 45 dias.`;
    } else if (diasDecorridos <= 90) {
        statusExperiencia = `2º Período: restam ${diasPara90} dias para o término do prazo fatal de 90 dias.`;
    } else {
        emExperiencia = false;
        statusExperiencia = 'Prazo de experiência expirado (convertido em prazo indeterminado pelo Art. 451 CLT).';
    }

    return {
        emExperiencia,
        diasDecorridos,
        diasPara45,
        diasPara90,
        statusExperiencia
    };
}

/**
 * Converte um colaborador do cadastro no formato esperado pelo Módulo 11 (Folha em Lote).
 * @param {object} c 
 * @returns {object} Item para processamento em lote
 */
export function converterParaItemFolha(c) {
    const salarioBase = Number(c.salarioBase) || 0;
    
    // Apura adicional de insalubridade
    let insalubridadePerc = 0;
    if (c.adicionalInsalubridade && c.adicionalInsalubridade !== '0') {
        insalubridadePerc = Number(c.adicionalInsalubridade) || 0;
    }

    return {
        id: c.id,
        matricula: c.matricula || '',
        nome: c.nome || 'Colaborador',
        cargo: c.cargo || 'Função',
        departamento: c.departamento || 'Geral',
        salarioBase,
        horasExtras50: 0,
        horasExtras100: 0,
        adicionalNoturnoHoras: Number(c.adicionalNoturnoHabitual) || 0,
        insalubridadePerc,
        periculosidade: !!c.adicionalPericulosidade,
        dependentes: Number(c.dependentesIR) || 0,
        filhosSalarioFamilia: Number(c.filhosSalarioFamilia) || 0,
        optanteVT: !!c.optanteVT,
        custoDiarioVT: Number(c.custoDiarioVT) || 0,
        outrosDescontos: 0
    };
}

/**
 * Monta o payload de dados completo para geração do Holerite Oficial em PDF.
 * @param {object} c Colaborador do cadastro
 * @param {object} empresa Dados da empresa do storage
 * @param {string} [mesReferencia='Mês Vigente']
 * @returns {object} Objeto pronto para construirHtmlHolerite()
 */
export function converterParaItemHolerite(c, empresa = {}, mesReferencia = '') {
    const salario = Number(c.salarioBase) || 0;
    const dependentes = Number(c.dependentesIR) || 0;

    // Vencimentos iniciais
    const proventos = [
        { codigo: '1000', descricao: 'Salário Base Mensal', referencia: '30 dias', valor: salario }
    ];

    // Adicional de Periculosidade (30%)
    if (c.adicionalPericulosidade) {
        proventos.push({
            codigo: '1091',
            descricao: 'Adicional de Periculosidade (30%)',
            referencia: '30%',
            valor: Math.round(salario * 0.30 * 100) / 100
        });
    }

    // Adicional de Insalubridade (10%, 20% ou 40% sobre Salário Mínimo R$ 1.412)
    if (c.adicionalInsalubridade && c.adicionalInsalubridade !== '0') {
        const perc = Number(c.adicionalInsalubridade);
        const valorIns = Math.round(1412.00 * (perc / 100) * 100) / 100;
        proventos.push({
            codigo: '1090',
            descricao: `Adicional de Insalubridade (${perc}%)`,
            referencia: `${perc}%`,
            valor: valorIns
        });
    }

    return {
        colaborador: {
            nome: c.nome || 'Colaborador',
            cargo: c.cargo || 'Função',
            cbo: c.cbo || '4110-10',
            matricula: c.matricula || '001',
            admissao: c.admissao ? c.admissao.split('-').reverse().join('/') : '01/01/2024',
            salarioBase: salario,
            dependentes
        },
        empresa: {
            razaoSocial: empresa.razaoSocial || 'EMPRESA DEMONSTRAÇÃO LTDA',
            cnpj: empresa.cnpj || '12.345.678/0001-90'
        },
        referencia: mesReferencia || 'Setembro / 2026',
        proventos,
        descontos: [],
        bases: {
            salarioBase: salario,
            baseINSS: salario,
            baseFGTS: salario,
            fgtsMes: salario * 0.08,
            baseIRRF: salario
        }
    };
}

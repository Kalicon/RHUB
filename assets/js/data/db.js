/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Banco de Dados Local do RHMS (IndexedDB)
 * Persistência 100% Client-Side, Seguro e Conforme à LGPD
 * ═══════════════════════════════════════════════════════════════════════
 */

const DB_NAME = 'rhub_hrms_db';
const DB_VERSION = 2;

let dbInstance = null;

/**
 * Inicializa a conexão com o IndexedDB e cria os ObjectStores e índices.
 * @returns {Promise<IDBDatabase>}
 */
export function abrirBanco() {
    if (dbInstance) return Promise.resolve(dbInstance);

    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            return reject(new Error('IndexedDB não é suportado neste ambiente.'));
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // 1. Store de Colaboradores
            if (!db.objectStoreNames.contains('colaboradores')) {
                const storeColaboradores = db.createObjectStore('colaboradores', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                storeColaboradores.createIndex('matricula', 'matricula', { unique: false });
                storeColaboradores.createIndex('cpf', 'cpf', { unique: false });
                storeColaboradores.createIndex('departamento', 'departamento', { unique: false });
                storeColaboradores.createIndex('status', 'status', { unique: false });
            }

            // 2. Store de Departamentos
            if (!db.objectStoreNames.contains('departamentos')) {
                db.createObjectStore('departamentos', { keyPath: 'id', autoIncrement: true });
            }

            // 3. Store de Histórico de Férias e Afastamentos
            if (!db.objectStoreNames.contains('afastamentos')) {
                const storeAfast = db.createObjectStore('afastamentos', { keyPath: 'id', autoIncrement: true });
                storeAfast.createIndex('colaboradorId', 'colaboradorId', { unique: false });
            }

            // 4. Store de Agendamento e Histórico de Férias (Fase 02)
            if (!db.objectStoreNames.contains('ferias')) {
                const storeFerias = db.createObjectStore('ferias', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                storeFerias.createIndex('colaboradorId', 'colaboradorId', { unique: false });
                storeFerias.createIndex('status', 'status', { unique: false });
                storeFerias.createIndex('periodoAquisitivoInicio', 'periodoAquisitivoInicio', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

/**
 * Salva ou atualiza um colaborador no IndexedDB.
 * @param {object} colaborador 
 * @returns {Promise<number>} ID do colaborador salvo
 */
export async function salvarColaborador(colaborador) {
    const db = await abrirBanco();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('colaboradores', 'readwrite');
        const store = tx.objectStore('colaboradores');

        const dados = {
            ...colaborador,
            atualizadoEm: new Date().toISOString()
        };

        if (!dados.criadoEm) {
            dados.criadoEm = new Date().toISOString();
        }

        // Se tiver ID, atualiza (put). Se não tiver, adiciona (add)
        const request = dados.id ? store.put(dados) : store.add(dados);

        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Obtém um colaborador pelo ID numérico.
 * @param {number} id 
 * @returns {Promise<object|null>}
 */
export async function obterColaborador(id) {
    const db = await abrirBanco();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('colaboradores', 'readonly');
        const store = tx.objectStore('colaboradores');
        const request = store.get(Number(id));

        request.onsuccess = (e) => resolve(e.target.result || null);
        request.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Lista colaboradores com filtros opcionais.
 * @param {object} [filtros={}] 
 * @returns {Promise<Array<object>>}
 */
export async function listarColaboradores(filtros = {}) {
    const db = await abrirBanco();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('colaboradores', 'readonly');
        const store = tx.objectStore('colaboradores');
        const request = store.getAll();

        request.onsuccess = (e) => {
            let lista = e.target.result || [];

            // Filtrar por termo de busca (Nome, CPF, Matrícula, Cargo)
            if (filtros.busca) {
                const termo = filtros.busca.toLowerCase().trim();
                lista = lista.filter(c => 
                    (c.nome && c.nome.toLowerCase().includes(termo)) ||
                    (c.cpf && c.cpf.includes(termo)) ||
                    (c.matricula && c.matricula.toLowerCase().includes(termo)) ||
                    (c.cargo && c.cargo.toLowerCase().includes(termo))
                );
            }

            // Filtrar por Departamento
            if (filtros.departamento && filtros.departamento !== 'todos') {
                lista = lista.filter(c => c.departamento === filtros.departamento);
            }

            // Filtrar por Status
            if (filtros.status && filtros.status !== 'todos') {
                lista = lista.filter(c => c.status === filtros.status);
            }

            // Ordenar por nome por padrão
            lista.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

            resolve(lista);
        };

        request.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Remove um colaborador pelo ID.
 * @param {number} id 
 * @returns {Promise<boolean>}
 */
export async function removerColaborador(id) {
    const db = await abrirBanco();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('colaboradores', 'readwrite');
        const store = tx.objectStore('colaboradores');
        const request = store.delete(Number(id));

        request.onsuccess = () => resolve(true);
        request.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Retorna métricas resumidas do quadro de colaboradores.
 * @returns {Promise<object>}
 */
export async function obterMetricasQuadro() {
    const colaboradores = await listarColaboradores();
    const total = colaboradores.length;
    const ativos = colaboradores.filter(c => c.status === 'Ativo').length;
    const emFerias = colaboradores.filter(c => c.status === 'Em Férias').length;
    const afastados = colaboradores.filter(c => c.status === 'Afastado').length;
    const desligados = colaboradores.filter(c => c.status === 'Desligado').length;

    const massaSalarial = colaboradores
        .filter(c => c.status !== 'Desligado')
        .reduce((acc, c) => acc + (Number(c.salarioBase) || 0), 0);

    const salarioMedio = (ativos + emFerias + afastados) > 0 
        ? massaSalarial / (ativos + emFerias + afastados) 
        : 0;

    return {
        total,
        ativos,
        emFerias,
        afastados,
        desligados,
        massaSalarial,
        salarioMedio
    };
}

/**
 * Dados de demonstração realistas para inicialização imediata (Seed)
 */
export const COLABORADORES_SEMENTE = [
    {
        matricula: 'RH-001',
        nome: 'Alice Ayako Hori',
        cpf: '123.456.789-01',
        rg: '28.910.223-4 SSP/SP',
        pis: '123.08069.63-7',
        ctps: '45890 / 0012 SP',
        tituloEleitor: '123456780192',
        dataNascimento: '1988-04-15',
        sexo: 'Feminino',
        estadoCivil: 'Casada',
        email: 'alice.hori@empresa.com.br',
        telefone: '(11) 98765-4321',
        endereco: 'Av. Paulista, 1578 - Bela Vista - São Paulo / SP',
        admissao: '2021-03-01',
        status: 'Ativo',
        tipoContrato: 'CLT Indeterminado',
        departamento: 'Recursos Humanos',
        cargo: 'Analista de Recursos Humanos Sênior',
        cbo: '2524-05',
        salarioBase: 6500.00,
        tipoSalario: 'Mensalista',
        divisorHoras: 220,
        dependentesIR: 1,
        filhosSalarioFamilia: 1,
        optanteVT: true,
        custoDiarioVT: 9.60,
        adicionalInsalubridade: '0',
        adicionalPericulosidade: false,
        adicionalNoturnoHabitual: 0,
        escala: '5x2',
        horarioEntrada: '08:00',
        horarioSaida: '17:48',
        intervalo: '01:00',
        avatarBg: '#3b82f6',
        iniciais: 'AH'
    },
    {
        matricula: 'RH-002',
        nome: 'Carlos Eduardo Silva',
        cpf: '234.567.890-12',
        rg: '33.456.789-1 SSP/SP',
        pis: '124.55567.89-0',
        ctps: '56789 / 0034 SP',
        tituloEleitor: '987654320188',
        dataNascimento: '1992-08-20',
        sexo: 'Masculino',
        estadoCivil: 'Solteiro',
        email: 'carlos.silva@empresa.com.br',
        telefone: '(11) 97654-3210',
        endereco: 'Rua das Flores, 450 - Santana - São Paulo / SP',
        admissao: '2023-01-16',
        status: 'Ativo',
        tipoContrato: 'CLT Indeterminado',
        departamento: 'Tecnologia da Informação',
        cargo: 'Engenheiro de Software Pleno',
        cbo: '2124-05',
        salarioBase: 8200.00,
        tipoSalario: 'Mensalista',
        divisorHoras: 200,
        dependentesIR: 0,
        filhosSalarioFamilia: 0,
        optanteVT: false,
        custoDiarioVT: 0,
        adicionalInsalubridade: '0',
        adicionalPericulosidade: false,
        adicionalNoturnoHabitual: 0,
        escala: '5x2',
        horarioEntrada: '09:00',
        horarioSaida: '18:00',
        intervalo: '01:00',
        avatarBg: '#8b5cf6',
        iniciais: 'CS'
    },
    {
        matricula: 'RH-003',
        nome: 'Mariana Souza Lima',
        cpf: '345.678.901-23',
        rg: '41.234.567-8 SSP/SP',
        pis: '125.77788.99-1',
        ctps: '67890 / 0056 SP',
        tituloEleitor: '876543210177',
        dataNascimento: '1995-11-05',
        sexo: 'Feminino',
        estadoCivil: 'Solteira',
        email: 'mariana.lima@empresa.com.br',
        telefone: '(11) 96543-2109',
        endereco: 'Rua Vergueiro, 1200 - Paraíso - São Paulo / SP',
        admissao: '2022-06-01',
        status: 'Em Férias',
        tipoContrato: 'CLT Indeterminado',
        departamento: 'Financeiro',
        cargo: 'Coordenadora Financeira & Controladoria',
        cbo: '2525-05',
        salarioBase: 9500.00,
        tipoSalario: 'Mensalista',
        divisorHoras: 220,
        dependentesIR: 0,
        filhosSalarioFamilia: 0,
        optanteVT: true,
        custoDiarioVT: 9.60,
        adicionalInsalubridade: '0',
        adicionalPericulosidade: false,
        adicionalNoturnoHabitual: 0,
        escala: '5x2',
        horarioEntrada: '08:30',
        horarioSaida: '18:18',
        intervalo: '01:00',
        avatarBg: '#10b981',
        iniciais: 'ML'
    },
    {
        matricula: 'RH-004',
        nome: 'Roberto Mendes de Castro',
        cpf: '456.789.012-34',
        rg: '19.876.543-2 SSP/SP',
        pis: '126.99900.11-2',
        ctps: '78901 / 0078 SP',
        tituloEleitor: '765432100166',
        dataNascimento: '1985-02-12',
        sexo: 'Masculino',
        estadoCivil: 'Casado',
        email: 'roberto.castro@empresa.com.br',
        telefone: '(11) 95432-1098',
        endereco: 'Rua do Comércio, 320 - Mooca - São Paulo / SP',
        admissao: '2019-10-10',
        status: 'Ativo',
        tipoContrato: 'CLT Indeterminado',
        departamento: 'Operações / Logística',
        cargo: 'Operador de Manutenção Industrial',
        cbo: '9111-05',
        salarioBase: 3800.00,
        tipoSalario: 'Mensalista',
        divisorHoras: 220,
        dependentesIR: 2,
        filhosSalarioFamilia: 2,
        optanteVT: true,
        custoDiarioVT: 9.60,
        adicionalInsalubridade: '20', // 20% sobre SM
        adicionalPericulosidade: true, // 30% periculosidade
        adicionalNoturnoHabitual: 20,
        escala: '6x1',
        horarioEntrada: '14:00',
        horarioSaida: '22:20',
        intervalo: '01:00',
        avatarBg: '#f59e0b',
        iniciais: 'RC'
    },
    {
        matricula: 'RH-005',
        nome: 'Patricia Albuquerque',
        cpf: '567.890.123-45',
        rg: '52.123.456-7 SSP/SP',
        pis: '127.11122.33-3',
        ctps: '89012 / 0090 SP',
        tituloEleitor: '654321090155',
        dataNascimento: '1998-07-30',
        sexo: 'Feminino',
        estadoCivil: 'Solteira',
        email: 'patricia.albuquerque@empresa.com.br',
        telefone: '(11) 94321-0987',
        endereco: 'Rua Augusta, 900 - Consolação - São Paulo / SP',
        admissao: '2024-02-01',
        status: 'Ativo',
        tipoContrato: 'Experiência (90 dias)',
        departamento: 'Comercial & Vendas',
        cargo: 'Assistente Comercial',
        cbo: '4110-10',
        salarioBase: 2900.00,
        tipoSalario: 'Mensalista',
        divisorHoras: 220,
        dependentesIR: 0,
        filhosSalarioFamilia: 0,
        optanteVT: true,
        custoDiarioVT: 9.60,
        adicionalInsalubridade: '0',
        adicionalPericulosidade: false,
        adicionalNoturnoHabitual: 0,
        escala: '5x2',
        horarioEntrada: '08:00',
        horarioSaida: '17:48',
        intervalo: '01:00',
        avatarBg: '#ec4899',
        iniciais: 'PA'
    }
];

/**
 * Carrega a semente de demonstração caso o banco esteja vazio.
 * @returns {Promise<boolean>} True se adicionou a semente
 */
export async function carregarSementeSeVazio() {
    const lista = await listarColaboradores();
    if (lista.length === 0) {
        for (const item of COLABORADORES_SEMENTE) {
            await salvarColaborador(item);
        }
        return true;
    }
    return false;
}

/**
 * Exporta todo o banco IndexedDB como JSON para backup.
 * @returns {Promise<string>} String JSON
 */
export async function exportarBancoJSON() {
    const colaboradores = await listarColaboradores();
    const dados = {
        versao: '3.0',
        geradoEm: new Date().toISOString(),
        colaboradores
    };
    return JSON.stringify(dados, null, 2);
}

/**
 * Restaura colaboradores a partir de um JSON de backup.
 * @param {string} jsonStr 
 * @returns {Promise<number>} Quantidade de colaboradores restaurados
 */
export async function restaurarBancoJSON(jsonStr) {
    const parsed = JSON.parse(jsonStr);
    const lista = parsed.colaboradores || parsed;
    if (!Array.isArray(lista)) {
        throw new Error('Formato inválido de backup: array de colaboradores não encontrado.');
    }

    let cont = 0;
    for (const c of lista) {
        delete c.id; // Gerar novos IDs auto-incrementais
        await salvarColaborador(c);
        cont++;
    }
    return cont;
}

// ═══════════════════════════════════════════════════════════════════════
//  CRUD DE FÉRIAS (Fase 02)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Salva ou atualiza um agendamento de férias no IndexedDB.
 * @param {object} ferias
 * @returns {Promise<number>} ID do registro salvo
 */
export async function salvarFerias(ferias) {
    const db = await abrirBanco();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('ferias', 'readwrite');
        const store = tx.objectStore('ferias');

        const dados = {
            ...ferias,
            atualizadoEm: new Date().toISOString()
        };
        if (!dados.criadoEm) dados.criadoEm = new Date().toISOString();

        const request = dados.id ? store.put(dados) : store.add(dados);
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Obtém um agendamento de férias pelo ID.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export async function obterFerias(id) {
    const db = await abrirBanco();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('ferias', 'readonly');
        const store = tx.objectStore('ferias');
        const request = store.get(Number(id));
        request.onsuccess = (e) => resolve(e.target.result || null);
        request.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Lista férias de um colaborador específico.
 * @param {number} colaboradorId
 * @returns {Promise<Array>}
 */
export async function listarFeriasPorColaborador(colaboradorId) {
    const db = await abrirBanco();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('ferias', 'readonly');
        const store = tx.objectStore('ferias');
        const idx = store.index('colaboradorId');
        const request = idx.getAll(Number(colaboradorId));
        request.onsuccess = (e) => resolve(e.target.result || []);
        request.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Lista todos os agendamentos de férias com filtros opcionais.
 * @param {object} [filtros={}]
 * @returns {Promise<Array>}
 */
export async function listarTodasFerias(filtros = {}) {
    const db = await abrirBanco();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('ferias', 'readonly');
        const store = tx.objectStore('ferias');
        const request = store.getAll();

        request.onsuccess = (e) => {
            let lista = e.target.result || [];

            if (filtros.status && filtros.status !== 'todos') {
                lista = lista.filter(f => f.status === filtros.status);
            }

            if (filtros.colaboradorId) {
                lista = lista.filter(f => f.colaboradorId === Number(filtros.colaboradorId));
            }

            // Ordenar por data de criação mais recente
            lista.sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));

            resolve(lista);
        };

        request.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Remove um agendamento de férias pelo ID.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function removerFerias(id) {
    const db = await abrirBanco();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('ferias', 'readwrite');
        const store = tx.objectStore('ferias');
        const request = store.delete(Number(id));
        request.onsuccess = () => resolve(true);
        request.onerror = (e) => reject(e.target.error);
    });
}

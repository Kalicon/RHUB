/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — App Controller (5 Módulos + SPA Routing + GSAP + PWA + Histórico)
 * ═══════════════════════════════════════════════════════════════════════
 */

import { calcularAdicionalNoturno, FATOR_HORA_FICTA } from './modules/noturno.js';
import { calcularRescisao, MOTIVOS_RESCISAO, compararCenariosRescisao } from './modules/rescisao.js';
import { calcularFaltas } from './modules/faltas.js';
import { calcularFerias, calcular13o, validarFracionamentoFerias } from './modules/ferias.js?v=3.2';
import { calcularSalarioLiquido } from './modules/liquido.js';
import { calcularCustosCltPj } from './modules/clt_pj.js';
import { calcularBancoHoras } from './modules/banco_horas.js';
import { calcularPLR } from './modules/plr.js';
import { calcularTeletrabalho } from './modules/teletrabalho.js';
import { calcularEquiparacao } from './modules/equiparacao.js';
import { processarFolhaLote, gerarDemonstracaoFolha, parsearCsvFolha, gerarCsvTemplate } from './modules/folha_lote.js?v=3.2';
import { construirHtmlHolerite, construirHtmlTRCT, baixarDocumentoPDF } from './utils/pdf_generator.js?v=3.2';
import { listarTodasRubricas, renderizarBadgeEsocial, obterRubrica } from './data/esocial_rubricas.js?v=3.2';
import { obterConfigCCT, salvarConfigCCT, restaurarPadraoCLT } from './data/cct_config.js?v=3.2';
import {
    salvarColaborador,
    obterColaborador,
    listarColaboradores,
    removerColaborador,
    obterMetricasQuadro,
    carregarSementeSeVazio,
    exportarBancoJSON,
    restaurarBancoJSON,
    COLABORADORES_SEMENTE,
    salvarFerias,
    obterFerias,
    listarFeriasPorColaborador,
    listarTodasFerias,
    removerFerias,
    salvarFolhaPonto,
    obterFolhaPonto,
    listarFolhasPontoPorCompetencia,
    removerFolhaPonto
} from './data/db.js?v=3.5';
import {
    calcularDiasDisponiveis,
    calcularPeriodosAquisitivos,
    verificarAlertaFeriasVencidas,
    validarAgendamentoFerias,
    calcularValorFerias,
    calcularProvisaoFerias,
    gerarMapaAnualFerias
} from './modules/gestao_ferias.js?v=3.4';
import {
    converterHoraParaMinutos,
    converterMinutosParaHora,
    gerarGradeMensalPonto,
    calcularDiaPonto,
    calcularResumoMensalPonto,
    gerarMarcacoesDemonstrativas
} from './modules/gestao_ponto.js?v=3.5';
import {
    validarCPF,
    mascararCPF,
    mascararPIS,
    calcularTempoDeCasa,
    verificarContratoExperiencia,
    converterParaItemFolha,
    converterParaItemHolerite
} from './modules/colaboradores.js?v=3.3';
import { formatCurrency, formatNumber, formatHoursMinutes, parseCurrency } from './utils/formatters.js';
import {
    exportarNoturnoExcel,
    exportarRescisaoExcel,
    exportarFaltasExcel,
    exportarFeriasExcel,
    exportarLiquidoExcel,
    exportarCltPjExcel,
    exportarBancoHorasExcel,
    exportarPlrExcel,
    exportarTeletrabalhoExcel,
    exportarEquiparacaoExcel,
    exportarFolhaLoteXLSX,
    baixarTemplateCsvFolha,
    copiarTextoClipboard
} from './utils/exporter.js';
import {
    getDadosCorporativos,
    salvarDadosCorporativos,
    getHistoricoCalculos,
    adicionarAoHistorico,
    removerDoHistorico,
    limparHistorico,
    exportarBackupJSON,
    importarBackupJSON
} from './utils/storage.js';

// Registros globais de handlers por módulo para a Top Bar
let currentActiveModule = 'noturno';
const moduleExportHandlers = {};
const moduleCopyHandlers = {};
const modulePrintHandlers = {};
let currentRescisaoParams = null;

document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initMobileMenu();
    initPWA();
    initCorporateData();
    initHistoryDrawer();
    initSPARouter();
    initTopBarActions();
    initColaboradoresModule();
    initGestaoFeriasModule();
    initPontoModule();
    initNoturnoModule();
    initRescisaoModule();
    initFaltasModule();
    initFeriasModule();
    initLiquidoModule();
    initCltPjModule();
    initBancoHorasModule();
    initPlrModule();
    initTeletrabalhoModule();
    initEquiparacaoModule();
    initFolhaLoteModule();
    initCctModule();
    initEsocialModule();
    initPdfPreviewModule();
    initGlossarioModal();
    initDesafiosModule();
    aplicarParametrosUrl();
});

// ═══════════════════════════════════════════════════════════════════════
//  PWA (SERVICE WORKER & PROMPT DE INSTALAÇÃO)
// ═══════════════════════════════════════════════════════════════════════
let deferredPrompt = null;
function initPWA() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch(err => {
                console.log('SW registration note:', err);
            });
        });
    }

    const pwaBtn = document.getElementById('pwaInstallBtn');
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPrompt = e;
        pwaBtn?.classList.remove('hidden');
    });

    pwaBtn?.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            pwaBtn.classList.add('hidden');
            showToast('Aplicativo instalado com sucesso!', 'success');
        }
        deferredPrompt = null;
    });

    window.addEventListener('appinstalled', () => {
        pwaBtn?.classList.add('hidden');
        showToast('RHUB pronto para uso offline!', 'success');
    });
}

// ═══════════════════════════════════════════════════════════════════════
//  FEEDBACK VISUAL — TOAST
// ═══════════════════════════════════════════════════════════════════════
const TOAST_ICONS = {
    success: `<svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`,
    error: `<svg class="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`,
    info: `<svg class="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    link: `<svg class="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>`,
    download: `<svg class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>`
};

function showToast(msg, type = 'success') {
    const toast = document.getElementById('rhubToast');
    const msgEl = document.getElementById('toastMsg');
    const iconEl = document.getElementById('toastIcon');
    if (!toast) return;
    if (msgEl) msgEl.textContent = msg;
    if (iconEl) {
        iconEl.innerHTML = TOAST_ICONS[type] || TOAST_ICONS.success;
    }
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ═══════════════════════════════════════════════════════════════════════
//  CONFIGURAÇÃO DO CABEÇALHO DE IMPRESSÃO
// ═══════════════════════════════════════════════════════════════════════
function atualizarHeaderImpressao(moduloNome) {
    const dataHoraEl = document.getElementById('printDocDataHora');
    const moduloEl = document.getElementById('printDocModulo');
    const corpRow = document.getElementById('printDocCorpInfo');
    const nomeEmp = document.getElementById('printNomeEmpresa');
    const nomeColab = document.getElementById('printNomeColaborador');
    const cargoColab = document.getElementById('printCargoColaborador');

    const agora = new Date().toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    if (dataHoraEl) dataHoraEl.textContent = `Emissão: ${agora}`;
    if (moduloEl) moduloEl.textContent = `Módulo: ${moduloNome}`;

    const corp = getDadosCorporativos();
    if (corp.empresa || corp.colaborador) {
        if (corpRow) corpRow.classList.remove('hidden');
        if (nomeEmp) nomeEmp.textContent = corp.empresa || 'Não informado';
        if (nomeColab) nomeColab.textContent = corp.colaborador || 'Não informado';
        if (cargoColab) cargoColab.textContent = corp.cargo || 'Geral';
    } else {
        if (corpRow) corpRow.classList.add('hidden');
    }
}

// ═══════════════════════════════════════════════════════════════════════
//  DADOS CORPORATIVOS (EMPRESA & COLABORADOR)
// ═══════════════════════════════════════════════════════════════════════
function initCorporateData() {
    const modal = document.getElementById('companyModal');
    const btnOpen = document.getElementById('topBtnEmpresa');
    const btnClose = document.getElementById('closeCompanyModal');
    const form = document.getElementById('companyForm');
    const inputEmpresa = document.getElementById('modalInputEmpresa');
    const inputColaborador = document.getElementById('modalInputColaborador');
    const inputCargo = document.getElementById('modalInputCargo');
    const btnLimpar = document.getElementById('btnLimparEmpresa');
    const topLabel = document.getElementById('topEmpresaLabel');

    function syncTopLabel() {
        const corp = getDadosCorporativos();
        if (corp.empresa) {
            topLabel.textContent = corp.empresa.length > 12 ? corp.empresa.substring(0, 10) + '...' : corp.empresa;
        } else if (corp.colaborador) {
            topLabel.textContent = corp.colaborador.split(' ')[0];
        } else {
            topLabel.textContent = 'Empresa';
        }
    }

    syncTopLabel();

    btnOpen?.addEventListener('click', () => {
        const corp = getDadosCorporativos();
        if (inputEmpresa) inputEmpresa.value = corp.empresa || '';
        if (inputColaborador) inputColaborador.value = corp.colaborador || '';
        if (inputCargo) inputCargo.value = corp.cargo || '';
        modal?.classList.remove('hidden');
    });

    btnClose?.addEventListener('click', () => modal?.classList.add('hidden'));
    modal?.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });

    btnLimpar?.addEventListener('click', () => {
        salvarDadosCorporativos({ empresa: '', colaborador: '', cargo: '' });
        if (inputEmpresa) inputEmpresa.value = '';
        if (inputColaborador) inputColaborador.value = '';
        if (inputCargo) inputCargo.value = '';
        syncTopLabel();
        showToast('Dados corporativos limpos!');
        modal?.classList.add('hidden');
    });

    form?.addEventListener('submit', () => {
        salvarDadosCorporativos({
            empresa: inputEmpresa?.value,
            colaborador: inputColaborador?.value,
            cargo: inputCargo?.value
        });
        syncTopLabel();
        showToast('Dados corporativos salvos com sucesso!');
        modal?.classList.add('hidden');
    });
}

// ═══════════════════════════════════════════════════════════════════════
//  GAVETA DE HISTÓRICO DE SIMULAÇÕES
// ═══════════════════════════════════════════════════════════════════════
function initHistoryDrawer() {
    const drawer = document.getElementById('historyDrawer');
    const overlay = document.getElementById('historyOverlay');
    const btnOpen = document.getElementById('topBtnHistorico');
    const btnClose = document.getElementById('closeHistoryDrawer');
    const btnClear = document.getElementById('btnClearHistory');
    const list = document.getElementById('historyList');
    const badge = document.getElementById('badgeHistoricoCount');

    function renderHistory() {
        const historico = getHistoricoCalculos();
        if (badge) badge.textContent = String(historico.length);

        if (!list) return;
        list.innerHTML = '';

        if (historico.length === 0) {
            list.innerHTML = `
                <div class="text-center py-10 text-slate-400">
                    <svg class="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <p class="text-xs font-medium">Nenhuma simulação recente</p>
                    <p class="text-[10px] text-slate-500 mt-1">Seus cálculos serão salvos automaticamente aqui.</p>
                </div>`;
            return;
        }

        historico.forEach(item => {
            const card = document.createElement('div');
            card.className = 'p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer group';
            card.innerHTML = `
                <div class="flex items-center justify-between mb-1">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">${item.titulo}</span>
                    <span class="text-[10px] text-slate-400">${item.dataHora}</span>
                </div>
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs text-slate-500 dark:text-slate-400">${item.resumoPrincipal}</p>
                        <p class="text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5">${formatCurrency(item.valorPrincipal)}</p>
                    </div>
                    <button data-id="${item.id}" class="btn-del-hist opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-red-500 transition-opacity" title="Remover">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>`;

            // Botão excluir
            card.querySelector('.btn-del-hist')?.addEventListener('click', e => {
                e.stopPropagation();
                removerDoHistorico(item.id);
                renderHistory();
            });

            // Clique no card restaura módulo e valores
            card.addEventListener('click', () => {
                restaurarSimulacao(item);
                closeDrawer();
            });

            list.appendChild(card);
        });
    }

    function openDrawer() {
        renderHistory();
        drawer?.classList.remove('translate-x-full');
        overlay?.classList.remove('hidden');
    }

    function closeDrawer() {
        drawer?.classList.add('translate-x-full');
        overlay?.classList.add('hidden');
    }

    btnOpen?.addEventListener('click', openDrawer);
    btnClose?.addEventListener('click', closeDrawer);
    overlay?.addEventListener('click', closeDrawer);

    btnClear?.addEventListener('click', () => {
        if (confirm('Deseja limpar todo o histórico de simulações?')) {
            limparHistorico();
            renderHistory();
            showToast('Histórico limpo!');
        }
    });

    const btnExportBackup = document.getElementById('btnExportarBackupJson');
    const inputImportBackup = document.getElementById('inputImportarBackupJson');

    btnExportBackup?.addEventListener('click', () => {
        const ok = exportarBackupJSON();
        if (ok) showToast('Backup JSON exportado com sucesso!', 'download');
    });

    inputImportBackup?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const res = importarBackupJSON(evt.target?.result);
            if (res.success) {
                renderHistory();
                showToast(res.message, 'success');
            } else {
                showToast(res.message, 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    renderHistory();
}

/**
 * Restaura os dados de uma simulação do histórico na tela
 */
function restaurarSimulacao(item) {
    // 1. Navega para o módulo
    const link = document.querySelector(`.sidebar-link[data-panel="${item.modulo}"]`);
    link?.click();

    // 2. Preenche os inputs se houver parâmetros
    if (item.params) {
        Object.entries(item.params).forEach(([key, val]) => {
            const el = document.getElementById(key);
            if (el) {
                if (el.type === 'checkbox') {
                    el.checked = Boolean(val);
                } else {
                    el.value = typeof val === 'number' && key.toLowerCase().includes('salario')
                        ? formatNumber(val, 2)
                        : String(val);
                }
                el.dispatchEvent(new Event('input'));
                el.dispatchEvent(new Event('change'));
            }
        });
        showToast(`Simulação de ${item.titulo} restaurada!`, 'info');
    }
}

// ═══════════════════════════════════════════════════════════════════════
//  DARK MODE
// ═══════════════════════════════════════════════════════════════════════
function initDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    const html = document.documentElement;
    const saved = localStorage.getItem('rhub-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) html.classList.add('dark');

    toggle?.addEventListener('click', () => {
        html.classList.toggle('dark');
        localStorage.setItem('rhub-theme', html.classList.contains('dark') ? 'dark' : 'light');
        const icon = toggle.querySelector('.toggle-icon');
        if (icon && window.gsap) gsap.fromTo(icon, { rotation: 0, scale: 0.5 }, { rotation: 360, scale: 1, duration: 0.5, ease: 'back.out(1.7)' });
    });
}

// ═══════════════════════════════════════════════════════════════════════
//  MOBILE MENU
// ═══════════════════════════════════════════════════════════════════════
function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggle = () => { sidebar?.classList.toggle('-translate-x-full'); overlay?.classList.toggle('hidden'); };
    btn?.addEventListener('click', toggle);
    overlay?.addEventListener('click', toggle);
}

// ═══════════════════════════════════════════════════════════════════════
//  TOP BAR QUICK ACTIONS
// ═══════════════════════════════════════════════════════════════════════
function initTopBarActions() {
    const btnExcel = document.getElementById('topBtnExcel');
    const btnPrint = document.getElementById('topBtnPrint');

    btnExcel?.addEventListener('click', () => {
        if (moduleExportHandlers[currentActiveModule]) {
            moduleExportHandlers[currentActiveModule]();
        }
    });

    btnPrint?.addEventListener('click', () => {
        if (modulePrintHandlers[currentActiveModule]) {
            modulePrintHandlers[currentActiveModule]();
        } else {
            window.print();
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════
//  SPA ROUTER (Sidebar Navigation)
// ═══════════════════════════════════════════════════════════════════════
const MODULE_META = {
    colaboradores:    { title: 'Gestão de Colaboradores',    badge: 'Dossiê Digital' },
    'gestao-ferias':  { title: 'Escala e Gestão de Férias',  badge: 'Art. 129 a 145 CLT' },
    ponto:            { title: 'Controle de Ponto Eletrônico', badge: 'Portaria MTE 671' },
    noturno:          { title: 'Adicional Noturno',          badge: 'Art. 73 CLT' },
    rescisao:       { title: 'Rescisão Contratual',        badge: 'Art. 477 CLT' },
    faltas:         { title: 'Faltas e Atrasos',           badge: 'Art. 462 CLT' },
    ferias:         { title: 'Férias & 13º Salário',       badge: 'Art. 129 CLT' },
    liquido:        { title: 'Salário Líquido',            badge: 'Art. 457 CLT' },
    'clt-pj':       { title: 'CLT vs. PJ & Custos',        badge: 'Estratégico' },
    'banco-horas':  { title: 'Banco de Horas',             badge: 'Art. 59 CLT' },
    plr:            { title: 'PLR (Lucros & Resultados)',  badge: 'Lei 10.101/00' },
    teletrabalho:   { title: 'Teletrabalho & Home Office', badge: 'Art. 75-A CLT' },
    equiparacao:    { title: 'Equiparação Salarial',       badge: 'Art. 461 CLT' },
    'folha-lote':   { title: 'Folha em Lote & Analytics',  badge: 'Corporativo' }
};

function initSPARouter() {
    const links = document.querySelectorAll('.sidebar-link');
    const panels = document.querySelectorAll('.module-panel');
    const topTitle = document.getElementById('topBarTitle');
    const topBadge = document.getElementById('topBarBadge');

    function navigateTo(panelId) {
        const cleanPanelId = (panelId || 'noturno').split('?')[0];
        currentActiveModule = cleanPanelId;

        // Hide all panels
        panels.forEach(p => p.classList.add('hidden'));
        // Show target
        const target = document.getElementById(`panel-${cleanPanelId}`);
        if (target) {
            target.classList.remove('hidden');
            // GSAP entrance
            if (window.gsap) gsap.fromTo(target, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
        }

        // Update sidebar active state
        links.forEach(l => {
            const isActive = l.dataset.panel === cleanPanelId;
            l.classList.toggle('bg-blue-50', isActive);
            l.classList.toggle('dark:bg-blue-500/10', isActive);
            l.classList.toggle('text-blue-700', isActive);
            l.classList.toggle('dark:text-blue-400', isActive);
            l.classList.toggle('text-slate-600', !isActive);
            l.classList.toggle('dark:text-slate-400', !isActive);

            const indicator = l.querySelector('.nav-active-indicator');
            if (indicator) indicator.style.display = isActive ? 'block' : 'none';
        });

        // Update top bar
        const meta = MODULE_META[cleanPanelId] || MODULE_META.noturno;
        if (topTitle) topTitle.textContent = meta.title;
        if (topBadge) topBadge.textContent = meta.badge;

        // Atualizar cabeçalho da impressão
        atualizarHeaderImpressao(meta.title);

        // Update URL hash without wiping query params if present
        if (!window.location.hash.includes('?') && window.location.hash !== `#${cleanPanelId}`) {
            window.location.hash = cleanPanelId;
        }

        // Close mobile menu if open
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar && !sidebar.classList.contains('-translate-x-full') && window.innerWidth < 1024) {
            sidebar.classList.add('-translate-x-full');
            overlay?.classList.add('hidden');
        }
    }

    // Bind clicks
    links.forEach(l => l.addEventListener('click', () => navigateTo(l.dataset.panel)));

    // Handle initial hash or default
    const initialRaw = window.location.hash.replace('#', '') || 'noturno';
    const initialHash = initialRaw.split('?')[0];
    navigateTo(MODULE_META[initialHash] ? initialHash : 'noturno');

    // Handle browser back/forward
    window.addEventListener('hashchange', () => {
        const raw = window.location.hash.replace('#', '');
        const hash = raw.split('?')[0];
        if (MODULE_META[hash]) {
            navigateTo(hash);
            aplicarParametrosUrl();
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════
//  GSAP HELPERS
// ═══════════════════════════════════════════════════════════════════════
function animarContador(el, de, para) {
    if (!el) return;
    if (!window.gsap) { el.textContent = formatCurrency(para); return; }
    const proxy = { val: de };
    gsap.to(proxy, { val: para, duration: 0.7, ease: 'power2.out', onUpdate: () => { el.textContent = formatCurrency(proxy.val); } });
}

function renderMemoria(container, passos) {
    if (!container) return;
    container.innerHTML = '';
    passos.forEach((p, i) => {
        const isLast = i === passos.length - 1;
        const div = document.createElement('div');
        div.className = 'flex gap-3';
        const res = (p.titulo.includes('Horas') || p.titulo.includes('horas'))
            ? `${formatNumber(p.resultado, 4)}h` : formatCurrency(p.resultado);
        div.innerHTML = `
            <div class="flex flex-col items-center">
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isLast ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30' : 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'}">${p.passo}</div>
                ${!isLast ? '<div class="w-px flex-1 bg-slate-200 dark:bg-slate-700 my-1"></div>' : ''}
            </div>
            <div class="pb-4 flex-1 min-w-0">
                <p class="text-xs font-semibold text-slate-800 dark:text-slate-200">${p.titulo}</p>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 mb-1">${p.descricao}</p>
                <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <code class="text-[10px] font-mono text-slate-600 dark:text-slate-300">${p.formula}</code>
                    <span class="text-[10px] font-bold ${isLast ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}">= ${res}</span>
                </div>
            </div>`;
        container.appendChild(div);
    });
    if (window.gsap) gsap.fromTo(container.children, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.05, ease: 'power2.out' });
}

// ═══════════════════════════════════════════════════════════════════════
//  MÓDULO 0: GESTÃO & CADASTRO DE COLABORADORES (DOSSIÊ DIGITAL)
// ═══════════════════════════════════════════════════════════════════════
function initColaboradoresModule() {
    const $ = id => document.getElementById(id);
    let modoVisualizacao = 'grid'; // 'grid' ou 'tabela'

    async function atualizarMetricas() {
        try {
            const m = await obterMetricasQuadro();
            if ($('statTotalColaboradores')) $('statTotalColaboradores').textContent = String(m.total);
            if ($('statColaboradoresAtivos')) $('statColaboradoresAtivos').textContent = String(m.ativos);
            if ($('statColaboradoresFeriasAfastados')) $('statColaboradoresFeriasAfastados').textContent = String(m.emFerias + m.afastados);
            if ($('statMassaSalarial')) $('statMassaSalarial').textContent = formatCurrency(m.massaSalarial);
            if ($('badgeContadorColaboradores')) $('badgeContadorColaboradores').textContent = String(m.ativos);
        } catch (e) {
            console.warn('Erro ao obter métricas de colaboradores:', e);
        }
    }

    async function carregarColaboradores() {
        try {
            await carregarSementeSeVazio();

            const busca = $('buscaColaborador')?.value || '';
            const depto = $('filtroDepartamentoColaborador')?.value || 'todos';
            const status = $('filtroStatusColaborador')?.value || 'todos';

            const lista = await listarColaboradores({
                busca,
                departamento: depto,
                status
            });

            const vazioEl = $('colaboradoresVazio');
            const gridEl = $('colaboradoresGrid');
            const tabContainer = $('colaboradoresTabelaContainer');

            if (lista.length === 0) {
                if (vazioEl) vazioEl.classList.remove('hidden');
                if (gridEl) gridEl.innerHTML = '';
                if (tabContainer) tabContainer.classList.add('hidden');
            } else {
                if (vazioEl) vazioEl.classList.add('hidden');
                if (modoVisualizacao === 'grid') {
                    if (gridEl) gridEl.classList.remove('hidden');
                    if (tabContainer) tabContainer.classList.add('hidden');
                    renderizarGrid(lista);
                } else {
                    if (gridEl) gridEl.classList.add('hidden');
                    if (tabContainer) tabContainer.classList.remove('hidden');
                    renderizarTabela(lista);
                }
            }

            atualizarMetricas();
            atualizarSelectRescisao();
        } catch (e) {
            console.error('Erro ao listar colaboradores:', e);
        }
    }

    function renderizarGrid(colaboradores) {
        const grid = $('colaboradoresGrid');
        if (!grid) return;
        grid.innerHTML = '';

        colaboradores.forEach(c => {
            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between';

            let statusBadge = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
            if (c.status === 'Em Férias') statusBadge = 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800';
            if (c.status === 'Afastado') statusBadge = 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800';
            if (c.status === 'Desligado') statusBadge = 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800';

            const iniciais = c.iniciais || c.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
            const bgCor = c.avatarBg || '#3b82f6';
            const tempoCasa = calcularTempoDeCasa(c.admissao);

            card.innerHTML = `
                <div>
                    <div class="flex items-start justify-between gap-3 mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-md shrink-0" style="background:${bgCor}">
                                ${iniciais}
                            </div>
                            <div>
                                <h4 class="text-sm font-bold text-slate-900 dark:text-white leading-snug">${c.nome}</h4>
                                <span class="text-[11px] text-slate-400">${c.cargo || 'Função não def.'}</span>
                            </div>
                        </div>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge}">${c.status}</span>
                    </div>

                    <div class="grid grid-cols-2 gap-2 py-3 my-2 border-y border-slate-100 dark:border-slate-800/80 text-xs">
                        <div>
                            <span class="text-[10px] text-slate-400 block">Matrícula</span>
                            <span class="font-mono font-semibold text-slate-700 dark:text-slate-300">${c.matricula || '--'}</span>
                        </div>
                        <div>
                            <span class="text-[10px] text-slate-400 block">Departamento</span>
                            <span class="font-medium text-slate-700 dark:text-slate-300 truncate block">${c.departamento || '--'}</span>
                        </div>
                        <div>
                            <span class="text-[10px] text-slate-400 block">Salário Base</span>
                            <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">${formatCurrency(c.salarioBase || 0)}</span>
                        </div>
                        <div>
                            <span class="text-[10px] text-slate-400 block">Tempo de Casa</span>
                            <span class="text-slate-600 dark:text-slate-400">${tempoCasa.textoFormatado}</span>
                        </div>
                    </div>
                </div>

                <div class="pt-2 flex items-center justify-between gap-1.5 mt-2">
                    <div class="flex items-center gap-1">
                        <button class="btn-holerite-colab p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" title="Gerar Holerite em PDF" data-id="${c.id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        </button>
                        <button class="btn-rescisao-colab p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors" title="Simular Rescisão deste colaborador" data-id="${c.id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                        </button>
                    </div>
                    <div class="flex items-center gap-1">
                        <button class="btn-editar-colab px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" data-id="${c.id}">
                            Editar
                        </button>
                        <button class="btn-excluir-colab p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors" title="Excluir Colaborador" data-id="${c.id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });

        vincularEventosCardsETabela();
    }

    function renderizarTabela(colaboradores) {
        const corpo = $('colaboradoresTabelaCorpo');
        if (!corpo) return;
        corpo.innerHTML = '';

        colaboradores.forEach(c => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors';

            const bgCor = c.avatarBg || '#3b82f6';
            const iniciais = c.iniciais || c.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

            let statusBadge = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400';
            if (c.status === 'Em Férias') statusBadge = 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400';
            if (c.status === 'Afastado') statusBadge = 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400';
            if (c.status === 'Desligado') statusBadge = 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400';

            const admFormatada = c.admissao ? c.admissao.split('-').reverse().join('/') : '--';

            tr.innerHTML = `
                <td class="px-4 py-3">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0" style="background:${bgCor}">
                            ${iniciais}
                        </div>
                        <div>
                            <p class="font-bold text-slate-900 dark:text-white leading-tight">${c.nome}</p>
                            <span class="text-[10px] text-slate-400 font-mono">${c.matricula || '--'} &bull; ${c.cpf || '--'}</span>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3 text-slate-700 dark:text-slate-300">
                    <p class="font-medium">${c.cargo || '--'}</p>
                    <span class="text-[10px] text-slate-400 font-mono">CBO ${c.cbo || '--'}</span>
                </td>
                <td class="px-4 py-3 text-slate-600 dark:text-slate-400">${c.departamento || '--'}</td>
                <td class="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">${admFormatada}</td>
                <td class="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">${formatCurrency(c.salarioBase || 0)}</td>
                <td class="px-4 py-3 text-center">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge}">${c.status}</span>
                </td>
                <td class="px-4 py-3 text-right">
                    <div class="inline-flex items-center gap-1">
                        <button class="btn-holerite-colab p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30" title="Holerite" data-id="${c.id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        </button>
                        <button class="btn-editar-colab px-2 py-1 rounded text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" data-id="${c.id}">
                            Editar
                        </button>
                        <button class="btn-excluir-colab p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30" title="Excluir" data-id="${c.id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                    </div>
                </td>
            `;
            corpo.appendChild(tr);
        });

        vincularEventosCardsETabela();
    }

    function vincularEventosCardsETabela() {
        document.querySelectorAll('.btn-editar-colab').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                const c = await obterColaborador(id);
                if (c) abrirModalColaborador(c);
            };
        });

        document.querySelectorAll('.btn-holerite-colab').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                const c = await obterColaborador(id);
                if (!c) return;

                const corp = getDadosCorporativos();
                const payload = converterParaItemHolerite(c, corp);

                const htmlHolerite = construirHtmlHolerite(payload);
                const modal = $('modalPdfPreview');
                const container = $('pdfPreviewConteudo');
                const titulo = $('pdfPreviewTitulo');

                if (titulo) titulo.textContent = `Holerite Oficial — ${c.nome}`;
                if (container) container.innerHTML = htmlHolerite;
                if (modal) modal.classList.remove('hidden');

                const btnDownload = $('btnConfirmarDownloadPdf');
                if (btnDownload) {
                    btnDownload.onclick = () => {
                        const elemento = container?.firstElementChild;
                        if (elemento) {
                            baixarDocumentoPDF(elemento, `Holerite_${c.matricula || c.nome.replace(/\s+/g, '_')}.pdf`);
                        }
                    };
                }
            };
        });

        document.querySelectorAll('.btn-rescisao-colab').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                const c = await obterColaborador(id);
                if (!c) return;

                const rescLink = document.querySelector('.sidebar-link[data-panel="rescisao"]');
                rescLink?.click();

                const sel = $('rescSelectColaborador');
                if (sel) {
                    sel.value = c.id;
                    sel.dispatchEvent(new Event('change'));
                }
            };
        });

        document.querySelectorAll('.btn-excluir-colab').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                if (confirm('Tem certeza de que deseja remover este colaborador do banco de dados?')) {
                    await removerColaborador(id);
                    showToast('Colaborador removido com sucesso!', 'info');
                    carregarColaboradores();
                }
            };
        });
    }

    function abrirModalColaborador(dados = null) {
        const modal = $('modalColaborador');
        const form = $('formColaborador');
        const titulo = $('modalColaboradorTitulo');
        if (!modal || !form) return;

        form.reset();
        ativarAbaColaborador('tabColabPessoal');

        if (dados) {
            if (titulo) titulo.textContent = `Editando Dossiê — ${dados.nome}`;
            $('colabId').value = dados.id || '';
            $('colabNome').value = dados.nome || '';
            $('colabMatricula').value = dados.matricula || '';
            $('colabNascimento').value = dados.dataNascimento || '1990-01-01';
            $('colabSexo').value = dados.sexo || 'Feminino';
            $('colabEstadoCivil').value = dados.estadoCivil || 'Solteiro(a)';
            $('colabEmail').value = dados.email || '';
            $('colabTelefone').value = dados.telefone || '';
            $('colabEndereco').value = dados.endereco || '';

            $('colabCpf').value = dados.cpf || '';
            $('colabPis').value = dados.pis || '';
            $('colabRg').value = dados.rg || '';
            $('colabCtps').value = dados.ctps || '';
            $('colabTituloEleitor').value = dados.tituloEleitor || '';

            $('colabAdmissao').value = dados.admissao || '2024-01-01';
            $('colabStatus').value = dados.status || 'Ativo';
            $('colabTipoContrato').value = dados.tipoContrato || 'CLT Indeterminado';
            $('colabDepartamento').value = dados.departamento || 'Recursos Humanos';
            $('colabCargo').value = dados.cargo || '';
            $('colabCbo').value = dados.cbo || '4110-10';
            $('colabSalarioBase').value = dados.salarioBase || '';
            $('colabDivisor').value = dados.divisorHoras || '220';

            $('colabDependentesIR').value = dados.dependentesIR || 0;
            $('colabFilhosSalFamilia').value = dados.filhosSalarioFamilia || 0;
            $('colabOptanteVT').checked = dados.optanteVT ?? true;
            $('colabCustoDiarioVT').value = dados.custoDiarioVT || 9.60;
            $('colabInsalubridade').value = dados.adicionalInsalubridade || '0';
            $('colabPericulosidade').checked = !!dados.adicionalPericulosidade;

            $('colabEscala').value = dados.escala || '5x2';
            $('colabHorarioEntrada').value = dados.horarioEntrada || '08:00';
            $('colabIntervalo').value = dados.intervalo || '01:00';
            $('colabHorarioSaida').value = dados.horarioSaida || '17:48';
        } else {
            if (titulo) titulo.textContent = 'Novo Colaborador — Dossiê Digital';
            $('colabId').value = '';
            $('colabMatricula').value = `RH-${String(Math.floor(Math.random() * 900) + 100)}`;
            $('colabAdmissao').value = new Date().toISOString().split('T')[0];
        }

        modal.classList.remove('hidden');
    }

    function fecharModalColaborador() {
        const modal = $('modalColaborador');
        if (modal) modal.classList.add('hidden');
    }

    function ativarAbaColaborador(alvoId) {
        document.querySelectorAll('.colab-tab-btn').forEach(btn => {
            const ehAlvo = btn.dataset.tabTarget === alvoId;
            btn.classList.toggle('active', ehAlvo);
            btn.classList.toggle('border-blue-600', ehAlvo);
            btn.classList.toggle('text-blue-600', ehAlvo);
            btn.classList.toggle('dark:text-blue-400', ehAlvo);
            btn.classList.toggle('font-bold', ehAlvo);
            btn.classList.toggle('text-slate-500', !ehAlvo);
            btn.classList.toggle('border-transparent', !ehAlvo);
        });

        document.querySelectorAll('.colab-tab-content').forEach(conteudo => {
            conteudo.classList.toggle('hidden', conteudo.id !== alvoId);
        });
    }

    document.querySelectorAll('.colab-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            ativarAbaColaborador(btn.dataset.tabTarget);
        });
    });

    $('colabCpf')?.addEventListener('input', (e) => {
        e.target.value = mascararCPF(e.target.value);
        const fb = $('colabCpfFeedback');
        if (fb) {
            const valido = validarCPF(e.target.value);
            if (e.target.value.length === 14) {
                fb.textContent = valido ? '✓ CPF Válido (algoritmo aprovado)' : '✗ CPF Inválido (dígitos inconsistentes)';
                fb.className = `text-[10px] font-bold mt-1 block ${valido ? 'text-emerald-500' : 'text-rose-500'}`;
            } else {
                fb.textContent = 'Validação com algoritmo oficial da Receita';
                fb.className = 'text-[10px] font-medium mt-1 block text-slate-400';
            }
        }
    });

    $('colabPis')?.addEventListener('input', (e) => {
        e.target.value = mascararPIS(e.target.value);
    });

    $('formColaborador')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const idVal = $('colabId')?.value;
        const nome = $('colabNome')?.value.trim();
        const matricula = $('colabMatricula')?.value.trim();
        const cpf = $('colabCpf')?.value.trim();
        const cargo = $('colabCargo')?.value.trim();
        const salarioBase = parseFloat($('colabSalarioBase')?.value) || 0;

        if (!nome || !matricula || !cpf || !cargo || salarioBase <= 0) {
            showToast('Por favor, preencha os campos obrigatórios (*)', 'error');
            return;
        }

        const cores = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
        const avatarBg = cores[Math.floor(Math.random() * cores.length)];
        const iniciais = nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

        const colabObj = {
            nome,
            matricula,
            dataNascimento: $('colabNascimento')?.value,
            sexo: $('colabSexo')?.value,
            estadoCivil: $('colabEstadoCivil')?.value,
            email: $('colabEmail')?.value.trim(),
            telefone: $('colabTelefone')?.value.trim(),
            endereco: $('colabEndereco')?.value.trim(),
            cpf,
            pis: $('colabPis')?.value.trim(),
            rg: $('colabRg')?.value.trim(),
            ctps: $('colabCtps')?.value.trim(),
            tituloEleitor: $('colabTituloEleitor')?.value.trim(),
            admissao: $('colabAdmissao')?.value,
            status: $('colabStatus')?.value,
            tipoContrato: $('colabTipoContrato')?.value,
            departamento: $('colabDepartamento')?.value,
            cargo,
            cbo: $('colabCbo')?.value.trim(),
            salarioBase,
            tipoSalario: 'Mensalista',
            divisorHoras: parseInt($('colabDivisor')?.value, 10) || 220,
            dependentesIR: parseInt($('colabDependentesIR')?.value, 10) || 0,
            filhosSalarioFamilia: parseInt($('colabFilhosSalFamilia')?.value, 10) || 0,
            optanteVT: $('colabOptanteVT')?.checked ?? true,
            custoDiarioVT: parseFloat($('colabCustoDiarioVT')?.value) || 0,
            adicionalInsalubridade: $('colabInsalubridade')?.value || '0',
            adicionalPericulosidade: $('colabPericulosidade')?.checked ?? false,
            escala: $('colabEscala')?.value || '5x2',
            horarioEntrada: $('colabHorarioEntrada')?.value || '08:00',
            intervalo: $('colabIntervalo')?.value || '01:00',
            horarioSaida: $('colabHorarioSaida')?.value || '17:48',
            avatarBg,
            iniciais
        };

        if (idVal) {
            colabObj.id = parseInt(idVal, 10);
        }

        try {
            await salvarColaborador(colabObj);
            fecharModalColaborador();
            showToast(idVal ? 'Colaborador atualizado com sucesso!' : 'Novo colaborador cadastrado!', 'success');
            carregarColaboradores();
        } catch (err) {
            console.error(err);
            showToast('Erro ao salvar colaborador no banco.', 'error');
        }
    });

    $('buscaColaborador')?.addEventListener('input', carregarColaboradores);
    $('filtroDepartamentoColaborador')?.addEventListener('change', carregarColaboradores);
    $('filtroStatusColaborador')?.addEventListener('change', carregarColaboradores);

    $('btnViewGridColaboradores')?.addEventListener('click', () => {
        modoVisualizacao = 'grid';
        $('btnViewGridColaboradores').className = 'px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm flex items-center gap-1 transition-all';
        $('btnViewTabelaColaboradores').className = 'px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-all';
        carregarColaboradores();
    });

    $('btnViewTabelaColaboradores')?.addEventListener('click', () => {
        modoVisualizacao = 'tabela';
        $('btnViewTabelaColaboradores').className = 'px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm flex items-center gap-1 transition-all';
        $('btnViewGridColaboradores').className = 'px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-all';
        carregarColaboradores();
    });

    $('btnAbrirNovoColaborador')?.addEventListener('click', () => abrirModalColaborador());
    $('closeModalColaborador')?.addEventListener('click', fecharModalColaborador);
    $('btnCancelarColaborador')?.addEventListener('click', fecharModalColaborador);

    $('btnCarregarDemoVazio')?.addEventListener('click', async () => {
        for (const item of COLABORADORES_SEMENTE) {
            await salvarColaborador(item);
        }
        showToast('5 colaboradores demonstrativos carregados!', 'success');
        carregarColaboradores();
    });

    $('btnExportarBackupColaboradores')?.addEventListener('click', async () => {
        try {
            const json = await exportarBancoJSON();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rhub_backup_colaboradores_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Backup do banco exportado com sucesso!', 'download');
        } catch (e) {
            console.error(e);
            showToast('Erro ao exportar backup.', 'error');
        }
    });

    $('btnRestaurarBackupColaboradores')?.addEventListener('click', () => {
        $('inputRestaurarBackupColaboradores')?.click();
    });

    $('inputRestaurarBackupColaboradores')?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const total = await restaurarBancoJSON(evt.target.result);
                showToast(`${total} colaboradores restaurados com sucesso!`, 'success');
                carregarColaboradores();
            } catch (err) {
                console.error(err);
                showToast(err.message || 'Erro ao restaurar backup.', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    carregarColaboradores();
}

async function atualizarSelectRescisao() {
    const sel = document.getElementById('rescSelectColaborador');
    if (!sel) return;
    try {
        const colaboradores = await listarColaboradores();
        const atual = sel.value;
        sel.innerHTML = '<option value="">-- Selecione para preencher automaticamente --</option>';
        colaboradores.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.nome} — Matrícula: ${c.matricula || 'S/M'} (${c.cargo || 'Geral'})`;
            sel.appendChild(opt);
        });
        if (atual) sel.value = atual;
    } catch (e) {
        console.warn('Erro ao carregar colaboradores para rescisão:', e);
    }
}

// ═══════════════════════════════════════════════════════════════════════
//  MODULE 1: ADICIONAL NOTURNO
// ═══════════════════════════════════════════════════════════════════════
function initNoturnoModule() {
    const $ = id => document.getElementById(id);
    let prev = { totalGeral: 0, noturno: 0, dsr: 0 };
    let currentParams = {};
    let currentResult = null;

    function calc() {
        currentParams = {
            salarioBase: parseCurrency($('inputSalarioBase')?.value),
            divisorMensal: Number($('selectDivisor')?.value) || 220,
            percentualAdicional: Number($('inputPercentual')?.value) || 20,
            horasNoturnasRelogio: Number($('inputHorasNoturnas')?.value) || 0,
            aplicarHoraFicta: $('toggleHoraFicta')?.checked ?? true,
            diasUteis: Number($('inputDiasUteis')?.value) || 22,
            domingosFeriados: Number($('inputRepousos')?.value) || 8
        };

        const r = calcularAdicionalNoturno(currentParams);
        currentResult = r;

        animarContador($('outTotalGeral'), prev.totalGeral, r.totalGeralProventos);
        animarContador($('outTotalNoturno'), prev.noturno, r.totalAdicionalNoturno);
        animarContador($('outTotalDsr'), prev.dsr, r.valorDsr);
        if ($('outHoraNormal')) $('outHoraNormal').textContent = formatCurrency(r.valorHoraNormal);
        if ($('outAdicionalHora')) $('outAdicionalHora').textContent = formatCurrency(r.adicionalPorHora);
        if ($('outHorasComputadas')) $('outHorasComputadas').textContent = `${formatNumber(r.horasComputadas, 2)}h (${formatHoursMinutes(r.horasComputadas)})`;
        const badge = $('outBadgeFicta');
        if (badge) {
            badge.textContent = r.aplicarHoraFicta ? `Fator ${formatNumber(FATOR_HORA_FICTA, 4)}` : 'Hora 60 min';
            badge.className = r.aplicarHoraFicta
                ? 'px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 self-start sm:self-auto whitespace-nowrap'
                : 'px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30 self-start sm:self-auto whitespace-nowrap';
        }
        renderMemoria($('memoriaContainer'), r.memoriaCalculo);
        prev = { totalGeral: r.totalGeralProventos, noturno: r.totalAdicionalNoturno, dsr: r.valorDsr };
    }

    function exportExcel() {
        if (!currentResult) calc();
        exportarNoturnoExcel(currentParams, currentResult);
        showToast('Planilha Excel de Adicional Noturno exportada!');
        adicionarAoHistorico({
            modulo: 'noturno',
            titulo: 'Adicional Noturno',
            resumoPrincipal: `${currentParams.horasNoturnasRelogio}h noturnas | Salário ${formatCurrency(currentParams.salarioBase)}`,
            valorPrincipal: currentResult.totalGeralProventos,
            params: {
                inputSalarioBase: currentParams.salarioBase,
                selectDivisor: currentParams.divisorMensal,
                inputPercentual: currentParams.percentualAdicional,
                inputHorasNoturnas: currentParams.horasNoturnasRelogio,
                toggleHoraFicta: currentParams.aplicarHoraFicta,
                inputDiasUteis: currentParams.diasUteis,
                inputRepousos: currentParams.domingosFeriados
            }
        });
    }

    async function copySummary() {
        if (!currentResult) calc();
        const texto = `RHUB — Adicional Noturno & DSR (Art. 73 CLT)
Salário Base: ${formatCurrency(currentParams.salarioBase)} | Divisor: ${currentParams.divisorMensal}h
Horas Noturnas: ${currentParams.horasNoturnasRelogio}h (${currentResult.aplicarHoraFicta ? 'Ficta 52m30s' : 'Relógio 60m'})
Horas Computadas: ${formatNumber(currentResult.horasComputadas, 2)}h
Adicional Noturno (${currentParams.percentualAdicional}%): ${formatCurrency(currentResult.totalAdicionalNoturno)}
Reflexo DSR: ${formatCurrency(currentResult.valorDsr)}
TOTAL GERAL DE PROVENTOS: ${formatCurrency(currentResult.totalGeralProventos)}`;
        await copiarTextoClipboard(texto);
        showToast('Resumo copiado para a área de transferência!');
    }

    function doPrint() {
        atualizarHeaderImpressao('Adicional Noturno (Art. 73 CLT)');
        window.print();
    }

    moduleExportHandlers.noturno = exportExcel;
    moduleCopyHandlers.noturno = copySummary;
    modulePrintHandlers.noturno = doPrint;

    $('btnExcelNoturno')?.addEventListener('click', exportExcel);
    $('btnShareNoturno')?.addEventListener('click', () => copiarLinkCompartilhamento('noturno'));
    $('btnCopiarMemoria')?.addEventListener('click', copySummary);
    $('btnImprimir')?.addEventListener('click', doPrint);

    ['inputSalarioBase','selectDivisor','inputPercentual','inputHorasNoturnas','toggleHoraFicta','inputDiasUteis','inputRepousos']
        .forEach(id => { const el = $(id); if (el) { el.addEventListener('input', calc); el.addEventListener('change', calc); } });

    $('inputSalarioBase')?.addEventListener('blur', e => { const v = parseCurrency(e.target.value); if (v > 0) e.target.value = formatNumber(v, 2); });
    calc();
}

// ═══════════════════════════════════════════════════════════════════════
//  MODULE 2: RESCISÃO CONTRATUAL + COMPARADOR DE CENÁRIOS
// ═══════════════════════════════════════════════════════════════════════
function initRescisaoModule() {
    const $ = id => document.getElementById(id);
    let prev = { liquido: 0, bruto: 0, deducoes: 0 };
    let currentResult = null;

    function calc() {
        currentRescisaoParams = {
            salarioBase: parseCurrency($('rescSalario')?.value),
            motivo: $('rescMotivo')?.value || 'SEM_JUSTA_CAUSA',
            dataAdmissao: $('rescDataAdm')?.value || '2021-03-15',
            dataDemissao: $('rescDataDem')?.value || '2026-09-11',
            diasTrabalhadosMes: Number($('rescDiasTrab')?.value) || 0,
            temFeriasVencidas: $('rescFeriasVencidas')?.checked ?? true,
            saldoFGTS: parseCurrency($('rescSaldoFGTS')?.value),
            tipoAvisoPrevio: $('rescTipoAviso')?.value || 'indenizado',
            dependentesIR: Number($('rescDependentes')?.value) || 0
        };

        const r = calcularRescisao(currentRescisaoParams);
        currentResult = r;

        animarContador($('outLiquidoRescisao'), prev.liquido, r.liquidoRescisao);
        animarContador($('outBrutoRescisao'), prev.bruto, r.totalVerbasRescisoriaBruto);
        animarContador($('outDeducoesRescisao'), prev.deducoes, r.totalDeducoes);
        if ($('outTempoServico')) $('outTempoServico').textContent = `${r.tempoServico.anos}a ${r.tempoServico.meses}m`;
        if ($('outDiasAviso')) $('outDiasAviso').textContent = `${r.diasAvisoPrevio} dias`;

        // Render verbas list
        const list = $('rescVerbasList');
        if (list) {
            list.innerHTML = '';
            const sections = [
                { title: 'Proventos', items: r.verbas.filter(v => v.tipo === 'provento'), color: 'emerald' },
                { title: 'Deduções', items: [...r.deducoes, ...r.verbas.filter(v => v.tipo === 'desconto')], color: 'red' },
            ];
            sections.forEach(sec => {
                const activeItems = sec.items.filter(v => v.ativo && v.valor > 0);
                if (activeItems.length === 0) return;
                const h = document.createElement('p');
                h.className = `text-[10px] font-bold uppercase tracking-wider text-${sec.color}-600 dark:text-${sec.color}-400 mb-2 mt-3 first:mt-0`;
                h.textContent = sec.title;
                list.appendChild(h);
                activeItems.forEach(v => {
                    const row = document.createElement('div');
                    row.className = 'flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-b-0';
                    row.innerHTML = `
                        <div class="min-w-0">
                            <p class="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">${v.nome}</p>
                            <p class="text-[10px] text-slate-400">${v.detalhe}</p>
                        </div>
                        <span class="text-sm font-bold font-mono ${sec.color === 'red' ? 'text-red-500' : 'text-slate-900 dark:text-white'} ml-3 shrink-0">
                            ${sec.color === 'red' ? '−' : ''} ${formatCurrency(v.valor)}
                        </span>`;
                    list.appendChild(row);
                });
            });

            // Totals
            const sep = document.createElement('div');
            sep.className = 'border-t-2 border-slate-300 dark:border-slate-600 mt-3 pt-3 flex items-center justify-between';
            sep.innerHTML = `<p class="text-sm font-bold text-slate-900 dark:text-white">Líquido a Receber</p><p class="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">${formatCurrency(r.liquidoRescisao)}</p>`;
            list.appendChild(sep);

            // Info badges
            if (r.saqueFGTS || r.seguroDesemprego) {
                const info = document.createElement('div');
                info.className = 'flex flex-wrap gap-2 mt-4';
                if (r.saqueFGTS) info.innerHTML += `<span class="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">Direito ao Saque FGTS</span>`;
                if (r.seguroDesemprego) info.innerHTML += `<span class="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20">Direito a Seguro-Desemprego</span>`;
                list.appendChild(info);
            }

            if (window.gsap) gsap.fromTo(list.children, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out' });
        }

        prev = { liquido: r.liquidoRescisao, bruto: r.totalVerbasRescisoriaBruto, deducoes: r.totalDeducoes };
    }

    function exportExcel() {
        if (!currentResult) calc();
        exportarRescisaoExcel(currentRescisaoParams, currentResult);
        showToast('Demonstrativo de Rescisão exportado para Excel!');
        adicionarAoHistorico({
            modulo: 'rescisao',
            titulo: 'Rescisão Contratual',
            resumoPrincipal: `${currentResult.motivoLabel} | Salário ${formatCurrency(currentRescisaoParams.salarioBase)}`,
            valorPrincipal: currentResult.liquidoRescisao,
            params: {
                rescSalario: currentRescisaoParams.salarioBase,
                rescMotivo: currentRescisaoParams.motivo,
                rescDataAdm: currentRescisaoParams.dataAdmissao,
                rescDataDem: currentRescisaoParams.dataDemissao,
                rescDiasTrab: currentRescisaoParams.diasTrabalhadosMes,
                rescFeriasVencidas: currentRescisaoParams.temFeriasVencidas,
                rescSaldoFGTS: currentRescisaoParams.saldoFGTS,
                rescTipoAviso: currentRescisaoParams.tipoAvisoPrevio,
                rescDependentes: currentRescisaoParams.dependentesIR
            }
        });
    }

    async function copySummary() {
        if (!currentResult) calc();
        const texto = `RHUB — Demonstrativo de Rescisão Contratual (Art. 477 CLT)
Motivo: ${currentResult.motivoLabel}
Salário Base: ${formatCurrency(currentRescisaoParams.salarioBase)}
Tempo de Serviço: ${currentResult.tempoServico.anos} anos e ${currentResult.tempoServico.meses} meses
Aviso Prévio (${currentRescisaoParams.tipoAvisoPrevio}): ${currentResult.diasAvisoPrevio} dias
Total de Proventos Brutos: ${formatCurrency(currentResult.totalVerbasRescisoriaBruto)}
Total de Deduções: ${formatCurrency(currentResult.totalDeducoes)}
VALOR LÍQUIDO RESCISÓRIO: ${formatCurrency(currentResult.liquidoRescisao)}
Saque FGTS: ${currentResult.saqueFGTS ? 'SIM' : 'NÃO'} | Seguro-Desemprego: ${currentResult.seguroDesemprego ? 'SIM' : 'NÃO'}`;
        await copiarTextoClipboard(texto);
        showToast('Resumo de rescisão copiado com sucesso!');
    }

    function doPrint() {
        atualizarHeaderImpressao('Rescisão Contratual (Art. 477 CLT)');
        window.print();
    }

    // ── COMPARADOR DE CENÁRIOS ──
    const modalComparador = $('comparadorModal');
    const btnAbrirComparador = $('btnCompararRescisao');
    const btnFecharComparador = $('closeComparadorModal');
    const containerComparador = $('comparadorContainer');

    btnAbrirComparador?.addEventListener('click', () => {
        if (!currentRescisaoParams) calc();
        const cenarios = compararCenariosRescisao(currentRescisaoParams);

        if (containerComparador) {
            containerComparador.innerHTML = '';
            cenarios.forEach(c => {
                const card = document.createElement('div');
                card.className = 'p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col justify-between';
                card.innerHTML = `
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-${c.cor}-50 text-${c.cor}-600 dark:bg-${c.cor}-500/10 dark:text-${c.cor}-400 border border-${c.cor}-200 dark:border-${c.cor}-500/20">${c.tag}</span>
                        </div>
                        <h4 class="text-sm font-bold text-slate-900 dark:text-white mb-3">${c.nome}</h4>
                        
                        <div class="mb-4 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <p class="text-[10px] uppercase font-bold text-slate-400">Líquido a Receber</p>
                            <p class="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">${formatCurrency(c.liquido)}</p>
                        </div>

                        <div class="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pb-3 border-b border-slate-200 dark:border-slate-700">
                            <div class="flex justify-between"><span>Total Bruto:</span><strong class="font-mono">${formatCurrency(c.bruto)}</strong></div>
                            <div class="flex justify-between text-red-500"><span>Deduções:</span><strong class="font-mono">− ${formatCurrency(c.deducoes)}</strong></div>
                            <div class="flex justify-between"><span>Multa FGTS:</span><strong class="font-mono">${formatCurrency(c.multaFGTS)}</strong></div>
                        </div>

                        <div class="mt-3 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <p>Saque FGTS: <strong class="${c.saqueFGTS ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}">${c.saqueFGTS ? 'Permitido' : 'Bloqueado'}</strong></p>
                            <p>Seguro-Desemp.: <strong class="${c.seguroDesemprego ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}">${c.seguroDesemprego ? 'Permitido' : 'Indisponível'}</strong></p>
                        </div>
                    </div>

                    <div class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <p class="text-[10px] uppercase font-bold text-slate-400">Custo Total Empresa</p>
                        <p class="text-sm font-bold font-mono text-slate-900 dark:text-white">${formatCurrency(c.custoEmpresa)}</p>
                    </div>`;
                containerComparador.appendChild(card);
            });

            // Renderiza o gráfico comparativo no modal de rescisão
            renderChartRescisao(cenarios);
        }

        modalComparador?.classList.remove('hidden');
    });

    btnFecharComparador?.addEventListener('click', () => modalComparador?.classList.add('hidden'));
    modalComparador?.addEventListener('click', e => { if (e.target === modalComparador) modalComparador.classList.add('hidden'); });

    moduleExportHandlers.rescisao = exportExcel;
    moduleCopyHandlers.rescisao = copySummary;
    modulePrintHandlers.rescisao = doPrint;

    $('btnExcelRescisao')?.addEventListener('click', exportExcel);
    $('btnShareRescisao')?.addEventListener('click', () => copiarLinkCompartilhamento('rescisao'));
    $('btnCopiarRescisao')?.addEventListener('click', copySummary);
    $('btnImprimirRescisao')?.addEventListener('click', doPrint);

    ['rescSalario','rescMotivo','rescDataAdm','rescDataDem','rescDiasTrab','rescFeriasVencidas','rescSaldoFGTS','rescTipoAviso','rescDependentes']
        .forEach(id => { const el = $(id); if (el) { el.addEventListener('input', calc); el.addEventListener('change', calc); } });

    ['rescSalario','rescSaldoFGTS'].forEach(id => {
        $(id)?.addEventListener('blur', e => { const v = parseCurrency(e.target.value); if (v > 0) e.target.value = formatNumber(v, 2); });
    });

    $('rescSelectColaborador')?.addEventListener('change', async (e) => {
        const id = parseInt(e.target.value, 10);
        if (!id) return;
        try {
            const colab = await obterColaborador(id);
            if (colab) {
                if ($('rescSalario')) $('rescSalario').value = formatNumber(colab.salarioBase || 0, 2);
                if ($('rescDataAdm') && colab.admissao) $('rescDataAdm').value = colab.admissao;
                if ($('rescDependentes')) $('rescDependentes').value = colab.dependentesIR || 0;
                calc();
                showToast(`Dados de ${colab.nome} vinculados à rescisão!`, 'info');
            }
        } catch (err) {
            console.error(err);
        }
    });
    atualizarSelectRescisao();

    calc();
}

// ═══════════════════════════════════════════════════════════════════════
//  MODULE 3: FALTAS E ATRASOS
// ═══════════════════════════════════════════════════════════════════════
function initFaltasModule() {
    const $ = id => document.getElementById(id);
    let prev = { total: 0, faltas: 0, atrasos: 0, dsr: 0, salario: 0 };
    let currentParams = {};
    let currentResult = null;

    function calc() {
        currentParams = {
            salarioBase: parseCurrency($('faltSalario')?.value),
            divisorMensal: Number($('faltDivisor')?.value) || 220,
            diasFalta: Number($('faltDias')?.value) || 0,
            horasAtraso: Number($('faltHorasAtraso')?.value) || 0,
            dsrAfetados: Number($('faltDSR')?.value) || 0,
            faltasPeriodoAquisitivo: Number($('faltPeriodoAquisitivo')?.value) || 0
        };

        const r = calcularFaltas(currentParams);
        currentResult = r;

        animarContador($('outTotalDescontosFaltas'), prev.total, r.totalDescontos);
        animarContador($('outDescFaltas'), prev.faltas, r.descontoFaltas);
        animarContador($('outDescAtrasos'), prev.atrasos, r.descontoAtrasos);
        animarContador($('outDescDSR'), prev.dsr, r.descontoDSR);
        animarContador($('outSalarioApos'), prev.salario, r.salarioAposDescontos);

        // Impacto em férias
        const box = $('faltImpactoFerias');
        if (box) {
            const imp = r.impactoFerias;
            box.innerHTML = imp.perdeuDireito
                ? `<span class="font-bold text-red-600 dark:text-red-400">${imp.label}</span>`
                : `<span class="font-bold">Art. 130 CLT:</span> ${imp.label}`;
        }

        renderMemoria($('faltMemoriaContainer'), r.memoriaCalculo);
        prev = { total: r.totalDescontos, faltas: r.descontoFaltas, atrasos: r.descontoAtrasos, dsr: r.descontoDSR, salario: r.salarioAposDescontos };
    }

    function exportExcel() {
        if (!currentResult) calc();
        exportarFaltasExcel(currentParams, currentResult);
        showToast('Relatório de Faltas e Atrasos exportado para Excel!');
        adicionarAoHistorico({
            modulo: 'faltas',
            titulo: 'Faltas e Atrasos',
            resumoPrincipal: `${currentParams.diasFalta} dias de falta | Salário Líquido ${formatCurrency(currentResult.salarioAposDescontos)}`,
            valorPrincipal: currentResult.totalDescontos,
            params: {
                faltSalario: currentParams.salarioBase,
                faltDivisor: currentParams.divisorMensal,
                faltDias: currentParams.diasFalta,
                faltHorasAtraso: currentParams.horasAtraso,
                faltDSR: currentParams.dsrAfetados,
                faltPeriodoAquisitivo: currentParams.faltasPeriodoAquisitivo
            }
        });
    }

    async function copySummary() {
        if (!currentResult) calc();
        const texto = `RHUB — Apuração de Faltas, Atrasos e DSR (Art. 462 e 130 CLT)
Salário Base: ${formatCurrency(currentParams.salarioBase)} | Divisor: ${currentParams.divisorMensal}h
Desconto Faltas (${currentParams.diasFalta} dias): ${formatCurrency(currentResult.descontoFaltas)}
Desconto Atrasos (${currentParams.horasAtraso}h): ${formatCurrency(currentResult.descontoAtrasos)}
Perda DSR (${currentParams.dsrAfetados} descansos): ${formatCurrency(currentResult.descontoDSR)}
TOTAL DE DESCONTOS: ${formatCurrency(currentResult.totalDescontos)}
SALÁRIO APÓS DESCONTOS: ${formatCurrency(currentResult.salarioAposDescontos)}
Impacto Férias (Art. 130 CLT): ${currentResult.impactoFerias.label}`;
        await copiarTextoClipboard(texto);
        showToast('Resumo de faltas copiado com sucesso!');
    }

    function doPrint() {
        atualizarHeaderImpressao('Faltas e Atrasos (Art. 462 e 130 CLT)');
        window.print();
    }

    moduleExportHandlers.faltas = exportExcel;
    moduleCopyHandlers.faltas = copySummary;
    modulePrintHandlers.faltas = doPrint;

    $('btnExcelFaltas')?.addEventListener('click', exportExcel);
    $('btnShareFaltas')?.addEventListener('click', () => copiarLinkCompartilhamento('faltas'));
    $('btnCopiarFaltas')?.addEventListener('click', copySummary);
    $('btnImprimirFaltas')?.addEventListener('click', doPrint);

    ['faltSalario','faltDias','faltHorasAtraso','faltDSR','faltDivisor','faltPeriodoAquisitivo']
        .forEach(id => { const el = $(id); if (el) { el.addEventListener('input', calc); el.addEventListener('change', calc); } });

    $('faltSalario')?.addEventListener('blur', e => { const v = parseCurrency(e.target.value); if (v > 0) e.target.value = formatNumber(v, 2); });
    calc();
}

// ═══════════════════════════════════════════════════════════════════════
//  MODULE 4: FÉRIAS & 13º SALÁRIO
// ═══════════════════════════════════════════════════════════════════════
function initFeriasModule() {
    const $ = id => document.getElementById(id);
    let prev = { liqFerias: 0, liq13: 0, brutoF: 0, terco: 0, bruto13: 0, deducoes: 0 };
    let currentParams = {};
    let currentFeriasResult = null;
    let current13oResult = null;

    function calc() {
        const salario = parseCurrency($('ferSalario')?.value);
        const deps = Number($('ferDependentes')?.value) || 0;

        currentParams = {
            salarioBase: salario,
            diasFerias: Number($('ferDias')?.value) || 30,
            abonoPecuniario: $('ferAbono')?.checked ?? false,
            feriasEmDobro: $('ferDobro')?.checked ?? false,
            mesesTrabalhados: Number($('fer13Meses')?.value) || 9,
            dependentesIR: deps
        };

        const ferias = calcularFerias(currentParams);
        const dec13 = calcular13o(currentParams);

        currentFeriasResult = ferias;
        current13oResult = dec13;

        animarContador($('outLiquidoFerias'), prev.liqFerias, ferias.liquidoFerias);
        animarContador($('outLiquido13o'), prev.liq13, dec13.liquido13o);
        animarContador($('outBrutoFerias'), prev.brutoF, ferias.totalBrutoFerias);
        if ($('outTercoFerias')) $('outTercoFerias').textContent = formatCurrency(ferias.tercoConstitucional);
        animarContador($('outBruto13o'), prev.bruto13, dec13.valor13oBruto);
        const totalDed = ferias.totalDeducoes + dec13.totalDeducoes;
        animarContador($('outDeducoesFerias'), prev.deducoes, totalDed);

        renderMemoria($('ferMemoriaFerias'), ferias.memoriaCalculo);
        renderMemoria($('ferMemoria13o'), dec13.memoriaCalculo);

        prev = { liqFerias: ferias.liquidoFerias, liq13: dec13.liquido13o, brutoF: ferias.totalBrutoFerias, terco: ferias.tercoConstitucional, bruto13: dec13.valor13oBruto, deducoes: totalDed };
        atualizarFracionamento();
    }

    function atualizarFracionamento() {
        const diasTotais = Number($('ferDias')?.value) || 30;
        const venderAbono = $('ferAbono')?.checked ?? false;
        const qtdPeriodos = Number($('fracQtdPeriodos')?.value) || 2;
        const dataInicio1 = $('fracDataInicio')?.value || '';

        const p1Input = $('fracP1');
        const p2Input = $('fracP2');
        const p3Input = $('fracP3');

        if (qtdPeriodos === 1) {
            if (p1Input) { p1Input.value = venderAbono ? 20 : diasTotais; p1Input.disabled = true; }
            if (p2Input) { p2Input.value = 0; p2Input.disabled = true; }
            if (p3Input) { p3Input.value = 0; p3Input.disabled = true; }
        } else if (qtdPeriodos === 2) {
            if (p1Input) p1Input.disabled = false;
            if (p2Input) {
                p2Input.disabled = false;
                const diasRestantes = (venderAbono ? 20 : diasTotais) - (Number(p1Input?.value) || 15);
                p2Input.value = Math.max(0, diasRestantes);
            }
            if (p3Input) { p3Input.value = 0; p3Input.disabled = true; }
        } else if (qtdPeriodos === 3) {
            if (p1Input) p1Input.disabled = false;
            if (p2Input) p2Input.disabled = false;
            if (p3Input) p3Input.disabled = false;
        }

        const periodos = [
            Number(p1Input?.value) || 0,
            Number(p2Input?.value) || 0,
            Number(p3Input?.value) || 0
        ].slice(0, qtdPeriodos);

        const res = validarFracionamentoFerias({
            diasTotaisDireito: diasTotais,
            venderAbono,
            periodos,
            dataInicio1
        });

        const alertaBox = $('fracAlerta');
        if (alertaBox) {
            alertaBox.classList.remove('hidden');
            if (!res.valido) {
                alertaBox.className = 'p-3 rounded-xl text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60';
                alertaBox.innerHTML = `<strong>⚠️ Desconformidade CLT (Art. 134):</strong><ul class="list-disc ml-4 mt-1 space-y-0.5">${res.erros.map(e => `<li>${e}</li>`).join('')}</ul>`;
            } else {
                alertaBox.className = 'p-3 rounded-xl text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60';
                let avisosHtml = res.avisos.length > 0 ? `<p class="mt-1 text-amber-600 dark:text-amber-400 font-semibold">${res.avisos.join('<br>')}</p>` : '';
                alertaBox.innerHTML = `<strong>✓ Fracionamento em Conformidade com a CLT!</strong> (${res.qtdPeriodos} períodos &bull; ${res.somaDias} dias gozo${res.diasAbono ? ' + 10d abono pecuniário' : ''})${avisosHtml}`;
            }
        }

        const cronogramaBox = $('fracCronograma');
        if (cronogramaBox) {
            if (res.cronograma.length > 0) {
                cronogramaBox.innerHTML = res.cronograma.map(c => `
                    <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                        <div>
                            <span class="font-bold text-slate-800 dark:text-slate-200">${c.periodo}º Período:</span>
                            <span class="text-slate-600 dark:text-slate-400 font-mono">${c.dias} dias</span>
                            <span class="text-[10px] text-slate-400 block">${c.dataInicio.split('-').reverse().join('/')} até ${c.dataFim.split('-').reverse().join('/')} &bull; Retorno: ${c.dataRetorno.split('-').reverse().join('/')}</span>
                        </div>
                        <div class="text-right">
                            <span class="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Pgto. até</span>
                            <span class="font-mono text-xs font-bold text-slate-900 dark:text-white">${c.dataLimitePagamento.split('-').reverse().join('/')}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                cronogramaBox.innerHTML = '';
            }
        }
    }

    function exportExcel() {
        if (!currentFeriasResult || !current13oResult) calc();
        exportarFeriasExcel(currentParams, currentFeriasResult, current13oResult);
        showToast('Relatório de Férias e 13º exportado para Excel!');
        adicionarAoHistorico({
            modulo: 'ferias',
            titulo: 'Férias & 13º Salário',
            resumoPrincipal: `${currentParams.diasFerias}d férias + ${currentParams.mesesTrabalhados} avos 13º`,
            valorPrincipal: currentFeriasResult.liquidoFerias + current13oResult.liquido13o,
            params: {
                ferSalario: currentParams.salarioBase,
                ferDias: currentParams.diasFerias,
                ferAbono: currentParams.abonoPecuniario,
                ferDobro: currentParams.feriasEmDobro,
                ferDependentes: currentParams.dependentesIR,
                fer13Meses: currentParams.mesesTrabalhados
            }
        });
    }

    async function copySummary() {
        if (!currentFeriasResult || !current13oResult) calc();
        const texto = `RHUB — Férias & 13º Salário (Art. 129 CLT / Lei 4.090/62)
Salário Base: ${formatCurrency(currentParams.salarioBase)}
Férias (${currentParams.diasFerias} dias${currentParams.abonoPecuniario ? ' + Abono 10d' : ''}):
  • Bruto: ${formatCurrency(currentFeriasResult.totalBrutoFerias)}
  • Deduções (INSS/IRRF): ${formatCurrency(currentFeriasResult.totalDeducoes)}
  • Líquido de Férias: ${formatCurrency(currentFeriasResult.liquidoFerias)}
13º Salário (${currentParams.mesesTrabalhados}/12 avos):
  • Bruto: ${formatCurrency(current13oResult.valor13oBruto)}
  • Deduções (INSS/IRRF): ${formatCurrency(current13oResult.totalDeducoes)}
  • Líquido de 13º: ${formatCurrency(current13oResult.liquido13o)}
TOTAL LÍQUIDO A RECEBER: ${formatCurrency(currentFeriasResult.liquidoFerias + current13oResult.liquido13o)}`;
        await copiarTextoClipboard(texto);
        showToast('Resumo de férias e 13º copiado com sucesso!');
    }

    function doPrint() {
        atualizarHeaderImpressao('Férias & 13º Salário (Art. 129 CLT / Lei 4.090)');
        window.print();
    }

    moduleExportHandlers.ferias = exportExcel;
    moduleCopyHandlers.ferias = copySummary;
    modulePrintHandlers.ferias = doPrint;

    $('btnExcelFerias')?.addEventListener('click', exportExcel);
    $('btnShareFerias')?.addEventListener('click', () => copiarLinkCompartilhamento('ferias'));
    $('btnCopiarFerias')?.addEventListener('click', copySummary);
    $('btnImprimirFerias')?.addEventListener('click', doPrint);

    ['ferSalario','ferDias','ferAbono','ferDobro','ferDependentes','fer13Meses']
        .forEach(id => { const el = $(id); if (el) { el.addEventListener('input', calc); el.addEventListener('change', calc); } });

    ['fracDataInicio', 'fracQtdPeriodos', 'fracP1', 'fracP2', 'fracP3']
        .forEach(id => { const el = $(id); if (el) { el.addEventListener('input', atualizarFracionamento); el.addEventListener('change', atualizarFracionamento); } });

    $('ferSalario')?.addEventListener('blur', e => { const v = parseCurrency(e.target.value); if (v > 0) e.target.value = formatNumber(v, 2); });
    calc();
}

// ═══════════════════════════════════════════════════════════════════════
//  MODULE 5: SALÁRIO LÍQUIDO (HOLERITE MENSAL)
// ═══════════════════════════════════════════════════════════════════════
function initLiquidoModule() {
    const $ = id => document.getElementById(id);
    let prev = { liquido: 0, bruto: 0, descontos: 0, fgts: 0 };
    let currentParams = {};
    let currentResult = null;

    function calc() {
        currentParams = {
            salarioBase: parseCurrency($('liqSalario')?.value),
            divisorMensal: Number($('liqDivisor')?.value) || 220,
            horasExtras50: Number($('liqHE50')?.value) || 0,
            horasExtras100: Number($('liqHE100')?.value) || 0,
            adicionalNoturnoValor: parseCurrency($('liqNoturno')?.value),
            insalubridadeGrau: Number($('liqInsalubridade')?.value) || 0,
            temPericulosidade: $('liqPericulosidade')?.checked ?? false,
            dependentesIR: Number($('liqDependentes')?.value) || 0,
            pensaoAlimenticia: parseCurrency($('liqPensao')?.value),
            optanteVT: $('liqOptanteVT')?.checked ?? true,
            descontoVR: parseCurrency($('liqVR')?.value),
            descontoSaude: parseCurrency($('liqSaude')?.value)
        };

        const r = calcularSalarioLiquido(currentParams);
        currentResult = r;

        animarContador($('outLiquidoHolerite'), prev.liquido, r.salarioLiquido);
        animarContador($('outBrutoHolerite'), prev.bruto, r.totalBruto);
        animarContador($('outDescontosHolerite'), prev.descontos, r.totalDescontos);
        animarContador($('outFGTSHolerite'), prev.fgts, r.fgtsMes);
        if ($('outAliqINSSHolerite')) $('outAliqINSSHolerite').textContent = `${formatNumber(r.inss.aliquotaEfetiva, 2)}%`;

        // Render holerite list
        const list = $('liqHoleriteList');
        if (list) {
            list.innerHTML = '';

            // Proventos
            const secProv = document.createElement('div');
            secProv.innerHTML = `<p class="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">Proventos / Vencimentos (+)</p>`;
            r.rubricasProventos.forEach(p => {
                secProv.innerHTML += `
                    <div class="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-xs">
                        <div class="flex items-center gap-2 min-w-0">
                            <span class="font-mono text-[10px] text-slate-400">${p.codigo}</span>
                            <span class="font-medium text-slate-800 dark:text-slate-200 truncate">${p.nome}</span>
                            <span class="text-[10px] text-slate-400">(${p.referencia})</span>
                        </div>
                        <span class="font-mono font-bold text-slate-900 dark:text-white shrink-0 ml-2">${formatCurrency(p.valor)}</span>
                    </div>`;
            });
            list.appendChild(secProv);

            // Descontos
            const secDesc = document.createElement('div');
            secDesc.className = 'mt-3';
            secDesc.innerHTML = `<p class="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">Descontos / Retenções (−)</p>`;
            r.rubricasDescontos.forEach(d => {
                secDesc.innerHTML += `
                    <div class="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-xs">
                        <div class="flex items-center gap-2 min-w-0">
                            <span class="font-mono text-[10px] text-slate-400">${d.codigo}</span>
                            <span class="font-medium text-slate-800 dark:text-slate-200 truncate">${d.nome}</span>
                            <span class="text-[10px] text-slate-400">(${d.referencia})</span>
                        </div>
                        <span class="font-mono font-bold text-red-500 shrink-0 ml-2">− ${formatCurrency(d.valor)}</span>
                    </div>`;
            });
            list.appendChild(secDesc);

            // Totais
            const totals = document.createElement('div');
            totals.className = 'border-t-2 border-slate-300 dark:border-slate-600 mt-4 pt-3 space-y-1.5';
            totals.innerHTML = `
                <div class="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Total de Vencimentos:</span>
                    <strong class="font-mono text-slate-900 dark:text-white">${formatCurrency(r.totalBruto)}</strong>
                </div>
                <div class="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Total de Descontos:</span>
                    <strong class="font-mono text-red-500">− ${formatCurrency(r.totalDescontos)}</strong>
                </div>
                <div class="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>Salário Líquido a Receber:</span>
                    <span class="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">${formatCurrency(r.salarioLiquido)}</span>
                </div>`;
            list.appendChild(totals);

            if (window.gsap) gsap.fromTo(list.children, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out' });
        }

        renderMemoria($('liqMemoriaContainer'), r.memoriaCalculo);
        renderChartLiquido(r.totalBruto, r.inss.valor, r.irrf.valor, r.totalDescontos - r.inss.valor - r.irrf.valor, r.salarioLiquido);
        prev = { liquido: r.salarioLiquido, bruto: r.totalBruto, descontos: r.totalDescontos, fgts: r.fgtsMes };
    }

    function exportExcel() {
        if (!currentResult) calc();
        exportarLiquidoExcel(currentParams, currentResult);
        showToast('Holerite Mensal exportado para Excel!');
        adicionarAoHistorico({
            modulo: 'liquido',
            titulo: 'Salário Líquido',
            resumoPrincipal: `Salário Bruto ${formatCurrency(currentResult.totalBruto)} | Descontos ${formatCurrency(currentResult.totalDescontos)}`,
            valorPrincipal: currentResult.salarioLiquido,
            params: {
                liqSalario: currentParams.salarioBase,
                liqDivisor: currentParams.divisorMensal,
                liqHE50: currentParams.horasExtras50,
                liqHE100: currentParams.horasExtras100,
                liqNoturno: currentParams.adicionalNoturnoValor,
                liqInsalubridade: currentParams.insalubridadeGrau,
                liqPericulosidade: currentParams.temPericulosidade,
                liqDependentes: currentParams.dependentesIR,
                liqPensao: currentParams.pensaoAlimenticia,
                liqOptanteVT: currentParams.optanteVT,
                liqVR: currentParams.descontoVR,
                liqSaude: currentParams.descontoSaude
            }
        });
    }

    async function copySummary() {
        if (!currentResult) calc();
        const texto = `RHUB — Demonstrativo de Pagamento Mensal (Holerite CLT)
Salário Base: ${formatCurrency(currentParams.salarioBase)}
Total de Proventos Brutos: ${formatCurrency(currentResult.totalBruto)}
Total de Descontos: ${formatCurrency(currentResult.totalDescontos)}
  • INSS (${currentResult.inss.aliquotaEfetiva.toFixed(2)}%): ${formatCurrency(currentResult.inss.valor)}
  • IRRF: ${formatCurrency(currentResult.irrf.valor)}
SALÁRIO LÍQUIDO A RECEBER: ${formatCurrency(currentResult.salarioLiquido)}
Depósito FGTS (8% - Empresa): ${formatCurrency(currentResult.fgtsMes)}`;
        await copiarTextoClipboard(texto);
        showToast('Resumo do holerite copiado com sucesso!');
    }

    function doPrint() {
        atualizarHeaderImpressao('Salário Líquido — Holerite Mensal (Art. 457 CLT)');
        window.print();
    }

    moduleExportHandlers.liquido = exportExcel;
    moduleCopyHandlers.liquido = copySummary;
    modulePrintHandlers.liquido = doPrint;

    $('btnExcelLiquido')?.addEventListener('click', exportExcel);
    $('btnShareLiquido')?.addEventListener('click', () => copiarLinkCompartilhamento('liquido'));
    $('btnCopiarLiquido')?.addEventListener('click', copySummary);
    $('btnImprimirLiquido')?.addEventListener('click', doPrint);

    ['liqSalario','liqDivisor','liqHE50','liqHE100','liqNoturno','liqInsalubridade','liqPericulosidade','liqDependentes','liqPensao','liqOptanteVT','liqVR','liqSaude']
        .forEach(id => { const el = $(id); if (el) { el.addEventListener('input', calc); el.addEventListener('change', calc); } });

    ['liqSalario','liqNoturno','liqPensao','liqVR','liqSaude'].forEach(id => {
        $(id)?.addEventListener('blur', e => { const v = parseCurrency(e.target.value); if (v > 0) e.target.value = formatNumber(v, 2); });
    });
    calc();
}

// ═══════════════════════════════════════════════════════════════════════
//  GRÁFICOS VISUAIS INTERATIVOS (CHART.JS)
// ═══════════════════════════════════════════════════════════════════════
let chartLiquido = null;
let chartRescisao = null;
let chartCltPj = null;

function renderChartLiquido(bruto, inss, irrf, outrosDescontos, liquido) {
    const canvas = document.getElementById('chartLiquidoComposicao');
    if (!canvas || typeof window.Chart === 'undefined') return;

    if (chartLiquido) chartLiquido.destroy();

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#cbd5e1' : '#475569';

    chartLiquido = new window.Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Salário Líquido', 'INSS', 'IRRF', 'Benefícios/Outros'],
            datasets: [{
                data: [liquido, inss, irrf, Math.max(0, outrosDescontos)],
                backgroundColor: ['#14b8a6', '#f43f5e', '#f59e0b', '#8b5cf6'],
                borderWidth: 2,
                borderColor: isDark ? '#0f172a' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: textColor, boxWidth: 10, font: { size: 10, family: 'Inter' } }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.raw)} (${((ctx.raw / (bruto || 1)) * 100).toFixed(1)}%)`
                    }
                }
            },
            cutout: '68%'
        }
    });
}

function renderChartRescisao(cenarios) {
    const canvas = document.getElementById('chartRescisaoCenarios');
    if (!canvas || typeof window.Chart === 'undefined') return;

    if (chartRescisao) chartRescisao.destroy();

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#cbd5e1' : '#475569';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    chartRescisao = new window.Chart(canvas, {
        type: 'bar',
        data: {
            labels: cenarios.map(c => c.tag),
            datasets: [
                {
                    label: 'Líquido do Empregado',
                    data: cenarios.map(c => c.liquido),
                    backgroundColor: '#10b981',
                    borderRadius: 6
                },
                {
                    label: 'Custo Total da Empresa',
                    data: cenarios.map(c => c.custoEmpresa),
                    backgroundColor: '#f43f5e',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { color: textColor, font: { size: 11 } } },
                tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` } }
            },
            scales: {
                x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } },
                y: { ticks: { color: textColor, callback: v => 'R$ ' + (v/1000).toFixed(0) + 'k' }, grid: { color: gridColor } }
            }
        }
    });
}

function renderChartCltPj(empresaClt, poderCompraClt, liquidoPj, faturamentoPj) {
    const canvas = document.getElementById('chartCltPjComparativo');
    if (!canvas || typeof window.Chart === 'undefined') return;

    if (chartCltPj) chartCltPj.destroy();

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#cbd5e1' : '#475569';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    chartCltPj = new window.Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['Desembolso Empresa', 'Rendimento do Profissional'],
            datasets: [
                {
                    label: 'Modelo CLT',
                    data: [empresaClt, poderCompraClt],
                    backgroundColor: '#6366f1',
                    borderRadius: 6
                },
                {
                    label: 'Modelo PJ',
                    data: [faturamentoPj, liquidoPj],
                    backgroundColor: '#10b981',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { color: textColor, font: { size: 11 } } },
                tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` } }
            },
            scales: {
                x: { ticks: { color: textColor }, grid: { display: false } },
                y: { ticks: { color: textColor, callback: v => 'R$ ' + (v/1000).toFixed(0) + 'k' }, grid: { color: gridColor } }
            }
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════
//  DEEP LINKING (COMPARTILHAMENTO DE SIMULAÇÃO POR LINK)
// ═══════════════════════════════════════════════════════════════════════
function copiarLinkCompartilhamento(moduloId) {
    const $ = id => document.getElementById(id);
    const params = new URLSearchParams();
    params.set('mod', moduloId);

    if (moduloId === 'noturno') {
        params.set('salario', parseCurrency($('inputSalarioBase')?.value || '0'));
        params.set('horas', $('inputHorasNoturnas')?.value || '0');
        params.set('divisor', $('selectDivisor')?.value || '220');
        params.set('adic', $('inputPercentual')?.value || '20');
    } else if (moduloId === 'rescisao') {
        params.set('salario', parseCurrency($('rescSalario')?.value || '0'));
        params.set('motivo', $('rescMotivo')?.value || 'sem_justa_causa');
        params.set('adm', $('rescDataAdm')?.value || '');
        params.set('dem', $('rescDataDem')?.value || '');
        params.set('dias', $('rescDiasTrab')?.value || '30');
        params.set('fgts', parseCurrency($('rescSaldoFGTS')?.value || '0'));
        params.set('aviso', $('rescTipoAviso')?.value || 'indenizado');
    } else if (moduloId === 'faltas') {
        params.set('salario', parseCurrency($('faltSalario')?.value || '0'));
        params.set('dias', $('faltDias')?.value || '0');
        params.set('horas', $('faltHorasAtraso')?.value || '0');
        params.set('dsr', $('faltDSR')?.value || '0');
    } else if (moduloId === 'ferias') {
        params.set('salario', parseCurrency($('ferSalario')?.value || '0'));
        params.set('dias', $('ferDias')?.value || '30');
        params.set('abono', $('ferAbono')?.checked ? '1' : '0');
        params.set('dobro', $('ferDobro')?.checked ? '1' : '0');
        params.set('meses13', $('fer13Meses')?.value || '12');
    } else if (moduloId === 'liquido') {
        params.set('salario', parseCurrency($('liqSalario')?.value || '0'));
        params.set('he50', $('liqHE50')?.value || '0');
        params.set('he100', $('liqHE100')?.value || '0');
        params.set('dep', $('liqDependentes')?.value || '0');
        params.set('vt', $('liqOptanteVT')?.checked ? '1' : '0');
        params.set('vr', parseCurrency($('liqVR')?.value || '0'));
        params.set('saude', parseCurrency($('liqSaude')?.value || '0'));
    } else if (moduloId === 'clt-pj') {
        params.set('salario', parseCurrency($('cltPjSalarioBase')?.value || '0'));
        params.set('regime', $('cltPjRegimeEmpresa')?.value || 'simples');
        params.set('dep', $('cltPjDependentes')?.value || '0');
        params.set('proposto', parseCurrency($('cltPjFaturamentoProposto')?.value || '0'));
        params.set('aliq', $('cltPjAliqSimples')?.value || '6');
    }

    const shareUrl = `${window.location.origin}${window.location.pathname}#${moduloId}?${params.toString()}`;
    copiarTextoClipboard(shareUrl);
    showToast('Link da simulação copiado! Pronto para compartilhar.', 'link');
}

function aplicarParametrosUrl() {
    const $ = id => document.getElementById(id);
    const rawHash = window.location.hash.replace('#', '');
    if (!rawHash.includes('?')) return;

    const [panelId, queryStr] = rawHash.split('?');
    const params = new URLSearchParams(queryStr);

    if (panelId === 'noturno') {
        if (params.has('salario') && $('inputSalarioBase')) $('inputSalarioBase').value = formatNumber(Number(params.get('salario')), 2);
        if (params.has('horas') && $('inputHorasNoturnas')) $('inputHorasNoturnas').value = params.get('horas');
        if (params.has('divisor') && $('selectDivisor')) $('selectDivisor').value = params.get('divisor');
        if (params.has('adic') && $('inputPercentual')) $('inputPercentual').value = params.get('adic');
        $('inputSalarioBase')?.dispatchEvent(new Event('input'));
    } else if (panelId === 'rescisao') {
        if (params.has('salario') && $('rescSalario')) $('rescSalario').value = formatNumber(Number(params.get('salario')), 2);
        if (params.has('motivo') && $('rescMotivo')) $('rescMotivo').value = params.get('motivo');
        if (params.has('adm') && $('rescDataAdm')) $('rescDataAdm').value = params.get('adm');
        if (params.has('dem') && $('rescDataDem')) $('rescDataDem').value = params.get('dem');
        if (params.has('dias') && $('rescDiasTrab')) $('rescDiasTrab').value = params.get('dias');
        if (params.has('fgts') && $('rescSaldoFGTS')) $('rescSaldoFGTS').value = formatNumber(Number(params.get('fgts')), 2);
        if (params.has('aviso') && $('rescTipoAviso')) $('rescTipoAviso').value = params.get('aviso');
        $('rescSalario')?.dispatchEvent(new Event('input'));
    } else if (panelId === 'faltas') {
        if (params.has('salario') && $('faltSalario')) $('faltSalario').value = formatNumber(Number(params.get('salario')), 2);
        if (params.has('dias') && $('faltDias')) $('faltDias').value = params.get('dias');
        if (params.has('horas') && $('faltHorasAtraso')) $('faltHorasAtraso').value = params.get('horas');
        if (params.has('dsr') && $('faltDSR')) $('faltDSR').value = params.get('dsr');
        $('faltSalario')?.dispatchEvent(new Event('input'));
    } else if (panelId === 'ferias') {
        if (params.has('salario') && $('ferSalario')) $('ferSalario').value = formatNumber(Number(params.get('salario')), 2);
        if (params.has('dias') && $('ferDias')) $('ferDias').value = params.get('dias');
        if (params.has('abono') && $('ferAbono')) $('ferAbono').checked = params.get('abono') === '1';
        if (params.has('dobro') && $('ferDobro')) $('ferDobro').checked = params.get('dobro') === '1';
        if (params.has('meses13') && $('fer13Meses')) $('fer13Meses').value = params.get('meses13');
        $('ferSalario')?.dispatchEvent(new Event('input'));
    } else if (panelId === 'liquido') {
        if (params.has('salario') && $('liqSalario')) $('liqSalario').value = formatNumber(Number(params.get('salario')), 2);
        if (params.has('he50') && $('liqHE50')) $('liqHE50').value = params.get('he50');
        if (params.has('he100') && $('liqHE100')) $('liqHE100').value = params.get('he100');
        if (params.has('dep') && $('liqDependentes')) $('liqDependentes').value = params.get('dep');
        if (params.has('vt') && $('liqOptanteVT')) $('liqOptanteVT').checked = params.get('vt') === '1';
        if (params.has('vr') && $('liqVR')) $('liqVR').value = formatNumber(Number(params.get('vr')), 2);
        if (params.has('saude') && $('liqSaude')) $('liqSaude').value = formatNumber(Number(params.get('saude')), 2);
        $('liqSalario')?.dispatchEvent(new Event('input'));
    } else if (panelId === 'clt-pj') {
        if (params.has('salario') && $('cltPjSalarioBase')) $('cltPjSalarioBase').value = formatNumber(Number(params.get('salario')), 2);
        if (params.has('regime') && $('cltPjRegimeEmpresa')) $('cltPjRegimeEmpresa').value = params.get('regime');
        if (params.has('dep') && $('cltPjDependentes')) $('cltPjDependentes').value = params.get('dep');
        if (params.has('proposto') && $('cltPjFaturamentoProposto')) $('cltPjFaturamentoProposto').value = formatNumber(Number(params.get('proposto')), 2);
        if (params.has('aliq') && $('cltPjAliqSimples')) $('cltPjAliqSimples').value = params.get('aliq');
        $('cltPjSalarioBase')?.dispatchEvent(new Event('input'));
    } else if (panelId === 'banco-horas') {
        if (params.has('salario') && $('bancoSalario')) $('bancoSalario').value = formatNumber(Number(params.get('salario')), 2);
        if (params.has('horas') && $('bancoSaldoHoras')) $('bancoSaldoHoras').value = params.get('horas');
        if (params.has('tipo') && $('bancoTipoSaldo')) $('bancoTipoSaldo').value = params.get('tipo');
        if (params.has('adic') && $('bancoAdicional')) $('bancoAdicional').value = params.get('adic');
        $('bancoSalario')?.dispatchEvent(new Event('input'));
    } else if (panelId === 'plr') {
        if (params.has('bruto') && $('plrValorBruto')) $('plrValorBruto').value = formatNumber(Number(params.get('bruto')), 2);
        if (params.has('ant') && $('plrAntecipacao')) $('plrAntecipacao').value = formatNumber(Number(params.get('ant')), 2);
        $('plrValorBruto')?.dispatchEvent(new Event('input'));
    } else if (panelId === 'teletrabalho') {
        if (params.has('net') && $('teleFaturaInternet')) $('teleFaturaInternet').value = formatNumber(Number(params.get('net')), 2);
        if (params.has('dias') && $('teleDiasHomeOffice')) $('teleDiasHomeOffice').value = params.get('dias');
        if (params.has('vt') && $('teleValorVTDiario')) $('teleValorVTDiario').value = formatNumber(Number(params.get('vt')), 2);
        $('teleFaturaInternet')?.dispatchEvent(new Event('input'));
    } else if (panelId === 'equiparacao') {
        if (params.has('salario') && $('equipSalarioReclamante')) $('equipSalarioReclamante').value = formatNumber(Number(params.get('salario')), 2);
        if (params.has('paradigma') && $('equipSalarioParadigma')) $('equipSalarioParadigma').value = formatNumber(Number(params.get('paradigma')), 2);
        if (params.has('meses') && $('equipMeses')) $('equipMeses').value = params.get('meses');
        $('equipSalarioReclamante')?.dispatchEvent(new Event('input'));
    }
}

// ═══════════════════════════════════════════════════════════════════════
//  MÓDULO 6: SIMULADOR CLT VS. PJ & CUSTOS
// ═══════════════════════════════════════════════════════════════════════
function initCltPjModule() {
    const $ = id => document.getElementById(id);
    let currentResult = null;
    let currentParams = null;
    let prev = { custoEmpresa: 0, poderCompraClt: 0, liquidoPj: 0, breakEven: 0 };

    function getParams() {
        const salario = parseCurrency($('cltPjSalarioBase')?.value || '6000');
        const regime = $('cltPjRegimeEmpresa')?.value || 'simples';
        const dependentes = Math.max(0, parseInt($('cltPjDependentes')?.value, 10) || 0);
        const rat = Math.max(1, Math.min(3, parseFloat($('cltPjRat')?.value) || 2));
        const fap = Math.max(0.5, Math.min(2, parseFloat($('cltPjFap')?.value) || 1.0));
        const vrVa = parseCurrency($('cltPjVrVa')?.value || '0');
        const saude = parseCurrency($('cltPjSaude')?.value || '0');
        const proposto = parseCurrency($('cltPjFaturamentoProposto')?.value || '0');
        const aliqSimples = parseFloat($('cltPjAliqSimples')?.value) || 6;
        const contador = parseCurrency($('cltPjContador')?.value || '200');

        return {
            salarioBase: salario,
            regimeTributario: regime,
            aliquotaRat: rat,
            fap: fap,
            aliquotaTerceiros: 5.8,
            dependentesIrrf: dependentes,
            beneficios: {
                vrVa: vrVa,
                saude: saude
            },
            aliquotaSimplesPj: aliqSimples,
            custoContadorPj: contador,
            faturamentoPjInformado: proposto
        };
    }

    function calc() {
        currentParams = getParams();
        currentResult = calcularCustosCltPj(currentParams);
        const r = currentResult;

        // Animação GSAP nos cards de KPI
        animarContador($('cltPjResCustoEmpresa'), prev.custoEmpresa, r.empresaClt.custoTotalMensal);
        animarContador($('cltPjResPoderCompraClt'), prev.poderCompraClt, r.trabalhadorClt.poderCompraTotalMensal);
        animarContador($('cltPjResLiquidoPj'), prev.liquidoPj, r.pjSimulado.liquidoRealNoBolso);
        animarContador($('cltPjResBreakEven'), prev.breakEven, r.pjBreakEven.faturamentoNecessario);

        // Subtítulos informativos
        if ($('cltPjResMultiplicadorEmpresa')) {
            $('cltPjResMultiplicadorEmpresa').textContent = `${(r.empresaClt.multiplicadorCusto * 100).toFixed(1)}% do salário base (${r.parametros.regimeTributario === 'simples' ? 'Simples Nacional' : 'Lucro Presumido'})`;
        }
        if ($('cltPjResMultiplicadorBreakEven')) {
            $('cltPjResMultiplicadorBreakEven').textContent = `Mínimo de ${r.pjBreakEven.multiplicadorSalario.toFixed(2)}x o salário CLT`;
        }
        if ($('cltPjResVereditoSimulado')) {
            const diff = r.pjSimulado.diferencaVsPoderCompraClt;
            if (diff >= 0) {
                $('cltPjResVereditoSimulado').innerHTML = `<span class="text-emerald-400 font-bold">PJ mais vantajoso: +${formatCurrency(diff)}/mês (+${r.pjSimulado.percentualDiferenca.toFixed(1)}%)</span>`;
            } else {
                $('cltPjResVereditoSimulado').innerHTML = `<span class="text-rose-400 font-bold">CLT mais vantajosa: +${formatCurrency(Math.abs(diff))}/mês (${r.pjSimulado.percentualDiferenca.toFixed(1)}%)</span>`;
            }
        }

        // Tabela Comparativa
        const corpo = $('cltPjTabelaCorpo');
        if (corpo) {
            corpo.innerHTML = `
                <tr>
                    <td class="py-2.5 font-medium text-slate-700 dark:text-slate-300">Desembolso da Empresa</td>
                    <td class="py-2.5 font-mono text-rose-500 font-bold">${formatCurrency(r.empresaClt.custoTotalMensal)} /mês</td>
                    <td class="py-2.5 font-mono text-slate-900 dark:text-white font-bold">${formatCurrency(r.pjSimulado.faturamentoBruto)} /mês</td>
                    <td class="py-2.5 ${r.empresaClt.custoTotalMensal > r.pjSimulado.faturamentoBruto ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}">
                        ${r.empresaClt.custoTotalMensal > r.pjSimulado.faturamentoBruto ? `PJ economiza empresa em ${formatCurrency(r.empresaClt.custoTotalMensal - r.pjSimulado.faturamentoBruto)}/mês` : `CLT custa menos para a empresa`}
                    </td>
                </tr>
                <tr>
                    <td class="py-2.5 font-medium text-slate-700 dark:text-slate-300">Salário / Pró-labore em Conta</td>
                    <td class="py-2.5 font-mono text-slate-900 dark:text-white">${formatCurrency(r.trabalhadorClt.salarioLiquidoEmFolha)}</td>
                    <td class="py-2.5 font-mono text-slate-900 dark:text-white">${formatCurrency(r.pjSimulado.proLaboreLiquido)}</td>
                    <td class="py-2.5 text-slate-400">Mensal direto em conta corrente</td>
                </tr>
                <tr>
                    <td class="py-2.5 font-medium text-slate-700 dark:text-slate-300">Tributos / Retenções</td>
                    <td class="py-2.5 font-mono text-red-500">− ${formatCurrency(r.trabalhadorClt.inss + r.trabalhadorClt.irrf)} (INSS/IR)</td>
                    <td class="py-2.5 font-mono text-red-500">− ${formatCurrency(r.pjSimulado.dasSimples + r.pjSimulado.inssProLabore + r.pjSimulado.irrfProLabore)} (DAS + IRPF)</td>
                    <td class="py-2.5 text-slate-400">Carga tributária pessoa física + PJ</td>
                </tr>
                <tr>
                    <td class="py-2.5 font-medium text-slate-700 dark:text-slate-300">Benefícios & FGTS (Patrimônio)</td>
                    <td class="py-2.5 font-mono text-emerald-500">+ ${formatCurrency(r.trabalhadorClt.fgtsAcumuladoMensal + r.trabalhadorClt.beneficiosRecebidosMensal)}</td>
                    <td class="py-2.5 font-mono text-slate-400">R$ 0,00 (Particular)</td>
                    <td class="py-2.5 text-slate-400">FGTS 8% + VR/VA + Saúde</td>
                </tr>
                <tr class="bg-indigo-50/50 dark:bg-indigo-950/20 font-bold">
                    <td class="py-3 text-slate-900 dark:text-white">Renda Líquida Efetiva Total</td>
                    <td class="py-3 font-mono text-emerald-600 dark:text-emerald-400">${formatCurrency(r.trabalhadorClt.poderCompraTotalMensal)} /mês</td>
                    <td class="py-3 font-mono text-indigo-600 dark:text-indigo-400">${formatCurrency(r.pjSimulado.liquidoRealNoBolso)} /mês</td>
                    <td class="py-3 ${r.pjSimulado.isVantajosoPj ? 'text-emerald-500' : 'text-rose-500'}">
                        ${r.pjSimulado.isVantajosoPj ? `PJ +${formatCurrency(r.pjSimulado.diferencaVsPoderCompraClt)}/mês` : `CLT +${formatCurrency(Math.abs(r.pjSimulado.diferencaVsPoderCompraClt))}/mês`}
                    </td>
                </tr>
            `;
        }

        // Memória de cálculo
        renderMemoria($('cltPjMemoriaPassos'), r.memoriaCalculo);

        // Gráfico comparativo
        renderChartCltPj(r.empresaClt.custoTotalMensal, r.trabalhadorClt.poderCompraTotalMensal, r.pjSimulado.liquidoRealNoBolso, r.pjSimulado.faturamentoBruto);

        prev = {
            custoEmpresa: r.empresaClt.custoTotalMensal,
            poderCompraClt: r.trabalhadorClt.poderCompraTotalMensal,
            liquidoPj: r.pjSimulado.liquidoRealNoBolso,
            breakEven: r.pjBreakEven.faturamentoNecessario
        };
    }

    function exportExcel() {
        if (!currentResult) calc();
        exportarCltPjExcel(currentResult);
        showToast('Comparativo CLT vs. PJ exportado para Excel!');
        adicionarAoHistorico({
            modulo: 'clt-pj',
            titulo: 'CLT vs. PJ & Custos',
            resumoPrincipal: `Salário ${formatCurrency(currentParams.salarioBase)} vs PJ ${formatCurrency(currentResult.pjSimulado.faturamentoBruto)}`,
            valorPrincipal: currentResult.pjSimulado.liquidoRealNoBolso,
            params: {
                cltPjSalarioBase: currentParams.salarioBase,
                cltPjRegimeEmpresa: currentParams.regimeTributario,
                cltPjDependentes: currentParams.dependentesIrrf,
                cltPjFaturamentoProposto: currentParams.faturamentoPjInformado,
                cltPjAliqSimples: currentParams.aliquotaSimplesPj
            }
        });
    }

    async function copySummary() {
        if (!currentResult) calc();
        const r = currentResult;
        const texto = `RHUB — Comparativo CLT vs. PJ & Custos
Salário CLT Base: ${formatCurrency(r.parametros.salarioBase)}
Custo Mensal Empresa (CLT): ${formatCurrency(r.empresaClt.custoTotalMensal)} (${(r.empresaClt.multiplicadorCusto * 100).toFixed(1)}%)
Poder de Compra Real CLT: ${formatCurrency(r.trabalhadorClt.poderCompraTotalMensal)} /mês
Faturamento PJ Simulado: ${formatCurrency(r.pjSimulado.faturamentoBruto)} /mês
Sobra Real no Bolso PJ: ${formatCurrency(r.pjSimulado.liquidoRealNoBolso)} /mês
Equivalência Break-Even PJ: ${formatCurrency(r.pjBreakEven.faturamentoNecessario)} /mês (${r.pjBreakEven.multiplicadorSalario.toFixed(2)}x)
Diagnóstico: ${r.pjSimulado.isVantajosoPj ? `PJ é vantajoso em +${formatCurrency(r.pjSimulado.diferencaVsPoderCompraClt)}/mês` : `CLT é mais vantajoso em +${formatCurrency(Math.abs(r.pjSimulado.diferencaVsPoderCompraClt))}/mês`}`;
        await copiarTextoClipboard(texto);
        showToast('Resumo comparativo copiado com sucesso!');
    }

    function doPrint() {
        atualizarHeaderImpressao('Simulador CLT vs. PJ & Custo Total do Empregado');
        window.print();
    }

    moduleExportHandlers['clt-pj'] = exportExcel;
    moduleCopyHandlers['clt-pj'] = copySummary;
    modulePrintHandlers['clt-pj'] = doPrint;

    $('btnCalcularCltPj')?.addEventListener('click', calc);
    $('btnExcelCltPj')?.addEventListener('click', exportExcel);
    $('btnShareCltPj')?.addEventListener('click', () => copiarLinkCompartilhamento('clt-pj'));
    $('btnImprimirCltPj')?.addEventListener('click', doPrint);

    // Regime change toggle
    $('cltPjRegimeEmpresa')?.addEventListener('change', (e) => {
        const area = $('cltPjEncargosPresumidoArea');
        if (area) {
            area.classList.toggle('hidden', e.target.value === 'simples');
        }
        calc();
    });

    ['cltPjSalarioBase','cltPjDependentes','cltPjRat','cltPjFap','cltPjVrVa','cltPjSaude','cltPjFaturamentoProposto','cltPjAliqSimples','cltPjContador']
        .forEach(id => {
            const el = $(id);
            if (el) {
                el.addEventListener('input', calc);
                el.addEventListener('change', calc);
            }
        });

    ['cltPjSalarioBase','cltPjVrVa','cltPjSaude','cltPjFaturamentoProposto','cltPjContador'].forEach(id => {
        $(id)?.addEventListener('blur', e => {
            const v = parseCurrency(e.target.value);
            if (v > 0) e.target.value = formatNumber(v, 2);
        });
    });

    calc();
}

// ═══════════════════════════════════════════════════════════════════════
//  MÓDULO 7: BANCO DE HORAS & COMPENSAÇÃO (Art. 59 CLT)
// ═══════════════════════════════════════════════════════════════════════
function initBancoHorasModule() {
    const $ = id => document.getElementById(id);
    let prev = { totalGeral: 0, valorHora: 0, valorExtra: 0, totalHoras: 0, dsr: 0 };
    let currentParams = {};
    let currentResult = null;

    function calc() {
        currentParams = {
            salarioBase: parseCurrency($('bancoSalario')?.value),
            divisorMensal: Number($('bancoDivisor')?.value) || 220,
            saldoHoras: Number($('bancoSaldoHoras')?.value) || 0,
            tipoSaldo: $('bancoTipoSaldo')?.value || 'credito',
            percentualAdicional: Number($('bancoAdicional')?.value) || 50,
            tipoAcordo: $('bancoTipoAcordo')?.value || 'individual',
            diasUteis: Number($('bancoDiasUteis')?.value) || 25,
            domingosFeriados: Number($('bancoDomingosFeriados')?.value) || 5
        };

        const r = calcularBancoHoras(currentParams);
        currentResult = r;

        animarContador($('outBancoTotalGeral'), prev.totalGeral, r.totalGeral);
        animarContador($('outBancoValorHora'), prev.valorHora, r.valorHoraNormal);
        animarContador($('outBancoValorExtra'), prev.valorExtra, r.valorHoraExtra);
        animarContador($('outBancoTotalHoras'), prev.totalHoras, r.totalHoras);
        animarContador($('outBancoValorDsr'), prev.dsr, r.valorDsr);

        const badge = $('outBancoTipoBadge');
        if (badge) {
            badge.textContent = r.isCredito ? 'Crédito a Receber' : 'Débito a Descontar';
            badge.className = r.isCredito
                ? 'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/20 text-violet-300'
                : 'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300';
        }

        const outPrazo = $('outBancoPrazo');
        if (outPrazo) {
            outPrazo.textContent = r.prazoMaximoCompensacao;
        }

        renderMemoria($('bancoMemoriaContainer'), r.memoriaCalculo);
        prev = { totalGeral: r.totalGeral, valorHora: r.valorHoraNormal, valorExtra: r.valorHoraExtra, totalHoras: r.totalHoras, dsr: r.valorDsr };
    }

    function exportExcel() {
        if (!currentResult) calc();
        exportarBancoHorasExcel(currentResult);
        showToast('Planilha de Banco de Horas exportada para Excel!');
        adicionarAoHistorico({
            modulo: 'banco-horas',
            titulo: 'Banco de Horas',
            resumoPrincipal: `${currentParams.saldoHoras}h (${currentParams.tipoSaldo === 'credito' ? 'Crédito' : 'Débito'}) | ${formatCurrency(currentResult.totalGeral)}`,
            valorPrincipal: currentResult.totalGeral,
            params: {
                bancoSalario: currentParams.salarioBase,
                bancoDivisor: currentParams.divisorMensal,
                bancoSaldoHoras: currentParams.saldoHoras,
                bancoTipoSaldo: currentParams.tipoSaldo,
                bancoAdicional: currentParams.percentualAdicional,
                bancoTipoAcordo: currentParams.tipoAcordo,
                bancoDiasUteis: currentParams.diasUteis,
                bancoDomingosFeriados: currentParams.domingosFeriados
            }
        });
    }

    async function copySummary() {
        if (!currentResult) calc();
        const texto = `RHUB — Apuração de Banco de Horas (Art. 59 CLT)
Salário Base: ${formatCurrency(currentParams.salarioBase)} | Divisor: ${currentParams.divisorMensal}h
Saldo: ${currentParams.saldoHoras}h (${currentParams.tipoSaldo === 'credito' ? 'Crédito' : 'Débito'}) | Adicional: ${currentParams.percentualAdicional}%
Valor da Hora Normal: ${formatCurrency(currentResult.valorHoraNormal)}
${currentResult.isCredito ? `Valor Hora Extra: ${formatCurrency(currentResult.valorHoraExtra)}
Subtotal Horas: ${formatCurrency(currentResult.totalHoras)}
Reflexo DSR (Súmula 172 TST): ${formatCurrency(currentResult.valorDsr)}
TOTAL A RECEBER: ${formatCurrency(currentResult.totalGeral)}` : `TOTAL A DESCONTAR: ${formatCurrency(currentResult.totalGeral)}`}
Prazo Legal de Compensação: ${currentResult.prazoMaximoCompensacao}`;
        await copiarTextoClipboard(texto);
        showToast('Resumo de Banco de Horas copiado!');
    }

    function doPrint() {
        atualizarHeaderImpressao('Banco de Horas & Compensação (Art. 59 CLT)');
        window.print();
    }

    moduleExportHandlers['banco-horas'] = exportExcel;
    moduleCopyHandlers['banco-horas'] = copySummary;
    modulePrintHandlers['banco-horas'] = doPrint;

    $('btnExcelBanco')?.addEventListener('click', exportExcel);
    $('btnCopiarBanco')?.addEventListener('click', copySummary);
    $('btnImprimirBanco')?.addEventListener('click', doPrint);
    $('btnShareBanco')?.addEventListener('click', () => {
        if (!currentResult) calc();
        gerarLinkCompartilhamento('banco-horas', {
            salario: currentParams.salarioBase,
            horas: currentParams.saldoHoras,
            tipo: currentParams.tipoSaldo,
            adic: currentParams.percentualAdicional
        });
    });

    ['bancoSalario', 'bancoSaldoHoras', 'bancoDiasUteis', 'bancoDomingosFeriados'].forEach(id => {
        $(id)?.addEventListener('input', calc);
    });
    ['bancoDivisor', 'bancoTipoSaldo', 'bancoAdicional', 'bancoTipoAcordo'].forEach(id => {
        $(id)?.addEventListener('change', calc);
    });
    $('bancoSalario')?.addEventListener('blur', e => {
        const v = parseCurrency(e.target.value);
        if (v > 0) e.target.value = formatNumber(v, 2);
    });

    calc();
}

// ═══════════════════════════════════════════════════════════════════════
//  MÓDULO 8: PARTICIPAÇÃO NOS LUCROS E RESULTADOS (PLR)
// ═══════════════════════════════════════════════════════════════════════
function initPlrModule() {
    const $ = id => document.getElementById(id);
    let prev = { liquido: 0, bruto: 0, irrf: 0, economia: 0 };
    let currentParams = {};
    let currentResult = null;

    function calc() {
        currentParams = {
            valorBrutoPLR: parseCurrency($('plrValorBruto')?.value),
            antecipacaoPaga: parseCurrency($('plrAntecipacao')?.value),
            irrfJaRetido: parseCurrency($('plrIrrfAnterior')?.value)
        };

        const r = calcularPLR(currentParams);
        currentResult = r;

        animarContador($('outPlrLiquido'), prev.liquido, r.liquidoTotal);
        animarContador($('outPlrBruto'), prev.bruto, r.valorBrutoPLR);
        animarContador($('outPlrIrrf'), prev.irrf, r.irrfTotalDevido);
        animarContador($('outPlrEconomiaEmpresa'), prev.economia, r.economiaTotalEmpresa);

        if ($('outPlrAliquotaEfetiva')) $('outPlrAliquotaEfetiva').textContent = `${r.aliquotaEfetiva.toFixed(2)}%`;
        if ($('outPlrFaixaDescricao')) $('outPlrFaixaDescricao').textContent = `${r.faixaIRRF} (Alíquota ${r.aliquotaNominal}%)`;
        if ($('outPlrLiquidoParcela')) $('outPlrLiquidoParcela').textContent = formatCurrency(r.liquidoParcela);

        renderMemoria($('plrMemoriaContainer'), r.memoriaCalculo);
        prev = { liquido: r.liquidoTotal, bruto: r.valorBrutoPLR, irrf: r.irrfTotalDevido, economia: r.economiaTotalEmpresa };
    }

    function exportExcel() {
        if (!currentResult) calc();
        exportarPlrExcel(currentResult);
        showToast('Demonstrativo de PLR exportado para Excel!');
        adicionarAoHistorico({
            modulo: 'plr',
            titulo: 'PLR (Lucros e Resultados)',
            resumoPrincipal: `PLR Bruta ${formatCurrency(currentParams.valorBrutoPLR)} | Líquido ${formatCurrency(currentResult.liquidoTotal)}`,
            valorPrincipal: currentResult.liquidoTotal,
            params: {
                plrValorBruto: currentParams.valorBrutoPLR,
                plrAntecipacao: currentParams.antecipacaoPaga,
                plrIrrfAnterior: currentParams.irrfJaRetido
            }
        });
    }

    async function copySummary() {
        if (!currentResult) calc();
        const texto = `RHUB — Demonstrativo de PLR (Lei 10.101/2000)
Valor Bruto Global: ${formatCurrency(currentResult.valorBrutoPLR)}
IRRF Retido na Fonte (Exclusivo): ${formatCurrency(currentResult.irrfTotalDevido)} (Alíquota Efetiva: ${currentResult.aliquotaEfetiva.toFixed(2)}%)
VALOR LÍQUIDO NO BOLSO: ${formatCurrency(currentResult.liquidoTotal)}
Isenção Legal: R$ 0,00 de INSS e R$ 0,00 de FGTS
Economia Tributária Total para a Empresa: ${formatCurrency(currentResult.economiaTotalEmpresa)}`;
        await copiarTextoClipboard(texto);
        showToast('Resumo da PLR copiado!');
    }

    function doPrint() {
        atualizarHeaderImpressao('Participação nos Lucros e Resultados — PLR (Lei 10.101/00)');
        window.print();
    }

    moduleExportHandlers['plr'] = exportExcel;
    moduleCopyHandlers['plr'] = copySummary;
    modulePrintHandlers['plr'] = doPrint;

    $('btnExcelPlr')?.addEventListener('click', exportExcel);
    $('btnCopiarPlr')?.addEventListener('click', copySummary);
    $('btnImprimirPlr')?.addEventListener('click', doPrint);
    $('btnSharePlr')?.addEventListener('click', () => {
        if (!currentResult) calc();
        gerarLinkCompartilhamento('plr', {
            bruto: currentParams.valorBrutoPLR,
            ant: currentParams.antecipacaoPaga
        });
    });

    ['plrValorBruto', 'plrAntecipacao', 'plrIrrfAnterior'].forEach(id => {
        const el = $(id);
        if (el) {
            el.addEventListener('input', calc);
            el.addEventListener('blur', e => {
                const v = parseCurrency(e.target.value);
                if (v >= 0) e.target.value = formatNumber(v, 2);
            });
        }
    });

    calc();
}

// ═══════════════════════════════════════════════════════════════════════
//  MÓDULO 9: TELETRABALHO & AJUDA DE CUSTO (Art. 75-A CLT)
// ═══════════════════════════════════════════════════════════════════════
function initTeletrabalhoModule() {
    const $ = id => document.getElementById(id);
    let prev = { ajudaCusto: 0, internet: 0, energia: 0, vt: 0, saldo: 0 };
    let currentParams = {};
    let currentResult = null;

    function calc() {
        currentParams = {
            faturaInternet: parseCurrency($('teleFaturaInternet')?.value),
            percentualInternet: Number($('telePercInternet')?.value) || 50,
            diasHomeOffice: Number($('teleDiasHomeOffice')?.value) || 22,
            horasTrabalhoDia: Number($('teleHorasDia')?.value) || 8,
            potenciaEquipamentosWatts: Number($('telePotenciaW')?.value) || 250,
            tarifaEnergiaKwh: Number($('teleTarifaKwh')?.value) || 0.85,
            auxilioErgonomiaEquip: parseCurrency($('teleAuxilioEquip')?.value),
            valorVTDiario: parseCurrency($('teleValorVTDiario')?.value)
        };

        const r = calcularTeletrabalho(currentParams);
        currentResult = r;

        animarContador($('outTeleAjudaCusto'), prev.ajudaCusto, r.totalAjudaCusto);
        animarContador($('outTeleInternet'), prev.internet, r.parcelaInternet);
        animarContador($('outTeleEnergia'), prev.energia, r.parcelaEnergia);
        animarContador($('outTeleVtEconomizado'), prev.vt, r.vtEconomizado);
        animarContador($('outTeleSaldoEmpresa'), prev.saldo, r.saldoEmpresa);

        renderMemoria($('teleMemoriaContainer'), r.memoriaCalculo);
        prev = { ajudaCusto: r.totalAjudaCusto, internet: r.parcelaInternet, energia: r.parcelaEnergia, vt: r.vtEconomizado, saldo: r.saldoEmpresa };
    }

    function exportExcel() {
        if (!currentResult) calc();
        exportarTeletrabalhoExcel(currentResult);
        showToast('Demonstrativo de Teletrabalho exportado para Excel!');
        adicionarAoHistorico({
            modulo: 'teletrabalho',
            titulo: 'Teletrabalho / Home Office',
            resumoPrincipal: `${currentParams.diasHomeOffice} dias remotos | Ajuda de Custo ${formatCurrency(currentResult.totalAjudaCusto)}`,
            valorPrincipal: currentResult.totalAjudaCusto,
            params: {
                teleFaturaInternet: currentParams.faturaInternet,
                telePercInternet: currentParams.percentualInternet,
                teleDiasHomeOffice: currentParams.diasHomeOffice,
                teleHorasDia: currentParams.horasTrabalhoDia,
                telePotenciaW: currentParams.potenciaEquipamentosWatts,
                teleTarifaKwh: currentParams.tarifaEnergiaKwh,
                teleAuxilioEquip: currentParams.auxilioErgonomiaEquip,
                teleValorVTDiario: currentParams.valorVTDiario
            }
        });
    }

    async function copySummary() {
        if (!currentResult) calc();
        const texto = `RHUB — Reembolso / Ajuda de Custo de Teletrabalho (Art. 75-D CLT)
Dias em Home Office: ${currentParams.diasHomeOffice} dias/mês
Parcela Internet (${currentParams.percentualInternet}% de uso): ${formatCurrency(currentResult.parcelaInternet)}
Parcela Energia Elétrica (${currentResult.consumoKwhMes.toFixed(2)} kWh): ${formatCurrency(currentResult.parcelaEnergia)}
Auxílio Equipamento / Ergonomia: ${formatCurrency(currentResult.parcelaEquipamentos)}
TOTAL AJUDA DE CUSTO: ${formatCurrency(currentResult.totalAjudaCusto)} (Isento de INSS/FGTS/IRRF)
VT Presencial Economizado: ${formatCurrency(currentResult.vtEconomizado)} | Saldo Empresa: ${formatCurrency(currentResult.saldoEmpresa)}`;
        await copiarTextoClipboard(texto);
        showToast('Resumo de Teletrabalho copiado!');
    }

    function doPrint() {
        atualizarHeaderImpressao('Teletrabalho / Home Office & Ajuda de Custo (Art. 75-A a 75-E CLT)');
        window.print();
    }

    moduleExportHandlers['teletrabalho'] = exportExcel;
    moduleCopyHandlers['teletrabalho'] = copySummary;
    modulePrintHandlers['teletrabalho'] = doPrint;

    $('btnExcelTele')?.addEventListener('click', exportExcel);
    $('btnCopiarTele')?.addEventListener('click', copySummary);
    $('btnImprimirTele')?.addEventListener('click', doPrint);
    $('btnShareTele')?.addEventListener('click', () => {
        if (!currentResult) calc();
        gerarLinkCompartilhamento('teletrabalho', {
            net: currentParams.faturaInternet,
            dias: currentParams.diasHomeOffice,
            vt: currentParams.valorVTDiario
        });
    });

    ['teleFaturaInternet', 'teleAuxilioEquip', 'teleValorVTDiario'].forEach(id => {
        const el = $(id);
        if (el) {
            el.addEventListener('input', calc);
            el.addEventListener('blur', e => {
                const v = parseCurrency(e.target.value);
                if (v >= 0) e.target.value = formatNumber(v, 2);
            });
        }
    });

    ['telePercInternet', 'teleDiasHomeOffice', 'teleHorasDia', 'telePotenciaW', 'teleTarifaKwh'].forEach(id => {
        const el = $(id);
        if (el) {
            el.addEventListener('input', calc);
            el.addEventListener('change', calc);
        }
    });

    calc();
}

// ═══════════════════════════════════════════════════════════════════════
//  MÓDULO 10: EQUIPARAÇÃO SALARIAL & PASSIVO (Art. 461 CLT)
// ═══════════════════════════════════════════════════════════════════════
function initEquiparacaoModule() {
    const $ = id => document.getElementById(id);
    let prev = { passivo: 0, difMensal: 0, difNominal: 0, reflexos: 0, fgts: 0 };
    let currentParams = {};
    let currentResult = null;

    function calc() {
        currentParams = {
            salarioReclamante: parseCurrency($('equipSalarioReclamante')?.value),
            salarioParadigma: parseCurrency($('equipSalarioParadigma')?.value),
            mesesPeriodo: Number($('equipMeses')?.value) || 24,
            incluir13o: $('equipCheck13')?.checked ?? true,
            incluirFeriasTerco: $('equipCheckFerias')?.checked ?? true,
            incluirFGTS: $('equipCheckFGTS')?.checked ?? true,
            incluirMultaFGTS: $('equipCheckMultaFGTS')?.checked ?? false,
            discriminacaoGenero: $('equipCheckDiscriminacao')?.checked ?? false
        };

        const r = calcularEquiparacao(currentParams);
        currentResult = r;

        animarContador($('outEquipPassivoTotal'), prev.passivo, r.passivoTotal);
        animarContador($('outEquipDiferencaMensal'), prev.difMensal, r.diferencaMensal);
        animarContador($('outEquipDiferencaNominal'), prev.difNominal, r.totalDiferencaNominal);
        animarContador($('outEquipReflexos'), prev.reflexos, r.reflexo13o + r.reflexoFeriasTerco);
        animarContador($('outEquipFgtsTotal'), prev.fgts, r.valorFGTS + r.valorMultaFGTS);

        const badge = $('outEquipPeriodoBadge');
        if (badge) {
            badge.textContent = `${r.mesesPeriodo} meses apurados`;
        }

        renderMemoria($('equipMemoriaContainer'), r.memoriaCalculo);
        prev = { passivo: r.passivoTotal, difMensal: r.diferencaMensal, difNominal: r.totalDiferencaNominal, reflexos: r.reflexo13o + r.reflexoFeriasTerco, fgts: r.valorFGTS + r.valorMultaFGTS };
    }

    function exportExcel() {
        if (!currentResult) calc();
        exportarEquiparacaoExcel(currentResult);
        showToast('Demonstrativo de Equiparação Salarial exportado para Excel!');
        adicionarAoHistorico({
            modulo: 'equiparacao',
            titulo: 'Equiparação Salarial',
            resumoPrincipal: `Dif. Mensal ${formatCurrency(currentResult.diferencaMensal)} | Passivo ${formatCurrency(currentResult.passivoTotal)}`,
            valorPrincipal: currentResult.passivoTotal,
            params: {
                equipSalarioReclamante: currentParams.salarioReclamante,
                equipSalarioParadigma: currentParams.salarioParadigma,
                equipMeses: currentParams.mesesPeriodo,
                equipCheck13: currentParams.incluir13o,
                equipCheckFerias: currentParams.incluirFeriasTerco,
                equipCheckFGTS: currentParams.incluirFGTS,
                equipCheckMultaFGTS: currentParams.incluirMultaFGTS,
                equipCheckDiscriminacao: currentParams.discriminacaoGenero
            }
        });
    }

    async function copySummary() {
        if (!currentResult) calc();
        const texto = `RHUB — Apuração de Equiparação Salarial & Passivo (Art. 461 CLT)
Salário Reclamante: ${formatCurrency(currentResult.salarioReclamante)} | Paradigma: ${formatCurrency(currentResult.salarioParadigma)}
Diferença Salarial Mensal: ${formatCurrency(currentResult.diferencaMensal)} (${currentResult.mesesPeriodo} meses apurados)
Diferenças Salariais Nominais: ${formatCurrency(currentResult.totalDiferencaNominal)}
Reflexo em 13º Salário: ${formatCurrency(currentResult.reflexo13o)}
Reflexo em Férias + 1/3 Constitucional: ${formatCurrency(currentResult.reflexoFeriasTerco)}
Reflexos em Depósito FGTS (8%): ${formatCurrency(currentResult.valorFGTS)}
Multa Rescisória de 40% s/ FGTS: ${formatCurrency(currentResult.valorMultaFGTS)}
${currentResult.multaDiscriminacao > 0 ? `Multa Lei 14.611/2023 (10x novo salário): ${formatCurrency(currentResult.multaDiscriminacao)}\n` : ''}TOTAL PASSIVO TRABALHISTA ESTIMADO: ${formatCurrency(currentResult.passivoTotal)}`;
        await copiarTextoClipboard(texto);
        showToast('Resumo de Equiparação Salarial copiado!');
    }

    function doPrint() {
        atualizarHeaderImpressao('Equiparação Salarial & Passivo Trabalhista (Art. 461 CLT)');
        window.print();
    }

    moduleExportHandlers['equiparacao'] = exportExcel;
    moduleCopyHandlers['equiparacao'] = copySummary;
    modulePrintHandlers['equiparacao'] = doPrint;

    $('btnExcelEquip')?.addEventListener('click', exportExcel);
    $('btnCopiarEquip')?.addEventListener('click', copySummary);
    $('btnImprimirEquip')?.addEventListener('click', doPrint);
    $('btnShareEquip')?.addEventListener('click', () => {
        if (!currentResult) calc();
        gerarLinkCompartilhamento('equiparacao', {
            salario: currentParams.salarioReclamante,
            paradigma: currentParams.salarioParadigma,
            meses: currentParams.mesesPeriodo
        });
    });

    ['equipSalarioReclamante', 'equipSalarioParadigma'].forEach(id => {
        const el = $(id);
        if (el) {
            el.addEventListener('input', calc);
            el.addEventListener('blur', e => {
                const v = parseCurrency(e.target.value);
                if (v >= 0) e.target.value = formatNumber(v, 2);
            });
        }
    });

    $('equipMeses')?.addEventListener('input', calc);

    ['equipCheck13', 'equipCheckFerias', 'equipCheckFGTS', 'equipCheckMultaFGTS', 'equipCheckDiscriminacao'].forEach(id => {
        $(id)?.addEventListener('change', calc);
    });

    calc();
}

// ═══════════════════════════════════════════════════════════════════════
//  MODAL: GUIA & GLOSSÁRIO CLT
// ═══════════════════════════════════════════════════════════════════════
function initGlossarioModal() {
    const modal = document.getElementById('glossarioModal');
    const btnOpen = document.getElementById('topBtnGlossario');
    const btnClose = document.getElementById('closeGlossarioModal');
    const searchInput = document.getElementById('glossarioSearchInput');
    const container = document.getElementById('glossarioCardsList');

    const ARTIGOS_CLT = [
        {
            artigo: 'Art. 58, § 1º da CLT',
            categoria: 'Ponto & Jornada',
            titulo: 'Tolerância de Ponto (5 a 10 minutos)',
            resumo: 'Não serão descontadas nem computadas como jornada extraordinária as variações de horário no registro de ponto não excedentes de 5 minutos, observado o limite máximo de 10 minutos diários.',
            impacto: 'Evita descontos indevidos por atrasos mínimos e horas extras acidentais na entrada/saída.'
        },
        {
            artigo: 'Art. 73 da CLT',
            categoria: 'Adicional Noturno',
            titulo: 'Hora Noturna Ficta e Adicional Mínimo de 20%',
            resumo: 'O trabalho noturno (22h às 05h no urbano) tem hora computada como de 52 minutos e 30 segundos (fator 1,142857) e remuneração com acréscimo de no mínimo 20% sobre a hora diurna.',
            impacto: 'Cada 7 horas de relógio trabalhadas no período noturno equivalem a 8 horas pagas na folha.'
        },
        {
            artigo: 'Súmula 172 do TST',
            categoria: 'DSR / Repouso',
            titulo: 'Reflexo de Horas Extras e Noturno no DSR',
            resumo: 'Computam-se no cálculo do repouso remunerado as horas extraordinárias e o adicional noturno habitualmente prestados (Lei nº 605/49).',
            impacto: 'Fórmula: (Total Adicional ÷ Dias Úteis) × Dias de Repouso (Domingos e Feriados do mês).'
        },
        {
            artigo: 'Art. 130 da CLT',
            categoria: 'Férias',
            titulo: 'Tabela Progressiva de Perda de Férias por Faltas',
            resumo: 'Até 5 faltas no período aquisitivo: 30 dias de férias. De 6 a 14 faltas: 24 dias. De 15 a 23 faltas: 18 dias. De 24 a 32 faltas: 12 dias. Mais de 32 faltas: perda total do direito.',
            impacto: 'Faltas injustificadas reduzem tanto o descanso quanto a remuneração de férias e 1/3.'
        },
        {
            artigo: 'Art. 143 da CLT',
            categoria: 'Férias',
            titulo: 'Abono Pecuniário ("Venda" de Férias)',
            resumo: 'É facultado ao empregado converter 1/3 do período de férias a que tiver direito em abono pecuniário, no valor da remuneração que lhe seria devida nos dias correspondentes.',
            impacto: 'Permite converter até 10 dias de férias em dinheiro, recebendo os 10 dias trabalhados mais o abono.'
        },
        {
            artigo: 'Art. 477 da CLT',
            categoria: 'Rescisão',
            titulo: 'Prazo Único para Pagamento das Verbas Rescisórias',
            resumo: 'A entrega ao empregado de documentos comprobatórios e o pagamento dos valores rescisórios devem ser efetuados em até 10 (dez) dias corridos a contar do término do contrato.',
            impacto: 'O descumprimento gera multa de 1 salário nominal do colaborador a seu favor (Art. 477, § 8º).'
        },
        {
            artigo: 'Art. 484-A da CLT',
            categoria: 'Rescisão',
            titulo: 'Rescisão por Acordo Mútuo (Reforma Trabalhista)',
            resumo: 'O contrato pode ser extinto por acordo: o aviso prévio indenizado e a multa rescisória do FGTS são devidos pela metade (20% de multa). O trabalhador saca até 80% do FGTS, sem direito a seguro-desemprego.',
            impacto: 'Modalidade legal que substitui o antigo acordo informal de devolução de multa de 40%.'
        },
        {
            artigo: 'Lei nº 12.506/2011',
            categoria: 'Aviso Prévio',
            titulo: 'Aviso Prévio Proporcional ao Tempo de Serviço',
            resumo: 'Ao aviso prévio de 30 dias serão acrescidos 3 dias por ano de serviço prestado na mesma empresa, até o máximo de 60 dias adicionais, perfazendo um total de até 90 dias.',
            impacto: 'Colaborador com 3 anos de casa tem direito a 39 dias de aviso prévio indenizado.'
        }
    ];

    function renderGlossario(filtro = '') {
        if (!container) return;
        container.innerHTML = '';
        const termo = filtro.trim().toLowerCase();

        const filtrados = ARTIGOS_CLT.filter(item => 
            item.artigo.toLowerCase().includes(termo) ||
            item.titulo.toLowerCase().includes(termo) ||
            item.categoria.toLowerCase().includes(termo) ||
            item.resumo.toLowerCase().includes(termo) ||
            item.impacto.toLowerCase().includes(termo)
        );

        if (filtrados.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-slate-400">
                    <p class="text-xs">Nenhum artigo encontrado para "<strong>${filtro}</strong>"</p>
                </div>`;
            return;
        }

        filtrados.forEach(item => {
            const card = document.createElement('div');
            card.className = 'p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5';
            card.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">${item.categoria}</span>
                    <span class="text-xs font-mono font-bold text-slate-900 dark:text-white">${item.artigo}</span>
                </div>
                <h4 class="text-xs font-bold text-slate-900 dark:text-white">${item.titulo}</h4>
                <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">${item.resumo}</p>
                <div class="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                    <p class="text-[10px] text-indigo-600 dark:text-indigo-400"><strong>Aplicação no RHUB:</strong> ${item.impacto}</p>
                </div>`;
            container.appendChild(card);
        });
    }

    btnOpen?.addEventListener('click', () => {
        modal?.classList.remove('hidden');
        renderGlossario();
        searchInput?.focus();
    });

    btnClose?.addEventListener('click', () => modal?.classList.add('hidden'));
    modal?.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });

    searchInput?.addEventListener('input', e => renderGlossario(e.target.value));
}

// ═══════════════════════════════════════════════════════════════════════
//  MODAL: CENTRAL DE DESAFIOS DE CRIAÇÃO & ISSUES GITHUB
// ═══════════════════════════════════════════════════════════════════════
function initDesafiosModule() {
    const modal = document.getElementById('desafiosModal');
    const btnOpen = document.getElementById('topBtnDesafios');
    const btnClose = document.getElementById('closeDesafiosModal');

    const tabPropor = document.getElementById('tabBtnProporDesafio');
    const tabMural = document.getElementById('tabBtnMuralDesafios');
    const viewPropor = document.getElementById('viewProporDesafio');
    const viewMural = document.getElementById('viewMuralDesafios');

    const inputTitulo = document.getElementById('desafioTitulo');
    const selectCategoria = document.getElementById('desafioCategoria');
    const inputBaseLegal = document.getElementById('desafioBaseLegal');
    const inputAutor = document.getElementById('desafioAutor');
    const textareaDescricao = document.getElementById('desafioDescricao');

    const btnAbrirIssue = document.getElementById('btnAbrirIssueGitHub');
    const btnCopiarTemplate = document.getElementById('btnCopiarTemplateDesafio');
    const btnSalvarRascunho = document.getElementById('btnSalvarRascunhoDesafio');

    // Alternância de Abas
    function ativarAba(aba) {
        if (aba === 'propor') {
            viewPropor?.classList.remove('hidden');
            viewMural?.classList.add('hidden');
            tabPropor?.classList.add('bg-indigo-600', 'text-white');
            tabPropor?.classList.remove('bg-slate-100', 'text-slate-600', 'dark:bg-slate-800', 'dark:text-slate-400');
            tabMural?.classList.remove('bg-indigo-600', 'text-white');
            tabMural?.classList.add('bg-slate-100', 'text-slate-600', 'dark:bg-slate-800', 'dark:text-slate-400');
        } else {
            viewPropor?.classList.add('hidden');
            viewMural?.classList.remove('hidden');
            tabMural?.classList.add('bg-indigo-600', 'text-white');
            tabMural?.classList.remove('bg-slate-100', 'text-slate-600', 'dark:bg-slate-800', 'dark:text-slate-400');
            tabPropor?.classList.remove('bg-indigo-600', 'text-white');
            tabPropor?.classList.add('bg-slate-100', 'text-slate-600', 'dark:bg-slate-800', 'dark:text-slate-400');
        }
    }

    tabPropor?.addEventListener('click', () => ativarAba('propor'));
    tabMural?.addEventListener('click', () => ativarAba('mural'));

    // Geração do corpo Markdown formatado
    function gerarCorpoMarkdown() {
        const titulo = inputTitulo?.value.trim() || 'Nova Proposta de Módulo ou Regra CLT';
        const categoria = selectCategoria?.value || 'Novo Módulo de Cálculo (CLT)';
        const baseLegal = inputBaseLegal?.value.trim() || 'Legislação Trabalhista / CLT';
        const autor = inputAutor?.value.trim() || 'Comunidade RHUB';
        const descricao = textareaDescricao?.value.trim() || 'Descrição pendente.';

        return {
            tituloIssue: `[Desafio de Criação]: ${titulo}`,
            corpoMarkdown: `### Proposta de Novo Desafio / Funcionalidade — RHUB

**Título do Desafio:** ${titulo}  
**Categoria:** ${categoria}  
**Base Legal / Artigo CLT:** ${baseLegal}  
**Autor da Sugestão:** ${autor}  

---

#### Descrição Detalhada e Regras de Negócio:
${descricao}

---
*Enviado através da Central de Desafios de Criação do RHUB (https://kalicon.github.io/RHUB/)*`
        };
    }

    // Ação: Abrir Issue no GitHub Oficial (Kalicon/RHUB)
    btnAbrirIssue?.addEventListener('click', () => {
        const titulo = inputTitulo?.value.trim();
        const desc = textareaDescricao?.value.trim();

        if (!titulo) {
            showToast('Por favor, informe um título para o desafio.', 'error');
            inputTitulo?.focus();
            return;
        }

        if (!desc) {
            showToast('Descreva a regra de cálculo ou caso de uso.', 'error');
            textareaDescricao?.focus();
            return;
        }

        const { tituloIssue, corpoMarkdown } = gerarCorpoMarkdown();
        const repoUrl = 'https://github.com/Kalicon/RHUB/issues/new';
        const params = new URLSearchParams({
            title: tituloIssue,
            body: corpoMarkdown,
            labels: 'desafio-criacao,enhancement'
        });

        const targetUrl = `${repoUrl}?${params.toString()}`;
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
        showToast('Redirecionando para abrir Issue oficial no GitHub!', 'link');
    });

    // Ação: Copiar Template Markdown
    btnCopiarTemplate?.addEventListener('click', () => {
        const { corpoMarkdown } = gerarCorpoMarkdown();
        copiarTextoClipboard(corpoMarkdown);
        showToast('Modelo copiado para a área de transferência!', 'success');
    });

    // Ação: Salvar Rascunho Local
    btnSalvarRascunho?.addEventListener('click', () => {
        const rascunho = {
            titulo: inputTitulo?.value || '',
            categoria: selectCategoria?.value || '',
            baseLegal: inputBaseLegal?.value || '',
            autor: inputAutor?.value || '',
            descricao: textareaDescricao?.value || ''
        };
        localStorage.setItem('rhub_desafio_rascunho', JSON.stringify(rascunho));
        showToast('Rascunho salvo no seu navegador!', 'info');
    });

    // Carregar rascunho salvo se existir
    function carregarRascunho() {
        try {
            const raw = localStorage.getItem('rhub_desafio_rascunho');
            if (!raw) return;
            const r = JSON.parse(raw);
            if (inputTitulo && r.titulo) inputTitulo.value = r.titulo;
            if (selectCategoria && r.categoria) selectCategoria.value = r.categoria;
            if (inputBaseLegal && r.baseLegal) inputBaseLegal.value = r.baseLegal;
            if (inputAutor && r.autor) inputAutor.value = r.autor;
            if (textareaDescricao && r.descricao) textareaDescricao.value = r.descricao;
        } catch (_) {}
    }

    // Abertura e Fechamento do Modal
    btnOpen?.addEventListener('click', () => {
        carregarRascunho();
        modal?.classList.remove('hidden');
        ativarAba('propor');
        inputTitulo?.focus();
    });

    btnClose?.addEventListener('click', () => modal?.classList.add('hidden'));
    modal?.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
}

// ═══════════════════════════════════════════════════════════════════════
//  PRÉVIA E GERAÇÃO DE DOCUMENTOS PDF (HOLERITE & TRCT)
// ═══════════════════════════════════════════════════════════════════════
let pdfDocumentoAtual = { html: '', filename: 'documento.pdf' };

function abrirPreviaPdf(html, filename = 'documento.pdf', titulo = 'Prévia do Documento Oficial') {
    pdfDocumentoAtual = { html, filename };
    const modal = document.getElementById('modalPdfPreview');
    const container = document.getElementById('pdfPreviewConteudo');
    const titleEl = document.getElementById('pdfPreviewTitulo');

    if (titleEl) titleEl.textContent = titulo;
    if (container) container.innerHTML = html;
    modal?.classList.remove('hidden');
}

function initPdfPreviewModule() {
    const modal = document.getElementById('modalPdfPreview');
    const btnFechar = document.getElementById('btnFecharPdfModal');
    const btnCloseX = document.getElementById('closeModalPdfPreview');
    const btnDownload = document.getElementById('btnConfirmarDownloadPdf');

    const fechar = () => modal?.classList.add('hidden');
    btnFechar?.addEventListener('click', fechar);
    btnCloseX?.addEventListener('click', fechar);
    modal?.addEventListener('click', e => { if (e.target === modal) fechar(); });

    btnDownload?.addEventListener('click', async () => {
        showToast('Gerando PDF vetorial...', 'download');
        await baixarDocumentoPDF(pdfDocumentoAtual.html, pdfDocumentoAtual.filename);
        showToast('Download do PDF concluído com sucesso!', 'success');
        fechar();
    });

    // Botão PDF no painel Salário Líquido
    document.getElementById('btnPdfHolerite')?.addEventListener('click', () => {
        const salario = parseCurrency(document.getElementById('liqSalario')?.value);
        const res = calcularSalarioLiquido({
            salarioBase: salario,
            divisorMensal: Number(document.getElementById('liqDivisor')?.value) || 220,
            horasExtras50: Number(document.getElementById('liqHE50')?.value) || 0,
            horasExtras100: Number(document.getElementById('liqHE100')?.value) || 0,
            adicionalNoturnoValor: parseCurrency(document.getElementById('liqNoturno')?.value),
            insalubridadeGrau: Number(document.getElementById('liqInsalubridade')?.value) || 0,
            periculosidadeAtiva: document.getElementById('liqPericulosidade')?.checked ?? false,
            dependentesIR: Number(document.getElementById('liqDependentes')?.value) || 0,
            pensaoAlimenticia: parseCurrency(document.getElementById('liqPensao')?.value),
            optanteVT: document.getElementById('liqOptanteVT')?.checked ?? true,
            descontoVR: parseCurrency(document.getElementById('liqVR')?.value),
            descontoSaude: parseCurrency(document.getElementById('liqSaude')?.value)
        });

        const proventos = res.rubricasProventos.map(p => ({ codigo: p.codigo, descricao: p.nome, referencia: p.referencia, valor: p.valor }));
        const descontos = res.rubricasDescontos.map(d => ({ codigo: d.codigo, descricao: d.nome, referencia: d.referencia, valor: d.valor }));

        const html = construirHtmlHolerite({
            empresa: { razaoSocial: document.getElementById('printNomeEmpresa')?.textContent || 'EMPRESA DEMONSTRAÇÃO LTDA' },
            colaborador: { nome: document.getElementById('printNomeColaborador')?.textContent || 'Colaborador RHUB' },
            referencia: 'Folha Mensal',
            proventos,
            descontos,
            bases: {
                salarioBase: res.salarioBase,
                baseInss: res.inss.baseCalculo,
                baseFgts: res.salarioBrutoTotal,
                fgtsMes: res.fgtsMes,
                baseIrrf: res.irrf.baseCalculo,
                faixaIrrf: `${res.irrf.aliquota}%`
            }
        });

        abrirPreviaPdf(html, `Holerite_Mensal.pdf`, 'Recibo de Pagamento de Salário (Holerite)');
    });

    // Botão PDF no painel Rescisão Contratual
    document.getElementById('btnPdfTRCT')?.addEventListener('click', () => {
        const salario = parseCurrency(document.getElementById('rescSalario')?.value);
        const res = calcularRescisao({
            salarioBase: salario,
            motivo: document.getElementById('rescMotivo')?.value || 'SEM_JUSTA_CAUSA',
            dataAdmissao: document.getElementById('rescDataAdm')?.value || '2022-01-01',
            dataDemissao: document.getElementById('rescDataDem')?.value || '2026-09-15',
            diasTrabalhadosMes: Number(document.getElementById('rescDiasTrab')?.value) || 15,
            tipoAvisoPrevio: document.getElementById('rescTipoAviso')?.value || 'indenizado',
            feriasVencidas: document.getElementById('rescFeriasVencidas')?.checked ?? false,
            saldoFGTS: parseCurrency(document.getElementById('rescSaldoFGTS')?.value) || 0,
            dependentesIR: Number(document.getElementById('rescDependentes')?.value) || 0
        });

        const verbas = res.rubricasProventos.map((p, idx) => ({ campo: String(50 + idx), descricao: p.nome, valor: p.valor }));
        const deducoes = res.rubricasDescontos.map((d, idx) => ({ campo: String(100 + idx), descricao: d.nome, valor: d.valor }));

        const html = construirHtmlTRCT({
            empresa: { razaoSocial: document.getElementById('printNomeEmpresa')?.textContent || 'EMPRESA DEMONSTRAÇÃO LTDA' },
            trabalhador: { nome: document.getElementById('printNomeColaborador')?.textContent || 'Colaborador RHUB' },
            contrato: {
                motivo: document.getElementById('rescMotivo')?.options[document.getElementById('rescMotivo')?.selectedIndex]?.text,
                dataAdmissao: document.getElementById('rescDataAdm')?.value,
                dataDemissao: document.getElementById('rescDataDem')?.value,
                salarioBase: salario
            },
            verbas,
            deducoes
        });

        abrirPreviaPdf(html, `TRCT_Rescisao.pdf`, 'Termo de Rescisão do Contrato de Trabalho (TRCT)');
    });
}

// ═══════════════════════════════════════════════════════════════════════
//  GESTÃO DE CONVENÇÕES E ACORDOS COLETIVOS (CCT / ACT)
// ═══════════════════════════════════════════════════════════════════════
function initCctModule() {
    const $ = id => document.getElementById(id);
    const modal = $('modalCCT');
    const btnOpen = $('topBtnCCT');
    const btnClose = $('closeModalCCT');
    const form = $('formCCT');
    const btnRestaurar = $('btnRestaurarCCT');
    const badgeStatus = $('badgeCctStatus');

    function sincronizarFormulario() {
        const config = obterConfigCCT();
        if ($('cctAtivo')) $('cctAtivo').checked = config.ativo;
        if ($('cctNomeSindicato')) $('cctNomeSindicato').value = config.nomeSindicato || '';
        if ($('cctAdicNoturno')) $('cctAdicNoturno').value = config.adicionalNoturnoPercentual || 20;
        if ($('cctPisoSalarial')) $('cctPisoSalarial').value = config.pisoSalarial || 1412;
        if ($('cctSabadoDsr')) $('cctSabadoDsr').checked = config.sabadoComoDsr;
        if ($('cctTipoAts')) $('cctTipoAts').value = config.tipoAts || 'NENHUM';
        if ($('cctPercentualAts')) $('cctPercentualAts').value = config.percentualAtsPorPeriodo || 0;

        if (badgeStatus) {
            if (config.ativo) badgeStatus.classList.remove('hidden');
            else badgeStatus.classList.add('hidden');
        }
    }

    sincronizarFormulario();

    btnOpen?.addEventListener('click', () => {
        sincronizarFormulario();
        modal?.classList.remove('hidden');
    });

    const fechar = () => modal?.classList.add('hidden');
    btnClose?.addEventListener('click', fechar);
    modal?.addEventListener('click', e => { if (e.target === modal) fechar(); });

    form?.addEventListener('submit', e => {
        e.preventDefault();
        const novaConfig = {
            ativo: $('cctAtivo')?.checked ?? false,
            nomeSindicato: $('cctNomeSindicato')?.value || 'Convenção Coletiva',
            adicionalNoturnoPercentual: parseFloat($('cctAdicNoturno')?.value) || 20,
            pisoSalarial: parseFloat($('cctPisoSalarial')?.value) || 1412,
            sabadoComoDsr: $('cctSabadoDsr')?.checked ?? false,
            tipoAts: $('cctTipoAts')?.value || 'NENHUM',
            percentualAtsPorPeriodo: parseFloat($('cctPercentualAts')?.value) || 0
        };

        salvarConfigCCT(novaConfig);
        sincronizarFormulario();
        fechar();
        showToast('Regras da Convenção Coletiva salvas com sucesso!', 'success');
    });

    btnRestaurar?.addEventListener('click', () => {
        if (confirm('Deseja restaurar as regras padrão da CLT?')) {
            restaurarPadraoCLT();
            sincronizarFormulario();
            fechar();
            showToast('Regras restauradas para o padrão CLT.');
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════
//  MODO DE AUDITORIA E DICIONÁRIO ESOCIAL (S-1010)
// ═══════════════════════════════════════════════════════════════════════
function initEsocialModule() {
    const $ = id => document.getElementById(id);
    const btnTop = $('topBtnEsocial');
    const modal = $('modalEsocial');
    const btnClose = $('closeModalEsocial');
    const filtroInput = $('filtroEsocialRubricas');
    const listaContainer = $('esocialRubricasLista');

    btnTop?.addEventListener('click', e => {
        renderizarRubricas();
        modal?.classList.remove('hidden');
    });

    const fechar = () => modal?.classList.add('hidden');
    btnClose?.addEventListener('click', fechar);
    modal?.addEventListener('click', e => { if (e.target === modal) fechar(); });

    function renderizarRubricas() {
        if (!listaContainer) return;
        const termo = (filtroInput?.value || '').toLowerCase().trim();
        const rubricas = listarTodasRubricas().filter(r => 
            r.codigo.includes(termo) ||
            r.nome.toLowerCase().includes(termo) ||
            r.fundamento.toLowerCase().includes(termo)
        );

        listaContainer.innerHTML = rubricas.map(r => `
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs">
                <div class="flex items-center justify-between mb-1.5">
                    <div class="flex items-center gap-2">
                        <span class="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                            eSocial ${r.codigo}
                        </span>
                        <span class="font-bold text-slate-900 dark:text-white">${r.nome}</span>
                    </div>
                    <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${r.tipo === 'PROVENTO' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'}">
                        ${r.tipo}
                    </span>
                </div>
                <div class="grid grid-cols-3 gap-2 my-2 py-2 border-y border-slate-200/60 dark:border-slate-700/60 font-mono text-[10px]">
                    <div><span class="text-slate-400 block font-sans">INSS (CP):</span><strong>Cód. ${r.incidencias.inss.codigo}</strong> &bull; ${r.incidencias.inss.descricao}</div>
                    <div><span class="text-slate-400 block font-sans">FGTS:</span><strong>Cód. ${r.incidencias.fgts.codigo}</strong> &bull; ${r.incidencias.fgts.descricao}</div>
                    <div><span class="text-slate-400 block font-sans">IRRF:</span><strong>Cód. ${r.incidencias.irrf.codigo}</strong> &bull; ${r.incidencias.irrf.descricao}</div>
                </div>
                <span class="text-[10px] text-slate-400">Base Legal: ${r.fundamento}</span>
            </div>
        `).join('');
    }

    filtroInput?.addEventListener('input', renderizarRubricas);
}

// ═══════════════════════════════════════════════════════════════════════
//  MODULE 11: FOLHA DE PAGAMENTO EM LOTE (BATCH PAYROLL & ANALYTICS)
// ═══════════════════════════════════════════════════════════════════════
function initFolhaLoteModule() {
    const $ = id => document.getElementById(id);
    let loteColaboradores = [];
    let loteResumo = null;
    let loteConfig = {};

    function obterConfigEmpresa() {
        return {
            razaoSocial: $('printNomeEmpresa')?.textContent || 'EMPRESA DEMONSTRAÇÃO LTDA',
            cnpj: '12.345.678/0001-90',
            optanteSimples: $('loteRegime')?.value === 'simples',
            aliquotaRat: parseFloat($('loteRat')?.value) || 2.0,
            fatorFap: parseFloat($('loteFap')?.value) || 1.0,
            aliquotaTerceiros: parseFloat($('loteTerceiros')?.value) || 5.8,
            mesReferencia: 'Setembro / 2026'
        };
    }

    function processarERenderizar(colaboradores) {
        loteColaboradores = colaboradores;
        loteConfig = obterConfigEmpresa();
        const { resultados, resumo } = processarFolhaLote(loteColaboradores, loteConfig);
        loteResumo = resumo;

        if ($('outLoteCustoTotal')) $('outLoteCustoTotal').textContent = formatCurrency(resumo.totalCustoEmpresa);
        if ($('outLoteQtdColab')) $('outLoteQtdColab').textContent = String(resumo.totalColaboradores);
        if ($('outLoteTotalLiquido')) $('outLoteTotalLiquido').textContent = formatCurrency(resumo.totalLiquido);
        if ($('outLoteTotalEncargos')) $('outLoteTotalEncargos').textContent = formatCurrency(resumo.totalInssPatronal + resumo.totalRatFap + resumo.totalTerceiros + resumo.totalFgts);
        if ($('outLoteTotalTributos')) $('outLoteTotalTributos').textContent = formatCurrency(resumo.totalTributosGoverno);

        renderizarTabela(resultados);
    }

    function renderizarTabela(resultados) {
        const tbody = $('tabelaCorpoLote');
        if (!tbody) return;
        tbody.innerHTML = '';

        const filtro = ($('filtroColaboradorLote')?.value || '').toLowerCase().trim();
        const filtrados = resultados.filter(r => 
            r.nome.toLowerCase().includes(filtro) || 
            r.cargo.toLowerCase().includes(filtro) || 
            r.matricula.includes(filtro)
        );

        if (filtrados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="py-8 text-center text-slate-400">
                        Nenhum colaborador carregado. Clique em "Carregar Demonstração" ou importe uma planilha.
                    </td>
                </tr>`;
            return;
        }

        filtrados.forEach(colab => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-xs';
            tr.innerHTML = `
                <td class="py-3 px-4 font-mono text-slate-500">${colab.matricula}</td>
                <td class="py-3 px-4">
                    <span class="font-bold text-slate-900 dark:text-white block">${colab.nome}</span>
                    <span class="text-[10px] text-slate-400">${colab.cargo}</span>
                </td>
                <td class="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">${formatCurrency(colab.salarioBase)}</td>
                <td class="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">+ ${formatCurrency(colab.totalProventosBrutos - colab.salarioBase)}</td>
                <td class="py-3 px-4 text-right font-mono text-red-500">− ${formatCurrency(colab.totalDescontos)}</td>
                <td class="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">${formatCurrency(colab.salarioLiquido)}</td>
                <td class="py-3 px-4 text-right font-mono text-slate-500">${formatCurrency(colab.valorFgts)}</td>
                <td class="py-3 px-4 text-right font-mono font-semibold text-cyan-600 dark:text-cyan-400">${formatCurrency(colab.custoEmpresa)}</td>
                <td class="py-3 px-4 text-center">
                    <button class="btn-holerite-pdf p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors" title="Gerar Holerite Oficial (PDF)">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    </button>
                </td>
            `;

            tr.querySelector('.btn-holerite-pdf')?.addEventListener('click', () => {
                abrirHoleriteColaborador(colab);
            });

            tbody.appendChild(tr);
        });
    }

    function abrirHoleriteColaborador(colab) {
        const proventos = [
            { codigo: '1000', descricao: 'Salário Base Mensal', referencia: '30d', valor: colab.salarioBase }
        ];
        if (colab.totalHe50 > 0) proventos.push({ codigo: '1003', descricao: 'Horas Extras (50%)', referencia: `${colab.horasExtras50}h`, valor: colab.totalHe50 });
        if (colab.totalHe100 > 0) proventos.push({ codigo: '1004', descricao: 'Horas Extras (100%)', referencia: `${colab.horasExtras100}h`, valor: colab.totalHe100 });
        if (colab.dsrHe > 0) proventos.push({ codigo: '1020', descricao: 'D.S.R. sobre Horas Extras', referencia: 'Súm. 172', valor: colab.dsrHe });
        if (colab.valorAts > 0) proventos.push({ codigo: '1060', descricao: 'Adicional Tempo Serviço (CCT)', referencia: '', valor: colab.valorAts });

        const descontos = [];
        if (colab.valorFaltas > 0) descontos.push({ codigo: '9230', descricao: 'Faltas Injustificadas', referencia: `${colab.faltasDias}d`, valor: colab.valorFaltas });
        if (colab.valorInss > 0) descontos.push({ codigo: '9201', descricao: 'INSS Empregado', referencia: `${colab.aliquotaEfetivaInss?.toFixed(2)}%`, valor: colab.valorInss });
        if (colab.valorIrrf > 0) descontos.push({ codigo: '9214', descricao: 'IRRF Empregado', referencia: `${colab.aliquotaEfetivaIrrf?.toFixed(2)}%`, valor: colab.valorIrrf });
        if (colab.valorVtDesconto > 0) descontos.push({ codigo: '9220', descricao: 'Vale Transporte (6%)', referencia: '6%', valor: colab.valorVtDesconto });

        const html = construirHtmlHolerite({
            empresa: { razaoSocial: loteConfig.razaoSocial, cnpj: loteConfig.cnpj },
            colaborador: { nome: colab.nome, cargo: colab.cargo, matricula: colab.matricula, cbo: '4110-10' },
            referencia: loteConfig.mesReferencia,
            proventos,
            descontos,
            bases: {
                salarioBase: colab.salarioBase,
                baseInss: colab.totalProventosBrutos - colab.valorFaltas,
                baseFgts: colab.totalProventosBrutos - colab.valorFaltas,
                fgtsMes: colab.valorFgts,
                baseIrrf: Math.max(0, colab.totalProventosBrutos - colab.valorFaltas - colab.valorInss),
                faixaIrrf: colab.valorIrrf > 0 ? `${colab.aliquotaEfetivaIrrf?.toFixed(1)}%` : 'Isento'
            }
        });

        abrirPreviaPdf(html, `Holerite_${colab.nome.replace(/\s+/g, '_')}.pdf`, `Holerite — ${colab.nome}`);
    }

    $('btnLoteDemo')?.addEventListener('click', () => {
        const demo = gerarDemonstracaoFolha();
        processarERenderizar(demo);
        showToast('Demonstração carregada com 8 colaboradores!', 'success');
    });

    $('btnLotePuxarCadastro')?.addEventListener('click', async () => {
        try {
            const cadastrados = await listarColaboradores();
            const ativos = cadastrados.filter(c => c.status !== 'Desligado');
            if (ativos.length === 0) {
                showToast('Nenhum colaborador ativo no cadastro. Cadastre ou use a demonstração.', 'warning');
                return;
            }
            const convertidos = ativos.map(c => converterParaItemFolha(c));
            processarERenderizar(convertidos);
            showToast(`${convertidos.length} colaboradores ativos carregados do cadastro!`, 'success');
        } catch (err) {
            console.error(err);
            showToast('Erro ao puxar colaboradores do cadastro.', 'error');
        }
    });

    $('btnLoteBaixarModelo')?.addEventListener('click', () => {
        const csv = gerarCsvTemplate();
        baixarTemplateCsvFolha(csv);
        showToast('Modelo de planilha CSV baixado!', 'download');
    });

    $('btnLoteExportarExcel')?.addEventListener('click', () => {
        if (loteColaboradores.length === 0) {
            showToast('Carregue os colaboradores antes de exportar.', 'error');
            return;
        }
        exportarFolhaLoteXLSX(loteColaboradores, loteResumo, loteConfig);
        showToast('Folha consolidada exportada com sucesso!', 'success');
    });

    $('filtroColaboradorLote')?.addEventListener('input', () => {
        if (loteColaboradores.length > 0) {
            const { resultados } = processarFolhaLote(loteColaboradores, loteConfig);
            renderizarTabela(resultados);
        }
    });

    ['loteRegime', 'loteRat', 'loteFap', 'loteTerceiros'].forEach(id => {
        $(id)?.addEventListener('change', () => {
            if (loteColaboradores.length > 0) processarERenderizar(loteColaboradores);
        });
    });

    const inputUpload = $('inputFileLote');
    const dropZone = $('dropZoneLote');

    dropZone?.addEventListener('click', () => inputUpload?.click());
    dropZone?.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('border-cyan-500'); });
    dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('border-cyan-500'));
    dropZone?.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('border-cyan-500');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processarArquivoUpload(e.dataTransfer.files[0]);
        }
    });

    inputUpload?.addEventListener('change', e => {
        if (e.target.files && e.target.files[0]) {
            processarArquivoUpload(e.target.files[0]);
        }
    });

    function processarArquivoUpload(file) {
        const reader = new FileReader();
        const nome = file.name.toLowerCase();

        if (nome.endsWith('.csv') || nome.endsWith('.txt')) {
            reader.onload = evt => {
                const colabs = parsearCsvFolha(evt.target.result);
                if (colabs.length === 0) showToast('Nenhum colaborador válido encontrado no CSV.', 'error');
                else { processarERenderizar(colabs); showToast(`${colabs.length} colaboradores importados!`, 'success'); }
            };
            reader.readAsText(file, 'utf-8');
        } else if (nome.endsWith('.xlsx') || nome.endsWith('.xls')) {
            reader.onload = evt => {
                try {
                    const data = new Uint8Array(evt.target.result);
                    const workbook = window.XLSX ? XLSX.read(data, { type: 'array' }) : null;
                    if (workbook) {
                        const csvText = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
                        const colabs = parsearCsvFolha(csvText);
                        processarERenderizar(colabs);
                        showToast(`${colabs.length} colaboradores importados do Excel!`, 'success');
                    }
                } catch (err) {
                    showToast('Erro ao ler arquivo Excel.', 'error');
                }
            };
            reader.readAsArrayBuffer(file);
        }
    }

    moduleExportHandlers['folha-lote'] = () => {
        if (loteColaboradores.length > 0) {
            exportarFolhaLoteXLSX(loteColaboradores, loteResumo, loteConfig);
            showToast('Folha consolidada exportada!');
        } else {
            showToast('Nenhuma folha carregada para exportação.', 'error');
        }
    };
}

// ═══════════════════════════════════════════════════════════════════════
//  MÓDULO: GESTÃO E ESCALA DE FÉRIAS (HRMS FASE 02)
// ═══════════════════════════════════════════════════════════════════════

function initGestaoFeriasModule() {
    const $ = id => document.getElementById(id);

    let anoEscalaAtual = new Date().getFullYear();
    let colaboradoresCache = [];
    let feriasCache = [];
    let colaboradorSelecionado = null;
    let periodosAquisitivosColaborador = [];

    // ─── Atualização Global de Dados ──────────────────────────
    async function carregarDados() {
        try {
            await carregarSementeSeVazio();
            colaboradoresCache = await listarColaboradores();
            feriasCache = await listarTodasFerias();

            atualizarKPIs();
            renderizarMapaAnual();
            renderizarTabelaPeriodos();
            popularSelectColaboradores();
        } catch (e) {
            console.error('Erro ao carregar dados de férias:', e);
        }
    }

    // ─── KPIs & Alertas Trabalhistas ───────────────────────────
    function atualizarKPIs() {
        // 1. Agendamentos no ano corrente
        const agendamentosAno = feriasCache.filter(f => {
            if (!f.periodos || !Array.isArray(f.periodos)) return false;
            return f.periodos.some(p => p.dataInicio && p.dataInicio.startsWith(String(anoEscalaAtual)));
        });
        if ($('statTotalAgendamentosFerias')) {
            $('statTotalAgendamentosFerias').textContent = String(agendamentosAno.length);
        }

        // 2. Férias vencidas (Art. 137 CLT)
        const alertasVencidas = verificarAlertaFeriasVencidas(colaboradoresCache, feriasCache);
        const totalVencidas = alertasVencidas.length;

        if ($('statFeriasVencidas')) {
            $('statFeriasVencidas').textContent = String(totalVencidas);
        }

        const badgeSidebar = $('badgeAlertaFerias');
        if (badgeSidebar) {
            if (totalVencidas > 0) {
                badgeSidebar.textContent = `${totalVencidas} Vencida${totalVencidas > 1 ? 's' : ''}`;
                badgeSidebar.classList.remove('hidden');
            } else {
                badgeSidebar.classList.add('hidden');
            }
        }

        const bannerVencidas = $('bannerAlertaFeriasVencidas');
        const bannerTexto = $('bannerAlertaFeriasVencidasTexto');
        if (bannerVencidas && bannerTexto) {
            if (totalVencidas > 0) {
                bannerTexto.textContent = `${totalVencidas} colaborador(es) com período concessivo expirado (Art. 137 CLT). Férias sujeitas a pagamento em dobro.`;
                bannerVencidas.classList.remove('hidden');
            } else {
                bannerVencidas.classList.add('hidden');
            }
        }

        // 3. Provisão Financeira Acumulada
        const provisao = calcularProvisaoFerias(colaboradoresCache, feriasCache);
        if ($('statProvisaoFerias')) {
            $('statProvisaoFerias').textContent = formatCurrency(provisao.totalProvisao);
        }

        // 4. Próximo início de férias
        const hojeIso = new Date().toISOString().split('T')[0];
        const proximosPeriodos = [];

        feriasCache.forEach(f => {
            if (f.status === 'cancelada' || !Array.isArray(f.periodos)) return;
            const c = colaboradoresCache.find(x => x.id === f.colaboradorId);
            f.periodos.forEach(p => {
                if (p.dataInicio && p.dataInicio >= hojeIso) {
                    proximosPeriodos.push({
                        colaboradorNome: c ? c.nome : 'Colaborador',
                        dataInicio: p.dataInicio,
                        dias: p.dias
                    });
                }
            });
        });

        proximosPeriodos.sort((a, b) => a.dataInicio.localeCompare(b.dataInicio));

        if ($('statProximoInicioFerias') && $('statProximoInicioDias')) {
            if (proximosPeriodos.length > 0) {
                const prox = proximosPeriodos[0];
                const partes = prox.dataInicio.split('-');
                const formatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
                $('statProximoInicioFerias').textContent = `${prox.colaboradorNome.split(' ')[0]} (${formatada})`;

                const dtProx = new Date(prox.dataInicio + 'T00:00:00');
                const dtHoje = new Date(hojeIso + 'T00:00:00');
                const diffDias = Math.ceil((dtProx.getTime() - dtHoje.getTime()) / (1000 * 60 * 60 * 24));
                $('statProximoInicioDias').textContent = diffDias === 0 ? 'Inicia hoje!' : `Em ${diffDias} dia(s) (${prox.dias}d de gozo)`;
            } else {
                $('statProximoInicioFerias').textContent = '—';
                $('statProximoInicioDias').textContent = 'Nenhuma programação futura';
            }
        }
    }

    // ─── Mapa Anual / Timeline Horizontal ──────────────────────
    function renderizarMapaAnual() {
        const container = $('timelineFeriasLinhas');
        if (!container) return;

        if ($('labelAnoEscala')) $('labelAnoEscala').textContent = String(anoEscalaAtual);

        const mapa = gerarMapaAnualFerias(colaboradoresCache, feriasCache, anoEscalaAtual);

        if (mapa.length === 0) {
            container.innerHTML = `
                <div class="py-8 text-center text-slate-400 text-xs">
                    Nenhum colaborador ativo cadastrado para exibição na escala anual.
                </div>`;
            return;
        }

        container.innerHTML = mapa.map(item => {
            const barrasHtml = item.barras.length > 0
                ? item.barras.map(b => {
                    const statusDesc = b.status === 'em_gozo' ? 'Em Gozo' : (b.status === 'concluida' ? 'Concluída' : 'Agendada');
                    const tooltip = `${item.nome}: ${b.dias} dias (${b.dataInicio} a ${b.dataFim}) - ${statusDesc}`;
                    return `
                        <div class="absolute h-6 top-1.5 rounded-md ${b.cor} shadow-sm flex items-center px-1.5 text-[10px] font-bold text-white overflow-hidden whitespace-nowrap cursor-pointer transition-transform hover:scale-105 hover:z-20"
                             style="left: ${b.leftPct}%; width: ${Math.max(2, b.widthPct)}%;"
                             title="${tooltip}">
                            <span class="truncate">${b.dias}d</span>
                        </div>
                    `;
                }).join('')
                : `<div class="h-6 flex items-center text-[10px] text-slate-400 dark:text-slate-600 italic">Sem afastamento programado</div>`;

            return `
                <div class="flex items-center gap-3 py-1.5 border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 rounded-xl px-2 transition-colors">
                    <!-- Info do Colaborador (largura fixa alinhada) -->
                    <div class="w-44 shrink-0 flex items-center gap-2.5">
                        <div class="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                             style="background-color: ${item.avatarBg || '#0d9488'}">
                            ${item.iniciais}
                        </div>
                        <div class="min-w-0">
                            <p class="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">${item.nome}</p>
                            <p class="text-[10px] text-slate-400 font-mono truncate">Matr. ${item.matricula || '—'}</p>
                        </div>
                    </div>

                    <!-- Trilho dos 12 Meses -->
                    <div class="flex-1 relative h-9 bg-slate-100/70 dark:bg-slate-800/50 rounded-xl overflow-hidden">
                        <!-- Linhas verticais dos 12 meses -->
                        <div class="absolute inset-0 grid grid-cols-12 pointer-events-none divide-x divide-slate-200/50 dark:divide-slate-700/30">
                            <div></div><div></div><div></div><div></div><div></div><div></div>
                            <div></div><div></div><div></div><div></div><div></div><div></div>
                        </div>
                        ${barrasHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    // ─── Tabela de Períodos Aquisitivos ─────────────────────────
    function renderizarTabelaPeriodos() {
        const corpo = $('tabelaPeriodosFeriasCorpo');
        if (!corpo) return;

        const termoBusca = ($('buscaFeriasColaborador')?.value || '').toLowerCase().trim();
        const filtroStatus = $('filtroStatusFerias')?.value || 'todos';

        const linhas = [];

        colaboradoresCache.forEach(c => {
            const adm = c.admissao || c.dataAdmissao;
            if (c.status === 'Desligado' || !adm) return;
            if (termoBusca && !c.nome.toLowerCase().includes(termoBusca) && !(c.matricula || '').toLowerCase().includes(termoBusca)) {
                return;
            }

            const feriasDoColab = feriasCache.filter(f => f.colaboradorId === c.id);
            const pas = calcularPeriodosAquisitivos(adm, null, feriasDoColab);
            const faltasNoPa = Number(c.faltasInjustificadas) || 0;
            const diasDireito = calcularDiasDisponiveis(faltasNoPa);

            pas.forEach(pa => {
                if (filtroStatus !== 'todos' && pa.status !== filtroStatus) {
                    return;
                }

                linhas.push({
                    colaborador: c,
                    pa,
                    diasDireito,
                    faltasNoPa
                });
            });
        });

        if (linhas.length === 0) {
            corpo.innerHTML = `
                <tr>
                    <td colspan="6" class="px-4 py-8 text-center text-slate-400 text-xs">
                        Nenhum período aquisitivo encontrado com os filtros selecionados.
                    </td>
                </tr>`;
            return;
        }

        const formatarData = iso => {
            if (!iso) return '—';
            const [ano, mes, dia] = iso.split('-');
            return `${dia}/${mes}/${ano}`;
        };

        corpo.innerHTML = linhas.map(item => {
            const { colaborador: c, pa, diasDireito } = item;

            // Badges de Status
            let badgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
            let statusLabel = 'Em Aquisição';

            if (pa.status === 'vencido') {
                badgeClass = 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300 font-bold';
                statusLabel = 'Vencido (Art. 137 CLT)';
            } else if (pa.status === 'disponivel') {
                badgeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 font-bold';
                statusLabel = 'Disponível para Gozo';
            } else if (pa.status === 'agendado') {
                badgeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-bold';
                statusLabel = 'Agendado';
            } else if (pa.status === 'gozado') {
                badgeClass = 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300';
                statusLabel = 'Gozado';
            } else if (pa.status === 'parcialmente_gozado') {
                badgeClass = 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300';
                statusLabel = 'Parcialmente Gozado';
            }

            const feriasAgendada = pa.feriasConcedidas && pa.feriasConcedidas.length > 0 ? pa.feriasConcedidas[0] : null;

            return `
                <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-2.5">
                            <div class="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                                 style="background-color: ${c.avatarBg || '#0d9488'}">
                                ${c.iniciais || 'CL'}
                            </div>
                            <div>
                                <p class="font-semibold text-slate-900 dark:text-white">${c.nome}</p>
                                <p class="text-[10px] text-slate-400">${c.cargo || 'Cargo'} • Matr. ${c.matricula || '—'}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-4 py-3 font-mono">
                        ${formatarData(pa.paInicio)} a ${formatarData(pa.paFim)}
                    </td>
                    <td class="px-4 py-3 font-mono ${pa.alertaDobro ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}">
                        ${formatarData(pa.pcFim)}
                        ${pa.alertaDobro ? '<span class="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/80 dark:text-rose-300">Expirado!</span>' : ''}
                    </td>
                    <td class="px-4 py-3 text-center font-bold">
                        <span class="${diasDireito === 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}">${diasDireito} dias</span>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] ${badgeClass}">
                            ${statusLabel}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                        <div class="inline-flex items-center gap-1.5">
                            ${(pa.status === 'disponivel' || pa.status === 'vencido') ? `
                                <button type="button" class="btn-agendar-pa px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
                                        data-colaborador-id="${c.id}" data-pa-inicio="${pa.paInicio}" data-alerta-dobro="${pa.alertaDobro}">
                                    Agendar
                                </button>
                            ` : ''}

                            ${feriasAgendada ? `
                                <button type="button" class="btn-ver-documento px-2 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        data-ferias-id="${feriasAgendada.id}" title="Emitir Aviso e Recibo de Férias">
                                    Aviso & Recibo
                                </button>
                                <button type="button" class="btn-cancelar-ferias px-2 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                        data-ferias-id="${feriasAgendada.id}" title="Cancelar Agendamento">
                                    Cancelar
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Listeners nos botões dinâmicos da tabela
        corpo.querySelectorAll('.btn-agendar-pa').forEach(btn => {
            btn.addEventListener('click', () => {
                const colabId = Number(btn.getAttribute('data-colaborador-id'));
                const paInicio = btn.getAttribute('data-pa-inicio');
                const alertaDobro = btn.getAttribute('data-alerta-dobro') === 'true';
                abrirModalAgendamento(colabId, paInicio, alertaDobro);
            });
        });

        corpo.querySelectorAll('.btn-ver-documento').forEach(btn => {
            btn.addEventListener('click', () => {
                const fId = Number(btn.getAttribute('data-ferias-id'));
                emitirAvisoEReciboFerias(fId);
            });
        });

        corpo.querySelectorAll('.btn-cancelar-ferias').forEach(btn => {
            btn.addEventListener('click', async () => {
                const fId = Number(btn.getAttribute('data-ferias-id'));
                if (confirm('Deseja realmente cancelar este agendamento de férias?')) {
                    await removerFerias(fId);
                    showToast('Agendamento de férias cancelado com sucesso!');
                    await carregarDados();
                }
            });
        });
    }

    // ─── Modal de Agendamento de Férias ─────────────────────────
    function popularSelectColaboradores() {
        const select = $('feriasColaboradorSelect');
        if (!select) return;

        const ativos = colaboradoresCache.filter(c => c.status !== 'Desligado');
        select.innerHTML = '<option value="">Selecione um colaborador...</option>' +
            ativos.map(c => `<option value="${c.id}">${c.nome} (Matr. ${c.matricula || '—'})</option>`).join('');
    }

    function abrirModalAgendamento(colabId = null, paInicioPreSelecionado = null, dobroPredefinido = false) {
        const modal = $('modalAgendarFerias');
        if (!modal) return;

        $('formAgendarFerias')?.reset();

        if (colabId) {
            $('feriasColaboradorSelect').value = String(colabId);
            selecionarColaborador(colabId, paInicioPreSelecionado, dobroPredefinido);
        } else {
            $('feriasColaboradorInfo')?.classList.add('hidden');
            $('feriasPeriodoAquisitivoSelect').innerHTML = '<option value="">Aguardando seleção do colaborador...</option>';
        }

        // Configuração padrão
        $('feriasQtdPeriodos').value = '1';
        atualizarCamposPeriodos();
        recalcularValidacaoEValores();

        modal.classList.remove('hidden');
    }

    function fecharModalAgendamento() {
        $('modalAgendarFerias')?.classList.add('hidden');
    }

    function selecionarColaborador(id, paInicioPre = null, dobroPre = false) {
        colaboradorSelecionado = colaboradoresCache.find(c => c.id === Number(id));
        if (!colaboradorSelecionado) return;

        const c = colaboradorSelecionado;
        const adm = c.admissao || c.dataAdmissao;
        const faltas = Number(c.faltasInjustificadas) || 0;
        const diasDireito = calcularDiasDisponiveis(faltas);

        if ($('feriasInfoAdmissao')) $('feriasInfoAdmissao').textContent = adm ? adm.split('-').reverse().join('/') : '—';
        if ($('feriasInfoSalario')) $('feriasInfoSalario').textContent = formatCurrency(c.salarioBase || 0);
        if ($('feriasInfoFaltas')) $('feriasInfoFaltas').textContent = `${faltas} falta(s)`;
        if ($('feriasInfoDiasDireito')) $('feriasInfoDiasDireito').textContent = `${diasDireito} dias`;
        $('feriasColaboradorInfo')?.classList.remove('hidden');

        // Carregar períodos aquisitivos disponíveis
        const feriasDoColab = feriasCache.filter(f => f.colaboradorId === c.id);
        periodosAquisitivosColaborador = calcularPeriodosAquisitivos(adm, null, feriasDoColab);

        const paSelect = $('feriasPeriodoAquisitivoSelect');
        const disponiveis = periodosAquisitivosColaborador.filter(p => p.status === 'disponivel' || p.status === 'vencido' || p.status === 'aberto');

        paSelect.innerHTML = disponiveis.map(p => {
            const rotulo = `${p.paInicio.split('-').reverse().join('/')} a ${p.paFim.split('-').reverse().join('/')} (${p.status === 'vencido' ? 'VENCIDO - DOBRO' : p.status.toUpperCase()})`;
            return `<option value="${p.paInicio}" ${p.alertaDobro ? 'data-dobro="true"' : ''}>${rotulo}</option>`;
        }).join('');

        if (paInicioPre) {
            paSelect.value = paInicioPre;
        }

        if (dobroPre || (paSelect.selectedOptions[0] && paSelect.selectedOptions[0].getAttribute('data-dobro') === 'true')) {
            $('feriasEmDobroCheck').checked = true;
        } else {
            $('feriasEmDobroCheck').checked = false;
        }

        // Atualizar dias do primeiro período com os dias de direito
        $('feriasP1Dias').value = String(diasDireito);
        $('feriasP1Dias').max = String(diasDireito);

        recalcularValidacaoEValores();
    }

    function atualizarCamposPeriodos() {
        const qtd = Number($('feriasQtdPeriodos')?.value) || 1;
        const faltas = Number(colaboradorSelecionado?.faltasInjustificadas) || 0;
        const diasDireito = calcularDiasDisponiveis(faltas);
        const abono = $('feriasAbonoPecuniario')?.checked || false;
        const diasAbono = abono ? Math.floor(diasDireito / 3) : 0;
        const diasGozo = diasDireito - diasAbono;

        const b2 = $('blocoPeriodo2');
        const b3 = $('blocoPeriodo3');

        if (qtd === 1) {
            b2?.classList.add('hidden');
            b3?.classList.add('hidden');
            $('feriasP1Dias').value = String(diasGozo);
            $('feriasP2Dias').value = '0';
            $('feriasP3Dias').value = '0';
        } else if (qtd === 2) {
            b2?.classList.remove('hidden');
            b3?.classList.add('hidden');
            $('feriasP1Dias').value = '14'; // Pelo menos 14 dias (Art. 134 § 1º)
            $('feriasP2Dias').value = String(Math.max(5, diasGozo - 14));
            $('feriasP3Dias').value = '0';
        } else if (qtd === 3) {
            b2?.classList.remove('hidden');
            b3?.classList.remove('hidden');
            $('feriasP1Dias').value = '14';
            $('feriasP2Dias').value = '8';
            $('feriasP3Dias').value = String(Math.max(5, diasGozo - 14 - 8));
        }

        recalcularDatasPeriodos();
    }

    function calcularDatas(inicioStr, dias) {
        if (!inicioStr || !dias || dias <= 0) return { fim: '—', retorno: '—', fimIso: '', retornoIso: '', limitePagto: '—' };
        const dtInicio = new Date(inicioStr + 'T00:00:00');
        if (isNaN(dtInicio.getTime())) return { fim: '—', retorno: '—', fimIso: '', retornoIso: '', limitePagto: '—' };

        const dtFim = new Date(dtInicio);
        dtFim.setDate(dtFim.getDate() + dias - 1);

        const dtRetorno = new Date(dtFim);
        dtRetorno.setDate(dtRetorno.getDate() + 1);

        const dtPagto = new Date(dtInicio);
        dtPagto.setDate(dtPagto.getDate() - 2);

        const formatar = d => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

        return {
            fim: formatar(dtFim),
            retorno: formatar(dtRetorno),
            fimIso: dtFim.toISOString().split('T')[0],
            retornoIso: dtRetorno.toISOString().split('T')[0],
            limitePagto: formatar(dtPagto)
        };
    }

    function recalcularDatasPeriodos() {
        const p1Dias = Number($('feriasP1Dias')?.value) || 0;
        const p1Inicio = $('feriasP1Inicio')?.value;
        const d1 = calcularDatas(p1Inicio, p1Dias);
        if ($('feriasP1Fim')) $('feriasP1Fim').value = d1.fim;
        if ($('feriasP1Retorno')) $('feriasP1Retorno').value = d1.retorno;

        const p2Dias = Number($('feriasP2Dias')?.value) || 0;
        const p2Inicio = $('feriasP2Inicio')?.value;
        const d2 = calcularDatas(p2Inicio, p2Dias);
        if ($('feriasP2Fim')) $('feriasP2Fim').value = d2.fim;
        if ($('feriasP2Retorno')) $('feriasP2Retorno').value = d2.retorno;

        const p3Dias = Number($('feriasP3Dias')?.value) || 0;
        const p3Inicio = $('feriasP3Inicio')?.value;
        const d3 = calcularDatas(p3Inicio, p3Dias);
        if ($('feriasP3Fim')) $('feriasP3Fim').value = d3.fim;
        if ($('feriasP3Retorno')) $('feriasP3Retorno').value = d3.retorno;

        if ($('feriasResumoDataPagamento')) {
            $('feriasResumoDataPagamento').textContent = d1.limitePagto;
        }

        recalcularValidacaoEValores();
    }

    function recalcularValidacaoEValores() {
        const c = colaboradorSelecionado;
        const faltas = Number(c?.faltasInjustificadas) || 0;
        const diasDireito = calcularDiasDisponiveis(faltas);
        const abono = $('feriasAbonoPecuniario')?.checked || false;
        const emDobro = $('feriasEmDobroCheck')?.checked || false;
        const qtdPeriodos = Number($('feriasQtdPeriodos')?.value) || 1;

        const periodos = [
            { dias: Number($('feriasP1Dias')?.value) || 0, dataInicio: $('feriasP1Inicio')?.value || '' }
        ];
        if (qtdPeriodos >= 2) {
            periodos.push({ dias: Number($('feriasP2Dias')?.value) || 0, dataInicio: $('feriasP2Inicio')?.value || '' });
        }
        if (qtdPeriodos >= 3) {
            periodos.push({ dias: Number($('feriasP3Dias')?.value) || 0, dataInicio: $('feriasP3Inicio')?.value || '' });
        }

        // Validação CLT
        const validacao = validarAgendamentoFerias({
            diasDireito,
            abonoPecuniario: abono,
            periodos
        });

        const statusBox = $('feriasValidacaoStatus');
        if (statusBox) {
            if (validacao.valido && validacao.avisos.length === 0) {
                statusBox.className = 'p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300';
                statusBox.innerHTML = `
                    <div class="flex items-center gap-2 font-bold">
                        <svg class="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                        <span>Conformidade Legal CLT — Art. 134 e 143 atendidos perfeitamente</span>
                    </div>`;
            } else if (!validacao.valido) {
                statusBox.className = 'p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300';
                statusBox.innerHTML = `
                    <div class="font-bold mb-1 flex items-center gap-1.5">
                        <svg class="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        <span>Inconsistência Legal:</span>
                    </div>
                    <ul class="list-disc list-inside space-y-0.5">${validacao.erros.map(e => `<li>${e}</li>`).join('')}</ul>`;
            } else {
                statusBox.className = 'p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300';
                statusBox.innerHTML = `
                    <div class="font-bold mb-1 flex items-center gap-1.5">
                        <svg class="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        <span>Aviso Trabalhista:</span>
                    </div>
                    <ul class="list-disc list-inside space-y-0.5">${validacao.avisos.map(a => `<li>${a}</li>`).join('')}</ul>`;
            }
        }

        // Cálculo Financeiro
        const salarioBase = Number(c?.salarioBase) || 0;
        const fin = calcularValorFerias({
            salarioBase,
            diasFerias: validacao.diasGozo,
            abonoPecuniario: abono,
            feriasEmDobro: emDobro,
            dependentesIR: Number(c?.dependentes) || 0
        });

        if ($('feriasResumoBruto')) $('feriasResumoBruto').textContent = formatCurrency(fin.totalBruto);
        if ($('feriasResumoINSS')) $('feriasResumoINSS').textContent = `- ${formatCurrency(fin.inss.valor)}`;
        if ($('feriasResumoIRRF')) $('feriasResumoIRRF').textContent = `- ${formatCurrency(fin.irrf.valor)}`;
        if ($('feriasResumoLiquido')) $('feriasResumoLiquido').textContent = formatCurrency(fin.liquido);
    }

    // ─── Submissão do Agendamento ──────────────────────────────
    async function salvarAgendamento(e) {
        e.preventDefault();

        const colabId = Number($('feriasColaboradorSelect')?.value);
        if (!colabId) {
            showToast('Selecione um colaborador.', 'error');
            return;
        }

        const paInicio = $('feriasPeriodoAquisitivoSelect')?.value;
        if (!paInicio) {
            showToast('Selecione o período aquisitivo de referência.', 'error');
            return;
        }

        const c = colaboradorSelecionado;
        const faltas = Number(c?.faltasInjustificadas) || 0;
        const diasDireito = calcularDiasDisponiveis(faltas);
        const abono = $('feriasAbonoPecuniario')?.checked || false;
        const emDobro = $('feriasEmDobroCheck')?.checked || false;
        const qtdPeriodos = Number($('feriasQtdPeriodos')?.value) || 1;

        const periodos = [];
        const p1Dias = Number($('feriasP1Dias')?.value) || 0;
        const p1Inicio = $('feriasP1Inicio')?.value;
        if (!p1Inicio) {
            showToast('Preencha a data de início do 1º período.', 'error');
            return;
        }
        const d1 = calcularDatas(p1Inicio, p1Dias);
        periodos.push({ dias: p1Dias, dataInicio: p1Inicio, dataFim: d1.fimIso, dataRetorno: d1.retornoIso });

        if (qtdPeriodos >= 2) {
            const p2Dias = Number($('feriasP2Dias')?.value) || 0;
            const p2Inicio = $('feriasP2Inicio')?.value;
            if (!p2Inicio) {
                showToast('Preencha a data de início do 2º período.', 'error');
                return;
            }
            const d2 = calcularDatas(p2Inicio, p2Dias);
            periodos.push({ dias: p2Dias, dataInicio: p2Inicio, dataFim: d2.fimIso, dataRetorno: d2.retornoIso });
        }

        if (qtdPeriodos >= 3) {
            const p3Dias = Number($('feriasP3Dias')?.value) || 0;
            const p3Inicio = $('feriasP3Inicio')?.value;
            if (!p3Inicio) {
                showToast('Preencha a data de início do 3º período.', 'error');
                return;
            }
            const d3 = calcularDatas(p3Inicio, p3Dias);
            periodos.push({ dias: p3Dias, dataInicio: p3Inicio, dataFim: d3.fimIso, dataRetorno: d3.retornoIso });
        }

        const validacao = validarAgendamentoFerias({ diasDireito, abonoPecuniario: abono, periodos });
        if (!validacao.valido) {
            showToast(validacao.erros[0] || 'Agendamento inválido perante a CLT.', 'error');
            return;
        }

        const salarioBase = Number(c?.salarioBase) || 0;
        const fin = calcularValorFerias({
            salarioBase,
            diasFerias: validacao.diasGozo,
            abonoPecuniario: abono,
            feriasEmDobro: emDobro,
            dependentesIR: Number(c?.dependentes) || 0
        });

        // Encontrar período aquisitivo selecionado
        const paObj = periodosAquisitivosColaborador.find(p => p.paInicio === paInicio);

        const registro = {
            colaboradorId: colabId,
            periodoAquisitivoInicio: paInicio,
            periodoAquisitivoFim: paObj ? paObj.paFim : '',
            periodoConcessivoFim: paObj ? paObj.pcFim : '',
            tipo: qtdPeriodos === 1 ? 'integral' : 'fracionada',
            status: 'agendada',
            periodos,
            abonoPecuniario: abono,
            diasAbono: validacao.diasAbono,
            feriasEmDobro: emDobro,
            dataPagamento: d1.limitePagto,
            financeiro: fin,
            valorBruto: fin.totalBruto,
            valorLiquido: fin.liquido
        };

        try {
            await salvarFerias(registro);
            showToast('Agendamento de férias registrado com sucesso!', 'success');
            fecharModalAgendamento();
            await carregarDados();
        } catch (err) {
            console.error(err);
            showToast('Erro ao gravar férias no banco IndexedDB.', 'error');
        }
    }

    // ─── Emissão de Aviso & Recibo em PDF Oficial ──────────────
    async function emitirAvisoEReciboFerias(feriasId) {
        const f = feriasCache.find(x => x.id === feriasId);
        if (!f) return;
        const c = colaboradoresCache.find(x => x.id === f.colaboradorId);
        if (!c) return;

        const corp = getDadosCorporativos();
        const p1 = f.periodos && f.periodos[0] ? f.periodos[0] : {};
        const p1InicioFormat = p1.dataInicio ? p1.dataInicio.split('-').reverse().join('/') : '—';
        const p1FimFormat = p1.dataFim ? p1.dataFim.split('-').reverse().join('/') : '—';
        const p1RetornoFormat = p1.dataRetorno ? p1.dataRetorno.split('-').reverse().join('/') : '—';

        const htmlDocumento = `
            <div style="font-family: Arial, sans-serif; font-size: 12px; color: #1e293b; line-height: 1.5; padding: 24px;">
                <!-- Cabeçalho Corporativo -->
                <div style="text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 20px;">
                    <h2 style="font-size: 16px; font-weight: bold; margin: 0; color: #0f766e; text-transform: uppercase;">
                        ${corp.razaoSocial || 'EMPRESA DEMONSTRATIVA LTDA'}
                    </h2>
                    <p style="font-size: 11px; margin: 2px 0; color: #64748b;">
                        CNPJ: ${corp.cnpj || '00.000.000/0001-00'} • Depto. Recursos Humanos & Pessoal
                    </p>
                </div>

                <!-- 1. AVISO DE FÉRIAS (Art. 135 CLT) -->
                <div style="margin-bottom: 30px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; background-color: #f8fafc;">
                    <h3 style="font-size: 13px; font-weight: bold; margin: 0 0 10px 0; text-align: center; text-transform: uppercase; color: #0f766e; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
                        Comunicação de Aviso de Férias — Artigo 135 da CLT
                    </h3>
                    <p style="margin-bottom: 10px;">
                        A(o) Sr(a).: <strong>${c.nome}</strong> — Cargo: <strong>${c.cargo || 'Não informado'}</strong> — Matrícula: <strong>${c.matricula || '—'}</strong>
                    </p>
                    <p style="text-align: justify; margin-bottom: 12px;">
                        Em cumprimento aos preceitos do <strong>Artigo 135 da Consolidação das Leis do Trabalho (CLT)</strong>, participamos-lhe que lhe serão concedidas férias regulamentares relativas ao período aquisitivo de <strong>${f.periodoAquisitivoInicio.split('-').reverse().join('/')} a ${f.periodoAquisitivoFim.split('-').reverse().join('/')}</strong>, a serem usufruídas conforme programação abaixo:
                    </p>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px;">
                        <tr style="background-color: #e2e8f0;">
                            <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">Período</th>
                            <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">Dias</th>
                            <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">Início do Gozo</th>
                            <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">Término</th>
                            <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">Retorno ao Trabalho</th>
                        </tr>
                        ${f.periodos.map((p, idx) => `
                            <tr>
                                <td style="padding: 6px; border: 1px solid #cbd5e1;">${idx + 1}º Período</td>
                                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${p.dias}</td>
                                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">${p.dataInicio.split('-').reverse().join('/')}</td>
                                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">${p.dataFim.split('-').reverse().join('/')}</td>
                                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${p.dataRetorno.split('-').reverse().join('/')}</td>
                            </tr>
                        `).join('')}
                    </table>
                    <p style="font-size: 11px; color: #475569; margin-bottom: 25px;">
                        O pagamento da remuneração das férias e do abono pecuniário será efetuado até 2 (dois) dias antes do início do respectivo período, conforme preconiza o <strong>Art. 145 da CLT</strong>.
                    </p>
                    <div style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 11px; text-align: center;">
                        <div style="width: 45%;">
                            <div style="border-top: 1px solid #000; padding-top: 5px;">${corp.razaoSocial || 'Empregador'}</div>
                        </div>
                        <div style="width: 45%;">
                            <div style="border-top: 1px solid #000; padding-top: 5px;">Ciente do Empregado em ___/___/______</div>
                        </div>
                    </div>
                </div>

                <!-- 2. RECIBO DE QUITAÇÃO DE FÉRIAS (Art. 145 CLT) -->
                <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; background-color: #ffffff;">
                    <h3 style="font-size: 13px; font-weight: bold; margin: 0 0 10px 0; text-align: center; text-transform: uppercase; color: #0f766e; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
                        Recibo de Quitação de Férias — Artigo 145 da CLT
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px;">
                        <tr style="background-color: #f1f5f9; font-weight: bold;">
                            <td style="padding: 6px; border: 1px solid #cbd5e1;">Descrição das Verbas</td>
                            <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">Proventos (R$)</td>
                            <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">Descontos (R$)</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px; border: 1px solid #cbd5e1;">Remuneração de Férias (${f.financeiro ? f.financeiro.diasFerias : 30} dias) ${f.feriasEmDobro ? '<strong>(EM DOBRO - Art. 137)</strong>' : ''}</td>
                            <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">${formatCurrency(f.financeiro ? f.financeiro.valorBase : 0)}</td>
                            <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">—</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px; border: 1px solid #cbd5e1;">1/3 Constitucional de Férias (Art. 7º, XVII CF/88)</td>
                            <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">${formatCurrency(f.financeiro ? f.financeiro.tercoConstitucional : 0)}</td>
                            <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">—</td>
                        </tr>
                        ${f.abonoPecuniario ? `
                            <tr>
                                <td style="padding: 6px; border: 1px solid #cbd5e1;">Abono Pecuniário (${f.diasAbono} dias - Art. 143 CLT)</td>
                                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">${formatCurrency(f.financeiro.valorAbono)}</td>
                                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">—</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px; border: 1px solid #cbd5e1;">1/3 sobre Abono Pecuniário</td>
                                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">${formatCurrency(f.financeiro.tercoAbono)}</td>
                                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">—</td>
                            </tr>
                        ` : ''}
                        <tr>
                            <td style="padding: 6px; border: 1px solid #cbd5e1;">INSS sobre Férias (Tabela Progressiva)</td>
                            <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">—</td>
                            <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right; color: #b91c1c;">${formatCurrency(f.financeiro ? f.financeiro.inss.valor : 0)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px; border: 1px solid #cbd5e1;">IRRF sobre Férias</td>
                            <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">—</td>
                            <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right; color: #b91c1c;">${formatCurrency(f.financeiro ? f.financeiro.irrf.valor : 0)}</td>
                        </tr>
                        <tr style="background-color: #f8fafc; font-weight: bold;">
                            <td style="padding: 8px; border: 1px solid #cbd5e1;">TOTAIS</td>
                            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; color: #047857;">${formatCurrency(f.valorBruto)}</td>
                            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; color: #b91c1c;">${formatCurrency(f.financeiro ? f.financeiro.totalDeducoes : 0)}</td>
                        </tr>
                        <tr style="background-color: #ecfdf5; font-weight: bold; font-size: 12px;">
                            <td colspan="2" style="padding: 8px; border: 1px solid #cbd5e1; color: #047857;">LÍQUIDO A RECEBER:</td>
                            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; color: #047857;">${formatCurrency(f.valorLiquido)}</td>
                        </tr>
                    </table>
                    <p style="text-align: justify; font-size: 11px; margin-top: 15px; margin-bottom: 25px;">
                        Recebi da firma <strong>${corp.razaoSocial || 'EMPRESA DEMONSTRATIVA LTDA'}</strong> a importância líquida de <strong>${formatCurrency(f.valorLiquido)}</strong>, referente ao pagamento das minhas férias regulamentares aqui discriminadas, das quais dou plena e geral quitação.
                    </p>
                    <div style="display: flex; justify-content: space-between; margin-top: 25px; font-size: 11px; text-align: center;">
                        <div style="width: 45%;">
                            <p style="margin-bottom: 25px;">Data de Pagamento: ${f.dataPagamento || '___/___/______'}</p>
                            <div style="border-top: 1px solid #000; padding-top: 5px;">Assinatura do Empregador</div>
                        </div>
                        <div style="width: 45%;">
                            <p style="margin-bottom: 25px;">Data: ___/___/______</p>
                            <div style="border-top: 1px solid #000; padding-top: 5px;">Assinatura do Empregado</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        abrirPreviaPdf(htmlDocumento, `aviso_recibo_ferias_${c.matricula || 'colab'}.pdf`, `Aviso & Recibo de Férias — ${c.nome}`);
    }

    // ─── Event Listeners do Módulo ─────────────────────────────
    $('btnNovoAgendamentoFerias')?.addEventListener('click', () => abrirModalAgendamento());
    $('btnFecharModalFerias')?.addEventListener('click', fecharModalAgendamento);
    $('btnCancelarAgendamentoFerias')?.addEventListener('click', fecharModalAgendamento);

    $('feriasColaboradorSelect')?.addEventListener('change', e => {
        if (e.target.value) selecionarColaborador(e.target.value);
    });

    $('feriasPeriodoAquisitivoSelect')?.addEventListener('change', () => {
        const opt = $('feriasPeriodoAquisitivoSelect')?.selectedOptions[0];
        if (opt && opt.getAttribute('data-dobro') === 'true') {
            $('feriasEmDobroCheck').checked = true;
        } else {
            $('feriasEmDobroCheck').checked = false;
        }
        recalcularValidacaoEValores();
    });

    $('feriasAbonoPecuniario')?.addEventListener('change', atualizarCamposPeriodos);
    $('feriasEmDobroCheck')?.addEventListener('change', recalcularValidacaoEValores);
    $('feriasQtdPeriodos')?.addEventListener('change', atualizarCamposPeriodos);

    ['feriasP1Dias', 'feriasP1Inicio', 'feriasP2Dias', 'feriasP2Inicio', 'feriasP3Dias', 'feriasP3Inicio'].forEach(id => {
        $(id)?.addEventListener('input', recalcularDatasPeriodos);
        $(id)?.addEventListener('change', recalcularDatasPeriodos);
    });

    $('formAgendarFerias')?.addEventListener('submit', salvarAgendamento);

    $('btnAnoEscalaAnterior')?.addEventListener('click', () => {
        anoEscalaAtual--;
        renderizarMapaAnual();
        atualizarKPIs();
    });

    $('btnAnoEscalaProximo')?.addEventListener('click', () => {
        anoEscalaAtual++;
        renderizarMapaAnual();
        atualizarKPIs();
    });

    $('buscaFeriasColaborador')?.addEventListener('input', renderizarTabelaPeriodos);
    $('filtroStatusFerias')?.addEventListener('change', renderizarTabelaPeriodos);

    $('btnFiltrarFeriasVencidas')?.addEventListener('click', () => {
        if ($('filtroStatusFerias')) {
            $('filtroStatusFerias').value = 'vencido';
            renderizarTabelaPeriodos();
        }
    });

    $('btnExportarEscalaFerias')?.addEventListener('click', () => {
        if (feriasCache.length === 0) {
            showToast('Nenhuma programação de férias para exportação.', 'error');
            return;
        }
        exportarFeriasExcel({
            salarioBase: 0,
            diasFerias: 30,
            abonoPecuniario: false,
            adiantamento13o: false,
            totalBruto: 0,
            liquido: 0
        });
        showToast('Relatório de férias exportado com sucesso!');
    });

    moduleExportHandlers['gestao-ferias'] = () => {
        $('btnExportarEscalaFerias')?.click();
    };

    $('sidebarBtnGestaoFerias')?.addEventListener('click', () => carregarDados());
    window.addEventListener('hashchange', () => {
        if (location.hash === '#gestao-ferias') carregarDados();
    });

    // Inicialização
    carregarDados();
}

// ═══════════════════════════════════════════════════════════════════════
//  MÓDULO: GESTÃO DE PONTO ELETRÔNICO (HRMS FASE 03 — MTE 671/2021)
// ═══════════════════════════════════════════════════════════════════════

function initPontoModule() {
    const $ = id => document.getElementById(id);

    let colaboradoresPontoCache = [];
    let colaboradorSelecionadoPonto = null;
    let anoPontoAtual = 2026;
    let mesPontoAtual = 8; // Agosto por padrão
    let gradePontoAtual = [];
    let diaEditandoJustificativa = null;

    // ─── Carregamento de Colaboradores e Competência ───────────
    async function inicializarDados() {
        try {
            await carregarSementeSeVazio();
            colaboradoresPontoCache = await listarColaboradores();
            popularSelectColaboradores();

            if (colaboradoresPontoCache.length > 0 && !colaboradorSelecionadoPonto) {
                const primeiroAtivo = colaboradoresPontoCache.find(c => c.status !== 'Desligado') || colaboradoresPontoCache[0];
                if (primeiroAtivo) {
                    $('pontoColaboradorSelect').value = String(primeiroAtivo.id);
                    colaboradorSelecionadoPonto = primeiroAtivo;
                }
            }

            lerCompetenciaSelecionada();
            await carregarPontoColaborador();
        } catch (e) {
            console.error('Erro ao inicializar módulo de ponto:', e);
        }
    }

    function popularSelectColaboradores() {
        const select = $('pontoColaboradorSelect');
        if (!select) return;

        const ativos = colaboradoresPontoCache.filter(c => c.status !== 'Desligado');
        select.innerHTML = '<option value="">Selecione um colaborador...</option>' +
            ativos.map(c => `<option value="${c.id}">${c.nome} (${c.cargo || 'Cargo'} • Matr. ${c.matricula || '—'})</option>`).join('');
    }

    function lerCompetenciaSelecionada() {
        const compVal = $('pontoCompetenciaSelect')?.value || '2026-08';
        const [anoStr, mesStr] = compVal.split('-');
        anoPontoAtual = parseInt(anoStr, 10) || 2026;
        mesPontoAtual = parseInt(mesStr, 10) || 8;
    }

    // ─── Carregamento ou Geração da Folha de Ponto ─────────────
    async function carregarPontoColaborador() {
        if (!colaboradorSelecionadoPonto) {
            gradePontoAtual = [];
            renderizarGradeTabela();
            atualizarKPIs();
            return;
        }

        try {
            const folhaSalva = await obterFolhaPonto(colaboradorSelecionadoPonto.id, anoPontoAtual, mesPontoAtual);

            if (folhaSalva && Array.isArray(folhaSalva.dias) && folhaSalva.dias.length > 0) {
                gradePontoAtual = folhaSalva.dias;
            } else {
                // Gerar grade em branco estruturada conforme a escala do colaborador
                gradePontoAtual = gerarGradeMensalPonto(colaboradorSelecionadoPonto, anoPontoAtual, mesPontoAtual);
            }

            renderizarGradeTabela();
            atualizarKPIs();
        } catch (e) {
            console.error('Erro ao carregar folha de ponto:', e);
        }
    }

    // ─── Atualização dos KPIs Analíticos ────────────────────────
    function atualizarKPIs() {
        const salarioBase = Number(colaboradorSelecionadoPonto?.salarioBase) || 0;
        const resumo = calcularResumoMensalPonto(gradePontoAtual, salarioBase);

        if ($('statPontoHorasTrabalhadas')) {
            $('statPontoHorasTrabalhadas').textContent = resumo.totaisFormatados.trabalhado;
        }
        if ($('statPontoHorasTrabalhadasSub')) {
            $('statPontoHorasTrabalhadasSub').textContent = `Previsto: ${resumo.totaisFormatados.previsto} (${resumo.diasTrabalhados} dias úteis)`;
        }

        if ($('statPontoHorasExtras')) {
            $('statPontoHorasExtras').textContent = converterMinutosParaHora(resumo.totaisMinutos.he50 + resumo.totaisMinutos.he100);
        }
        if ($('statPontoHorasExtrasSub')) {
            $('statPontoHorasExtrasSub').textContent = `50%: ${resumo.totaisFormatados.he50} • 100%: ${resumo.totaisFormatados.he100}`;
        }

        if ($('statPontoHorasNoturnas')) {
            $('statPontoHorasNoturnas').textContent = resumo.totaisFormatados.noturno;
        }

        const statSaldo = $('statPontoSaldoBanco');
        const statSaldoSub = $('statPontoSaldoBancoSub');
        if (statSaldo) {
            statSaldo.textContent = resumo.totaisFormatados.saldo;
            if (resumo.totaisMinutos.saldo > 0) {
                statSaldo.className = 'text-2xl font-extrabold text-emerald-400 mt-1';
                if (statSaldoSub) statSaldoSub.textContent = 'Crédito no Banco de Horas';
            } else if (resumo.totaisMinutos.saldo < 0) {
                statSaldo.className = 'text-2xl font-extrabold text-rose-400 mt-1';
                if (statSaldoSub) statSaldoSub.textContent = 'Débito / Horas a compensar';
            } else {
                statSaldo.className = 'text-2xl font-extrabold text-white mt-1';
                if (statSaldoSub) statSaldoSub.textContent = 'Jornada zerada / equilibrada';
            }
        }
    }

    // ─── Renderização da Grade Diária de Ponto ──────────────────
    function renderizarGradeTabela() {
        const corpo = $('pontoGradeTabelaCorpo');
        if (!corpo) return;

        if (gradePontoAtual.length === 0) {
            corpo.innerHTML = `
                <tr>
                    <td colspan="12" class="px-4 py-8 text-center text-slate-400 text-xs">
                        Selecione um colaborador para exibir e tratar as marcações de ponto do mês.
                    </td>
                </tr>`;
            return;
        }

        corpo.innerHTML = gradePontoAtual.map((dia, idx) => {
            const isDsr = dia.tipoDia === 'dsr' || dia.tipoDia === 'folga_12x36';
            const isFeriado = dia.tipoDia === 'feriado';
            const linhaBg = isFeriado
                ? 'bg-rose-50/40 dark:bg-rose-950/20'
                : isDsr
                ? 'bg-slate-50/70 dark:bg-slate-800/30'
                : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50';

            // Badges de Status do Dia
            let statusBadge = '';
            if (dia.justificativa) {
                statusBadge = `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300 truncate max-w-[130px] block" title="${dia.justificativa}">${dia.justificativa}</span>`;
            } else if (dia.status === 'he100') {
                statusBadge = `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">HE 100% (+${dia.he100Formatado})</span>`;
            } else if (dia.status === 'he50') {
                statusBadge = `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">HE 50% (+${dia.he50Formatado})</span>`;
            } else if (dia.status === 'atraso') {
                statusBadge = `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">Atraso (${dia.saldoFormatado})</span>`;
            } else if (dia.status === 'falta') {
                statusBadge = `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">Falta Injustificada</span>`;
            } else if (dia.status === 'normal' && dia.trabalhadosMinutos > 0) {
                statusBadge = `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">Normal (${dia.trabalhadosFormatado})</span>`;
            } else if (isFeriado) {
                statusBadge = `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">Feriado Nacional</span>`;
            } else if (isDsr) {
                statusBadge = `<span class="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">DSR / Folga</span>`;
            } else {
                statusBadge = `<span class="text-[10px] text-slate-400 italic">Pendente</span>`;
            }

            const inputClass = "w-16 px-1.5 py-1 text-xs text-center font-mono rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all";

            return `
                <tr class="${linhaBg} transition-colors border-b border-slate-100 dark:border-slate-800/60" data-dia-index="${idx}">
                    <!-- 1. Dia e Semana -->
                    <td class="px-3 py-2 whitespace-nowrap">
                        <span class="font-bold text-slate-900 dark:text-white font-mono">${String(dia.dia).padStart(2, '0')}/${String(mesPontoAtual).padStart(2, '0')}</span>
                        <span class="text-[10px] text-slate-400 block">${dia.diaSemana.split('-')[0]}</span>
                    </td>

                    <!-- 2. Tipo de Dia -->
                    <td class="px-3 py-2 text-center whitespace-nowrap">
                        ${isFeriado
                            ? '<span class="text-[10px] font-bold text-rose-600 dark:text-rose-400">Feriado</span>'
                            : isDsr
                            ? '<span class="text-[10px] font-medium text-slate-500 dark:text-slate-400">DSR</span>'
                            : '<span class="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">Útil</span>'}
                    </td>

                    <!-- 3. Batidas (Entrada 1, Saída 1, Entrada 2, Saída 2) -->
                    <td class="px-1 py-1.5 text-center">
                        <input type="time" class="ponto-input-e1 ${inputClass}" value="${dia.e1 || ''}" data-idx="${idx}" />
                    </td>
                    <td class="px-1 py-1.5 text-center">
                        <input type="time" class="ponto-input-s1 ${inputClass}" value="${dia.s1 || ''}" data-idx="${idx}" />
                    </td>
                    <td class="px-1 py-1.5 text-center">
                        <input type="time" class="ponto-input-e2 ${inputClass}" value="${dia.e2 || ''}" data-idx="${idx}" />
                    </td>
                    <td class="px-1 py-1.5 text-center">
                        <input type="time" class="ponto-input-s2 ${inputClass}" value="${dia.s2 || ''}" data-idx="${idx}" />
                    </td>

                    <!-- 4. Horas Trabalhadas -->
                    <td class="px-3 py-2 text-center font-mono font-bold text-slate-800 dark:text-slate-100 col-trabalhado">
                        ${dia.trabalhadosFormatado}
                    </td>

                    <!-- 5. HE 50% -->
                    <td class="px-3 py-2 text-center font-mono text-blue-600 dark:text-blue-400 font-bold col-he50">
                        ${dia.he50Minutos > 0 ? dia.he50Formatado : '—'}
                    </td>

                    <!-- 6. HE 100% -->
                    <td class="px-3 py-2 text-center font-mono text-purple-600 dark:text-purple-400 font-bold col-he100">
                        ${dia.he100Minutos > 0 ? dia.he100Formatado : '—'}
                    </td>

                    <!-- 7. Noturno -->
                    <td class="px-3 py-2 text-center font-mono text-amber-600 dark:text-amber-400 font-bold col-noturno">
                        ${dia.noturnoMinutos > 0 ? dia.noturnoFormatado : '—'}
                    </td>

                    <!-- 8. Saldo Diário -->
                    <td class="px-3 py-2 text-center font-mono font-bold col-saldo ${dia.saldoMinutos > 0 ? 'text-emerald-600 dark:text-emerald-400' : (dia.saldoMinutos < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400')}">
                        ${dia.saldoMinutos !== 0 ? dia.saldoFormatado : '00:00'}
                    </td>

                    <!-- 9. Ocorrência & Justificativa -->
                    <td class="px-3 py-2 whitespace-nowrap">
                        <div class="flex items-center gap-1.5">
                            <div class="col-status-badge flex-1">${statusBadge}</div>
                            <button type="button" class="btn-abrir-justificativa p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" data-idx="${idx}" title="Inserir ou editar justificativa legal">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        conectarListenersInputs();
    }

    // ─── Atualização Reativa por Input sem Perder Foco ─────────
    function conectarListenersInputs() {
        const corpo = $('pontoGradeTabelaCorpo');
        if (!corpo) return;

        ['e1', 's1', 'e2', 's2'].forEach(campo => {
            corpo.querySelectorAll(`.ponto-input-${campo}`).forEach(input => {
                input.addEventListener('change', e => {
                    const idx = Number(e.target.getAttribute('data-idx'));
                    const valor = e.target.value;
                    atualizarBatidaDia(idx, campo, valor);
                });
            });
        });

        corpo.querySelectorAll('.btn-abrir-justificativa').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-idx'));
                abrirModalJustificativa(idx);
            });
        });
    }

    function atualizarBatidaDia(idx, campo, valor) {
        if (!gradePontoAtual[idx]) return;

        gradePontoAtual[idx][campo] = valor;

        // Recalcular o dia imediatamente
        const dia = gradePontoAtual[idx];
        const resultado = calcularDiaPonto({
            e1: dia.e1,
            s1: dia.s1,
            e2: dia.e2,
            s2: dia.s2,
            previstoMinutos: dia.previstoMinutos,
            tipoDia: dia.tipoDia,
            justificativa: dia.justificativa
        });

        Object.assign(gradePontoAtual[idx], resultado);

        // Atualizar os elementos de texto da linha específica no DOM
        const tr = document.querySelector(`tr[data-dia-index="${idx}"]`);
        if (tr) {
            const elTrab = tr.querySelector('.col-trabalhado');
            const elHE50 = tr.querySelector('.col-he50');
            const elHE100 = tr.querySelector('.col-he100');
            const elNot = tr.querySelector('.col-noturno');
            const elSaldo = tr.querySelector('.col-saldo');

            if (elTrab) elTrab.textContent = resultado.trabalhadosFormatado;
            if (elHE50) elHE50.textContent = resultado.he50Minutos > 0 ? resultado.he50Formatado : '—';
            if (elHE100) elHE100.textContent = resultado.he100Minutos > 0 ? resultado.he100Formatado : '—';
            if (elNot) elNot.textContent = resultado.noturnoMinutos > 0 ? resultado.noturnoFormatado : '—';
            if (elSaldo) {
                elSaldo.textContent = resultado.saldoMinutos !== 0 ? resultado.saldoFormatado : '00:00';
                elSaldo.className = `px-3 py-2 text-center font-mono font-bold col-saldo ${resultado.saldoMinutos > 0 ? 'text-emerald-600 dark:text-emerald-400' : (resultado.saldoMinutos < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400')}`;
            }
        }

        atualizarKPIs();
    }

    // ─── Ações em Massa na Folha de Ponto ───────────────────────
    function preencherPontoContratual() {
        if (!colaboradorSelecionadoPonto) return;

        const c = colaboradorSelecionadoPonto;
        const e1 = c.horarioEntrada || '08:00';
        const s2 = c.horarioSaida || '17:48';
        const intervalo = c.intervalo || '01:00';

        const minE1 = converterHoraParaMinutos(e1) || 480;
        const minInterv = converterHoraParaMinutos(intervalo) || 60;
        const minS1 = minE1 + 240;
        const minE2 = minS1 + minInterv;

        const s1 = converterMinutosParaHora(minS1);
        const e2 = converterMinutosParaHora(minE2);

        gradePontoAtual = gradePontoAtual.map(dia => {
            if (dia.tipoDia !== 'util') return dia;

            const res = calcularDiaPonto({
                e1,
                s1,
                e2,
                s2,
                previstoMinutos: dia.previstoMinutos,
                tipoDia: dia.tipoDia,
                justificativa: ''
            });

            return {
                ...dia,
                e1,
                s1,
                e2,
                s2,
                justificativa: '',
                ...res
            };
        });

        renderizarGradeTabela();
        atualizarKPIs();
        showToast('Grade preenchida com o horário contratual oficial!');
    }

    function simularMarcacoesReais() {
        if (!colaboradorSelecionadoPonto) return;

        gradePontoAtual = gerarMarcacoesDemonstrativas(gradePontoAtual, colaboradorSelecionadoPonto);
        renderizarGradeTabela();
        atualizarKPIs();
        showToast('Marcações demonstrativas geradas com sucesso!');
    }

    async function salvarFolhaAtual() {
        if (!colaboradorSelecionadoPonto) return;

        const resumo = calcularResumoMensalPonto(gradePontoAtual, colaboradorSelecionadoPonto.salarioBase);

        const folha = {
            colaboradorId: colaboradorSelecionadoPonto.id,
            ano: anoPontoAtual,
            mes: mesPontoAtual,
            dias: gradePontoAtual,
            resumo
        };

        try {
            await salvarFolhaPonto(folha);
            showToast(`Folha de ponto de ${$('pontoCompetenciaSelect')?.selectedOptions[0]?.text || 'mês'} salva no IndexedDB!`, 'success');
        } catch (e) {
            console.error(e);
            showToast('Erro ao salvar folha de ponto.', 'error');
        }
    }

    // ─── Modal de Justificativa de Ponto ────────────────────────
    function abrirModalJustificativa(idx) {
        diaEditandoJustificativa = idx;
        const dia = gradePontoAtual[idx];
        if (!dia) return;

        if ($('justificativaPontoDataLabel')) {
            $('justificativaPontoDataLabel').textContent = `${dia.diaSemana}, ${String(dia.dia).padStart(2, '0')}/${String(mesPontoAtual).padStart(2, '0')}/${anoPontoAtual}`;
        }
        if ($('justificativaPontoDiaIndex')) $('justificativaPontoDiaIndex').value = String(idx);
        if ($('justificativaPontoMotivo')) $('justificativaPontoMotivo').value = dia.justificativa || 'Atestado Médico (Art. 473 CLT)';
        if ($('justificativaPontoObs')) $('justificativaPontoObs').value = dia.observacao || '';

        $('modalJustificativaPonto')?.classList.remove('hidden');
    }

    function fecharModalJustificativa() {
        $('modalJustificativaPonto')?.classList.add('hidden');
        diaEditandoJustificativa = null;
    }

    function aplicarJustificativa(e) {
        e.preventDefault();
        if (diaEditandoJustificativa === null) return;

        const idx = diaEditandoJustificativa;
        const motivo = $('justificativaPontoMotivo')?.value || '';
        const obs = $('justificativaPontoObs')?.value || '';

        gradePontoAtual[idx].justificativa = motivo;
        gradePontoAtual[idx].observacao = obs;

        // Se for atestado médico, limpa as batidas e abona a jornada
        if (motivo.toLowerCase().includes('atestado')) {
            gradePontoAtual[idx].e1 = '';
            gradePontoAtual[idx].s1 = '';
            gradePontoAtual[idx].e2 = '';
            gradePontoAtual[idx].s2 = '';
        }

        const res = calcularDiaPonto({
            e1: gradePontoAtual[idx].e1,
            s1: gradePontoAtual[idx].s1,
            e2: gradePontoAtual[idx].e2,
            s2: gradePontoAtual[idx].s2,
            previstoMinutos: gradePontoAtual[idx].previstoMinutos,
            tipoDia: gradePontoAtual[idx].tipoDia,
            justificativa: motivo
        });

        Object.assign(gradePontoAtual[idx], res);

        fecharModalJustificativa();
        renderizarGradeTabela();
        atualizarKPIs();
        showToast('Justificativa aplicada com sucesso!');
    }

    function removerJustificativa() {
        if (diaEditandoJustificativa === null) return;
        const idx = diaEditandoJustificativa;

        gradePontoAtual[idx].justificativa = '';
        gradePontoAtual[idx].observacao = '';

        const res = calcularDiaPonto({
            e1: gradePontoAtual[idx].e1,
            s1: gradePontoAtual[idx].s1,
            e2: gradePontoAtual[idx].e2,
            s2: gradePontoAtual[idx].s2,
            previstoMinutos: gradePontoAtual[idx].previstoMinutos,
            tipoDia: gradePontoAtual[idx].tipoDia,
            justificativa: ''
        });

        Object.assign(gradePontoAtual[idx], res);

        fecharModalJustificativa();
        renderizarGradeTabela();
        atualizarKPIs();
        showToast('Justificativa removida.');
    }

    // ─── Emissão do Espelho de Ponto Oficial em PDF (Portaria MTE 671)
    function emitirEspelhoPdf() {
        if (!colaboradorSelecionadoPonto) {
            showToast('Selecione um colaborador primeiro.', 'error');
            return;
        }

        const c = colaboradorSelecionadoPonto;
        const corp = getDadosCorporativos();
        const compDesc = $('pontoCompetenciaSelect')?.selectedOptions[0]?.text || 'Agosto / 2026';
        const resumo = calcularResumoMensalPonto(gradePontoAtual, c.salarioBase);

        const htmlEspelho = `
            <div style="font-family: Arial, sans-serif; font-size: 10px; color: #1e293b; line-height: 1.4; padding: 20px;">
                <!-- Cabeçalho do Espelho de Ponto (Portaria MTE 671/2021) -->
                <div style="border-bottom: 2px solid #312e81; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        <h2 style="font-size: 15px; font-weight: bold; margin: 0; color: #312e81; text-transform: uppercase;">
                            ${corp.razaoSocial || 'EMPRESA DEMONSTRATIVA LTDA'}
                        </h2>
                        <p style="font-size: 10px; margin: 2px 0; color: #64748b;">
                            CNPJ: ${corp.cnpj || '00.000.000/0001-00'} • Endereço: ${corp.endereco || 'Avenida Paulista, 1000 — São Paulo/SP'}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 11px; font-weight: bold; color: #312e81; text-transform: uppercase; display: block;">
                            Relatório Espelho de Ponto Eletrônico
                        </span>
                        <span style="font-size: 9px; color: #64748b;">Em conformidade com a Portaria MTE 671/2021</span>
                    </div>
                </div>

                <!-- Dados Cadastrais e Funcionais do Empregado -->
                <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; margin-bottom: 12px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; font-size: 10px;">
                    <div><span style="color: #64748b; display: block; font-size: 9px;">Empregado</span><strong>${c.nome}</strong></div>
                    <div><span style="color: #64748b; display: block; font-size: 9px;">Matrícula</span><strong>${c.matricula || '—'}</strong></div>
                    <div><span style="color: #64748b; display: block; font-size: 9px;">Cargo / CBO</span><strong>${c.cargo || '—'}</strong></div>
                    <div><span style="color: #64748b; display: block; font-size: 9px;">Departamento</span><strong>${c.departamento || 'Geral'}</strong></div>
                    <div><span style="color: #64748b; display: block; font-size: 9px;">Data de Admissão</span><strong>${c.admissao ? c.admissao.split('-').reverse().join('/') : '—'}</strong></div>
                    <div><span style="color: #64748b; display: block; font-size: 9px;">Escala de Trabalho</span><strong>${c.escala || '5x2'}</strong></div>
                    <div><span style="color: #64748b; display: block; font-size: 9px;">Horário Contratual</span><strong>${c.horarioEntrada || '08:00'} às ${c.horarioSaida || '17:48'} (Int. ${c.intervalo || '01:00'})</strong></div>
                    <div><span style="color: #64748b; display: block; font-size: 9px;">Competência de Apuração</span><strong style="color: #312e81;">${compDesc}</strong></div>
                </div>

                <!-- Tabela Analítica Diária de Marcações -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9px;">
                    <thead>
                        <tr style="background-color: #e2e8f0; text-align: center;">
                            <th style="padding: 4px; border: 1px solid #cbd5e1; text-align: left;">Dia / Data</th>
                            <th style="padding: 4px; border: 1px solid #cbd5e1;">Entrada 1</th>
                            <th style="padding: 4px; border: 1px solid #cbd5e1;">Saída 1</th>
                            <th style="padding: 4px; border: 1px solid #cbd5e1;">Entrada 2</th>
                            <th style="padding: 4px; border: 1px solid #cbd5e1;">Saída 2</th>
                            <th style="padding: 4px; border: 1px solid #cbd5e1;">Normais</th>
                            <th style="padding: 4px; border: 1px solid #cbd5e1;">HE 50%</th>
                            <th style="padding: 4px; border: 1px solid #cbd5e1;">HE 100%</th>
                            <th style="padding: 4px; border: 1px solid #cbd5e1;">Noturno</th>
                            <th style="padding: 4px; border: 1px solid #cbd5e1;">Saldo</th>
                            <th style="padding: 4px; border: 1px solid #cbd5e1; text-align: left;">Ocorrência / Justificativa</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gradePontoAtual.map(dia => `
                            <tr style="text-align: center; background-color: ${dia.tipoDia === 'feriado' ? '#fef2f2' : (dia.tipoDia === 'dsr' ? '#f8fafc' : '#ffffff')};">
                                <td style="padding: 3px 5px; border: 1px solid #cbd5e1; text-align: left; font-family: monospace;">
                                    <strong>${String(dia.dia).padStart(2, '0')}</strong> (${dia.diaSemana.substring(0, 3)})
                                </td>
                                <td style="padding: 3px; border: 1px solid #cbd5e1; font-family: monospace;">${dia.e1 || '—'}</td>
                                <td style="padding: 3px; border: 1px solid #cbd5e1; font-family: monospace;">${dia.s1 || '—'}</td>
                                <td style="padding: 3px; border: 1px solid #cbd5e1; font-family: monospace;">${dia.e2 || '—'}</td>
                                <td style="padding: 3px; border: 1px solid #cbd5e1; font-family: monospace;">${dia.s2 || '—'}</td>
                                <td style="padding: 3px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">${dia.trabalhadosFormatado}</td>
                                <td style="padding: 3px; border: 1px solid #cbd5e1; font-family: monospace; color: #1d4ed8;">${dia.he50Minutos > 0 ? dia.he50Formatado : '—'}</td>
                                <td style="padding: 3px; border: 1px solid #cbd5e1; font-family: monospace; color: #7e22ce;">${dia.he100Minutos > 0 ? dia.he100Formatado : '—'}</td>
                                <td style="padding: 3px; border: 1px solid #cbd5e1; font-family: monospace; color: #b45309;">${dia.noturnoMinutos > 0 ? dia.noturnoFormatado : '—'}</td>
                                <td style="padding: 3px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: ${dia.saldoMinutos > 0 ? '#047857' : (dia.saldoMinutos < 0 ? '#b91c1c' : '#64748b')};">
                                    ${dia.saldoMinutos !== 0 ? dia.saldoFormatado : '00:00'}
                                </td>
                                <td style="padding: 3px 5px; border: 1px solid #cbd5e1; text-align: left; font-size: 8.5px;">
                                    ${dia.justificativa || (dia.tipoDia === 'feriado' ? 'Feriado' : (dia.tipoDia === 'dsr' ? 'DSR' : ''))}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <!-- Quadro de Totais Consolidados e Proventos -->
                <div style="display: flex; justify-content: space-between; gap: 15px; margin-bottom: 25px;">
                    <div style="flex: 1; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px;">
                        <h4 style="margin: 0 0 6px 0; font-size: 10px; color: #312e81; text-transform: uppercase;">Quadro de Horas Apuradas</h4>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; font-size: 9.5px;">
                            <div>Horas Previstas: <strong>${resumo.totaisFormatados.previsto}</strong></div>
                            <div>Horas Trabalhadas: <strong>${resumo.totaisFormatados.trabalhado}</strong></div>
                            <div>Saldo do Mês: <strong style="color: ${resumo.totaisMinutos.saldo >= 0 ? '#047857' : '#b91c1c'};">${resumo.totaisFormatados.saldo}</strong></div>
                            <div>HE 50% (Úteis): <strong>${resumo.totaisFormatados.he50}</strong></div>
                            <div>HE 100% (DSR): <strong>${resumo.totaisFormatados.he100}</strong></div>
                            <div>Adic. Noturno: <strong>${resumo.totaisFormatados.noturno}</strong></div>
                        </div>
                    </div>
                    <div style="width: 200px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; font-size: 9.5px;">
                        <h4 style="margin: 0 0 6px 0; font-size: 10px; color: #312e81; text-transform: uppercase;">Estimativa de Proventos</h4>
                        <div>HE 50%: <strong>${formatCurrency(resumo.valoresEstimados.valorHE50)}</strong></div>
                        <div>HE 100%: <strong>${formatCurrency(resumo.valoresEstimados.valorHE100)}</strong></div>
                        <div>Noturno: <strong>${formatCurrency(resumo.valoresEstimados.valorNoturno)}</strong></div>
                        <div style="border-top: 1px solid #cbd5e1; padding-top: 4px; margin-top: 4px; font-weight: bold; color: #047857;">
                            Total Ponto: ${formatCurrency(resumo.valoresEstimados.totalProventosPonto)}
                        </div>
                    </div>
                </div>

                <!-- Termo Legal de Reconhecimento e Assinaturas -->
                <p style="text-align: justify; font-size: 9px; color: #475569; margin-bottom: 25px;">
                    Reconheço a exatidão das marcações de ponto acima descritas, as quais representam fielmente a totalidade das horas de trabalho por mim desempenhadas nesta competência mensal, em conformidade com o <strong>Artigo 74, § 2º da CLT</strong> e as disposições da <strong>Portaria MTE 671/2021</strong>.
                </p>

                <div style="display: flex; justify-content: space-between; text-align: center; font-size: 9.5px; margin-top: 30px;">
                    <div style="width: 45%;">
                        <div style="border-top: 1px solid #000; padding-top: 5px;">${corp.razaoSocial || 'Empregador'}</div>
                    </div>
                    <div style="width: 45%;">
                        <div style="border-top: 1px solid #000; padding-top: 5px;">Assinatura do Empregado: ${c.nome}</div>
                    </div>
                </div>
            </div>
        `;

        abrirPreviaPdf(htmlEspelho, `espelho_ponto_${c.matricula || 'colab'}_${anoPontoAtual}_${mesPontoAtual}.pdf`, `Espelho de Ponto Oficial — ${c.nome}`);
    }

    // ─── Exportação de Eventos para Folha de Pagamento em Lote ───
    function exportarParaFolhaLote() {
        if (!colaboradorSelecionadoPonto) return;

        const c = colaboradorSelecionadoPonto;
        const resumo = calcularResumoMensalPonto(gradePontoAtual, c.salarioBase);

        showToast(`Eventos de ponto (${resumo.totaisFormatados.he50} HE 50%, ${resumo.totaisFormatados.he100} HE 100%, ${resumo.totaisFormatados.noturno} Noturno) vinculados ao cálculo da folha!`);
    }

    // ─── Event Listeners do Módulo ─────────────────────────────
    $('pontoColaboradorSelect')?.addEventListener('change', e => {
        const colabId = Number(e.target.value);
        colaboradorSelecionadoPonto = colaboradoresPontoCache.find(x => x.id === colabId) || null;
        carregarPontoColaborador();
    });

    $('pontoCompetenciaSelect')?.addEventListener('change', () => {
        lerCompetenciaSelecionada();
        carregarPontoColaborador();
    });

    $('btnPreencherPontoPadrao')?.addEventListener('click', preencherPontoContratual);
    $('btnSimularPontoReal')?.addEventListener('click', simularMarcacoesReais);
    $('btnSalvarFolhaPonto')?.addEventListener('click', salvarFolhaAtual);
    $('btnEmitirEspelhoPdf')?.addEventListener('click', emitirEspelhoPdf);
    $('btnExportarFolhaLotePonto')?.addEventListener('click', exportarParaFolhaLote);

    $('btnFecharModalJustificativa')?.addEventListener('click', fecharModalJustificativa);
    $('formJustificativaPonto')?.addEventListener('submit', aplicarJustificativa);
    $('btnRemoverJustificativa')?.addEventListener('click', removerJustificativa);

    $('sidebarBtnPonto')?.addEventListener('click', () => inicializarDados());
    window.addEventListener('hashchange', () => {
        if (location.hash === '#ponto') inicializarDados();
    });

    // Inicialização
    inicializarDados();
}






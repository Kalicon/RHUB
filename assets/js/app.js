/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — App Controller (5 Módulos + SPA Routing + GSAP + PWA + Histórico)
 * ═══════════════════════════════════════════════════════════════════════
 */

import { calcularAdicionalNoturno, FATOR_HORA_FICTA } from './modules/noturno.js';
import { calcularRescisao, MOTIVOS_RESCISAO, compararCenariosRescisao } from './modules/rescisao.js';
import { calcularFaltas } from './modules/faltas.js';
import { calcularFerias, calcular13o } from './modules/ferias.js';
import { calcularSalarioLiquido } from './modules/liquido.js';
import { formatCurrency, formatNumber, formatHoursMinutes, parseCurrency } from './utils/formatters.js';
import {
    exportarNoturnoExcel,
    exportarRescisaoExcel,
    exportarFaltasExcel,
    exportarFeriasExcel,
    exportarLiquidoExcel,
    copiarTextoClipboard
} from './utils/exporter.js';
import {
    getDadosCorporativos,
    salvarDadosCorporativos,
    getHistoricoCalculos,
    adicionarAoHistorico,
    removerDoHistorico,
    limparHistorico
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
    initNoturnoModule();
    initRescisaoModule();
    initFaltasModule();
    initFeriasModule();
    initLiquidoModule();
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
            showToast('Aplicativo instalado com sucesso!', '📱');
        }
        deferredPrompt = null;
    });

    window.addEventListener('appinstalled', () => {
        pwaBtn?.classList.add('hidden');
        showToast('RHUB pronto para uso offline!', '✓');
    });
}

// ═══════════════════════════════════════════════════════════════════════
//  FEEDBACK VISUAL — TOAST
// ═══════════════════════════════════════════════════════════════════════
function showToast(msg, icon = '✓') {
    const toast = document.getElementById('rhubToast');
    const msgEl = document.getElementById('toastMsg');
    const iconEl = document.getElementById('toastIcon');
    if (!toast) return;
    if (msgEl) msgEl.textContent = msg;
    if (iconEl) iconEl.textContent = icon;
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
        showToast(`Simulação de ${item.titulo} restaurada!`, '📋');
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
    noturno:  { title: 'Adicional Noturno',    badge: 'Art. 73 CLT' },
    rescisao: { title: 'Rescisão Contratual',  badge: 'Art. 477 CLT' },
    faltas:   { title: 'Faltas e Atrasos',     badge: 'Art. 462 CLT' },
    ferias:   { title: 'Férias & 13º Salário', badge: 'Art. 129 CLT' },
    liquido:  { title: 'Salário Líquido',      badge: 'Art. 457 CLT' },
};

function initSPARouter() {
    const links = document.querySelectorAll('.sidebar-link');
    const panels = document.querySelectorAll('.module-panel');
    const topTitle = document.getElementById('topBarTitle');
    const topBadge = document.getElementById('topBarBadge');

    function navigateTo(panelId) {
        currentActiveModule = panelId;

        // Hide all panels
        panels.forEach(p => p.classList.add('hidden'));
        // Show target
        const target = document.getElementById(`panel-${panelId}`);
        if (target) {
            target.classList.remove('hidden');
            // GSAP entrance
            if (window.gsap) gsap.fromTo(target, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
        }

        // Update sidebar active state
        links.forEach(l => {
            const isActive = l.dataset.panel === panelId;
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
        const meta = MODULE_META[panelId] || MODULE_META.noturno;
        if (topTitle) topTitle.textContent = meta.title;
        if (topBadge) topBadge.textContent = meta.badge;

        // Atualizar cabeçalho da impressão
        atualizarHeaderImpressao(meta.title);

        // Update URL hash
        window.location.hash = panelId;

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
    const initialHash = window.location.hash.replace('#', '') || 'noturno';
    navigateTo(MODULE_META[initialHash] ? initialHash : 'noturno');

    // Handle browser back/forward
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#', '');
        if (MODULE_META[hash]) navigateTo(hash);
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
                if (r.saqueFGTS) info.innerHTML += `<span class="px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">✓ Direito ao Saque FGTS</span>`;
                if (r.seguroDesemprego) info.innerHTML += `<span class="px-2.5 py-1 text-[10px] font-bold rounded-full bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20">✓ Seguro-Desemprego</span>`;
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
                            <p>Saque FGTS: <strong class="${c.saqueFGTS ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}">${c.saqueFGTS ? '✓ Permitido' : '✕ Bloqueado'}</strong></p>
                            <p>Seguro-Desemp.: <strong class="${c.seguroDesemprego ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}">${c.seguroDesemprego ? '✓ Permitido' : '✕ Não tem'}</strong></p>
                        </div>
                    </div>

                    <div class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <p class="text-[10px] uppercase font-bold text-slate-400">Custo Total Empresa</p>
                        <p class="text-sm font-bold font-mono text-slate-900 dark:text-white">${formatCurrency(c.custoEmpresa)}</p>
                    </div>`;
                containerComparador.appendChild(card);
            });
        }

        modalComparador?.classList.remove('hidden');
    });

    btnFecharComparador?.addEventListener('click', () => modalComparador?.classList.add('hidden'));
    modalComparador?.addEventListener('click', e => { if (e.target === modalComparador) modalComparador.classList.add('hidden'); });

    moduleExportHandlers.rescisao = exportExcel;
    moduleCopyHandlers.rescisao = copySummary;
    modulePrintHandlers.rescisao = doPrint;

    $('btnExcelRescisao')?.addEventListener('click', exportExcel);
    $('btnCopiarRescisao')?.addEventListener('click', copySummary);
    $('btnImprimirRescisao')?.addEventListener('click', doPrint);

    ['rescSalario','rescMotivo','rescDataAdm','rescDataDem','rescDiasTrab','rescFeriasVencidas','rescSaldoFGTS','rescTipoAviso','rescDependentes']
        .forEach(id => { const el = $(id); if (el) { el.addEventListener('input', calc); el.addEventListener('change', calc); } });

    ['rescSalario','rescSaldoFGTS'].forEach(id => {
        $(id)?.addEventListener('blur', e => { const v = parseCurrency(e.target.value); if (v > 0) e.target.value = formatNumber(v, 2); });
    });
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
                ? `<span class="font-bold text-red-600 dark:text-red-400">⚠ ${imp.label}</span>`
                : `<span class="font-bold">📋 Art. 130 CLT:</span> ${imp.label}`;
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
    $('btnCopiarFerias')?.addEventListener('click', copySummary);
    $('btnImprimirFerias')?.addEventListener('click', doPrint);

    ['ferSalario','ferDias','ferAbono','ferDobro','ferDependentes','fer13Meses']
        .forEach(id => { const el = $(id); if (el) { el.addEventListener('input', calc); el.addEventListener('change', calc); } });

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
    $('btnCopiarLiquido')?.addEventListener('click', copySummary);
    $('btnImprimirLiquido')?.addEventListener('click', doPrint);

    ['liqSalario','liqDivisor','liqHE50','liqHE100','liqNoturno','liqInsalubridade','liqPericulosidade','liqDependentes','liqPensao','liqOptanteVT','liqVR','liqSaude']
        .forEach(id => { const el = $(id); if (el) { el.addEventListener('input', calc); el.addEventListener('change', calc); } });

    ['liqSalario','liqNoturno','liqPensao','liqVR','liqSaude'].forEach(id => {
        $(id)?.addEventListener('blur', e => { const v = parseCurrency(e.target.value); if (v > 0) e.target.value = formatNumber(v, 2); });
    });
    calc();
}

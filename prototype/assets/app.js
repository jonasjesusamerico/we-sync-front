/*
 * we-sync prototype: shared layout, icons, sample data and helpers.
 * Plain script (no modules) so the pages open straight from the file system.
 */
(function () {
  'use strict';

  // Stroke icons, 24x24 grid.
  const ICONS = {
    sync: 'M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4',
    home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h4',
    plus: 'M12 5v14M5 12h14',
    chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    tag: 'M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9zM7.5 7.5h.01',
    card: 'M3 6h18v12H3zM3 10h18M7 15h3',
    logout: 'M10 4H5v16h5M15 8l4 4-4 4M19 12H9',
    sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
    chevL: 'M15 6l-6 6 6 6',
    chevR: 'M9 6l6 6-6 6',
    chevD: 'M6 9l6 6 6-6',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    food: 'M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3c-2 2-3 4-3 7h3v11',
    car: 'M5 16v-5l2-5h10l2 5v5M3 16h18v3H3zM7.5 13h.01M16.5 13h.01',
    house: 'M4 21V9l8-6 8 6v12zM10 21v-6h4v6',
    heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
    book: 'M4 19V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h14',
    smile: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01',
    wallet: 'M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l12-3v3M16 13.5h.01',
    calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
    arrowDown: 'M12 5v14M6 13l6 6 6-6',
    arrowUp: 'M12 19V5M6 11l6-6 6 6',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
    check: 'M5 12.5l4.5 4.5L19 7',
    x: 'M6 6l12 12M18 6 6 18',
    bell: 'M6 16v-5a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0',
    filter: 'M4 5h16l-6 8v6l-4-1v-5z',
    edit: 'M4 20h4L19 9l-4-4L4 16z',
    trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    eyeOff: 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a9.6 9.6 0 0 0 4.4-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2',
    mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
    lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
    target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
    sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
    menu: 'M4 7h16M4 12h16M4 17h16',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
    users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M18 14a6 6 0 0 1 4 6',
    piggy: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
    link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
    alert: 'M12 3l10 18H2zM12 10v5M12 18h.01',
    sliders: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4',
    trendUp: 'M3 17l6-6 4 4 8-8M15 7h6v6',
    gift: 'M4 11h16v10H4zM3 7h18v4H3zM12 7v14M12 7c-1.5-3-5-3-5-1s3 1 5 1zM12 7c1.5-3 5-3 5-1s-3 1-5 1z',
    briefcase: 'M3 8h18v12H3zM8 8V5h8v3M3 13h18',
    lockSmall: 'M7 11h10v9H7zM9 11V8a3 3 0 0 1 6 0v3',
    help: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.5v.4M12 17h.01',
    star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
    coffee: 'M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 10h2a2.5 2.5 0 0 1 0 5h-2M8 3v3M12 3v3',
  };

  function icon(name, cls) {
    const d = ICONS[name] || '';
    return (
      '<svg class="ws-icon ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' +
      d +
      '"/></svg>'
    );
  }

  function hydrateIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
      el.outerHTML = icon(el.getAttribute('data-icon'), el.getAttribute('class') || '');
    });
  }

  // Sample data mirroring the API seed (categories, payment methods, statuses).
  const CATEGORIES = [
    { id: 1, name: 'Alimentação', icon: 'food', color: 'var(--ws-cat-food)' },
    { id: 2, name: 'Transporte', icon: 'car', color: 'var(--ws-cat-transport)' },
    { id: 3, name: 'Moradia', icon: 'house', color: 'var(--ws-cat-home)' },
    { id: 4, name: 'Saúde', icon: 'heart', color: 'var(--ws-cat-health)' },
    { id: 5, name: 'Educação', icon: 'book', color: 'var(--ws-cat-education)' },
    { id: 6, name: 'Lazer', icon: 'smile', color: 'var(--ws-cat-leisure)' },
  ];

  const PAYMENT_METHODS = [
    { id: 1, name: 'Dinheiro' },
    { id: 2, name: 'Cartão de crédito' },
    { id: 3, name: 'Cartão de débito' },
    { id: 4, name: 'Pix' },
    { id: 5, name: 'Transferência bancária' },
    { id: 6, name: 'Boleto' },
  ];

  const STATUS = {
    PAID: { label: 'Paga', cls: 'is-paid' },
    PENDING: { label: 'Pendente', cls: 'is-pending' },
    CANCELED: { label: 'Cancelada', cls: 'is-canceled' },
  };

  // Amounts in integer cents.
  const PURCHASES = [
    [1, '2026-10-02', 'Aluguel', 3, 6, 145000, 'PAID', true],
    [2, '2026-10-03', 'Supermercado do mês', 1, 3, 38645, 'PAID', true],
    [3, '2026-10-05', 'Combustível', 2, 2, 21000, 'PAID'],
    [4, '2026-10-07', 'Farmácia', 4, 4, 7490, 'PAID'],
    [5, '2026-10-08', 'Almoço com a equipe', 1, 4, 5800, 'PAID'],
    [6, '2026-10-10', 'Curso de inglês', 5, 6, 32000, 'PAID'],
    [7, '2026-10-12', 'Cinema', 6, 2, 6400, 'PAID'],
    [8, '2026-10-14', 'Conta de luz', 3, 4, 18237, 'PAID', true],
    [9, '2026-10-15', 'Feira', 1, 1, 9250, 'PAID'],
    [10, '2026-10-17', 'Corrida de aplicativo', 2, 2, 3870, 'PAID'],
    [11, '2026-10-19', 'Padaria', 1, 3, 2780, 'PAID'],
    [12, '2026-10-21', 'Consulta no dentista', 4, 2, 25000, 'PENDING'],
    [13, '2026-10-23', 'Supermercado', 1, 2, 41230, 'PAID', true],
    [14, '2026-10-25', 'Internet', 3, 6, 11990, 'PENDING', true],
    [15, '2026-10-27', 'Show', 6, 2, 18000, 'CANCELED'],
    [16, '2026-10-28', 'Livro', 5, 4, 6990, 'PAID'],
    [17, '2026-10-29', 'Restaurante', 1, 2, 14360, 'PAID'],
    [18, '2026-10-30', 'Estacionamento', 2, 4, 2500, 'PENDING'],
  ].map(function (r) {
    return {
      id: r[0],
      date: r[1],
      description: r[2],
      category: CATEGORIES.find((c) => c.id === r[3]),
      paymentMethod: PAYMENT_METHODS.find((p) => p.id === r[4]),
      amount: r[5],
      status: r[6],
      shared: !!r[7],
    };
  });

  // Recurring purchases: fixed bills repeat for N months, installments show their position.
  const RECURRENCE = { 1: 'fixa · 10/12', 6: 'parcela 4/6', 8: 'fixa', 14: 'fixa' };
  PURCHASES.forEach((p) => (p.recurrence = RECURRENCE[p.id] || null));

  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  function formatBrl(cents) {
    return brl.format(cents / 100);
  }

  const MONTHS = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];

  // Dates stay as "YYYY-MM-DD" strings, never parsed through new Date(string).
  function formatDate(iso) {
    const p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }
  function formatDayMonth(iso) {
    const p = iso.split('-');
    return p[2] + ' ' + MONTHS[Number(p[1]) - 1].slice(0, 3);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function statusPill(status) {
    const s = STATUS[status];
    return '<span class="ws-status ' + s.cls + '">' + s.label + '</span>';
  }

  function catBubble(cat) {
    return '<span class="ws-cat" style="--cat:' + cat.color + '">' + icon(cat.icon) + '</span>';
  }

  // Theme
  function currentTheme() {
    return document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light';
  }
  function setTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    try {
      localStorage.setItem('ws-theme', theme);
    } catch (e) {
      /* storage unavailable: theme lasts for this page only */
    }
    document.querySelectorAll('[data-theme-toggle]').forEach(paintThemeButton);
  }
  function paintThemeButton(btn) {
    const dark = currentTheme() === 'dark';
    btn.innerHTML = icon(dark ? 'sun' : 'moon');
    btn.setAttribute('aria-label', dark ? 'Usar tema claro' : 'Usar tema escuro');
  }
  function bindThemeToggles() {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      paintThemeButton(btn);
      btn.addEventListener('click', function () {
        setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
      });
    });
  }

  // Layout
  const NAV = [
    { group: 'Menu', key: 'dashboard', label: 'Início', href: 'dashboard.html', icon: 'home' },
    { group: 'Menu', key: 'compras', label: 'Compras', href: 'compras.html', icon: 'receipt' },
    { group: 'Menu', key: 'casa', label: 'Nossa casa', href: 'casa.html', icon: 'users' },
    { group: 'Planejamento', key: 'metas', label: 'Metas e relatórios', href: 'metas.html', icon: 'target' },
    { group: 'Planejamento', key: 'investimentos', label: 'Investimentos', href: 'investimentos.html', icon: 'trendUp' },
    // Only for accounts flagged as admin in the database (checked by the API, not only hidden here).
    { group: 'Sistema', key: 'admin', label: 'Configuração geral', href: 'admin.html', icon: 'shield' },
    { group: 'Administração', key: 'configuracoes', label: 'Configurações', href: 'configuracoes.html', icon: 'sliders' },
  ];

  const NOTIFICATIONS = [
    { icon: 'users', text: 'Amanda registrou uma compra da casa: Produtos de limpeza, R$ 98,40', when: 'há 5 dias', href: 'casa.html' },
    { icon: 'alert', text: 'Os gastos da casa em outubro passaram do padrão', when: 'ontem', href: 'casa.html#padrao' },
  ];

  // Shared household sample (the partner's side comes from her own account).
  const HOUSE = {
    name: 'Nossa casa',
    me: { name: 'Jonas', initials: 'JS', incomes: [['Salário', 650000], ['Vale-alimentação', 80000], ['Freelance de design', 120000]] },
    partner: { name: 'Amanda', initials: 'AM', incomes: [['Salário', 420000], ['Vale-alimentação', 80000]] },
    partnerPurchases: [
      [101, '2026-10-04', 'Mercado', 1, 4, 52000, 'PAID'],
      [102, '2026-10-09', 'Gás de cozinha', 3, 4, 11500, 'PAID'],
      [103, '2026-10-16', 'Farmácia', 4, 3, 6490, 'PAID'],
      [104, '2026-10-26', 'Produtos de limpeza', 3, 3, 9840, 'PAID'],
    ],
    // Monthly totals of house purchases before the current month.
    history: [['mai', 248000], ['jun', 255000], ['jul', 260000], ['ago', 275000], ['set', 270000]],
    ceiling: 300000,
    startDay: 1,
    // Income assumed for a member with no income in the month; null = system minimum wage.
    minIncome: null,
    boxes: [
      { id: 1, name: 'Reserva da casa', bank: 'Nubank', owner: 'Jonas', cdi: 100, invested: 800000, gross: 41235, irRate: 0.2 },
      { id: 2, name: 'Caixinha da Amanda', bank: 'Banco Inter', owner: 'Amanda', cdi: 102, invested: 350000, gross: 9610, irRate: 0.225 },
    ],
    // Couple's dreams (SON-*): each one has its own box, kept out of the settlement and the rescue suggestion.
    // "due" is the target month; "last3" are the confirmed deposits of the last 3 months (the current pace).
    dreams: [
      { id: 1, name: 'Viagem para o Chile', target: 1200000, due: '2027-07', bank: 'Nubank', owner: 'Conta conjunta', cdi: 100, balance: 380000, last3: [90000, 90000, 80000] },
      { id: 2, name: 'Sofá novo', target: 450000, due: '2027-01', bank: 'Banco Inter', owner: 'Amanda', cdi: 102, balance: 260000, last3: [40000, 40000, 30000] },
    ],
  };

  // Month the prototype treats as the current one (the sample data is October 2026).
  const NOW = { year: 2026, month: 10 };
  const monthIndex = (y, m) => y * 12 + (m - 1);
  const monthLabel = (idx) => MONTHS[idx % 12].toLowerCase() + ' ' + Math.floor(idx / 12);

  // Regressive IR by how long the money stays invested (in months).
  function irByMonths(n) {
    if (n <= 6) return 0.225;
    if (n <= 12) return 0.2;
    if (n <= 24) return 0.175;
    return 0.15;
  }

  // Plan for a dream (05, section "Sonhos"): monthly saving needed to reach the target by the due month with
  // the box yield net of IR, each member's part by the income split, and the forecast at the current pace.
  function dreamPlan(d, shareMe) {
    const [y, m] = d.due.split('-').map(Number);
    const n = Math.max(1, monthIndex(y, m) - monthIndex(NOW.year, NOW.month));
    const rate = (Math.pow(1 + CDI_YEAR, 1 / 12) - 1) * (d.cdi / 100) * (1 - irByMonths(n));
    const grow = (k) => Math.pow(1 + rate, k);
    const ceilReal = (c) => Math.ceil(c / 100) * 100;
    const missing = d.target - d.balance * grow(n);
    const need = missing <= 0 ? 0 : ceilReal((missing * rate) / (grow(n) - 1));
    const pace = d.last3.length ? Math.round(d.last3.reduce((a, x) => a + x, 0) / d.last3.length) : need;
    let k = 0;
    while (k < 600 && d.balance * grow(k) + (pace * (grow(k) - 1)) / rate < d.target) k++;
    const done = d.balance >= d.target;
    let status;
    if (done) status = { key: 'done', label: 'Concluído' };
    else if (k <= n - 1) status = { key: 'ahead', label: 'Adiantado' };
    else if (k <= n) status = { key: 'ontrack', label: 'No ritmo' };
    else status = { key: 'late', label: 'Atrasado' };
    return {
      months: n, rate: rate, need: need, needMe: ceilReal(need * shareMe), needP: ceilReal(need * (1 - shareMe)),
      pace: pace, forecast: k >= 600 ? null : monthLabel(monthIndex(NOW.year, NOW.month) + k), dueLabel: monthLabel(monthIndex(y, m)),
      pct: Math.min(100, Math.round((d.balance / d.target) * 100)), status: status,
    };
  }

  // Asset catalog kept in the system settings (admin). The daily 00:00 job updates the closing price of each
  // active asset once, and every portfolio reads the price from here (one request per asset, not per user).
  const ASSETS = [
    { ticker: 'ITSA4', name: 'Itaúsa PN', cls: 'acao', close: 1045, date: '30/10/2026', active: true },
    { ticker: 'BBAS3', name: 'Banco do Brasil ON', cls: 'acao', close: 2730, date: '30/10/2026', active: true },
    { ticker: 'WEGE3', name: 'WEG ON', cls: 'acao', close: 3620, date: '24/10/2026', active: false },
    { ticker: 'PETR4', name: 'Petrobras PN', cls: 'acao', close: 3712, date: '30/10/2026', active: true },
    { ticker: 'MXRF11', name: 'Maxi Renda FII', cls: 'fii', close: 970, date: '30/10/2026', active: true },
    { ticker: 'HGLG11', name: 'CSHG Logística FII', cls: 'fii', close: 16240, date: '30/10/2026', active: true },
    { ticker: 'KNRI11', name: 'Kinea Renda Imobiliária FII', cls: 'fii', close: 14790, date: '30/10/2026', active: true },
    { ticker: 'TESOURO SELIC 2029', name: 'Tesouro Selic 2029', cls: 'tesouro', close: 1745903, date: '31/10/2026', active: true },
    { ticker: 'TESOURO IPCA+ 2035', name: 'Tesouro IPCA+ 2035', cls: 'tesouro', close: 284723, date: '31/10/2026', active: true },
  ];
  const assetOf = (ticker) => ASSETS.find((a) => a.ticker === ticker);

  // Requests from users to add an asset to the catalog. Prototype keeps them in this browser so the admin page
  // can show them; in the app they are records reviewed by the analysts.
  function assetRequests() {
    try {
      return JSON.parse(localStorage.getItem('ws-asset-requests') || '[]');
    } catch (e) {
      return [];
    }
  }
  function saveAssetRequests(list) {
    try {
      localStorage.setItem('ws-asset-requests', JSON.stringify(list));
    } catch (e) {
      /* storage unavailable: request lasts for this page only */
    }
  }

  // Annual CDI used in the estimates (sample; the app reads the daily series stored by the weekly job).
  const CDI_YEAR = 0.149;

  // Set in the system settings (admin); 2026 value from Banco Central SGS series 1619.
  const SYSTEM_MIN_WAGE = 162100;

  // Demo: casa.html?semrenda=1 shows the partner without income in the month.
  if (new URLSearchParams(location.search).get('semrenda') === '1') HOUSE.partner.incomes = [];

  function sumIncomes(person) {
    return person.incomes.reduce((a, i) => a + i[1], 0);
  }

  function houseMinIncome() {
    return HOUSE.minIncome || SYSTEM_MIN_WAGE;
  }

  // Settlement for the month. "rescue" is money taken from a box and received by one member:
  // it lowers what that member paid and the house total. The deposit makes each member's
  // contribution proportional to income, since the box money belongs to the house.
  function houseMonth(rescue) {
    const usedMinMe = sumIncomes(HOUSE.me) === 0;
    const usedMinP = sumIncomes(HOUSE.partner) === 0;
    const incMe = usedMinMe ? houseMinIncome() : sumIncomes(HOUSE.me);
    const incP = usedMinP ? houseMinIncome() : sumIncomes(HOUSE.partner);
    const shareMe = incMe / (incMe + incP);
    const shareP = 1 - shareMe;
    const mine = PURCHASES.filter((p) => p.shared);
    const theirs = HOUSE.partnerPurchases.map((r) => ({
      id: r[0], date: r[1], description: r[2],
      category: CATEGORIES.find((c) => c.id === r[3]),
      paymentMethod: PAYMENT_METHODS.find((m) => m.id === r[4]),
      amount: r[5], status: r[6], shared: true, by: HOUSE.partner.name,
    }));
    mine.forEach((p) => (p.by = HOUSE.me.name));
    const paidOf = (list) => list.filter((p) => p.status === 'PAID').reduce((a, p) => a + p.amount, 0);
    const grossMe = paidOf(mine);
    const grossP = paidOf(theirs);
    let paidMe = grossMe;
    let paidP = grossP;
    // A rescue may come in parts (from each member's box); a joint-account part is split by the shares.
    const parts = rescue ? (Array.isArray(rescue) ? rescue : [rescue]) : [];
    let r = 0;
    parts.forEach(function (part) {
      r += part.amount;
      if (part.to === HOUSE.me.name) paidMe -= part.amount;
      else if (part.to === HOUSE.partner.name) paidP -= part.amount;
      else {
        paidMe -= Math.round(part.amount * shareMe);
        paidP -= part.amount - Math.round(part.amount * shareMe);
      }
    });
    const total = paidMe + paidP;
    let deposit;
    if (paidMe / shareMe >= paidP / shareP) {
      deposit = { from: HOUSE.partner.name, amount: Math.round((paidMe * shareP) / shareMe - paidP) };
    } else {
      deposit = { from: HOUSE.me.name, amount: Math.round((paidP * shareMe) / shareP - paidMe) };
    }
    return {
      incMe: incMe, incP: incP, shareMe: shareMe, shareP: shareP, usedMinMe: usedMinMe, usedMinP: usedMinP,
      purchases: mine.concat(theirs).sort((a, b) => (a.date < b.date ? 1 : -1)),
      grossTotal: grossMe + grossP, grossMe: grossMe, grossP: grossP,
      paidMe: paidMe, paidP: paidP, total: total, rescue: r, deposit: deposit,
    };
  }

  function houseStandard() {
    const h = HOUSE.history;
    if (h.length >= 12) {
      return { value: Math.round(h.slice(-12).reduce((a, x) => a + x[1], 0) / 12), rule: 'média dos últimos 12 meses' };
    }
    if (h.length >= 3) {
      return {
        value: Math.round(h.slice(-3).reduce((a, x) => a + x[1], 0) / 3),
        rule: 'média dos últimos 3 meses (a casa tem ' + h.length + ' meses de histórico)',
      };
    }
    return { value: HOUSE.ceiling, rule: 'meta da casa (menos de 3 meses de histórico)' };
  }

  // isAdmin mirrors the admin flag set in the database; the prototype user is an admin to show the area.
  const USER = { name: 'Jonas', initials: 'JS', email: 'jonas@exemplo.com', isAdmin: true };

  function brand() {
    return (
      '<a class="ws-brand" href="dashboard.html"><span class="ws-brand-mark">' +
      icon('sync') +
      '</span>we-sync</a>'
    );
  }

  function navLink(item, active) {
    if (item.soon) {
      return (
        '<a class="ws-nav-link" aria-disabled="true" title="Em breve">' +
        icon(item.icon) +
        item.label +
        '<span class="ws-badge-soon">em breve</span></a>'
      );
    }
    return (
      '<a class="ws-nav-link" href="' +
      item.href +
      '"' +
      (item.key === active ? ' aria-current="page"' : '') +
      '>' +
      icon(item.icon) +
      item.label +
      '</a>'
    );
  }

  function renderSidebar(active) {
    const el = document.getElementById('ws-sidebar');
    if (!el) return;
    el.className = 'ws-sidebar';
    el.setAttribute('aria-label', 'Menu principal');
    el.innerHTML =
      '<div class="px-2 pb-2">' +
      brand() +
      '</div>' +
      ['Menu', 'Planejamento', 'Administração'].concat(USER.isAdmin ? ['Sistema'] : [])
        .map(
          (g) =>
            '<div class="ws-nav-title">' + g + '</div><nav class="d-flex flex-column gap-1" aria-label="' + g + '">' +
            NAV.filter((n) => n.group === g).map((n) => navLink(n, active)).join('') +
            '</nav>',
        )
        .join('') +
      '<div class="ws-sidebar-card">' +
      '<strong>Registre na hora</strong>' +
      '<p>Lançar a compra assim que ela acontece deixa o mês sempre em dia.</p>' +
      '<a class="btn w-100" href="nova-compra.html">Nova compra</a>' +
      '</div>';
  }

  function renderTopbar() {
    const el = document.getElementById('ws-topbar');
    if (!el) return;
    el.className = 'ws-topbar';
    el.innerHTML =
      brand() +
      '<div class="ws-topbar-actions">' +
      '<a class="btn btn-primary d-none d-lg-inline-flex align-items-center gap-2 me-1" href="nova-compra.html">' +
      icon('plus') +
      'Nova compra</a>' +
      (TOURS[tourKey()]
        ? '<button type="button" class="btn btn-ghost btn-icon" data-tour-help aria-label="Ajuda: refazer o tour desta tela" title="Tour desta tela">' + icon('help') + '</button>'
        : '') +
      '<button type="button" class="btn btn-ghost btn-icon" data-theme-toggle></button>' +
      '<div class="dropdown">' +
      '<button type="button" class="btn btn-ghost btn-icon position-relative" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Notificações, ' +
      NOTIFICATIONS.length +
      ' novas">' +
      icon('bell') +
      '<span class="ws-bell-dot" aria-hidden="true"></span></button>' +
      '<div class="dropdown-menu dropdown-menu-end ws-notif-menu"><div class="px-2 py-1 fw-bold">Notificações</div>' +
      NOTIFICATIONS.map(
        (n) =>
          '<a class="dropdown-item ws-notif" href="' + n.href + '">' + icon(n.icon) + '<span><span class="d-block">' + n.text +
          '</span><small class="text-muted">' + n.when + '</small></span></a>',
      ).join('') +
      '</div></div>' +
      '<div class="dropdown">' +
      '<button type="button" class="ws-user-btn" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Menu da conta">' +
      '<span class="ws-avatar">' +
      USER.initials +
      '</span><span class="ws-user-name">' +
      USER.name +
      '</span>' +
      icon('chevD', 'd-none d-lg-inline') +
      '</button>' +
      '<ul class="dropdown-menu dropdown-menu-end">' +
      '<li class="px-2 py-1"><div class="fw-bold">' +
      USER.name +
      '</div><div class="small text-muted">' +
      USER.email +
      '</div></li>' +
      '<li><hr class="dropdown-divider"></li>' +
      '<li><a class="dropdown-item" href="configuracoes.html#conta">' +
      icon('user') +
      'Meu perfil</a></li>' +
      '<li><a class="dropdown-item" href="configuracoes.html#rendas">' +
      icon('sliders') +
      'Configurações</a></li>' +
      '<li><a class="dropdown-item" href="login.html">' +
      icon('logout') +
      'Sair</a></li>' +
      '</ul></div>' +
      '</div>';
  }

  function renderBottomNav(active) {
    const el = document.getElementById('ws-bottomnav');
    if (!el) return;
    el.className = 'ws-bottomnav';
    el.setAttribute('aria-label', 'Navegação');
    const item = function (key, label, href, ic) {
      return (
        '<a href="' +
        href +
        '"' +
        (key === active ? ' aria-current="page"' : '') +
        '>' +
        icon(ic) +
        label +
        '</a>'
      );
    };
    el.innerHTML =
      item('dashboard', 'Início', 'dashboard.html', 'home') +
      item('compras', 'Compras', 'compras.html', 'receipt') +
      '<a class="ws-fab" href="nova-compra.html" aria-label="Nova compra">' +
      icon('plus') +
      '</a>' +
      item('casa', 'Casa', 'casa.html', 'users') +
      item('configuracoes', 'Ajustes', 'configuracoes.html', 'sliders');
  }

  function toast(message) {
    document.querySelectorAll('.ws-toast').forEach((t) => t.remove());
    const el = document.createElement('div');
    el.className = 'ws-toast';
    el.setAttribute('role', 'status');
    el.innerHTML = icon('check') + '<span></span>';
    el.querySelector('span').textContent = message;
    document.body.appendChild(el);
    setTimeout(function () {
      el.remove();
    }, 3200);
  }


  // ---------- Guided tour (TOUR-*) ----------
  // One tour per screen (key = data-page) plus feature tours announced as "Novidade" to existing accounts.
  // A step points at an element; "box" highlights the closest card instead of the element itself. The first
  // selector that is visible wins, so a step can name the desktop and the mobile element (sidebar / bottom nav).
  // When nothing is visible the card is shown centered.
  const TOURS = {
    dashboard: {
      title: 'Boas-vindas',
      steps: [
        { title: 'Boas-vindas ao we-sync', text: 'Em poucos passos mostramos onde fica cada coisa. Use Prosseguir e Voltar, ou feche quando quiser.' },
        { t: ['#ws-sidebar', '#ws-bottomnav'], title: 'Menu', text: 'Daqui você vai para Compras, Nossa casa, Metas e relatórios e Investimentos.' },
        { t: '.ws-month', title: 'Troque o mês', text: 'Veja os meses anteriores. Tudo na tela acompanha o mês escolhido.' },
        { t: '#kpi-total', box: '.ws-hero', title: 'Seu mês num relance', text: 'Quanto você gastou no mês e como está a sua meta pessoal.' },
        { t: '#avail-title', box: '.ws-card', title: 'Disponível na conta', text: 'Renda do mês menos o que já foi pago. A sobra prevista desconta também o que falta pagar.' },
        { t: ['.ws-topbar .btn-primary', '.ws-fab'], title: 'Nova compra', text: 'Registre a compra assim que ela acontece: o mês fica sempre em dia.' },
        { t: '[data-tour-help]', title: 'Ajuda', text: 'Este botão refaz o tour da tela em que você está, quando quiser.' },
      ],
    },
    compras: {
      title: 'Compras',
      steps: [
        { t: '#summary', title: 'Compras do mês', text: 'Todas as compras que saíram do seu bolso no mês escolhido.' },
        { t: '#f-search', box: '.ws-card', title: 'Filtros', text: 'Busque pela descrição ou filtre por categoria e situação.' },
        { t: ['#rows', '#cards'], box: '.ws-card', title: 'Lista', text: 'Toque numa compra para editar. Contas fixas e parcelas mostram a posição, como 3/10.' },
      ],
    },
    'nova-compra': {
      title: 'Nova compra',
      steps: [
        { t: '#amount-box', title: 'Valor', text: 'Comece pelo valor. Os centavos entram sozinhos enquanto você digita.' },
        { t: '#description', title: 'Descrição e tópico', text: 'Pela descrição o app sugere o tópico (ex.: "iFood" → Delivery). Você pode trocar.' },
        { t: '#categories', title: 'Categoria', text: 'Escolha a categoria. As suas categorias aparecem junto com as padrão.' },
        { t: '#sc-personal', box: 'fieldset', title: 'De quem é o gasto?', text: 'Pessoal é o padrão. Compartilhada entra na divisão da casa.' },
        { t: '#rp-none', box: 'fieldset', title: 'Repetição', text: 'Conta fixa por alguns meses ou compra parcelada: o app cria as próximas para você.' },
      ],
    },
    casa: {
      title: 'Nossa casa',
      steps: [
        { t: '#split-title', box: '.ws-card', title: 'Divisão do mês', text: 'Cada um paga a parte proporcional à renda: quem ganha mais paga mais.' },
        { t: '#settle-title', box: '.ws-card', title: 'Acerto do mês', text: 'Mostra quanto falta para cada um ficar na sua proporção, e como acertar.' },
        { t: '#padrao', title: 'Padrão de gastos', text: 'A média real da casa. Quando o mês passa do padrão, o app sugere um resgate.' },
        { t: '#boxes-title', box: '.ws-card', title: 'Caixinhas', text: 'O dinheiro guardado da casa, rendendo pelo CDI.' },
        { t: '#dreams-title', box: '.ws-card', title: 'Sonhos do casal', text: 'Objetivos com valor e data. O app calcula quanto cada um guarda por mês.' },
        { t: '.ws-month', title: 'Meses fechados', text: 'Ao voltar para um mês que já fechou, aparece o Encontro do mês: um roteiro para conversarem sobre ele.' },
      ],
    },
    sonhos: {
      title: 'Novidade: Sonhos do casal',
      feature: true,
      steps: [
        { title: 'Novidade: Sonhos do casal', text: 'Agora vocês podem guardar dinheiro para um objetivo em comum, como uma viagem ou um sofá novo.' },
        { t: '#dreams-title', box: '.ws-card', title: 'Seus sonhos', text: 'Cada sonho tem valor, data e uma caixinha só dele, rendendo pelo CDI.' },
        { t: '.ws-dream', title: 'Quanto guardar', text: 'O app mostra quanto guardar por mês e a parte de cada um, proporcional à renda.' },
        { t: '#new-dream', title: 'Crie o primeiro', text: 'Toque em Novo sonho para começar.' },
      ],
    },
    metas: {
      title: 'Metas e relatórios',
      steps: [
        { t: '#sc-pessoal', box: '.ws-segmented', title: 'Pessoal ou casa', text: 'A mesma tela mostra as suas metas e as da casa.' },
        { t: '#goal-title', box: '.ws-card', title: 'Meta do mês', text: 'A projeção diz como o mês fecha no ritmo atual e quanto dá para gastar por dia.' },
        { t: '#insights', box: '.ws-card', title: 'Padrões identificados', text: 'O app avisa quando um tópico cresce todo mês ou foge do normal.' },
        { t: '#report', box: '.ws-card', title: 'Relatório por tópico', text: 'Até hoje, projeção, média, tendência e ticket médio de cada tópico.' },
      ],
    },
    investimentos: {
      title: 'Investimentos',
      steps: [
        { t: '#k-total', box: '.ws-card, .ws-hero', title: 'Seu patrimônio', text: 'Total investido, custo e lucro ou prejuízo.' },
        { t: '#add-op', title: 'Nova operação', text: 'Registre compras e vendas de ações, FIIs e Tesouro Direto.' },
        { t: '#boxes', box: '.ws-card', title: 'Caixinhas pessoais', text: 'As suas caixinhas e as da casa em que você é o titular.' },
        { t: '#brokers', box: '.ws-card', title: 'Corretoras', text: 'Saldo de cada corretora, depósitos e saques.' },
      ],
    },
    configuracoes: {
      title: 'Configurações',
      steps: [
        { t: '.ws-settings-nav', title: 'Seções', text: 'Rendas, categorias, formas de pagamento e a sua conta.' },
        { t: '#inc-list', box: '.ws-card', title: 'Rendas', text: 'Cadastre todas as rendas: elas entram no disponível do mês e na divisão da casa.' },
      ],
    },
    admin: {
      title: 'Configuração geral',
      steps: [
        { t: '.ws-settings-nav', title: 'Configuração geral', text: 'Parâmetros que valem para todos os usuários. Toda mudança vai para o histórico.' },
        { t: '#mw-form', box: '.ws-card', title: 'Salário mínimo', text: 'Usado como renda mínima da casa. "Buscar no Banco Central" sugere o valor.' },
      ],
    },
  };

  // Prototype keeps tour state in this browser; the app stores it in the account, per tour and version (TOUR-07).
  const TOUR_PREFIX = 'ws-tour-';
  function tourDone(key) {
    try {
      return localStorage.getItem(TOUR_PREFIX + key) === 'done';
    } catch (e) {
      return false;
    }
  }
  function setTourDone(key) {
    try {
      localStorage.setItem(TOUR_PREFIX + key, 'done');
    } catch (e) {
      /* storage unavailable: the tour shows again next time */
    }
  }
  // Closing without the tick hides the tour for the rest of the session only (TOUR-05). The prototype uses the
  // browser session; in the app the session ends at logout or when the app/browser is closed.
  function tourSkipped(key) {
    try {
      return sessionStorage.getItem(TOUR_PREFIX + key) === 'skip';
    } catch (e) {
      return false;
    }
  }
  function setTourSkipped(key) {
    try {
      sessionStorage.setItem(TOUR_PREFIX + key, 'skip');
    } catch (e) {
      /* storage unavailable: the tour may show again in this session */
    }
  }
  function resetTours() {
    [localStorage, sessionStorage].forEach(function (store) {
      try {
        Object.keys(store)
          .filter((k) => k.startsWith(TOUR_PREFIX))
          .forEach((k) => store.removeItem(k));
      } catch (e) {
        /* nothing stored */
      }
    });
  }

  function visible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  }

  function stepTarget(step) {
    if (!step.t) return null;
    const list = Array.isArray(step.t) ? step.t : [step.t];
    for (const sel of list) {
      const el = document.querySelector(sel);
      if (visible(el)) return step.box ? el.closest(step.box) || el : el;
    }
    return null;
  }

  let activeTour = null;

  // A page may share the menu entry of another (nova-compra highlights Compras) but has its own tour.
  const tourKey = () => document.body.getAttribute('data-tour') || document.body.getAttribute('data-page');

  function startTour(key) {
    const tour = TOURS[key];
    if (!tour || activeTour) return;
    const opener = document.activeElement;
    let i = 0;
    const root = document.createElement('div');
    root.className = 'ws-tour';
    root.innerHTML =
      '<div class="ws-tour-shade"></div><div class="ws-tour-spot" hidden></div>' +
      '<div class="ws-tour-card" role="dialog" aria-modal="true" aria-labelledby="ws-tour-title" tabindex="-1">' +
      '<div class="d-flex align-items-start gap-2"><div class="flex-grow-1">' +
      '<div class="ws-tour-count" id="ws-tour-count"></div><h2 class="ws-tour-title" id="ws-tour-title"></h2></div>' +
      '<button type="button" class="btn btn-ghost btn-icon btn-sm" data-tour="close" aria-label="Fechar o tour">' + icon('x') + '</button></div>' +
      '<p class="ws-tour-text" id="ws-tour-text"></p>' +
      '<div class="ws-tour-dots" aria-hidden="true"></div>' +
      '<div class="ws-tour-foot">' +
      '<div class="form-check mb-0"><input class="form-check-input" type="checkbox" id="ws-tour-never" />' +
      '<label class="form-check-label small" for="ws-tour-never">Não exibir novamente</label></div>' +
      '<div class="d-flex gap-2"><button type="button" class="btn btn-ghost btn-sm" data-tour="back">Voltar</button>' +
      '<button type="button" class="btn btn-primary btn-sm" data-tour="next"></button></div></div></div>';
    document.body.appendChild(root);
    const card = root.querySelector('.ws-tour-card');
    const spot = root.querySelector('.ws-tour-spot');

    function place() {
      const step = tour.steps[i];
      const el = stepTarget(step);
      card.classList.toggle('is-center', !el);
      if (!el) {
        spot.hidden = true;
        card.style.top = card.style.left = '';
        return;
      }
      const r = el.getBoundingClientRect();
      const pad = 6;
      spot.hidden = false;
      Object.assign(spot.style, { top: r.top - pad + 'px', left: r.left - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' });
      const cw = card.offsetWidth;
      const ch = card.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let top = r.bottom + 14;
      if (top + ch > vh - 8) top = r.top - ch - 14;
      if (top < 8) top = Math.max(8, vh - ch - 8);
      const left = Math.min(Math.max(8, r.left + r.width / 2 - cw / 2), vw - cw - 8);
      card.style.top = top + 'px';
      card.style.left = left + 'px';
    }

    function show() {
      const step = tour.steps[i];
      const last = i === tour.steps.length - 1;
      root.querySelector('#ws-tour-count').textContent = 'Passo ' + (i + 1) + ' de ' + tour.steps.length;
      root.querySelector('#ws-tour-title').textContent = step.title;
      root.querySelector('#ws-tour-text').textContent = step.text;
      root.querySelector('.ws-tour-dots').innerHTML = tour.steps.map((_, k) => '<span' + (k === i ? ' class="is-active"' : '') + '></span>').join('');
      root.querySelector('[data-tour="back"]').disabled = i === 0;
      root.querySelector('[data-tour="next"]').textContent = last ? 'Concluir' : 'Prosseguir';
      const el = stepTarget(step);
      // A tall element (a card bigger than the screen) is shown from its top, leaving room for the tour card.
      if (el && el.offsetHeight > window.innerHeight * 0.6) {
        const bar = document.getElementById('ws-topbar');
        const offset = (bar ? bar.getBoundingClientRect().bottom : 0) + 12;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'instant' });
      } else if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
      place();
      card.focus();
    }

    // Finishing or ticking "don't show again" marks the tour as seen; closing without the tick shows it again
    // on a visit in a later session (TOUR-05).
    function end(finished) {
      if (finished || root.querySelector('#ws-tour-never').checked) setTourDone(key);
      else setTourSkipped(key);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      document.removeEventListener('keydown', onKey);
      root.remove();
      activeTour = null;
      if (opener && opener.focus) opener.focus();
    }

    function go(delta) {
      if (i + delta >= tour.steps.length) return end(true);
      i = Math.max(0, i + delta);
      show();
    }

    function onKey(e) {
      if (e.key === 'Escape') end(false);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Tab') {
        const f = Array.from(card.querySelectorAll('button:not([disabled]), input'));
        const first = f[0];
        const lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    root.addEventListener('click', function (e) {
      const b = e.target.closest('[data-tour]');
      if (!b) return;
      if (b.dataset.tour === 'close') end(false);
      else go(b.dataset.tour === 'next' ? 1 : -1);
    });
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    document.addEventListener('keydown', onKey);
    activeTour = key;
    show();
  }

  // Feature tours offered as "Novidade" to accounts created before the release; new accounts get every screen
  // tour from the start instead (TOUR-03, TOUR-04).
  const NEWS = [
    { key: 'sonhos', title: 'Novidade: Sonhos do casal', text: 'Guardem juntos para uma viagem, um sofá ou o que sonharem.', href: 'casa.html?tour=sonhos' },
  ];
  function renderNews() {
    const el = document.getElementById('ws-news');
    if (!el) return;
    const item = NEWS.find((n) => !tourDone(n.key));
    if (!item) {
      el.hidden = true;
      return;
    }
    el.innerHTML =
      '<div class="ws-news" role="status">' + icon('sparkle') + '<div class="flex-grow-1"><strong>' + item.title + '</strong>' +
      '<div class="small text-muted">' + item.text + '</div></div>' +
      '<div class="d-flex flex-wrap gap-2 justify-content-end"><button type="button" class="btn btn-ghost btn-sm" data-news-skip>Agora não</button>' +
      '<a class="btn btn-primary btn-sm" href="' + item.href + '">Fazer o tour</a></div></div>';
    el.querySelector('[data-news-skip]').addEventListener('click', function () {
      setTourDone(item.key);
      renderNews();
    });
  }

  // ?tour=<key> opens a tour on arrival (used by the "Novidade" banner); ?semtour=1 skips the automatic one.
  function autoTour(active) {
    const q = new URLSearchParams(location.search);
    const asked = q.get('tour');
    if (asked && TOURS[asked]) return setTimeout(() => startTour(asked), 300);
    if (q.get('semtour') === '1') return;
    if (TOURS[active] && !tourDone(active) && !tourSkipped(active)) setTimeout(() => startTour(active), 500);
  }

  function initPage() {
    const active = document.body.getAttribute('data-page');
    renderSidebar(active);
    renderTopbar();
    renderBottomNav(active);
    hydrateIcons();
    bindThemeToggles();
    const help = document.querySelector('[data-tour-help]');
    if (help) help.addEventListener('click', () => startTour(tourKey()));
    renderNews();
    autoTour(tourKey());
  }

  window.WS = {
    icon: icon,
    hydrateIcons: hydrateIcons,
    CATEGORIES: CATEGORIES,
    PAYMENT_METHODS: PAYMENT_METHODS,
    PURCHASES: PURCHASES,
    STATUS: STATUS,
    MONTHS: MONTHS,
    USER: USER,
    formatBrl: formatBrl,
    formatDate: formatDate,
    formatDayMonth: formatDayMonth,
    escapeHtml: escapeHtml,
    statusPill: statusPill,
    catBubble: catBubble,
    toast: toast,
    setTheme: setTheme,
    HOUSE: HOUSE,
    houseMonth: houseMonth,
    houseStandard: houseStandard,
    houseMinIncome: houseMinIncome,
    ASSETS: ASSETS,
    assetOf: assetOf,
    assetRequests: assetRequests,
    saveAssetRequests: saveAssetRequests,
    SYSTEM_MIN_WAGE: SYSTEM_MIN_WAGE,
    CDI_YEAR: CDI_YEAR,
    NOW: NOW,
    dreamPlan: dreamPlan,
    startTour: startTour,
    tourDone: tourDone,
    setTourDone: setTourDone,
    resetTours: resetTours,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
  } else {
    initPage();
  }
})();

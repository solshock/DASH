import {
    App,
    ItemView,
    Plugin,
    PluginSettingTab,
    Setting,
    WorkspaceLeaf,
    Notice,
    TFolder,
} from 'obsidian';

const VIEW_TYPE = 'solshock-command-center';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsageData {
    daily: number;
    monthly: number;
    dailyLimit: number;
    monthlyLimit: number;
    lastReset: string;
}

interface CustomLink {
    id: string;
    name: string;
    url: string;
}

type AgentStatus = 'active' | 'pending' | 'offline';

interface Settings {
    apiKeys: { anthropic: string; gemini: string; abacusai: string };
    usage: {
        claude: UsageData;
        gemini: UsageData;
        abacusai: UsageData;
        hermes: UsageData;
    };
    agentStatuses: { [key: string]: AgentStatus };
    customLinks: CustomLink[];
    pinterest: string;
    tiktok: string;
    vaultFolders: { [key: string]: string };
    workbenchNote: string;
    workbenchLinks: CustomLink[];
}

const mkUsage = (dailyLimit = 100, monthlyLimit = 3000): UsageData => ({
    daily: 0,
    monthly: 0,
    dailyLimit,
    monthlyLimit,
    lastReset: new Date().toISOString().slice(0, 10),
});

const DEFAULT_SETTINGS: Settings = {
    apiKeys: { anthropic: '', gemini: '', abacusai: '' },
    usage: {
        claude:   mkUsage(100, 3000),
        gemini:   mkUsage(100, 3000),
        abacusai: mkUsage(100, 3000),
        hermes:   mkUsage(50,  1500),
    },
    agentStatuses: {
        summer:          'active',
        email:           'pending',
        twitter:         'pending',
        analytics:       'pending',
        searchConsole:   'pending',
        shopifyAnalytics:'pending',
    },
    customLinks: [],
    pinterest: '',
    tiktok: '',
    workbenchNote: '',
    workbenchLinks: [],
    vaultFolders: {
        projects:      'Solshock Projects',
        mike:          'Mike',
        summer:        'Summer',
        dailyNotes:    'Daily Notes',
        clippings:     'Clippings',
        excalidraw:    'Excalidraw',
        freebird:      'Freebird',
        meetingPlanner:'Meeting Planner',
        vendors:       'Vendors',
    },
};

// ─── Dashboard View ───────────────────────────────────────────────────────────

class DashboardView extends ItemView {
    plugin: SolshockPlugin;
    private timers: ReturnType<typeof setInterval>[] = [];

    constructor(leaf: WorkspaceLeaf, plugin: SolshockPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType()    { return VIEW_TYPE; }
    getDisplayText() { return 'Command Center'; }
    getIcon()        { return 'layout-dashboard'; }

    async onOpen() {
        this.checkDailyReset();
        const el = this.contentEl;
        el.empty();
        el.addClass('ss-root');
        el.innerHTML = this.html();
        this.wire(el);
        this.startClock(el);
        this.startWeather(el);
        this.startSiteStatus(el);
    }

    async onClose() {
        this.timers.forEach(clearInterval);
        this.timers = [];
    }

    // ── Daily reset ───────────────────────────────────────────────────────────

    private checkDailyReset() {
        const today = new Date().toISOString().slice(0, 10);
        let changed = false;
        for (const key of Object.keys(this.plugin.settings.usage) as (keyof Settings['usage'])[]) {
            if (this.plugin.settings.usage[key].lastReset !== today) {
                this.plugin.settings.usage[key].daily = 0;
                this.plugin.settings.usage[key].lastReset = today;
                changed = true;
            }
        }
        if (changed) this.plugin.saveSettings();
    }

    // ── Full HTML shell ───────────────────────────────────────────────────────

    private html(): string {
        return `
<div class="ss-dash">
  ${this.hHeader()}
  <div class="ss-body">
    ${this.hMeters()}
    ${this.hQuickLinks()}
    ${this.hSocial()}
    ${this.hVaultNav()}
    ${this.hWorkbench()}
    ${this.hAgents()}
    ${this.hKanban()}
    ${this.hCustomLinks()}
  </div>
  ${this.hFooter()}
</div>`;
    }

    // ── Header ────────────────────────────────────────────────────────────────

    private hHeader(): string {
        return `
<header class="ss-header">
  <div class="ss-weather-block">
    <div class="ss-weather-main">
      ☀️ <span id="ss-temp">--°F</span> — <span id="ss-cond">Loading…</span>
    </div>
    <div class="ss-weather-sub">
      <span>H: <b id="ss-hi">--</b>°</span>
      <span>L: <b id="ss-lo">--</b>°</span>
      <span>💧 <b id="ss-hum">--</b>%</span>
    </div>
    <button class="ss-icon-btn" id="ss-wx-refresh" title="Refresh weather">↻</button>
  </div>

  <div class="ss-clock-block">
    <div class="ss-time" id="ss-time">--:-- --</div>
    <div class="ss-date" id="ss-date">Tampa, FL</div>
  </div>

  <div class="ss-status-block">
    <div class="ss-status-row">
      <span class="ss-dot" id="ss-dot" style="color:#8A8A80">●</span>
      <span id="ss-status-label">Checking…</span>
    </div>
    <div class="ss-status-sub" id="ss-status-time">—</div>
    <button class="ss-icon-btn" id="ss-status-refresh" title="Check site status">↻ Check</button>
  </div>
</header>`;
    }

    // ── AI Usage Meters ───────────────────────────────────────────────────────

    private hMeters(): string {
        const meters: { id: keyof Settings['usage']; label: string; emoji: string }[] = [
            { id: 'claude',   label: 'Claude (Anthropic)', emoji: '🤖' },
            { id: 'gemini',   label: 'Google Gemini',      emoji: '♊' },
            { id: 'abacusai', label: 'Abacus AI',          emoji: '🧮' },
            { id: 'hermes',   label: 'Hermes',             emoji: '⚡' },
        ];
        return `
<section class="ss-section">
  <h2 class="ss-title">🤖 AI Usage Meters</h2>
  <div class="ss-meters-grid">
    ${meters.map(m => this.hMeter(m.id, m.label, m.emoji)).join('')}
  </div>
</section>`;
    }

    private hMeter(id: string, label: string, emoji: string): string {
        const u = this.plugin.settings.usage[id as keyof Settings['usage']];
        const dp = Math.min(100, Math.round((u.daily   / u.dailyLimit)   * 100));
        const mp = Math.min(100, Math.round((u.monthly / u.monthlyLimit) * 100));
        const barColor = (p: number) => p < 50 ? '#4ade80' : p < 80 ? '#F5D060' : '#ef4444';
        const statusClass = dp >= 80 ? 'critical' : dp >= 50 ? 'warn' : 'ok';
        const statusText  = dp >= 80 ? '🔴 Critical' : dp >= 50 ? '🟡 Warning' : '🟢 Healthy';

        return `
<div class="ss-card ss-meter-card" data-meter-card="${id}">
  <div class="ss-meter-head">
    <span>${emoji} ${label}</span>
    <span class="ss-meter-status ${statusClass}" data-status="${id}">${statusText}</span>
  </div>

  <div class="ss-meter-row">
    <span>Daily</span>
    <span data-meter-daily="${id}">${u.daily} / ${u.dailyLimit}</span>
  </div>
  <div class="ss-bar-track">
    <div class="ss-bar-fill" data-bar-daily="${id}" style="width:${dp}%;background:${barColor(dp)}"></div>
  </div>

  <div class="ss-meter-row">
    <span>Monthly</span>
    <span data-meter-monthly="${id}">${u.monthly} / ${u.monthlyLimit}</span>
  </div>
  <div class="ss-bar-track">
    <div class="ss-bar-fill" data-bar-monthly="${id}" style="width:${mp}%;background:${barColor(mp)}"></div>
  </div>

  <div class="ss-meter-btns">
    <button class="ss-btn-sm" data-add="${id}" data-amt="1">+1</button>
    <button class="ss-btn-sm" data-add="${id}" data-amt="5">+5</button>
    <button class="ss-btn-sm" data-add="${id}" data-amt="10">+10</button>
    <button class="ss-btn-sm ss-btn-warn" data-reset-daily="${id}">↺ Day</button>
    <button class="ss-btn-sm ss-btn-danger" data-reset-month="${id}">↺ Month</button>
  </div>
</div>`;
    }

    // ── Quick Links ───────────────────────────────────────────────────────────

    private hQuickLinks(): string {
        const links = [
            { emoji: '🌐', label: 'Live Site',     url: 'https://solshockco.com' },
            { emoji: '🛍️', label: 'Shopify Admin', url: 'https://admin.shopify.com' },
            { emoji: '📧', label: 'Gmail',          url: 'https://mail.google.com' },
            { emoji: '☁️', label: 'Cloudflare',    url: 'https://dash.cloudflare.com' },
            { emoji: '🎨', label: 'Claude Design', url: 'https://claude.ai/design' },
            { emoji: '💻', label: 'Claude Code',   url: 'https://claude.ai/code' },
        ];
        return `
<section class="ss-section">
  <h2 class="ss-title">⚡ Quick Links</h2>
  <div class="ss-links-grid">
    ${links.map(l => `
    <a class="ss-card ss-link-card" href="${l.url}" target="_blank" rel="noopener noreferrer">
      <span class="ss-link-emoji">${l.emoji}</span>
      <span>${l.label}</span>
    </a>`).join('')}
  </div>
</section>`;
    }

    // ── Social Media ──────────────────────────────────────────────────────────

    private hSocial(): string {
        const s = this.plugin.settings;
        const social = [
            { emoji: '📘', label: 'Facebook',   url: 'https://facebook.com/solshockco' },
            { emoji: '📸', label: 'Instagram',  url: 'https://instagram.com/solshockco' },
            { emoji: '🐦', label: 'X / Twitter',url: 'https://x.com/solshockco' },
            { emoji: '▶️', label: 'YouTube',    url: 'https://youtube.com/@solshockco' },
            { emoji: '📌', label: 'Pinterest',  url: s.pinterest },
            { emoji: '🎵', label: 'TikTok',     url: s.tiktok },
        ];
        return `
<section class="ss-section">
  <h2 class="ss-title">📱 Social Media</h2>
  <div class="ss-links-grid">
    ${social.map(p => p.url
        ? `<a class="ss-card ss-link-card" href="${p.url}" target="_blank" rel="noopener noreferrer">
             <span class="ss-link-emoji">${p.emoji}</span>
             <span>${p.label}</span>
             <span class="ss-badge-active">🟢</span>
           </a>`
        : `<div class="ss-card ss-link-card ss-pending">
             <span class="ss-link-emoji">${p.emoji}</span>
             <span>${p.label}</span>
             <span class="ss-badge-pending">🟡 Add in Settings</span>
           </div>`
    ).join('')}
  </div>
</section>`;
    }

    // ── Vault Navigation ──────────────────────────────────────────────────────

    private hVaultNav(): string {
        const f = this.plugin.settings.vaultFolders;
        const folders = [
            { key: 'projects',      icon: '🗂️',  label: 'Projects' },
            { key: 'mike',          icon: '👤',  label: 'Mike' },
            { key: 'summer',        icon: '🤖',  label: 'Summer' },
            { key: 'dailyNotes',    icon: '📅',  label: 'Daily Notes' },
            { key: 'clippings',     icon: '✂️',  label: 'Clippings' },
            { key: 'excalidraw',    icon: '✏️',  label: 'Excalidraw' },
            { key: 'freebird',      icon: '🕊️', label: 'Freebird' },
            { key: 'meetingPlanner',icon: '📆',  label: 'Meetings' },
            { key: 'vendors',       icon: '🤝',  label: 'Vendors' },
        ];
        return `
<section class="ss-section">
  <h2 class="ss-title">📓 Vault Navigation</h2>
  <div class="ss-vault-grid">
    ${folders.map(fd => `
    <button class="ss-card ss-vault-btn" data-open-folder="${f[fd.key] ?? fd.label}">
      <span class="ss-vault-icon">${fd.icon}</span>
      <span>${f[fd.key] ?? fd.label}</span>
    </button>`).join('')}
  </div>
</section>`;
    }

    // ── Workbench ─────────────────────────────────────────────────────────────────

    private hWorkbench(): string {
        const note  = this.plugin.settings.workbenchNote  ?? '';
        const links = this.plugin.settings.workbenchLinks ?? [];
        return `
<section class="ss-section ss-section-wide">
  <h2 class="ss-title">🔧 Workbench</h2>
  <div class="ss-workbench">

    <div class="ss-wb-editor-panel">
      <div class="ss-wb-toolbar">
        <span class="ss-wb-label">📝 Notes</span>
        <div class="ss-wb-toolbar-btns">
          <button class="ss-btn-sm ss-wb-mode active" id="ss-wb-edit-btn">Edit</button>
          <button class="ss-btn-sm ss-wb-mode" id="ss-wb-preview-btn">Preview</button>
          <span class="ss-wb-saved" id="ss-wb-saved">Saved ✓</span>
        </div>
      </div>
      <textarea class="ss-wb-textarea" id="ss-wb-textarea" placeholder="Start writing… supports Markdown" spellcheck="true">${note}</textarea>
      <div class="ss-wb-preview ss-hidden" id="ss-wb-preview"></div>
    </div>

    <div class="ss-wb-links-panel">
      <div class="ss-wb-toolbar">
        <span class="ss-wb-label">🔗 Workbench Links</span>
      </div>
      <div class="ss-wb-links-scroll" id="ss-wb-links-list">
        ${links.map(l => this.hWbLinkRow(l)).join('')}
      </div>
      <div class="ss-wb-add-row">
        <input class="ss-input" id="ss-wb-link-name" placeholder="Name…" />
        <input class="ss-input" id="ss-wb-link-url"  placeholder="https://… or vault note path" />
        <button class="ss-btn-sm" id="ss-wb-add-link">＋ Add</button>
      </div>
    </div>

  </div>
</section>`;
    }

    private hWbLinkRow(l: CustomLink): string {
        const isVault = !l.url.startsWith('http');
        return `
<div class="ss-wb-link-row" data-wb-link-id="${l.id}">
  ${isVault
    ? `<button class="ss-wb-link-btn" data-open-note="${l.url}">📄 ${l.name}</button>`
    : `<a class="ss-wb-link-btn" href="${l.url}" target="_blank" rel="noopener noreferrer">🔗 ${l.name}</a>`
  }
  <button class="ss-del-btn" data-del-wb-link="${l.id}" title="Remove">✕</button>
</div>`;
    }

    // ── Tools & Agents ────────────────────────────────────────────────────────

    private hAgents(): string {
        const st = this.plugin.settings.agentStatuses;
        const agents = [
            { id: 'summer',          emoji: '🤖', label: 'Summer Chat',       url: 'https://solshockco.com' },
            { id: 'email',           emoji: '📧', label: 'Email Agent',        url: 'https://mail.google.com' },
            { id: 'twitter',         emoji: '🐦', label: 'X / Twitter Bot',    url: 'https://x.com/solshockco' },
            { id: 'analytics',       emoji: '📊', label: 'Google Analytics',   url: 'https://analytics.google.com' },
            { id: 'searchConsole',   emoji: '🔍', label: 'Search Console',     url: 'https://search.google.com/search-console' },
            { id: 'shopifyAnalytics',emoji: '💰', label: 'Shopify Analytics',  url: 'https://admin.shopify.com' },
        ];
        const dot:   Record<AgentStatus, string> = { active: '🟢', pending: '🟡', offline: '🔴' };
        const lbl:   Record<AgentStatus, string> = { active: 'Active', pending: 'Setup Pending', offline: 'Offline' };

        return `
<section class="ss-section">
  <h2 class="ss-title">🛠️ Tools & Agents</h2>
  <div class="ss-agents-grid">
    ${agents.map(a => {
        const s: AgentStatus = (st[a.id] as AgentStatus) ?? 'pending';
        return `
    <div class="ss-card ss-agent-row">
      <span class="ss-agent-emoji">${a.emoji}</span>
      <span class="ss-agent-label">${a.label}</span>
      <span class="ss-agent-status">${dot[s]} ${lbl[s]}</span>
      <a class="ss-btn-sm" href="${a.url}" target="_blank" rel="noopener noreferrer">Open →</a>
    </div>`;
    }).join('')}
  </div>
</section>`;
    }

    // ── Kanban ────────────────────────────────────────────────────────────────

    private hKanban(): string {
        const cols = [
            {
                title: 'TO DO',
                cards: ['Brand photoshoot plan', 'SEO keyword research', 'Q3 email sequence'],
            },
            {
                title: 'IN PROGRESS',
                cards: ['Website copy v2', 'Summer agent tuning', 'Shopify product pages'],
            },
            {
                title: 'DONE',
                cards: ['Command Center v1', 'Brand Bible', 'Design System'],
            },
        ];
        return `
<section class="ss-section ss-section-wide">
  <h2 class="ss-title">📋 Kanban Board</h2>
  <div class="ss-kanban">
    ${cols.map(c => `
    <div class="ss-kanban-col">
      <div class="ss-kanban-col-title">${c.title}</div>
      ${c.cards.map(card => `<div class="ss-kanban-card">${card}</div>`).join('')}
    </div>`).join('')}
  </div>

  <details class="ss-guide">
    <summary class="ss-guide-summary">📖 Hermes Kanban — Setup Guide</summary>
    <div class="ss-guide-body">
      <p><strong>Lanes for SOLSHOCK</strong></p>
      <ul>
        <li>Customer Emails → <code>email-agent</code></li>
        <li>Social Media Scripts → <code>content-writer</code></li>
        <li>Reels to Edit → <code>video-editor</code></li>
        <li>Website Updates → <code>claude-code</code></li>
        <li>Research → <code>research-agent</code></li>
      </ul>
      <p><strong>How It Works</strong></p>
      <ol>
        <li>Create a card with <code>kanban_create()</code></li>
        <li>Assign it to a profile (agent)</li>
        <li>Dispatcher spawns that agent</li>
        <li>Agent completes → card moves to DONE</li>
        <li>Parents/dependencies auto-link</li>
      </ol>
      <p><strong>CLI Commands</strong></p>
      <pre>hermes kanban create "Task" --assignee &lt;profile&gt;
hermes kanban list
hermes kanban show &lt;id&gt;
hermes kanban complete &lt;id&gt; --summary "Done"</pre>
    </div>
  </details>
</section>`;
    }

    // ── Custom Links ──────────────────────────────────────────────────────────

    private hCustomLinks(): string {
        return `
<section class="ss-section">
  <h2 class="ss-title">➕ Custom Links</h2>
  <div class="ss-add-row">
    <input class="ss-input" id="ss-link-name" placeholder="Link name…" />
    <input class="ss-input" id="ss-link-url"  placeholder="https://…" />
    <button class="ss-btn" id="ss-add-link">Add</button>
  </div>
  <div class="ss-links-grid" id="ss-custom-grid">
    ${this.plugin.settings.customLinks.map(l => this.hCustomCard(l)).join('')}
  </div>
</section>`;
    }

    private hCustomCard(l: CustomLink): string {
        return `
<div class="ss-card ss-link-card ss-custom-card" data-link-id="${l.id}">
  <a href="${l.url}" target="_blank" rel="noopener noreferrer" class="ss-custom-anchor">
    🔗 ${l.name}
  </a>
  <button class="ss-del-btn" data-del-link="${l.id}" title="Remove">✕</button>
</div>`;
    }

    // ── Footer ────────────────────────────────────────────────────────────────

    private hFooter(): string {
        const ts = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
        return `
<footer class="ss-footer">
  <span>SOLSHOCK Coastal Clothing Co. — Tampa, FL</span>
  <span>Built with ♥ and Claude</span>
  <span>Updated: ${ts}</span>
</footer>`;
    }

    // ── Event wiring ──────────────────────────────────────────────────────────

    private wire(el: Element) {
        el.addEventListener('click', e => this.onClick(e));
        el.addEventListener('keydown', e => {
            const t = e.target as HTMLElement;
            if ((e as KeyboardEvent).key === 'Enter') {
                if (t.id === 'ss-link-url'     || t.id === 'ss-link-name')    this.addCustomLink(el);
                if (t.id === 'ss-wb-link-url'  || t.id === 'ss-wb-link-name') this.addWbLink();
            }
        });

        // Workbench note — auto-save with debounce
        let saveTimer: ReturnType<typeof setTimeout>;
        const textarea = el.querySelector<HTMLTextAreaElement>('#ss-wb-textarea');
        const savedEl  = el.querySelector<HTMLElement>('#ss-wb-saved');
        if (textarea) {
            textarea.addEventListener('input', () => {
                if (savedEl) savedEl.textContent = 'Saving…';
                clearTimeout(saveTimer);
                saveTimer = setTimeout(() => {
                    this.plugin.settings.workbenchNote = textarea.value;
                    this.plugin.saveSettings();
                    if (savedEl) savedEl.textContent = 'Saved ✓';
                }, 600);
            });
        }
    }

    private onClick(e: Event) {
        const t = e.target as HTMLElement;

        // Usage add
        const addEl = t.closest<HTMLElement>('[data-add]');
        if (addEl) {
            this.addUsage(addEl.dataset.add!, parseInt(addEl.dataset.amt!));
            return;
        }

        // Usage reset daily
        const rdEl = t.closest<HTMLElement>('[data-reset-daily]');
        if (rdEl) {
            this.resetUsage(rdEl.dataset.resetDaily!, 'daily');
            return;
        }

        // Usage reset monthly
        const rmEl = t.closest<HTMLElement>('[data-reset-month]');
        if (rmEl) {
            if (confirm('Reset monthly usage for this service?')) {
                this.resetUsage(rmEl.dataset.resetMonth!, 'monthly');
            }
            return;
        }

        // Vault folder
        const folderEl = t.closest<HTMLElement>('[data-open-folder]');
        if (folderEl) {
            this.openFolder(folderEl.dataset.openFolder!);
            return;
        }

        // Delete custom link
        const delEl = t.closest<HTMLElement>('[data-del-link]');
        if (delEl) {
            this.deleteCustomLink(delEl.dataset.delLink!);
            return;
        }

        // Add custom link button
        if (t.id === 'ss-add-link') {
            this.addCustomLink(this.contentEl);
            return;
        }

        // Weather refresh
        if (t.id === 'ss-wx-refresh') {
            this.fetchWeather(this.contentEl);
            return;
        }

        // Site status refresh
        if (t.id === 'ss-status-refresh') {
            this.checkSiteStatus(this.contentEl);
            return;
        }

        // Workbench — toggle edit/preview
        if (t.id === 'ss-wb-edit-btn')    { this.wbMode('edit');    return; }
        if (t.id === 'ss-wb-preview-btn') { this.wbMode('preview'); return; }

        // Workbench — add link
        if (t.id === 'ss-wb-add-link') { this.addWbLink(); return; }

        // Workbench — delete link
        const delWb = t.closest<HTMLElement>('[data-del-wb-link]');
        if (delWb) { this.deleteWbLink(delWb.dataset.delWbLink!); return; }

        // Workbench — open vault note
        const noteBtn = t.closest<HTMLElement>('[data-open-note]');
        if (noteBtn) {
            this.app.workspace.openLinkText(noteBtn.dataset.openNote!, '', false);
            return;
        }
    }

    // ── Usage logic ───────────────────────────────────────────────────────────

    private addUsage(id: string, amount: number) {
        const u = this.plugin.settings.usage[id as keyof Settings['usage']];
        if (!u) return;
        u.daily   += amount;
        u.monthly += amount;
        this.plugin.saveSettings();
        this.refreshMeterUI(id, u);
    }

    private resetUsage(id: string, type: 'daily' | 'monthly') {
        const u = this.plugin.settings.usage[id as keyof Settings['usage']];
        if (!u) return;
        u.daily = 0;
        u.lastReset = new Date().toISOString().slice(0, 10);
        if (type === 'monthly') u.monthly = 0;
        this.plugin.saveSettings();
        this.refreshMeterUI(id, u);
    }

    private refreshMeterUI(id: string, u: UsageData) {
        const dp = Math.min(100, Math.round((u.daily   / u.dailyLimit)   * 100));
        const mp = Math.min(100, Math.round((u.monthly / u.monthlyLimit) * 100));
        const barColor = (p: number) => p < 50 ? '#4ade80' : p < 80 ? '#F5D060' : '#ef4444';
        const el = this.contentEl;

        const qry = <T extends Element>(sel: string) => el.querySelector<T>(sel);

        const bdEl = qry<HTMLElement>(`[data-bar-daily="${id}"]`);
        if (bdEl) { bdEl.style.width = `${dp}%`; bdEl.style.background = barColor(dp); }

        const bmEl = qry<HTMLElement>(`[data-bar-monthly="${id}"]`);
        if (bmEl) { bmEl.style.width = `${mp}%`; bmEl.style.background = barColor(mp); }

        const tdEl = qry(`[data-meter-daily="${id}"]`);
        if (tdEl) tdEl.textContent = `${u.daily} / ${u.dailyLimit}`;

        const tmEl = qry(`[data-meter-monthly="${id}"]`);
        if (tmEl) tmEl.textContent = `${u.monthly} / ${u.monthlyLimit}`;

        const stEl = qry(`[data-status="${id}"]`);
        if (stEl) {
            stEl.className = `ss-meter-status ${dp >= 80 ? 'critical' : dp >= 50 ? 'warn' : 'ok'}`;
            stEl.textContent = dp >= 80 ? '🔴 Critical' : dp >= 50 ? '🟡 Warning' : '🟢 Healthy';
        }
    }

    // ── Vault navigation ──────────────────────────────────────────────────────

    private openFolder(path: string) {
        const abs = this.app.vault.getAbstractFileByPath(path);
        if (abs instanceof TFolder) {
            const leaves = this.app.workspace.getLeavesOfType('file-explorer');
            if (leaves.length > 0) {
                this.app.workspace.revealLeaf(leaves[0]);
                (leaves[0].view as { revealInFolder?: (f: TFolder) => void }).revealInFolder?.(abs);
            }
            new Notice(`📁 ${path}`);
        } else {
            // Fallback: try as a note link
            this.app.workspace.openLinkText(path, '', false);
            new Notice(`📁 ${path}`);
        }
    }

    // ── Workbench methods ─────────────────────────────────────────────────────────

    private wbMode(mode: 'edit' | 'preview') {
        const textarea   = this.contentEl.querySelector<HTMLTextAreaElement>('#ss-wb-textarea');
        const preview    = this.contentEl.querySelector<HTMLElement>('#ss-wb-preview');
        const editBtn    = this.contentEl.querySelector<HTMLElement>('#ss-wb-edit-btn');
        const previewBtn = this.contentEl.querySelector<HTMLElement>('#ss-wb-preview-btn');
        if (!textarea || !preview || !editBtn || !previewBtn) return;

        if (mode === 'preview') {
            preview.innerHTML = this.simpleMarkdown(textarea.value);
            textarea.classList.add('ss-hidden');
            preview.classList.remove('ss-hidden');
            editBtn.classList.remove('active');
            previewBtn.classList.add('active');
        } else {
            textarea.classList.remove('ss-hidden');
            preview.classList.add('ss-hidden');
            editBtn.classList.add('active');
            previewBtn.classList.remove('active');
        }
    }

    private simpleMarkdown(md: string): string {
        return md
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
            .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g,     '<em>$1</em>')
            .replace(/`(.+?)`/g,       '<code>$1</code>')
            .replace(/^- (.+)$/gm,     '<li>$1</li>')
            .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
            .replace(/\n\n+/g, '</p><p>')
            .replace(/\n/g, '<br>');
    }

    private addWbLink() {
        const nameEl = this.contentEl.querySelector<HTMLInputElement>('#ss-wb-link-name');
        const urlEl  = this.contentEl.querySelector<HTMLInputElement>('#ss-wb-link-url');
        if (!nameEl || !urlEl) return;
        const name = nameEl.value.trim();
        const url  = urlEl.value.trim();
        if (!name || !url) { new Notice('Enter both a name and a URL or note path.'); return; }

        const link: CustomLink = { id: Date.now().toString(), name, url };
        this.plugin.settings.workbenchLinks.push(link);
        this.plugin.saveSettings();
        this.contentEl.querySelector('#ss-wb-links-list')?.insertAdjacentHTML('beforeend', this.hWbLinkRow(link));
        nameEl.value = '';
        urlEl.value  = '';
    }

    private deleteWbLink(id: string) {
        this.plugin.settings.workbenchLinks = this.plugin.settings.workbenchLinks.filter(l => l.id !== id);
        this.plugin.saveSettings();
        this.contentEl.querySelector(`[data-wb-link-id="${id}"]`)?.remove();
    }

    // ── Custom link CRUD ──────────────────────────────────────────────────────

    private addCustomLink(root: Element) {
        const nameEl = root.querySelector<HTMLInputElement>('#ss-link-name');
        const urlEl  = root.querySelector<HTMLInputElement>('#ss-link-url');
        if (!nameEl || !urlEl) return;

        const name = nameEl.value.trim();
        const url  = urlEl.value.trim();
        if (!name || !url) { new Notice('Enter both a name and a URL.'); return; }

        const link: CustomLink = { id: Date.now().toString(), name, url };
        this.plugin.settings.customLinks.push(link);
        this.plugin.saveSettings();

        const grid = root.querySelector('#ss-custom-grid');
        if (grid) grid.insertAdjacentHTML('beforeend', this.hCustomCard(link));

        nameEl.value = '';
        urlEl.value  = '';
    }

    private deleteCustomLink(id: string) {
        this.plugin.settings.customLinks = this.plugin.settings.customLinks.filter(l => l.id !== id);
        this.plugin.saveSettings();
        this.contentEl.querySelector(`[data-link-id="${id}"]`)?.remove();
    }

    // ── Clock ─────────────────────────────────────────────────────────────────

    private startClock(el: Element) {
        const tick = () => {
            const now = new Date();
            const timeEl = el.querySelector('#ss-time');
            const dateEl = el.querySelector('#ss-date');
            if (timeEl) {
                timeEl.textContent = now.toLocaleTimeString('en-US', {
                    timeZone: 'America/New_York',
                    hour:   '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                });
            }
            if (dateEl) {
                dateEl.textContent = now.toLocaleDateString('en-US', {
                    timeZone: 'America/New_York',
                    weekday: 'long',
                    month:   'long',
                    day:     'numeric',
                    year:    'numeric',
                });
            }
        };
        tick();
        this.timers.push(setInterval(tick, 1000));
    }

    // ── Weather ───────────────────────────────────────────────────────────────

    private async fetchWeather(el: Element) {
        try {
            const res  = await fetch(
                'https://api.open-meteo.com/v1/forecast' +
                '?latitude=27.95&longitude=-82.45' +
                '&current=temperature_2m,relative_humidity_2m,weather_code' +
                '&daily=temperature_2m_max,temperature_2m_min' +
                '&timezone=America%2FNew_York&temperature_unit=fahrenheit'
            );
            const data = await res.json();
            const c = data.current;
            const d = data.daily;

            const set = (id: string, val: string | number) => {
                const node = el.querySelector(`#${id}`);
                if (node) node.textContent = String(val);
            };
            set('ss-temp', `${Math.round(c.temperature_2m)}°F`);
            set('ss-cond', this.weatherLabel(c.weather_code));
            set('ss-hi',   Math.round(d.temperature_2m_max[0]));
            set('ss-lo',   Math.round(d.temperature_2m_min[0]));
            set('ss-hum',  c.relative_humidity_2m);
        } catch {
            const node = el.querySelector('#ss-cond');
            if (node) node.textContent = 'Unavailable';
        }
    }

    private startWeather(el: Element) {
        this.fetchWeather(el);
        this.timers.push(setInterval(() => this.fetchWeather(el), 10 * 60 * 1000));
    }

    private weatherLabel(code: number): string {
        if (code === 0)       return 'Clear ☀️';
        if (code <= 2)        return 'Partly Cloudy ⛅';
        if (code === 3)       return 'Overcast ☁️';
        if (code <= 49)       return 'Foggy 🌫️';
        if (code <= 59)       return 'Drizzle 🌦️';
        if (code <= 69)       return 'Rain 🌧️';
        if (code <= 79)       return 'Snow 🌨️';
        if (code <= 82)       return 'Showers 🌦️';
        if (code <= 99)       return 'Thunderstorm ⛈️';
        return 'Unknown';
    }

    // ── Site status ───────────────────────────────────────────────────────────

    private async checkSiteStatus(el: Element) {
        const dotEl   = el.querySelector<HTMLElement>('#ss-dot');
        const labelEl = el.querySelector('#ss-status-label');
        const timeEl  = el.querySelector('#ss-status-time');
        if (labelEl) labelEl.textContent = 'Checking…';

        try {
            const t0 = Date.now();
            await fetch('https://solshockco.com', { method: 'HEAD', mode: 'no-cors' });
            const ms = Date.now() - t0;
            if (dotEl)   { dotEl.textContent = '●'; dotEl.style.color = '#4ade80'; }
            if (labelEl) labelEl.textContent = `solshockco.com — Up (${ms}ms)`;
        } catch {
            if (dotEl)   { dotEl.textContent = '●'; dotEl.style.color = '#ef4444'; }
            if (labelEl) labelEl.textContent = 'solshockco.com — Down';
        }
        if (timeEl) {
            timeEl.textContent = `Checked ${new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' })}`;
        }
    }

    private startSiteStatus(el: Element) {
        this.checkSiteStatus(el);
        this.timers.push(setInterval(() => this.checkSiteStatus(el), 60 * 1000));
    }
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

class SolshockSettingsTab extends PluginSettingTab {
    plugin: SolshockPlugin;

    constructor(app: App, plugin: SolshockPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl: c } = this;
        c.empty();

        c.createEl('h1', { text: '⚡ SOLSHOCK Command Center' });

        // ── API Keys ──────────────────────────────────────────────────────────
        c.createEl('h3', { text: 'API Keys' });
        c.createEl('p', { text: 'Stored locally in your vault — never sent anywhere except the respective API.', cls: 'ss-settings-note' });

        const mkKey = (name: string, placeholder: string, get: () => string, set: (v: string) => void) => {
            new Setting(c).setName(name)
                .addText(t => t.setPlaceholder(placeholder).setValue(get())
                    .onChange(async v => { set(v); await this.plugin.saveSettings(); }));
        };

        mkKey('Anthropic API Key', 'sk-ant-…',
            () => this.plugin.settings.apiKeys.anthropic,
            v  => { this.plugin.settings.apiKeys.anthropic = v; });
        mkKey('Google Gemini API Key', 'AIza…',
            () => this.plugin.settings.apiKeys.gemini,
            v  => { this.plugin.settings.apiKeys.gemini = v; });
        mkKey('Abacus AI API Key', 'api_…',
            () => this.plugin.settings.apiKeys.abacusai,
            v  => { this.plugin.settings.apiKeys.abacusai = v; });

        // ── Usage Limits ──────────────────────────────────────────────────────
        c.createEl('h3', { text: 'Usage Limits' });

        const services: { id: keyof Settings['usage']; label: string }[] = [
            { id: 'claude',   label: 'Claude' },
            { id: 'gemini',   label: 'Gemini' },
            { id: 'abacusai', label: 'Abacus AI' },
            { id: 'hermes',   label: 'Hermes' },
        ];

        for (const svc of services) {
            const u = this.plugin.settings.usage[svc.id];
            new Setting(c).setName(`${svc.label} — Daily Limit`)
                .addText(t => t.setValue(String(u.dailyLimit))
                    .onChange(async v => { u.dailyLimit = parseInt(v) || 100; await this.plugin.saveSettings(); }));
            new Setting(c).setName(`${svc.label} — Monthly Limit`)
                .addText(t => t.setValue(String(u.monthlyLimit))
                    .onChange(async v => { u.monthlyLimit = parseInt(v) || 3000; await this.plugin.saveSettings(); }));
        }

        // ── Social ────────────────────────────────────────────────────────────
        c.createEl('h3', { text: 'Social Media' });

        new Setting(c).setName('Pinterest URL')
            .addText(t => t.setPlaceholder('https://pinterest.com/…').setValue(this.plugin.settings.pinterest)
                .onChange(async v => { this.plugin.settings.pinterest = v; await this.plugin.saveSettings(); }));
        new Setting(c).setName('TikTok URL')
            .addText(t => t.setPlaceholder('https://tiktok.com/@…').setValue(this.plugin.settings.tiktok)
                .onChange(async v => { this.plugin.settings.tiktok = v; await this.plugin.saveSettings(); }));

        // ── Agent Statuses ────────────────────────────────────────────────────
        c.createEl('h3', { text: 'Agent Statuses' });

        const agents = [
            { id: 'summer',           label: 'Summer Chat' },
            { id: 'email',            label: 'Email Agent' },
            { id: 'twitter',          label: 'X / Twitter Bot' },
            { id: 'analytics',        label: 'Google Analytics' },
            { id: 'searchConsole',    label: 'Search Console' },
            { id: 'shopifyAnalytics', label: 'Shopify Analytics' },
        ];

        for (const agent of agents) {
            new Setting(c).setName(agent.label)
                .addDropdown(d => d
                    .addOption('active',  '🟢 Active')
                    .addOption('pending', '🟡 Pending')
                    .addOption('offline', '🔴 Offline')
                    .setValue(this.plugin.settings.agentStatuses[agent.id] ?? 'pending')
                    .onChange(async v => {
                        this.plugin.settings.agentStatuses[agent.id] = v as AgentStatus;
                        await this.plugin.saveSettings();
                    }));
        }

        // ── Vault Folder Paths ────────────────────────────────────────────────
        c.createEl('h3', { text: 'Vault Folder Paths' });
        c.createEl('p', { text: 'Exact names as they appear in your vault root.', cls: 'ss-settings-note' });

        const folderDefs = [
            { key: 'projects',       label: 'Projects' },
            { key: 'mike',           label: 'Mike' },
            { key: 'summer',         label: 'Summer' },
            { key: 'dailyNotes',     label: 'Daily Notes' },
            { key: 'clippings',      label: 'Clippings' },
            { key: 'excalidraw',     label: 'Excalidraw' },
            { key: 'freebird',       label: 'Freebird' },
            { key: 'meetingPlanner', label: 'Meeting Planner' },
            { key: 'vendors',        label: 'Vendors' },
        ];

        for (const fd of folderDefs) {
            new Setting(c).setName(fd.label)
                .addText(t => t
                    .setPlaceholder(fd.label)
                    .setValue(this.plugin.settings.vaultFolders[fd.key] ?? '')
                    .onChange(async v => {
                        this.plugin.settings.vaultFolders[fd.key] = v;
                        await this.plugin.saveSettings();
                    }));
        }
    }
}

// ─── Main Plugin ──────────────────────────────────────────────────────────────

export default class SolshockPlugin extends Plugin {
    settings: Settings = DEFAULT_SETTINGS;

    async onload() {
        await this.loadSettings();

        this.registerView(VIEW_TYPE, leaf => new DashboardView(leaf, this));

        this.addRibbonIcon('layout-dashboard', 'SOLSHOCK Command Center', () => {
            this.openDashboard();
        });

        this.addCommand({
            id:       'open-dashboard',
            name:     'Open SOLSHOCK Command Center',
            callback: () => this.openDashboard(),
        });

        this.addSettingTab(new SolshockSettingsTab(this.app, this));
    }

    async onunload() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE);
    }

    async loadSettings() {
        const saved = (await this.loadData()) ?? {};
        this.settings = {
            ...DEFAULT_SETTINGS,
            ...saved,
            apiKeys:        { ...DEFAULT_SETTINGS.apiKeys,        ...saved.apiKeys },
            usage:          { ...DEFAULT_SETTINGS.usage,          ...saved.usage },
            agentStatuses:  { ...DEFAULT_SETTINGS.agentStatuses,  ...saved.agentStatuses },
            vaultFolders:   { ...DEFAULT_SETTINGS.vaultFolders,   ...saved.vaultFolders },
            workbenchNote:  saved.workbenchNote  ?? '',
            workbenchLinks: saved.workbenchLinks ?? [],
        };
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    private async openDashboard() {
        const { workspace } = this.app;
        let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
        if (!leaf) {
            leaf = workspace.getLeaf('tab');
            await leaf.setViewState({ type: VIEW_TYPE, active: true });
        }
        workspace.revealLeaf(leaf);
    }
}

// src/chrome.jsx — Obsidian-style shell components
import React from 'react';
import { fmtShort } from './data.js';

export const VIEW_META = {
  dashboard:    { file: 'Dashboard.md',    icon: '🌊', folder: 'May' },
  envelopes:    { file: 'Envelopes.md',    icon: '✉️', folder: 'May' },
  bills:        { file: 'Bills & Subs.md', icon: '🧾', folder: 'May' },
  goals:        { file: 'Goals.md',        icon: '🐚', folder: 'May' },
  debt:         { file: 'Debt Payoff.md',  icon: '🪨', folder: 'May' },
  transactions: { file: 'Transactions.md', icon: '📒', folder: 'May' },
};

export function Ribbon({ view, setView, onCommand, onToggleSidebar, onTweaks }) {
  const icons = [
    { id: 'sidebar', label: 'Toggle sidebar', svg: <path d="M3 4h14v12H3zM7 4v12" />,           onClick: onToggleSidebar },
    { id: 'cmd',     label: '⌘K Commands',    svg: <path d="M5 5h4v4H5zm6 0h4v4h-4zM5 11h4v4H5zm6 0h4v4h-4z" />, onClick: onCommand },
  ];
  const views = [
    { id: 'dashboard',    label: 'Dashboard',    svg: <path d="M10 2l8 6v10h-5v-6H7v6H2V8z" /> },
    { id: 'envelopes',    label: 'Envelopes',    svg: <path d="M2 5h16v10H2zM2 5l8 6 8-6" /> },
    { id: 'bills',        label: 'Bills',        svg: <path d="M4 2h12v16l-3-2-3 2-3-2-3 2zM7 6h6M7 9h6M7 12h4" /> },
    { id: 'goals',        label: 'Goals',        svg: <circle cx="10" cy="10" r="7" />,          extra: <><circle cx="10" cy="10" r="3.5" /><circle cx="10" cy="10" r="1.2" fill="currentColor" /></> },
    { id: 'debt',         label: 'Debt',         svg: <path d="M3 14c2-6 5-9 7-9s5 3 7 9M3 14h14M6 14v-3M10 14v-5M14 14v-3" /> },
    { id: 'transactions', label: 'Transactions', svg: <path d="M3 5h14M3 10h14M3 15h10" /> },
  ];
  return (
    <div className="ribbon">
      {icons.map((i) => (
        <button key={i.id} className="ribbon-btn" title={i.label} onClick={i.onClick}>
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{i.svg}</svg>
        </button>
      ))}
      <div className="ribbon-sep" />
      {views.map((v) => (
        <button key={v.id} className={'ribbon-btn ' + (view === v.id ? 'on' : '')} title={v.label} onClick={() => setView(v.id)}>
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{v.svg}{v.extra}</svg>
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <button className="ribbon-btn" title="Tweaks" onClick={onTweaks}>
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="6" r="2" /><path d="M10 2v2M10 8v10" />
          <circle cx="5" cy="13" r="2" /><path d="M5 2v9M5 15v3" />
          <circle cx="15" cy="10" r="2" /><path d="M15 2v6M15 12v6" />
        </svg>
      </button>
      <div className="ribbon-decor" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <circle cx="12" cy="12" r="6" fill="var(--sl-gold)" />
          <g stroke="var(--sl-gold)" strokeWidth="1.4" strokeLinecap="round">
            <line x1="12" y1="1"  x2="12" y2="4"  />
            <line x1="12" y1="20" x2="12" y2="23" />
            <line x1="1"  y1="12" x2="4"  y2="12" />
            <line x1="20" y1="12" x2="23" y2="12" />
            <line x1="4"  y1="4"  x2="6"  y2="6"  />
            <line x1="18" y1="18" x2="20" y2="20" />
            <line x1="4"  y1="20" x2="6"  y2="18" />
            <line x1="18" y1="6"  x2="20" y2="4"  />
          </g>
        </svg>
      </div>
    </div>
  );
}

export function VaultSidebar({ view, setView, openTab, totals, illustrations }) {
  const [openFolders, setOpenFolders] = React.useState({ May: true, April: false, March: false, Templates: false });
  const toggle = (f) => setOpenFolders((o) => ({ ...o, [f]: !o[f] }));
  const files  = Object.entries(VIEW_META).map(([id, m]) => ({ id, ...m }));

  return (
    <aside className="vault">
      <div className="vault-hd">
        <div className="vault-title">
          <span className="vault-pin">⚓︎</span>
          <span>solshock-vault</span>
        </div>
        <div className="vault-actions">
          <button title="New note">＋</button>
          <button title="Search">⌕</button>
        </div>
      </div>
      <div className="vault-search">
        <input placeholder="Quick switcher…" />
        <kbd>⌘O</kbd>
      </div>
      <div className="tree">
        <Folder label="Budget 2026" open onToggle={() => {}} depth={0}>
          <Folder label="May" open={openFolders.May} onToggle={() => toggle('May')} depth={1} badge="6">
            {files.map((f) => (
              <FileItem key={f.id} label={f.file} icon={f.icon} active={view === f.id}
                        onClick={() => { setView(f.id); openTab(f.id); }} />
            ))}
          </Folder>
          <Folder label="April" open={openFolders.April} onToggle={() => toggle('April')} depth={1}>
            <FileItem label="Dashboard.md" icon="🌊" muted />
            <FileItem label="Wrap-up.md"   icon="🐚" muted />
          </Folder>
          <Folder label="March" open={openFolders.March} onToggle={() => toggle('March')} depth={1}>
            <FileItem label="Dashboard.md" icon="🌊" muted />
          </Folder>
        </Folder>
        <Folder label="Templates" open={openFolders.Templates} onToggle={() => toggle('Templates')} depth={0}>
          <FileItem label="Monthly review.md" icon="📋" muted />
          <FileItem label="Goal tracker.md"   icon="🎯" muted />
        </Folder>
        <Folder label="Inbox" open={false} onToggle={() => {}} depth={0} count={2} />
      </div>
      <div className="vault-foot">
        {illustrations && (
          <svg className="coastal-decor" viewBox="0 0 220 90" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 60 Q 30 45 60 60 T 120 60 T 180 60 T 240 60 V 90 H 0 Z" fill="var(--sl-teal)" opacity=".25" />
            <path d="M0 70 Q 30 58 60 70 T 120 70 T 180 70 T 240 70 V 90 H 0 Z" fill="var(--sl-teal)" opacity=".4" />
            <path d="M0 80 Q 30 70 60 80 T 120 80 T 180 80 T 240 80 V 90 H 0 Z" fill="var(--sl-teal)" opacity=".6" />
            <circle cx="180" cy="30" r="10" fill="var(--sl-gold)" />
            <path d="M40 70 l5 -18 l3 4 l4 -10 l3 8 l4 -4 l2 20 z" fill="var(--sl-coral)" opacity=".85" />
          </svg>
        )}
        <div className="vault-foot-row">
          <span>net worth</span>
          <strong>{fmtShort(totals.netWorth)}</strong>
        </div>
      </div>
    </aside>
  );
}

function Folder({ label, open, onToggle, children, depth, badge, count }) {
  return (
    <div className="folder" style={{ paddingLeft: depth * 8 }}>
      <button className="folder-row" onClick={onToggle}>
        <span className="chev" style={{ transform: open ? 'rotate(90deg)' : 'none' }}>▸</span>
        <span className="folder-icon">{open ? '📂' : '📁'}</span>
        <span className="folder-label">{label}</span>
        {badge != null && <span className="folder-badge">{badge}</span>}
        {count != null && <span className="folder-count">{count}</span>}
      </button>
      {open && <div className="folder-body">{children}</div>}
    </div>
  );
}

function FileItem({ label, icon, active, muted, onClick }) {
  return (
    <button className={'file-row ' + (active ? 'active ' : '') + (muted ? 'muted' : '')} onClick={onClick}>
      <span className="file-icon">{icon}</span>
      <span className="file-label">{label}</span>
    </button>
  );
}

export function TabBar({ tabs, view, setView, closeTab }) {
  return (
    <div className="tabbar">
      {tabs.map((id) => {
        const m = VIEW_META[id];
        return (
          <div key={id} className={'tab ' + (view === id ? 'on' : '')} onClick={() => setView(id)}>
            <span className="tab-icon">{m.icon}</span>
            <span className="tab-label">{m.file}</span>
            <button className="tab-x" onClick={(e) => { e.stopPropagation(); closeTab(id); }} title="Close">×</button>
          </div>
        );
      })}
      <button className="tab-new" title="New tab">＋</button>
      <div style={{ flex: 1 }} />
      <div className="tab-breadcrumb">
        budget&nbsp;2026 <span>›</span> may <span>›</span> {VIEW_META[view]?.file}
      </div>
    </div>
  );
}

export function StatusBar({ totals, view, txnCount }) {
  const left = totals.budgetTotal - totals.spent;
  return (
    <div className="statusbar">
      <span>📍 {VIEW_META[view]?.file}</span>
      <span className="dot">•</span>
      <span>{txnCount} txns this month</span>
      <span className="dot">•</span>
      <span>spent {fmtShort(totals.spent)} of {fmtShort(totals.budgetTotal)}</span>
      <span className="dot">•</span>
      <span className={left >= 0 ? 'good' : 'bad'}>
        {left >= 0 ? '✓ ' : '⚠︎ '}{fmtShort(Math.abs(left))} {left >= 0 ? 'left' : 'over'}
      </span>
      <div style={{ flex: 1 }} />
      <span className="status-pill">🌊 coastal mode</span>
      <span className="dot">•</span>
      <span>autosync · just now</span>
    </div>
  );
}

export function CommandPalette({ open, onClose, setView, openTab, openAddTxn, openAddBill, openAddGoal }) {
  const [q, setQ]       = React.useState('');
  const inputRef        = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setQ('');
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const cmds = [
    { id: 'go-dashboard',    label: 'Go to: Dashboard',             icon: '🌊', kind: 'Nav',    action: () => { setView('dashboard');    openTab('dashboard'); } },
    { id: 'go-envelopes',    label: 'Go to: Envelopes',             icon: '✉️', kind: 'Nav',    action: () => { setView('envelopes');    openTab('envelopes'); } },
    { id: 'go-bills',        label: 'Go to: Bills & Subs',          icon: '🧾', kind: 'Nav',    action: () => { setView('bills');        openTab('bills'); } },
    { id: 'go-goals',        label: 'Go to: Goals',                 icon: '🐚', kind: 'Nav',    action: () => { setView('goals');        openTab('goals'); } },
    { id: 'go-debt',         label: 'Go to: Debt Payoff',           icon: '🪨', kind: 'Nav',    action: () => { setView('debt');         openTab('debt'); } },
    { id: 'go-txns',         label: 'Go to: Transactions',          icon: '📒', kind: 'Nav',    action: () => { setView('transactions'); openTab('transactions'); } },
    { id: 'add-txn',         label: 'New transaction',              icon: '＋', kind: 'Create', action: () => openAddTxn() },
    { id: 'add-bill',        label: 'New bill / subscription',      icon: '＋', kind: 'Create', action: () => openAddBill() },
    { id: 'add-goal',        label: 'New savings goal',             icon: '＋', kind: 'Create', action: () => openAddGoal() },
    { id: 'import-csv',      label: 'Import transactions from CSV…',icon: '⤓', kind: 'Data',   action: () => { setView('transactions'); openTab('transactions'); setTimeout(() => document.querySelector('[data-csv-input]')?.click(), 100); } },
  ];

  const filtered = cmds.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));
  if (!open) return null;

  return (
    <div className="cmd-scrim" onClick={onClose}>
      <div className="cmd-pal" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="cmd-input"
          placeholder="Type a command or search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && filtered[0]) { filtered[0].action(); onClose(); }
          }}
        />
        <div className="cmd-list">
          {filtered.map((c, i) => (
            <button key={c.id} className={'cmd-row ' + (i === 0 ? 'on' : '')} onClick={() => { c.action(); onClose(); }}>
              <span className="cmd-icon">{c.icon}</span>
              <span className="cmd-label">{c.label}</span>
              <span className="cmd-kind">{c.kind}</span>
            </button>
          ))}
          {filtered.length === 0 && <div className="cmd-empty">No matches. Try "add", "goal", "csv"…</div>}
        </div>
        <div className="cmd-foot">
          <span><kbd>↵</kbd> run</span>
          <span><kbd>esc</kbd> close</span>
          <span style={{ flex: 1 }} />
          <span>solshock command palette</span>
        </div>
      </div>
    </div>
  );
}

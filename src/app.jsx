import React from 'react';
import { seed, deriveTotals } from './data.js';
import { Ribbon, VaultSidebar, TabBar, StatusBar, CommandPalette } from './chrome.jsx';
import { DashboardView }     from './dashboard.jsx';
import { EnvelopesView }     from './envelopes.jsx';
import { BillsView }         from './bills.jsx';
import { GoalsView }         from './goals.jsx';
import { DebtView }          from './debt.jsx';
import { TransactionsView }  from './transactions.jsx';
import {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakSelect,
  TweakRadio,
  TweakToggle,
  TweakButton,
} from './tweaks-panel.jsx';

const PALETTES = {
  coastal:  ['#C9880A', '#60B8FF', '#FF8C00', '#F5D060', '#87CEEB', '#2EC4B6', '#FF6B6B', '#8FBC8F', '#9B59B6'],
  sunset:   ['#FF8C00', '#E85D04', '#F5D060', '#C9880A', '#FF6B6B', '#9B59B6', '#60B8FF', '#87CEEB', '#8FBC8F'],
  tide:     ['#60B8FF', '#87CEEB', '#2EC4B6', '#1a6fb8', '#0d4a8a', '#8FBC8F', '#F5D060', '#FF8C00', '#C9880A'],
  classic:  ['#C9880A', '#F5D060', '#60B8FF', '#87CEEB', '#FF8C00', '#FFFFFF', '#1a2a4a', '#8FBC8F', '#FF6B6B'],
  reef:     ['#FF6B6B', '#FFB997', '#F5D060', '#2EC4B6', '#60B8FF', '#9B59B6', '#FF8C00', '#C9880A', '#87CEEB'],
  obsidian: ['#F5D060', '#60B8FF', '#f76f07', '#87CEEB', '#d00ee6', '#a10ee6', '#3CCB7F', '#ff5b5b', '#C9880A'],
};

const TWEAK_DEFAULTS = {
  palette:         'coastal',
  bg:              'navy',
  theme:           'coastal',
  density:         'regular',
  illustrations:   true,
  animatedDivider: true,
};

// ── Modal shell ──────────────────────────────────────────────────────────────
function Modal({ title, children, onClose, onSave, saveLabel = 'Save' }) {
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold"  onClick={onSave}>{saveLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Add transaction modal ────────────────────────────────────────────────────
function AddTxnModal({ state, setState, onClose }) {
  const [form, setForm] = React.useState({
    date: '2026-05-25', payee: '', amount: '',
    env: state.envelopes[0]?.id || '', note: '', isIncome: false,
  });
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = () => {
    const amt = parseFloat(form.amount);
    if (!form.payee || isNaN(amt)) return;
    const txn = {
      id: 't_' + Date.now(),
      date: form.date,
      payee: form.payee,
      amount: form.isIncome ? Math.abs(amt) : -Math.abs(amt),
      env: form.isIncome ? null : form.env,
      note: form.note,
    };
    setState((s) => ({ ...s, txns: [txn, ...s.txns] }));
    onClose();
  };
  return (
    <Modal title="New transaction" onClose={onClose} onSave={save} saveLabel="Log it">
      <div className="field-row">
        <div className="field">
          <label>Date</label>
          <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} />
        </div>
        <div className="field">
          <label>Amount</label>
          <input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => update('amount', e.target.value)} autoFocus />
        </div>
      </div>
      <div className="field">
        <label>Payee</label>
        <input type="text" placeholder="e.g. Trader Joe's" value={form.payee} onChange={(e) => update('payee', e.target.value)} />
      </div>
      <div className="field-row">
        <div className="field">
          <label>Type</label>
          <select value={form.isIncome ? 'in' : 'out'} onChange={(e) => update('isIncome', e.target.value === 'in')}>
            <option value="out">Expense</option>
            <option value="in">Income</option>
          </select>
        </div>
        <div className="field">
          <label>Envelope</label>
          <select value={form.env} onChange={(e) => update('env', e.target.value)} disabled={form.isIncome}>
            {state.envelopes.map((e) => <option key={e.id} value={e.id}>{e.icon} {e.name}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label>Note (optional)</label>
        <input type="text" placeholder="weekly grocery run…" value={form.note} onChange={(e) => update('note', e.target.value)} />
      </div>
    </Modal>
  );
}

// ── Add bill modal ───────────────────────────────────────────────────────────
function AddBillModal({ state, setState, onClose }) {
  const [form, setForm] = React.useState({
    name: '', amount: '', nextDate: '2026-06-01', category: 'subs', logo: '📺', auto: true,
  });
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = () => {
    const amt = parseFloat(form.amount);
    if (!form.name || isNaN(amt)) return;
    const bill = {
      id: 'b_' + Date.now(),
      name: form.name, amount: amt, cadence: 'monthly',
      nextDate: form.nextDate, category: form.category,
      logo: form.logo, auto: form.auto, active: true,
    };
    setState((s) => ({ ...s, bills: [...s.bills, bill] }));
    onClose();
  };
  return (
    <Modal title="New bill or subscription" onClose={onClose} onSave={save} saveLabel="Add bill">
      <div className="field-row">
        <div className="field">
          <label>Name</label>
          <input type="text" placeholder="e.g. Spotify" value={form.name} onChange={(e) => update('name', e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>Amount / month</label>
          <input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => update('amount', e.target.value)} />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Next charge</label>
          <input type="date" value={form.nextDate} onChange={(e) => update('nextDate', e.target.value)} />
        </div>
        <div className="field">
          <label>Icon</label>
          <input type="text" maxLength="3" value={form.logo} onChange={(e) => update('logo', e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Category</label>
        <select value={form.category} onChange={(e) => update('category', e.target.value)}>
          <option value="subs">Subscriptions</option>
          <option value="utility">Utilities</option>
          <option value="insurance">Insurance</option>
          <option value="housing">Housing</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="row" style={{ gap: 10 }}>
        <button className="toggle" data-on={form.auto ? 1 : 0} onClick={() => update('auto', !form.auto)}><i /></button>
        <span style={{ fontSize: 12, color: 'var(--sl-ink-2)' }}>Charges automatically</span>
      </div>
    </Modal>
  );
}

// ── Add goal modal ───────────────────────────────────────────────────────────
function AddGoalModal({ state, setState, onClose }) {
  const [form, setForm] = React.useState({
    name: '', target: '', saved: 0, monthly: '', due: '2026-12-31', icon: '🐚', color: 'gold',
  });
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = () => {
    if (!form.name || !form.target) return;
    const goal = {
      id: 'g_' + Date.now(),
      name: form.name,
      target:  parseFloat(form.target),
      saved:   parseFloat(form.saved)   || 0,
      monthly: parseFloat(form.monthly) || 0,
      due:     form.due,
      icon:    form.icon,
      color:   form.color,
    };
    setState((s) => ({ ...s, goals: [...s.goals, goal] }));
    onClose();
  };
  return (
    <Modal title="New savings goal" onClose={onClose} onSave={save} saveLabel="Set goal">
      <div className="field-row">
        <div className="field">
          <label>Name</label>
          <input type="text" placeholder="e.g. Costa Rica trip" value={form.name} onChange={(e) => update('name', e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>Icon</label>
          <input type="text" maxLength="3" value={form.icon} onChange={(e) => update('icon', e.target.value)} />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Target</label>
          <input type="number" placeholder="3500" value={form.target} onChange={(e) => update('target', e.target.value)} />
        </div>
        <div className="field">
          <label>Already saved</label>
          <input type="number" placeholder="0" value={form.saved} onChange={(e) => update('saved', e.target.value)} />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Monthly contribution</label>
          <input type="number" placeholder="200" value={form.monthly} onChange={(e) => update('monthly', e.target.value)} />
        </div>
        <div className="field">
          <label>Target date</label>
          <input type="date" value={form.due} onChange={(e) => update('due', e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Accent color</label>
        <div className="row" style={{ gap: 8 }}>
          {[['gold', '#F5D060'], ['coral', '#FF8C00'], ['teal', '#60B8FF'], ['navy', '#87CEEB']].map(([k, hex]) => (
            <button key={k} onClick={() => update('color', k)}
              style={{
                width: 32, height: 32, borderRadius: 8, background: hex, cursor: 'pointer',
                border: '2px solid ' + (form.color === k ? 'var(--sl-gold-light)' : 'transparent'),
              }} />
          ))}
        </div>
      </div>
    </Modal>
  );
}

// ── Root App ─────────────────────────────────────────────────────────────────
export function App({ initialState, onSave }) {
  const containerRef           = React.useRef(null);
  const [t, setTweak]          = useTweaks(TWEAK_DEFAULTS);
  const [tweaksOpen, setTweaksOpen] = React.useState(false);

  const [state, setStateRaw]   = React.useState(() => initialState ?? JSON.parse(JSON.stringify(seed)));
  const totals                 = React.useMemo(() => deriveTotals(state), [state]);

  const setState = React.useCallback((updater) => {
    setStateRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      onSave?.(next);
      return next;
    });
  }, [onSave]);

  const [view, setView]        = React.useState('dashboard');
  const [tabs, setTabs]        = React.useState(['dashboard', 'envelopes', 'bills']);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [cmdOpen, setCmdOpen]  = React.useState(false);
  const [modal, setModal]      = React.useState(null);

  const openTab  = (id) => setTabs((ts) => ts.includes(id) ? ts : [...ts, id]);
  const closeTab = (id) => setTabs((ts) => {
    const next = ts.filter((x) => x !== id);
    if (view === id) setView(next[0] || 'dashboard');
    return next.length ? next : ['dashboard'];
  });
  const goTo = (id) => { setView(id); openTab(id); };

  React.useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((x) => !x);
      }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const palette = PALETTES[t.palette] || PALETTES.coastal;

  return (
    <div
      className="solshock-ledger"
      ref={containerRef}
      data-density={t.density}
      data-bg={t.bg}
      data-theme={t.theme || 'coastal'}
    >
      <div className="app-bg" />
      <div className="app" data-sidebar={sidebarOpen ? 'open' : 'closed'} style={{ '--vault-w': '260px' }}>
        <Ribbon
          view={view}
          setView={(v) => { setView(v); openTab(v); }}
          onCommand={() => setCmdOpen(true)}
          onToggleSidebar={() => setSidebarOpen((x) => !x)}
          onTweaks={() => setTweaksOpen((x) => !x)}
        />

        <VaultSidebar
          view={view}
          setView={setView}
          openTab={openTab}
          totals={totals}
          illustrations={t.illustrations}
        />

        <TabBar tabs={tabs} view={view} setView={setView} closeTab={closeTab} />

        <div className="main">
          {view === 'dashboard'    && <DashboardView    state={state} palette={palette} totals={totals} illustrations={t.illustrations} onCommand={() => setCmdOpen(true)} onAddTxn={() => setModal('txn')} onGoTo={goTo} />}
          {view === 'envelopes'    && <EnvelopesView    state={state} setState={setState} palette={palette} totals={totals} />}
          {view === 'bills'        && <BillsView        state={state} setState={setState} onAddBill={() => setModal('bill')} />}
          {view === 'goals'        && <GoalsView        state={state} setState={setState} onAddGoal={() => setModal('goal')} />}
          {view === 'debt'         && <DebtView         state={state} setState={setState} />}
          {view === 'transactions' && <TransactionsView state={state} setState={setState} onAddTxn={() => setModal('txn')} />}
        </div>

        <StatusBar totals={totals} view={view} txnCount={state.txns.length} />

        <CommandPalette
          open={cmdOpen}
          onClose={() => setCmdOpen(false)}
          setView={setView}
          openTab={openTab}
          openAddTxn={() => setModal('txn')}
          openAddBill={() => setModal('bill')}
          openAddGoal={() => setModal('goal')}
        />

        {modal === 'txn'  && <AddTxnModal  state={state} setState={setState} onClose={() => setModal(null)} />}
        {modal === 'bill' && <AddBillModal state={state} setState={setState} onClose={() => setModal(null)} />}
        {modal === 'goal' && <AddGoalModal state={state} setState={setState} onClose={() => setModal(null)} />}

        <TweaksPanel
          open={tweaksOpen}
          onClose={() => setTweaksOpen(false)}
          containerRef={containerRef}
          title="Tweaks · Solshock Ledger"
        >
          <TweakSection label="Theme" />
          <TweakSelect
            label="Color theme"
            value={t.theme || 'coastal'}
            options={[
              { value: 'coastal',  label: 'Coastal (default)' },
              { value: 'obsidian', label: 'Obsidian' },
            ]}
            onChange={(v) => setTweak('theme', v)}
          />
          <TweakSection label="Palette" />
          <TweakSelect
            label="Donut colors"
            value={t.palette}
            options={[
              { value: 'coastal',  label: 'Coastal (default)' },
              { value: 'obsidian', label: 'Obsidian' },
              { value: 'sunset',   label: 'Sunset' },
              { value: 'tide',     label: 'Tide' },
              { value: 'classic',  label: 'Solshock Classic' },
              { value: 'reef',     label: 'Reef' },
            ]}
            onChange={(v) => setTweak('palette', v)}
          />
          <TweakSelect
            label="Background"
            value={t.bg}
            options={[
              { value: 'navy',     label: 'Deep navy (default)' },
              { value: 'midnight', label: 'Midnight' },
              { value: 'dusk',     label: 'Dusk' },
            ]}
            onChange={(v) => setTweak('bg', v)}
          />

          <TweakSection label="Layout" />
          <TweakRadio
            label="Density"
            value={t.density}
            options={['compact', 'regular', 'spacious']}
            onChange={(v) => setTweak('density', v)}
          />
          <TweakToggle label="Coastal illustrations" value={t.illustrations}   onChange={(v) => setTweak('illustrations', v)} />
          <TweakToggle label="Animated divider"      value={t.animatedDivider} onChange={(v) => setTweak('animatedDivider', v)} />

          <TweakSection label="Quick actions" />
          <TweakButton label="Reset all data" secondary onClick={() => {
            if (confirm('Reset to seed data? This will wipe your transactions and edits.')) {
              setState(JSON.parse(JSON.stringify(seed)));
            }
          }} />
          <TweakButton label="Open command palette" onClick={() => setCmdOpen(true)} />
        </TweaksPanel>
      </div>
    </div>
  );
}

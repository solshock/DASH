import React from 'react';
import { fmt } from './data.js';
import { KPI } from './components.jsx';

export function EnvelopesView({ state, setState, palette, totals }) {
  const [editing, setEditing] = React.useState(null);
  const [draft,   setDraft]   = React.useState(0);

  const startEdit = (id, val) => { setEditing(id); setDraft(val); };
  const saveEdit  = () => {
    setState((s) => ({ ...s, envelopes: s.envelopes.map((e) => e.id === editing ? { ...e, budget: Number(draft) || 0 } : e) }));
    setEditing(null);
  };

  const remaining = totals.budgetTotal - totals.spent;

  return (
    <div className="pane">
      <div className="page-hd">
        <div>
          <div className="crumb">budget-2026 / may / envelopes.md</div>
          <h1>Envelopes</h1>
          <div className="lede">Money divided like coastline — each cove holds a purpose. Click a budget number to edit inline.</div>
        </div>
        <div className="page-hd-right">
          <button className="btn btn-gold">＋ New envelope</button>
        </div>
      </div>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <KPI label="Allocated"    value={fmt(totals.budgetTotal)} gold meta={<span className="muted">across {state.envelopes.length} envelopes</span>} />
        <KPI label="Spent so far" value={fmt(totals.spent)} meta={<span className="muted">{Math.round((totals.spent / totals.budgetTotal) * 100)}% of allocated</span>} />
        <KPI label={remaining >= 0 ? 'Free to surf' : 'Overspent'} value={fmt(Math.abs(remaining))}
          meta={<span className={remaining >= 0 ? 'up' : 'down'}>{remaining >= 0 ? '✓ on plan' : '⚠︎ adjust'}</span>} />
      </div>

      <div className="card">
        <div className="card-hd">
          <div className="card-title">May envelopes</div>
          <span className="card-sub">click any number to edit</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '38px 1fr 110px 220px 110px 80px', gap: 14, padding: '8px 12px', fontSize: 9, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--sl-ink-3)' }}>
          <span /><span>Envelope</span><span>Budget</span><span>Used</span><span>Left</span><span />
        </div>

        {state.envelopes.map((e, i) => {
          const spent = totals.spentByEnv[e.id] || 0;
          const pct   = e.budget ? (spent / e.budget) * 100 : 0;
          const left  = e.budget - spent;
          const color = palette[i % palette.length];
          return (
            <div key={e.id} className="env-row">
              <div className="env-icon" style={{ background: color + '22', borderColor: color + '55' }}>{e.icon}</div>
              <div className="env-name">
                {e.name}
                <div className="sub">{state.txns.filter((t) => t.env === e.id).length} txns this month</div>
              </div>
              <div>
                {editing === e.id ? (
                  <input autoFocus type="number" value={draft} className="env-vals"
                    style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--sl-gold)', borderRadius: 4, padding: '4px 8px', color: 'var(--sl-gold-light)', width: 96 }}
                    onChange={(ev) => setDraft(ev.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(ev) => { if (ev.key === 'Enter') saveEdit(); if (ev.key === 'Escape') setEditing(null); }} />
                ) : (
                  <div className="env-vals" onClick={() => startEdit(e.id, e.budget)} style={{ cursor: 'pointer' }}>
                    {fmt(e.budget).replace('.00', '')}
                    <div className="small">monthly</div>
                  </div>
                )}
              </div>
              <div>
                <div className="bar-wrap">
                  <div className={'bar-fill ' + (pct > 100 ? 'over' : pct > 85 ? '' : 'flush')}
                    style={{ width: Math.min(pct, 100) + '%', background: pct > 100 ? '' : `linear-gradient(90deg, ${color}, ${color}cc)` }} />
                </div>
                <div className="bar-meta">
                  <span>{fmt(spent).replace('.00', '')}</span>
                  <span>{Math.round(pct)}%</span>
                </div>
              </div>
              <div className="env-vals">
                <span style={{ color: left < 0 ? 'var(--sl-coral)' : 'var(--sl-foam)' }}>{fmt(left).replace('.00', '')}</span>
              </div>
              <div className={'pct-pill ' + (pct > 100 ? 'over' : pct > 85 ? 'warn' : '')}>
                {pct > 100 ? 'over' : pct > 85 ? 'tight' : 'flush'}
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: 16, padding: 12, borderTop: '1px dashed var(--sl-line)', display: 'grid', gridTemplateColumns: '38px 1fr 110px 220px 110px 80px', gap: 14, alignItems: 'center' }}>
          <div />
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sl-gold-light)' }}>Totals</div>
          <div className="env-vals" style={{ color: 'var(--sl-gold-light)' }}>{fmt(totals.budgetTotal)}</div>
          <div className="bar-wrap">
            <div className="bar-fill" style={{ width: Math.min((totals.spent / totals.budgetTotal) * 100, 100) + '%' }} />
          </div>
          <div className="env-vals" style={{ color: remaining < 0 ? 'var(--sl-coral)' : 'var(--sl-good)' }}>{fmt(remaining)}</div>
          <div />
        </div>
      </div>
    </div>
  );
}

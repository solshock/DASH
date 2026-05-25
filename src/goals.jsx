import React from 'react';
import { fmt, fmtShort } from './data.js';
import { KPI } from './components.jsx';

export function GoalsView({ state, setState, onAddGoal }) {
  const contribute = (id, amt) => {
    setState((s) => ({ ...s, goals: s.goals.map((g) => g.id === id ? { ...g, saved: Math.min(g.saved + amt, g.target) } : g) }));
  };

  const totalSaved  = state.goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = state.goals.reduce((s, g) => s + g.target, 0);

  const colorFor = (g) => ({ gold: '#F5D060', coral: '#FF8C00', teal: '#60B8FF', navy: '#87CEEB' }[g.color] || '#F5D060');

  return (
    <div className="pane">
      <div className="page-hd">
        <div>
          <div className="crumb">budget-2026 / may / goals.md</div>
          <h1>Horizon Goals</h1>
          <div className="lede">Each goal is a shoreline you're swimming toward. Drop in a contribution any time — it pulls from your savings envelope.</div>
        </div>
        <div className="page-hd-right">
          <button className="btn btn-gold" onClick={onAddGoal}>＋ New goal</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 22, padding: 24 }}>
        <div className="row" style={{ alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="card-title">Total progress</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
              <div className="signature-text" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 40, fontWeight: 600 }}>
                {fmt(totalSaved)}
              </div>
              <div style={{ fontSize: 14, color: 'var(--sl-ink-3)', fontFamily: 'JetBrains Mono, monospace' }}>
                / {fmtShort(totalTarget)}
              </div>
            </div>
            <div className="goal-bar-wrap" style={{ marginTop: 14, height: 12 }}>
              <div className="goal-bar-fill" style={{ width: (totalSaved / totalTarget) * 100 + '%' }} />
            </div>
            <div className="bar-meta" style={{ marginTop: 8 }}>
              <span>{Math.round((totalSaved / totalTarget) * 100)}% of all goals</span>
              <span>{fmt(totalTarget - totalSaved)} more to go</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <KPI label="Active goals" value={state.goals.length} meta={<span className="muted">savings buckets</span>} />
            <KPI label="Monthly auto" value={fmt(state.goals.reduce((s, g) => s + g.monthly, 0))} gold meta={<span className="up">↗︎ on track</span>} />
          </div>
        </div>
      </div>

      <div className="grid-cards">
        {state.goals.map((g) => {
          const pct       = (g.saved / g.target) * 100;
          const remaining = g.target - g.saved;
          const monthsLeft = g.monthly > 0 ? Math.ceil(remaining / g.monthly) : 0;
          const c = colorFor(g);
          return (
            <div key={g.id} className="goal-card">
              <div className="goal-pct">{Math.round(pct)}%</div>
              <div className="goal-hd">
                <div className="goal-icon" style={{ background: c + '22', borderColor: c + '55' }}>{g.icon}</div>
                <div>
                  <div className="goal-name">{g.name}</div>
                  <div className="goal-meta">due {new Date(g.due).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} · ${g.monthly}/mo</div>
                </div>
              </div>
              <div className="goal-vals">
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--sl-ink-3)', textTransform: 'uppercase' }}>Saved</div>
                  <div className="saved tnum">{fmt(g.saved).replace('.00', '')}</div>
                </div>
                <div className="target tnum" style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--sl-ink-3)', textTransform: 'uppercase' }}>Target</div>
                  <div>{fmt(g.target).replace('.00', '')}</div>
                </div>
              </div>
              <div className="goal-bar-wrap">
                <div className="goal-bar-fill" style={{ width: pct + '%', background: `linear-gradient(90deg, ${c}, ${c}aa)` }} />
              </div>
              <div className="bar-meta">
                <span>{fmt(remaining).replace('.00', '')} left</span>
                <span>{monthsLeft}mo at current pace</span>
              </div>
              <div className="goal-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => contribute(g.id, 25)}>＋ $25</button>
                <button className="btn btn-ghost btn-sm" onClick={() => contribute(g.id, 100)}>＋ $100</button>
                <button className="btn btn-gold  btn-sm" onClick={() => contribute(g.id, g.monthly)}>＋ ${g.monthly}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

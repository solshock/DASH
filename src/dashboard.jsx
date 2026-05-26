import React from 'react';
import { fmt, fmtShort, today } from './data.js';
import { KPI, CashflowBars } from './components.jsx';

export function DashboardView({ state, palette, totals, onCommand, illustrations, onAddTxn, onGoTo }) {
  const [hover, setHover] = React.useState(null);

  const segs = state.envelopes
    .map((e, i) => ({ id: e.id, name: e.name, icon: e.icon, amount: totals.spentByEnv[e.id] || 0, budget: e.budget, color: palette[i % palette.length] }))
    .filter((s) => s.amount > 0);
  const totalSpent = segs.reduce((s, x) => s + x.amount, 0);

  const R = 70, C = 2 * Math.PI * R;
  let acc = 0;
  const segments = segs.map((s) => {
    const frac = s.amount / totalSpent || 0;
    const len  = frac * C;
    const offset = -acc;
    acc += len;
    return { ...s, frac, len, offset };
  });

  const hoveredAmount = hover != null ? segments.find((s) => s.id === hover)?.amount : null;
  const centerVal = hoveredAmount != null ? hoveredAmount : totalSpent;
  const centerLbl = hoveredAmount != null ? (segments.find((s) => s.id === hover)?.name ?? '') : 'spent · may';

  const upcoming = state.bills
    .filter((b) => b.active)
    .map((b) => ({ ...b, days: Math.ceil((new Date(b.nextDate) - today) / 86400000) }))
    .filter((b) => b.days >= 0 && b.days <= 14)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  const recent = [...state.txns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  const weeks = [
    { lbl: 'W-3', in: 3250, out: 1840 },
    { lbl: 'W-2', in: 0,    out: 2210 },
    { lbl: 'W-1', in: 3250, out: 1620 },
    { lbl: 'now', in: 3250, out: Math.max(0, totals.spent - 1840 - 2210 - 1620) },
  ];

  return (
    <div className="pane">
      <div className="page-hd">
        <div>
          <div className="crumb">budget-2026 / may / dashboard.md</div>
          <h1>May Currents</h1>
          <div className="lede">A horizon-line view of the month. Net worth, envelopes, bills cresting next, and the gold you've set aside.</div>
        </div>
        <div className="page-hd-right">
          <button className="btn btn-gold" onClick={onAddTxn}>＋ New transaction</button>
          <button className="btn btn-ghost btn-sm" onClick={onCommand}>⌘ K · commands</button>
        </div>
      </div>

      <div className="divider-anim" style={{ marginBottom: 22, opacity: 0.7 }} />

      <div className="kpi-row">
        <KPI label="Net Worth"    value={fmt(totals.netWorth)} meta={<span className="muted">assets minus debt</span>} gold deco="🌊" />
        <KPI label="Income · May" value={fmt(totals.income)}   meta={<span className="muted">{state.txns.filter(t => t.amount > 0).length} deposits logged</span>} deco="🪙" />
        <KPI label="Spent · May"  value={fmt(totals.spent)}    meta={totals.budgetTotal > 0 ? <><span className={totals.spent < totals.budgetTotal ? 'up' : 'down'}>{Math.round((totals.spent / totals.budgetTotal) * 100)}%</span><span> of budget</span></> : <span className="muted">set budgets in envelopes</span>} deco="📥" />
        <KPI label="Saved · May"  value={fmt(totals.saved)}    meta={<span className="muted">to savings envelope</span>} deco="🐚" />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title">Spending mix</div>
              <div className="card-sub">May 1 – {today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {segs.length} categories</div>
            </div>
            <span className="tag gold">live</span>
          </div>
          <div className="donut-wrap">
            {segments.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, minHeight: 200, color: 'var(--sl-ink-3)', fontSize: 12 }}>
                <div style={{ fontSize: 28 }}>🌊</div>
                <div>No spending yet — add a transaction</div>
              </div>
            )}
            {segments.length > 0 && <svg className="donut-svg" viewBox="0 0 200 200">
              <defs>
                <filter id="sl-soft" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.5" />
                </filter>
              </defs>
              <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="28" />
              <g transform="rotate(-90 100 100)">
                {segments.map((s) => (
                  <circle key={s.id} className={'seg ' + (hover && hover !== s.id ? 'dim' : '')}
                    cx="100" cy="100" r={R} fill="none" stroke={s.color} strokeWidth="28"
                    strokeDasharray={`${s.len} ${C - s.len}`} strokeDashoffset={s.offset} strokeLinecap="butt"
                    onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)}>
                    <title>{s.name}: {fmt(s.amount)} ({Math.round(s.frac * 100)}%)</title>
                  </circle>
                ))}
              </g>
              <text className="donut-center" x="100" y="94">
                <tspan className="big" x="100" dy="0">{fmtShort(centerVal)}</tspan>
              </text>
              <text className="donut-center" x="100" y="115">
                <tspan className="lbl" x="100" dy="0">{centerLbl.length > 14 ? centerLbl.slice(0, 14) + '…' : centerLbl}</tspan>
              </text>
              {hoveredAmount != null && (
                <text className="donut-center" x="100" y="130">
                  <tspan className="lbl" x="100" dy="0" style={{ fill: 'var(--sl-electric-blue)' }}>
                    {Math.round((hoveredAmount / totalSpent) * 100)}% · click
                  </tspan>
                </text>
              )}
              {illustrations && (
                <g opacity="0.9">
                  <circle cx="172" cy="28" r="4" fill="var(--sl-gold-light)" />
                  <g stroke="var(--sl-gold-light)" strokeWidth="0.8" strokeLinecap="round">
                    <line x1="172" y1="20" x2="172" y2="17" /><line x1="172" y1="36" x2="172" y2="39" />
                    <line x1="164" y1="28" x2="161" y2="28" /><line x1="180" y1="28" x2="183" y2="28" />
                    <line x1="166" y1="22" x2="164" y2="20" /><line x1="178" y1="34" x2="180" y2="36" />
                    <line x1="166" y1="34" x2="164" y2="36" /><line x1="178" y1="22" x2="180" y2="20" />
                  </g>
                </g>
              )}
            </svg>}
            <div className="donut-legend">
              {segments.map((s) => (
                <div key={s.id} className={'legend-row ' + (hover && hover !== s.id ? 'dim' : '')}
                  onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)}
                  onClick={() => onGoTo('envelopes')}>
                  <span className="legend-sw" style={{ background: s.color }} />
                  <span className="legend-name">{s.icon} {s.name}</span>
                  <span className="legend-pct tnum">{Math.round(s.frac * 100)}%</span>
                  <span className="legend-amt tnum">{fmt(s.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card tight">
            <div className="card-hd">
              <div className="card-title">Cashflow · 4 wk</div>
              <div className="card-sub">in / out</div>
            </div>
            <CashflowBars weeks={weeks} />
          </div>

          <div className="card tight">
            <div className="card-hd">
              <div className="card-title">🪨 Debt outstanding</div>
              <button className="btn-link" onClick={() => onGoTo('debt')}>plan →</button>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24, color: 'var(--sl-coral)', marginBottom: 4 }}>
              {fmt(totals.debtTotal)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--sl-ink-3)', marginBottom: 10 }}>across {state.debts.length} account{state.debts.length !== 1 ? 's' : ''}</div>
            {state.debts.length > 0 && (() => {
              const totalOrig = state.debts.reduce((s, d) => s + d.original, 0);
              const totalPaid = state.debts.reduce((s, d) => s + (d.original - d.balance), 0);
              const pct = totalOrig > 0 ? Math.round((totalPaid / totalOrig) * 100) : 0;
              return <>
                <div className="bar-wrap" style={{ height: 6 }}>
                  <div className="goal-bar-fill" style={{ width: pct + '%' }} />
                </div>
                <div className="bar-meta">
                  <span>{fmt(totalPaid)} paid</span>
                  <span>{pct}% retired</span>
                </div>
              </>;
            })()}
          </div>

          <div className="card tight">
            <div className="card-hd">
              <div className="card-title">🐚 Savings goals</div>
              <button className="btn-link" onClick={() => onGoTo('goals')}>open →</button>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24 }} className="gold-text">
              {fmt(totals.goalSaved)} <span style={{ fontSize: 13, color: 'var(--sl-ink-3)', marginLeft: 4 }}>/ {fmtShort(totals.goalTarget)}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--sl-ink-3)', marginBottom: 10 }}>{totals.goalTarget > 0 ? Math.round((totals.goalSaved / totals.goalTarget) * 100) + '% to the horizon' : 'no goals yet'}</div>
            <div className="bar-wrap" style={{ height: 6 }}>
              <div className="bar-fill" style={{ width: (totals.goalTarget > 0 ? (totals.goalSaved / totals.goalTarget) * 100 : 0) + '%' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title">Cresting in 14 days</div>
              <div className="card-sub">Upcoming bills & subscriptions</div>
            </div>
            <button className="btn-link" onClick={() => onGoTo('bills')}>all bills →</button>
          </div>
          {upcoming.length === 0 && <div className="empty"><div className="em-icon">🌴</div>clear horizon — no bills this week.</div>}
          {upcoming.map((b) => (
            <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto 80px', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--sl-line-2)' }}>
              <div className="bill-logo">{b.logo}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{b.name}</div>
                <div style={{ fontSize: 11, color: 'var(--sl-ink-3)' }}>{new Date(b.nextDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              </div>
              <div className="tnum" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{fmt(b.amount)}</div>
              <div style={{ textAlign: 'right' }}>
                <span className={'tag ' + (b.days <= 3 ? 'coral' : b.days <= 7 ? 'gold' : 'blue')}>
                  {b.days === 0 ? 'today' : b.days === 1 ? 'tomorrow' : 'in ' + b.days + 'd'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title">Recent currents</div>
              <div className="card-sub">Latest transactions</div>
            </div>
            <button className="btn-link" onClick={() => onGoTo('transactions')}>ledger →</button>
          </div>
          {recent.map((t) => {
            const env = state.envelopes.find((e) => e.id === t.env);
            return (
              <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--sl-line-2)' }}>
                <div className="txn-date">{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                <div>
                  <div className="txn-payee" style={{ fontSize: 13 }}>{t.payee}</div>
                  {env && <span className="txn-env-pill" style={{ marginTop: 4 }}>{env.icon} {env.name}</span>}
                  {!env && t.amount > 0 && <span className="txn-env-pill income">↘︎ income</span>}
                </div>
                <div className={'txn-amount ' + (t.amount > 0 ? 'in' : 'out')}>
                  {t.amount > 0 ? '+' : ''}{fmt(t.amount)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

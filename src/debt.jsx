import React from 'react';
import { fmt, fmtShort } from './data.js';
import { KPI } from './components.jsx';

function simulate(debts, strategy, extraInput) {
  function run(extra) {
    const ds = debts.map((d) => ({ ...d, _bal: d.balance }));
    let month = 0;
    let totalInterest = 0;
    const payoffMonths = {};
    while (ds.some((d) => d._bal > 0) && month < 600) {
      month++;
      ds.forEach((d) => {
        if (d._bal > 0) {
          const i = (d._bal * d.apr / 100) / 12;
          d._bal += i;
          totalInterest += i;
        }
      });
      ds.forEach((d) => {
        if (d._bal > 0) {
          const pay = Math.min(d.minPay, d._bal);
          d._bal -= pay;
        }
      });
      const sorted = ds.filter((d) => d._bal > 0).sort((a, b) =>
        strategy === 'avalanche' ? b.apr - a.apr : a._bal - b._bal
      );
      if (sorted[0] && extra > 0) {
        const pay = Math.min(extra, sorted[0]._bal);
        sorted[0]._bal -= pay;
      }
      ds.forEach((d) => {
        if (d._bal <= 0.01 && !payoffMonths[d.id]) payoffMonths[d.id] = month;
      });
    }
    return { months: month, interest: totalInterest, payoffMonths };
  }
  const withExtra    = run(extraInput);
  const withoutExtra = run(0);
  const sorted  = [...debts].sort((a, b) => strategy === 'avalanche' ? b.apr - a.apr : a.balance - b.balance);
  const ordered = sorted.map((d) => ({ ...d, payoffMonths: withExtra.payoffMonths[d.id] || withExtra.months }));
  return {
    months: withExtra.months,
    interest: withExtra.interest,
    monthsNoExtra: withoutExtra.months,
    interestNoExtra: withoutExtra.interest,
    ordered,
  };
}

function ProjectionStat({ label, value, sub, gold }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--sl-line-2)' }}>
      <div>
        <div className="debt-meta-label">{label}</div>
        <div style={{ fontSize: 11, color: 'var(--sl-ink-3)', marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 18 }}
           className={gold ? 'gold-text' : ''}>
        {value}
      </div>
    </div>
  );
}

export function DebtView({ state, setState }) {
  const [strategy, setStrategy] = React.useState('avalanche');
  const [extra, setExtra]       = React.useState(150);

  const totalBalance  = state.debts.reduce((s, d) => s + d.balance,  0);
  const totalOriginal = state.debts.reduce((s, d) => s + d.original, 0);
  const totalMin      = state.debts.reduce((s, d) => s + d.minPay,   0);
  const totalPaid     = totalOriginal - totalBalance;

  const projection = React.useMemo(() => simulate(state.debts, strategy, extra), [state.debts, strategy, extra]);

  return (
    <div className="pane">
      <div className="page-hd">
        <div>
          <div className="crumb">budget-2026 / may / debt payoff.md</div>
          <h1>Debt Tides</h1>
          <div className="lede">What you owe, in retreating order. Switch between snowball (smallest balance) and avalanche (highest rate) to see your payoff horizon move.</div>
        </div>
        <div className="page-hd-right">
          <span className="card-sub" style={{ marginRight: 4 }}>strategy</span>
          <div className="row" style={{ gap: 4, background: 'rgba(255,255,255,0.04)', padding: 3, borderRadius: 8, border: '1px solid var(--sl-line-2)' }}>
            {['avalanche', 'snowball'].map((s) => (
              <button key={s} className={'btn btn-sm ' + (strategy === s ? 'btn-gold' : 'btn-ghost')} style={{ border: 'none' }} onClick={() => setStrategy(s)}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <KPI label="Total balance"   value={fmt(totalBalance)}  meta={<span className="down">across {state.debts.length} accounts</span>} />
        <KPI label="Already retired" value={fmt(totalPaid)}     gold meta={<span className="up">{Math.round((totalPaid / totalOriginal) * 100)}% of starting debt</span>} />
        <KPI label="Min payment"     value={fmt(totalMin)}      meta={<span className="muted">required / month</span>} />
        <KPI label="Debt-free in"    value={projection.months + ' mo'} meta={<span className="up">↗︎ {new Date(2026, 4 + projection.months, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>} />
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title">Your debts</div>
              <div className="card-sub">ordered by {strategy === 'avalanche' ? 'APR (highest first)' : 'balance (smallest first)'}</div>
            </div>
          </div>

          {projection.ordered.map((d, i) => {
            const pct = ((d.original - d.balance) / d.original) * 100;
            return (
              <div key={d.id} className="debt-row">
                <div className="debt-icon">{d.icon}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {i === 0 && <span className="tag gold" style={{ marginRight: 8 }}>focus</span>}
                    {d.name}
                  </div>
                  <div className="debt-progress-wrap">
                    <div className="debt-progress-fill" style={{ width: pct + '%' }} />
                  </div>
                  <div className="bar-meta">
                    <span>{Math.round(pct)}% retired</span>
                    <span>{fmt(d.original - d.balance).replace('.00', '')} paid</span>
                  </div>
                </div>
                <div>
                  <div className="debt-meta-label">Balance</div>
                  <div className="debt-balance">{fmt(d.balance)}</div>
                </div>
                <div>
                  <div className="debt-meta-label">APR</div>
                  <span className={'apr-pill ' + (d.apr >= 15 ? 'high' : d.apr >= 7 ? 'med' : 'low')}>{d.apr}%</span>
                </div>
                <div>
                  <div className="debt-meta-label">Min / mo</div>
                  <div className="debt-meta-val">{fmt(d.minPay)}</div>
                </div>
                <div>
                  <div className="debt-meta-label" style={{ textAlign: 'right' }}>Payoff</div>
                  <div className="debt-meta-val" style={{ textAlign: 'right', color: 'var(--sl-gold-light)' }}>{d.payoffMonths}mo</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title">Payoff projection</div>
              <div className="card-sub">{strategy} method</div>
            </div>
          </div>

          <div className="field" style={{ marginBottom: 20 }}>
            <label>Extra payment per month</label>
            <div className="row" style={{ alignItems: 'center', gap: 12 }}>
              <input type="range" min="0" max="800" step="25" value={extra}
                onChange={(e) => setExtra(+e.target.value)}
                style={{ flex: 1, accentColor: 'var(--sl-gold)' }} />
              <div className="env-vals" style={{ width: 70, textAlign: 'right' }}>${extra}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ProjectionStat label="Total interest paid"   value={fmt(projection.interest)}       sub={`vs ${fmt(projection.interestNoExtra)} with min only`} />
            <ProjectionStat label="Saved with extra $/mo" value={fmt(projection.interestNoExtra - projection.interest)} sub="interest avoided" gold />
            <ProjectionStat label="Months saved"          value={projection.monthsNoExtra - projection.months + ' mo'} sub="vs paying minimums only" />
            <ProjectionStat label="Debt-free date"        value={new Date(2026, 4 + projection.months, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} sub={`${projection.months} months from today`} />
          </div>

          <div style={{ marginTop: 20, padding: 14, background: 'rgba(96,184,255,0.06)', border: '1px solid rgba(96,184,255,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--sl-foam)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--sl-electric-blue)' }}>🌊 Coastal tip.</strong>{' '}
            {strategy === 'avalanche'
              ? 'Avalanche kills the highest-APR debt first — math-optimal. Best when interest is what hurts.'
              : 'Snowball clears the smallest balances first — psychologically momentum-building. Best when you need wins.'}
          </div>
        </div>
      </div>
    </div>
  );
}

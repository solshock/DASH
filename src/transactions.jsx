import React from 'react';
import { fmt, parseCSV } from './data.js';
import { KPI } from './components.jsx';

export function TransactionsView({ state, setState, onAddTxn }) {
  const [filter,  setFilter]  = React.useState('all');
  const [search,  setSearch]  = React.useState('');
  const fileRef = React.useRef(null);

  const handleCSV = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const rows = parseCSV(ev.target.result);
        setState((s) => ({ ...s, txns: [...rows, ...s.txns] }));
      } catch (err) {
        console.error('CSV parse error', err);
        alert("Couldn't parse that CSV. Expected columns: date,payee,amount,env,note");
      }
    };
    r.readAsText(f);
    e.target.value = '';
  };

  const exportCSV = () => {
    const esc = (v) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const rows = [['date', 'payee', 'amount', 'env', 'note']];
    [...state.txns]
      .sort((a, b) => b.date.localeCompare(a.date))
      .forEach((t) => rows.push([t.date, t.payee, t.amount, t.env || '', t.note || ''].map(esc)));
    const csv  = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `solshock-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const removeTxn = (id) =>
    setState((s) => ({ ...s, txns: s.txns.filter((t) => t.id !== id) }));

  let filtered = [...state.txns].sort((a, b) => b.date.localeCompare(a.date));
  if (filter === 'in')  filtered = filtered.filter((t) => t.amount > 0);
  if (filter === 'out') filtered = filtered.filter((t) => t.amount < 0);
  if (filter !== 'all' && filter !== 'in' && filter !== 'out') {
    filtered = filtered.filter((t) => t.env === filter);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((t) => t.payee.toLowerCase().includes(q) || (t.note || '').toLowerCase().includes(q));
  }

  const inflow  = state.txns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const outflow = state.txns.filter((t) => t.amount < 0).reduce((s, t) => s - t.amount, 0);

  return (
    <div className="pane">
      <div className="page-hd">
        <div>
          <div className="crumb">budget-2026 / may / transactions.md</div>
          <h1>Ledger</h1>
          <div className="lede">Every wave that hit the shore this month. Import from your bank's CSV or log them by hand.</div>
        </div>
        <div className="page-hd-right">
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={exportCSV}>⤴ Export</button>
            <button className="btn btn-ghost" onClick={() => fileRef.current.click()}>⤓ Import CSV</button>
            <button className="btn btn-gold"  onClick={onAddTxn}>＋ New transaction</button>
          </div>
          <input ref={fileRef} type="file" accept=".csv,text/csv" data-csv-input onChange={handleCSV} style={{ display: 'none' }} />
        </div>
      </div>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <KPI label="Total entries" value={state.txns.length} meta={<span className="muted">across all months</span>} />
        <KPI label="Inflow"  value={fmt(inflow)}  gold meta={<span className="up">↘︎ income &amp; transfers in</span>} />
        <KPI label="Outflow" value={fmt(outflow)} meta={<span className="muted">spend + savings transfers</span>} />
      </div>

      <div className="card">
        <div className="card-hd" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="row" style={{ gap: 6 }}>
            {[['all', 'All'], ['in', 'Income'], ['out', 'Spend']].map(([k, l]) => (
              <button key={k} className={'btn btn-sm ' + (filter === k ? 'btn-gold' : 'btn-ghost')} onClick={() => setFilter(k)}>{l}</button>
            ))}
            <select
              style={{ height: 28, padding: '0 8px', borderRadius: 6, marginLeft: 8, background: 'rgba(255,255,255,0.04)', color: 'var(--sl-ink)', border: '1px solid var(--sl-line-2)', fontSize: 11 }}
              value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">— by envelope —</option>
              {state.envelopes.map((e) => <option key={e.id} value={e.id}>{e.icon} {e.name}</option>)}
            </select>
          </div>
          <input
            type="text"
            placeholder="Search payee or note…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--sl-line-2)', borderRadius: 6, color: 'var(--sl-ink)', padding: '6px 10px', fontSize: 12, width: 220, fontFamily: 'inherit', outline: 'none' }}
          />
        </div>

        <table className="txn-table">
          <thead>
            <tr>
              <th style={{ width: 110 }}>Date</th>
              <th>Payee</th>
              <th style={{ width: 180 }}>Envelope</th>
              <th style={{ width: 120, textAlign: 'right' }}>Amount</th>
              <th style={{ width: 50 }} />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan="5"><div className="empty"><div className="em-icon">🌊</div>Calm waters — no transactions match.</div></td></tr>
            )}
            {filtered.map((t) => {
              const env = state.envelopes.find((e) => e.id === t.env);
              return (
                <tr key={t.id}>
                  <td className="txn-date">{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</td>
                  <td>
                    <div className="txn-payee">{t.payee}</div>
                    {t.note && <div className="txn-note">{t.note}</div>}
                  </td>
                  <td>
                    {env               && <span className="txn-env-pill">{env.icon} {env.name}</span>}
                    {!env && t.amount > 0 && <span className="txn-env-pill income">↘︎ income</span>}
                    {!env && t.amount < 0 && <span className="txn-env-pill">uncategorized</span>}
                  </td>
                  <td className={'txn-amount ' + (t.amount > 0 ? 'in' : 'out')}>
                    {t.amount > 0 ? '+' : ''}{fmt(t.amount)}
                  </td>
                  <td><button className="icon-btn" onClick={() => removeTxn(t.id)} title="Delete">×</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ marginTop: 12, padding: 12, borderTop: '1px dashed var(--sl-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--sl-ink-3)', fontFamily: 'JetBrains Mono, monospace' }}>
          <span>{filtered.length} of {state.txns.length} shown</span>
          <span>CSV format: <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>date,payee,amount,env,note</code></span>
        </div>
      </div>
    </div>
  );
}

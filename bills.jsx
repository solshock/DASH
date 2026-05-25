// bills.jsx — Bills & subscriptions tracker
// Exposes: BillsView

function BillsView({ state, setState, onAddBill }) {
  const { fmt } = window.LedgerData;
  const todayDate = window.LedgerData.today;

  const annotated = state.bills
    .map((b) => ({ ...b, days: Math.ceil((new Date(b.nextDate) - todayDate) / 86400000) }))
    .sort((a, b) => a.days - b.days);

  const activeBills = annotated.filter((b) => b.active);
  const monthlyTotal = activeBills.reduce((s, b) => s + b.amount, 0);
  const subsOnly = activeBills.filter((b) => b.category === 'subs');
  const subsTotal = subsOnly.reduce((s, b) => s + b.amount, 0);

  const toggleActive = (id) =>
    setState((s) => ({ ...s, bills: s.bills.map((b) => b.id === id ? { ...b, active: !b.active } : b) }));
  const removeBill = (id) =>
    setState((s) => ({ ...s, bills: s.bills.filter((b) => b.id !== id) }));

  return (
    <div className="pane">
      <div className="page-hd">
        <div>
          <div className="crumb">budget-2026 / may / bills & subs.md</div>
          <h1>Bills & Subs</h1>
          <div className="lede">
            Recurring tides. Every charge that hits your account on autopilot, organized by what's cresting next.
          </div>
        </div>
        <div className="page-hd-right">
          <button className="btn btn-gold" onClick={onAddBill}>＋ Add bill</button>
        </div>
      </div>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <KPI label="Monthly outflow" value={fmt(monthlyTotal)} gold meta={<span className="muted">{activeBills.length} active bills</span>} />
        <KPI label="Subscriptions only" value={fmt(subsTotal)} meta={<span className="muted">{subsOnly.length} services · {fmt(subsTotal*12)} / yr</span>} />
        <KPI label="Next 7 days" value={fmt(activeBills.filter((b) => b.days <= 7).reduce((s, b) => s + b.amount, 0))} meta={<span className="muted">{activeBills.filter((b) => b.days <= 7).length} bills</span>} />
        <KPI label="Paused" value={annotated.filter((b) => !b.active).length} meta={<span className="muted">not counted in budget</span>} />
      </div>

      <div className="card">
        <div className="card-hd">
          <div className="card-title">All bills & subscriptions</div>
          <div className="card-sub">toggle to pause · click row to edit</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 100px 140px 80px 80px', gap: 14, padding: '8px 12px', fontSize: 9, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
          <span></span>
          <span>Name</span>
          <span style={{ textAlign: 'right' }}>Amount</span>
          <span>Next charge</span>
          <span>Auto</span>
          <span style={{ textAlign: 'right' }}>Active</span>
        </div>

        {annotated.map((b) => (
          <div key={b.id} className={'bill-row ' + (!b.active ? 'inactive' : '')}>
            <div className="bill-logo">{b.logo}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{b.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                <span className="tag">{b.category}</span>
                <span style={{ marginLeft: 8 }}>{b.cadence}</span>
              </div>
            </div>
            <div className="bill-amount">{fmt(b.amount)}</div>
            <div className="bill-next">
              {new Date(b.nextDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {b.active && (
                <span className={'days ' + (b.days <= 3 ? 'urgent' : b.days <= 7 ? 'soon' : '')}>
                  {b.days < 0 ? `${-b.days}d ago` : b.days === 0 ? 'today' : `${b.days}d`}
                </span>
              )}
            </div>
            <div>
              {b.auto ? <span className="tag gold">auto</span> : <span className="tag">manual</span>}
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
              <button className="toggle" data-on={b.active ? 1 : 0} onClick={() => toggleActive(b.id)}><i></i></button>
              <button className="icon-btn" title="Remove" onClick={() => removeBill(b.id)}>×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { BillsView });

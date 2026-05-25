// src/components.jsx — shared components used across multiple views
import React from 'react';
import { fmtShort } from './data.js';

export function KPI({ label, value, meta, gold, deco }) {
  return (
    <div className={'kpi ' + (gold ? 'gold' : '')}>
      {deco && <div className="kpi-deco" aria-hidden="true">{deco}</div>}
      <div className="kpi-label">{label}</div>
      <div className="kpi-val tnum">{value}</div>
      <div className="kpi-meta">{meta}</div>
    </div>
  );
}

export function CashflowBars({ weeks }) {
  const max = Math.max(...weeks.flatMap((w) => [w.in, w.out]));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, alignItems: 'end', height: 100 }}>
      {weeks.map((w, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%' }}>
          <div style={{ display: 'flex', gap: 3, alignItems: 'end', flex: 1, width: '100%', justifyContent: 'center' }}>
            <div title={'In ' + fmtShort(w.in)}  style={{ width: 14, height: (w.in  / max) * 100 + '%', background: 'linear-gradient(180deg, var(--sl-gold-light), var(--sl-gold))',          borderRadius: '3px 3px 0 0', minHeight: w.in  > 0 ? 2 : 0 }} />
            <div title={'Out ' + fmtShort(w.out)} style={{ width: 14, height: (w.out / max) * 100 + '%', background: 'linear-gradient(180deg, var(--sl-electric-blue), #1a6fb8)', borderRadius: '3px 3px 0 0', minHeight: w.out > 0 ? 2 : 0 }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--sl-ink-3)', fontFamily: 'JetBrains Mono, monospace' }}>{w.lbl}</div>
        </div>
      ))}
    </div>
  );
}

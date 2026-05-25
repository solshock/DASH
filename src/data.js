// src/data.js — ES module

export const today = new Date(2026, 4, 25);

export const fmt = (n) =>
  (n < 0 ? '-$' : '$') +
  Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const fmtShort = (n) => {
  const abs = Math.abs(n);
  if (abs >= 1000) return (n < 0 ? '-$' : '$') + (abs / 1000).toFixed(abs >= 10000 ? 0 : 1) + 'k';
  return fmt(n).replace(/\.00$/, '');
};

export const monthKey = (d = new Date()) =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');

const envelopes = [
  { id: 'rent',    name: 'Rent',          icon: '🏠', budget: 0, color: 'navy' },
  { id: 'grocer',  name: 'Groceries',     icon: '🥑', budget: 0, color: 'teal' },
  { id: 'dining',  name: 'Dining Out',    icon: '🦞', budget: 0, color: 'coral' },
  { id: 'transit', name: 'Transit',       icon: '⛵', budget: 0, color: 'foam' },
  { id: 'util',    name: 'Utilities',     icon: '💡', budget: 0, color: 'gold' },
  { id: 'fun',     name: 'Fun & Misc',    icon: '🎟️', budget: 0, color: 'sunset' },
  { id: 'health',  name: 'Health',        icon: '🩺', budget: 0, color: 'sage' },
  { id: 'subs',    name: 'Subscriptions', icon: '📺', budget: 0, color: 'lilac' },
  { id: 'save',    name: 'Savings',       icon: '🐚', budget: 0, color: 'gold' },
];

const bills = [];

const goals = [];

const debts = [];

const txns = [];

export const seed = { envelopes, bills, goals, debts, txns, netCash: 0 };

export function deriveTotals(state) {
  const income = state.txns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spent  = state.txns.filter((t) => t.amount < 0 && t.env !== 'save').reduce((s, t) => s - t.amount, 0);
  const saved  = state.txns.filter((t) => t.env === 'save').reduce((s, t) => s - t.amount, 0);
  const budgetTotal = state.envelopes.reduce((s, e) => s + e.budget, 0);
  const spentByEnv = {};
  state.envelopes.forEach((e) => (spentByEnv[e.id] = 0));
  state.txns.forEach((t) => {
    if (t.amount < 0 && t.env && spentByEnv[t.env] != null) spentByEnv[t.env] += -t.amount;
  });
  const debtTotal  = state.debts.reduce((s, d) => s + d.balance, 0);
  const goalSaved  = state.goals.reduce((s, g) => s + g.saved, 0);
  const goalTarget = state.goals.reduce((s, g) => s + g.target, 0);
  const netCash    = state.netCash ?? 0;
  return { income, spent, saved, budgetTotal, spentByEnv, debtTotal, goalSaved, goalTarget, netCash, netWorth: netCash - debtTotal };
}

export function parseCSV(text) {
  const rows = text.trim().split(/\r?\n/);
  const head = rows.shift().toLowerCase().split(',').map((s) => s.trim());
  const idx  = (k) => head.indexOf(k);
  const di = idx('date'), pi = idx('payee'), ai = idx('amount'), ei = idx('env'), ni = idx('note');
  return rows.map((r, i) => {
    const cells = r.split(',').map((s) => s.trim());
    const amt   = parseFloat(cells[ai]);
    return {
      id:     'imp_' + Date.now() + '_' + i,
      date:   cells[di] || '',
      payee:  cells[pi] || '',
      amount: isNaN(amt) ? 0 : amt,
      env:    cells[ei] || null,
      note:   ni > -1 ? cells[ni] || '' : '',
    };
  });
}

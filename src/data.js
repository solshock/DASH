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
  { id: 'rent',    name: 'Rent',          icon: '🏠', budget: 1800, spent: 1800,   color: 'navy' },
  { id: 'grocer',  name: 'Groceries',     icon: '🥑', budget: 600,  spent: 412.18, color: 'teal' },
  { id: 'dining',  name: 'Dining Out',    icon: '🦞', budget: 300,  spent: 247.40, color: 'coral' },
  { id: 'transit', name: 'Transit',       icon: '⛵', budget: 150,  spent: 88.20,  color: 'foam' },
  { id: 'util',    name: 'Utilities',     icon: '💡', budget: 180,  spent: 156.00, color: 'gold' },
  { id: 'fun',     name: 'Fun & Misc',    icon: '🎟️', budget: 200,  spent: 134.55, color: 'sunset' },
  { id: 'health',  name: 'Health',        icon: '🩺', budget: 120,  spent: 60.00,  color: 'sage' },
  { id: 'subs',    name: 'Subscriptions', icon: '📺', budget: 90,   spent: 67.46,  color: 'lilac' },
  { id: 'save',    name: 'Savings',       icon: '🐚', budget: 800,  spent: 800.00, color: 'gold' },
];

const bills = [
  { id: 'b1',  name: 'Rent',           amount: 1800,  cadence: 'monthly', nextDate: '2026-06-01', category: 'rent',    logo: '🏠', auto: true,  active: true },
  { id: 'b2',  name: 'Internet',       amount: 79,    cadence: 'monthly', nextDate: '2026-06-04', category: 'util',    logo: '🛜', auto: true,  active: true },
  { id: 'b3',  name: 'Phone',          amount: 55,    cadence: 'monthly', nextDate: '2026-06-12', category: 'util',    logo: '📱', auto: true,  active: true },
  { id: 'b4',  name: 'Netflix',        amount: 15.49, cadence: 'monthly', nextDate: '2026-06-08', category: 'subs',    logo: '🎬', auto: true,  active: true },
  { id: 'b5',  name: 'Spotify',        amount: 11.99, cadence: 'monthly', nextDate: '2026-06-14', category: 'subs',    logo: '🎧', auto: true,  active: true },
  { id: 'b6',  name: 'NYT',            amount: 17.00, cadence: 'monthly', nextDate: '2026-06-19', category: 'subs',    logo: '📰', auto: true,  active: true },
  { id: 'b7',  name: 'iCloud+',        amount: 2.99,  cadence: 'monthly', nextDate: '2026-06-22', category: 'subs',    logo: '☁️', auto: true,  active: true },
  { id: 'b8',  name: 'Adobe CC',       amount: 19.99, cadence: 'monthly', nextDate: '2026-06-03', category: 'subs',    logo: '🎨', auto: true,  active: true },
  { id: 'b9',  name: 'Gym (Surf Club)',amount: 45,    cadence: 'monthly', nextDate: '2026-05-28', category: 'health',  logo: '🏄', auto: true,  active: true },
  { id: 'b10', name: 'Car Insurance',  amount: 142,   cadence: 'monthly', nextDate: '2026-06-15', category: 'transit', logo: '🚗', auto: true,  active: true },
  { id: 'b11', name: 'Hulu',           amount: 7.99,  cadence: 'monthly', nextDate: '2026-06-10', category: 'subs',    logo: '📺', auto: false, active: false },
];

const goals = [
  { id: 'g1', name: 'Emergency Fund',     target: 10000, saved: 4200, monthly: 400, due: '2026-12-31', icon: '🛟', color: 'gold' },
  { id: 'g2', name: 'Hawaii Trip',        target: 3500,  saved: 1100, monthly: 250, due: '2026-11-01', icon: '🌺', color: 'coral' },
  { id: 'g3', name: 'New MacBook',        target: 2500,  saved: 900,  monthly: 200, due: '2026-09-15', icon: '💻', color: 'teal' },
  { id: 'g4', name: 'House Down Payment', target: 30000, saved: 8400, monthly: 600, due: '2028-06-01', icon: '🏖️', color: 'navy' },
];

const debts = [
  { id: 'd1', name: 'Student Loan', balance: 14200, original: 22000, apr: 5.4,   minPay: 220, icon: '🎓' },
  { id: 'd2', name: 'Credit Card',  balance: 2300,  original: 3800,  apr: 22.99, minPay: 75,  icon: '💳' },
  { id: 'd3', name: 'Car Loan',     balance: 9800,  original: 18000, apr: 4.5,   minPay: 310, icon: '🚗' },
];

const txns = [
  { id: 't1',  date: '2026-05-24', payee: "Trader Joe's",      amount: -84.21,  env: 'grocer',  note: 'weekly shop' },
  { id: 't2',  date: '2026-05-23', payee: 'Shell',             amount: -42.10,  env: 'transit', note: 'gas' },
  { id: 't3',  date: '2026-05-23', payee: 'Tide Pool Cafe',    amount: -18.50,  env: 'dining',  note: 'iced oat latte + bagel' },
  { id: 't4',  date: '2026-05-22', payee: 'Adobe',             amount: -19.99,  env: 'subs',    note: 'Creative Cloud' },
  { id: 't5',  date: '2026-05-21', payee: 'Whole Foods',       amount: -56.40,  env: 'grocer',  note: '' },
  { id: 't6',  date: '2026-05-20', payee: 'Salty Dog BBQ',     amount: -38.20,  env: 'dining',  note: 'dinner w/ J' },
  { id: 't7',  date: '2026-05-20', payee: 'Pacific Power',     amount: -86.00,  env: 'util',    note: 'May electric' },
  { id: 't8',  date: '2026-05-19', payee: 'Movie — Driftwood', amount: -22.00,  env: 'fun',     note: '' },
  { id: 't9',  date: '2026-05-18', payee: 'Payroll',           amount: 3250.00, env: null,      note: 'biweekly' },
  { id: 't10', date: '2026-05-17', payee: 'Surf Club Gym',     amount: -45.00,  env: 'health',  note: '' },
  { id: 't11', date: '2026-05-16', payee: 'Spotify',           amount: -11.99,  env: 'subs',    note: '' },
  { id: 't12', date: '2026-05-15', payee: "Trader Joe's",      amount: -62.85,  env: 'grocer',  note: '' },
  { id: 't13', date: '2026-05-14', payee: 'Netflix',           amount: -15.49,  env: 'subs',    note: '' },
  { id: 't14', date: '2026-05-13', payee: 'Coastal Coffee',    amount: -6.75,   env: 'dining',  note: '' },
  { id: 't15', date: '2026-05-12', payee: 'BART',              amount: -8.20,   env: 'transit', note: '' },
  { id: 't16', date: '2026-05-11', payee: 'Pharmacy',          amount: -15.00,  env: 'health',  note: 'sunscreen' },
  { id: 't17', date: '2026-05-10', payee: 'Concert tickets',   amount: -88.55,  env: 'fun',     note: 'Vampire Weekend' },
  { id: 't18', date: '2026-05-08', payee: 'Rent — Coastline',  amount: -1800,   env: 'rent',    note: 'May' },
  { id: 't19', date: '2026-05-04', payee: 'Payroll',           amount: 3250.00, env: null,      note: 'biweekly' },
  { id: 't20', date: '2026-05-03', payee: 'Transfer → Savings',amount: -800,    env: 'save',    note: '' },
];

export const seed = { envelopes, bills, goals, debts, txns };

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
  const netCash    = 50800;
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

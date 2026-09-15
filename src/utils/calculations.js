export const structureKeys = ["Checking","Saving","Investments","Digital Craft","Rewards"];
export const costKeys = ["Housing","Food","Transport","Shopping","Gym","Other"];
export const goalKeys = [
  ["Home","Home Plan"],
  ["Travel","Travel Plan"],
  ["Drive","Drive Plan"],
  ["Hobby","Hobby Plan"]
];

export const sum = (rows, key) => rows.reduce((a, r) => a + (Number(r[key]) || 0), 0);

export function monthLabel(row) {
  return `${row.Month} ${row.Year}`;
}

export function latestRow(rows, year, month) {
  return rows.find(r => Number(r.Year) === Number(year) && String(r.Month) === String(month)) || rows[rows.length - 1];
}

export function previousRow(rows, selected) {
  const idx = rows.findIndex(r => r === selected);
  return idx > 0 ? rows[idx - 1] : null;
}

export function pctChange(current, previous) {
  if (!previous) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function goalPct(actual, plan) {
  if (!plan) return 0;
  return Math.max(0, Math.min(100, (actual / plan) * 100));
}

export function actualBudget(row) {
  return (Number(row.Needs)||0) + (Number(row.Savings)||0) + (Number(row.Goal)||0) + (Number(row.Debts)||0);
}

export function budgetStatus(row) {
  const b = Number(row.Budget)||0;
  const a = actualBudget(row);
  if (a > b) return { label: "Over budget", tone: "danger" };
  if (a === b) return { label: "On budget", tone: "neutral" };
  return { label: "Under budget", tone: "good" };
}

import * as XLSX from "xlsx";

export const REQUIRED_COLUMNS = [
  "Year","Month","Num Month","Inflow","Checking","Saving","Investments","Digital Craft","Rewards",
  "Costs","Housing","Food","Transport","Shopping","Gym","Other","Goals","Home","Travel","Drive","Hobby",
  "Total Goals Plan","Home Plan","Travel Plan","Drive Plan","Hobby Plan","Needs","Savings","Goal","Debts",
  "Budget","Budget Previous","Balance"
];

const numericColumns = REQUIRED_COLUMNS.filter(c => !["Month"].includes(c) && c !== "Year");

export async function parseExcelFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const preferred = workbook.SheetNames.find(n => n.toLowerCase() === "data") || workbook.SheetNames[0];
  const sheet = workbook.Sheets[preferred];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

  if (!rows.length) throw new Error("Sheet tidak berisi data.");

  const missing = REQUIRED_COLUMNS.filter(c => !Object.prototype.hasOwnProperty.call(rows[0], c));
  if (missing.length) throw new Error(`Kolom wajib tidak ditemukan: ${missing.join(", ")}`);

  return rows.map(row => {
    const normalized = {};
    for (const key of REQUIRED_COLUMNS) {
      let value = row[key];
      if (numericColumns.includes(key) && value !== null && value !== "") value = Number(value);
      normalized[key] = value;
    }
    return normalized;
  }).filter(r => r.Year != null && r.Month != null);
}

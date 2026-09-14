import { useMemo, useState } from "react";
import { parseExcelFile } from "../utils/excelParser";
import { initialData } from "../data/initialData";

export function useExcelData() {
  const [rows, setRows] = useState(initialData);
  const [sourceName, setSourceName] = useState("Chart180.xlsx • embedded demo/source data");
  const [error, setError] = useState("");

  async function upload(file) {
    setError("");
    try {
      const parsed = await parseExcelFile(file);
      setRows(parsed);
      setSourceName(file.name);
    } catch (e) {
      setError(e.message || "File Excel tidak dapat dibaca.");
    }
  }

  const years = useMemo(() => [...new Set(rows.map(r => Number(r.Year)))].sort((a,b)=>a-b), [rows]);

  return { rows, years, sourceName, error, upload };
}

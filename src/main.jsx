import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { Moon, Sun, WalletCards, Upload, FileSpreadsheet, ChevronDown } from "lucide-react";
import "./index.css";
import App from "./App";

function Root() {
  const [dark, setDark] = useState(() => localStorage.getItem("finance-theme") === "dark");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("finance-theme", dark ? "dark" : "light");
  }, [dark]);
  return (
    <div className={dark ? "dark" : ""}>
      <App dark={dark} setDark={setDark} />
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<Root />);

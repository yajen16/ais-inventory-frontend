import { useEffect, useMemo, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
);

function App() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");

  // 🔗 Fetch Excel data from backend
  useEffect(() => {
    fetch("https://ais-inventory-backend.onrender.com/api/inventory")
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  // ✅ EXACT Excel headers
  const columns = [
    "Article",
    "DESCRIPTION",
    "Semi-expendable Property Number",
    "Unit of Measure",
    "Unit Value",
    "Balance per Card (Qty)",
    "On Hand Per Count (Qty)",
    "Shortage / Overage (Qty)",
    "Value",
    "Remarks",
    "Item Value",
    "End-User",
  ];

  // 🔍 Search filter
  const filtered = useMemo(() => {
    return data.filter((row) =>
      Object.values(row)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [data, search]);

  // 📊 Article summary
  const articleSummary = useMemo(() => {
    const summary = {};
    data.forEach((row) => {
      const article = row["Article"] || "Unspecified";
      const unitValue = Number(row["Unit Value"]) || 0;
      const qty =
        Number(row["On Hand Per Count (Qty)"]) ||
        Number(row["Balance per Card (Qty)"]) ||
        0;

      if (!summary[article]) summary[article] = { qty: 0, value: 0 };
      summary[article].qty += qty;
      summary[article].value += unitValue * qty;
    });
    return summary;
  }, [data]);

// ✅ ICT DEVICE CLASSIFICATION (Smart TV separated)
function getIctDeviceType(desc = "") {
  const d = desc.toLowerCase();

  // MOST SPECIFIC FIRST (important)
  if (d.includes("projector")) return "Projector";

  if (d.includes("smart tv")) return "Smart TV";

  if (d.includes("monitor")) return "Monitor";

  if (d.includes("tv")) return "TV";

  if (d.includes("laptop") || d.includes("notebook"))
    return "Laptop";

  if (
    d.includes("desktop") ||
    d.includes("cpu") ||
    (d.includes("pc") && !d.includes("printer"))
  )
    return "Desktop";

  if (
    d.includes("printer") ||
    d.includes("epson") ||
    d.includes("canon") ||
    d.includes("brother")
  )
    return "Printer";

  if (d.includes("router") || d.includes("switch"))
    return "Router / Network";

  if (d.includes("hard drive") || d.includes("ssd"))
    return "External Storage";

  return "Others";
}

  // 💻 ICT DEVICE SUMMARY
const ictSummary = useMemo(() => {
  const summary = {};

  data
    .filter(
      (r) =>
        (r["Article"] || "").trim().toLowerCase() === "ict equipment"
    )
    .forEach((row) => {
      const type = getIctDeviceType(row["DESCRIPTION"] || "");
      const unitValue = Number(row["Unit Value"]) || 0;
      const qty =
        Number(row["On Hand Per Count (Qty)"]) ||
        Number(row["Balance per Card (Qty)"]) ||
        0;

      if (!summary[type]) summary[type] = { qty: 0, value: 0 };

      summary[type].qty += qty;
      summary[type].value += unitValue * qty;
    });

  return summary;
}, [data]);

  // 🔢 Totals
  const labels = Object.keys(articleSummary);
  const values = Object.values(articleSummary).map((v) => v.value);
  const totalValue = values.reduce((a, b) => a + b, 0);
  const totalQty = Object.values(articleSummary).reduce((a, b) => a + b.qty, 0);

  // 📈 Charts
  const colors = [
    "#6366F1",
    "#22C55E",
    "#06B6D4",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
  ];

  const barData = {
    labels,
    datasets: [
      {
        label: "Total Value (₱)",
        data: values,
        backgroundColor: colors,
      },
    ],
  };

  const pieData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
      },
    ],
  };

  const barOptions = {
    plugins: {
      title: {
        display: true,
        text: "Total Inventory Value per Article",
      },
      tooltip: {
        callbacks: {
          label: (ctx) => " ₱ " + ctx.parsed.y.toLocaleString(),
        },
      },
    },
    scales: {
      x: { title: { display: true, text: "Article" } },
      y: {
        title: { display: true, text: "Total Value (₱)" },
        ticks: { callback: (v) => "₱ " + v.toLocaleString() },
      },
    },
  };

  const pieOptions = {
    plugins: {
      title: { display: true, text: "Inventory Value Distribution" },
      legend: { position: "right" },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = ((ctx.parsed / total) * 100).toFixed(2);
            return ` ₱ ${ctx.parsed.toLocaleString()} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>AIS Inventory Dashboard</h1>

      {/* KPI CARDS */}
      <div style={grid}>
        <StatCard title="Total Inventory Value" value={`₱${totalValue.toLocaleString()}`} />
        <StatCard title="Total Articles" value={labels.length} />
        <StatCard title="Total Quantity" value={totalQty} />
      </div>

      {/* CHARTS */}
      <div style={grid2}>
        <div style={panel}><Bar data={barData} options={barOptions} /></div>
        <div style={panel}><Doughnut data={pieData} options={pieOptions} /></div>
      </div>

      {/* ICT BREAKDOWN */}
      <h2>ICT Equipment Breakdown</h2>
      <table style={table}>
        <thead>
          <tr>
            <th style={th}>Device Type</th>
            <th style={th}>Total Qty</th>
            <th style={th}>Total Value (₱)</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(ictSummary).map(([type, val]) => (
            <tr key={type}>
              <td style={td}>{type}</td>
              <td style={td}>{val.qty}</td>
              <td style={td}>₱{val.value.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SEARCH */}
      <input
        style={searchBox}
        placeholder="Search inventory..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* DETAILED TABLE */}
      <div style={{ maxHeight: "70vh", overflow: "auto" }}>
        <table style={table}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c} style={th}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c} style={td}>{row[c] ?? ""}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* 🔹 UI COMPONENTS & STYLES */
const StatCard = ({ title, value }) => (
  <div style={card}>
    <div style={{ fontSize: 13 }}>{title}</div>
    <div style={{ fontSize: 26, fontWeight: "bold" }}>{value}</div>
  </div>
);

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
  gap: 16,
  marginBottom: 24,
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))",
  gap: 20,
  marginBottom: 24,
};

const panel = {
  background: "#fff",
  padding: 16,
  borderRadius: 12,
  boxShadow: "0 6px 14px rgba(0,0,0,.15)",
};

const card = {
  ...panel,
  background: "#6366F1",
  color: "#fff",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: 20,
};

const th = {
  border: "1px solid #999",
  padding: 6,
  textAlign: "left",
};

const td = {
  border: "1px solid #ccc",
  padding: 6,
};

const searchBox = {
  padding: 10,
  width: "100%",
  marginBottom: 12,
};

export default App;
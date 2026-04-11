import { useEffect, useMemo, useState } from "react";

function App() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("https://ais-inventory-backend.onrender.com/api/inventory")
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("Fetch error:", err));
  }, []);

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

  const filtered = useMemo(() => {
    return data.filter(row =>
      Object.values(row)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [data, search]);

  const articleSummary = useMemo(() => {
    const summary = {};
    data.forEach((row) => {
      const article = row["Article"] || "Unspecified";
      const unitValue = Number(row["Unit Value"]) || 0;
      const qty =
        Number(row["On Hand Per Count (Qty)"]) ||
        Number(row["Balance per Card (Qty)"]) || 0;

      if (!summary[article]) summary[article] = { qty: 0, value: 0 };
      summary[article].qty += qty;
      summary[article].value += unitValue * qty;
    });
    return summary;
  }, [data]);

// ✅ ICT DEVICE CLASSIFICATION
function getIctDeviceType(desc = "") {
  const d = desc.toLowerCase();

  if (d.includes("projector")) return "Projector";
  if (d.includes("smart tv")) return "Smart TV";
  if (d.includes("monitor")) return "Monitor";
  if (d.includes("tv")) return "TV";

  if (d.includes("laptop") || d.includes("notebook")) return "Laptop";

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

  return "Others";
}

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

  const labels = Object.keys(articleSummary);
  const values = Object.values(articleSummary).map(v => v.value);
  const totalValue = values.reduce((a, b) => a + b, 0);
  const totalQty = Object.values(articleSummary).reduce((a, b) => a + b.qty, 0);

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>AIS Inventory Dashboard</h1>

      {/* KPI CARDS */}
      <div style={grid}>
        <StatCard title="Total Inventory Value" value={`₱${totalValue.toLocaleString()}`} />
        <StatCard title="Total Articles" value={labels.length} />
        <StatCard title="Total Quantity" value={totalQty} />
      </div>

{/* ✅ ICT BOX DASHBOARD */}
<h2 style={{marginTop:"30px"}}>ICT Equipment Breakdown</h2>

<div style={ictGrid}>
{
Object.entries(ictSummary)
.sort((a,b)=>b[1].value-a[1].value)
.map(([type,val])=>(
<ICTCard
 key={type}
 title={type}
 qty={val.qty}
 value={val.value}
/>
))
}
</div>

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
              {columns.map(c => (
                <th key={c} style={th}>{c}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filtered.map((row, i) => (
              <tr key={i}>
                {columns.map(c => (
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

/* KPI CARD */
const StatCard = ({ title, value }) => (
<div style={{
background: "linear-gradient(135deg,#6366F1,#9333EA)",
color: "#fff",
padding: "18px",
borderRadius: "16px",
boxShadow: "0 6px 16px rgba(0,0,0,.15)"
}}>
<div style={{fontSize:13}}>{title}</div>
<div style={{fontSize:26,fontWeight:"bold"}}>{value}</div>
</div>
);

/* ICT DEVICE CARD */
const ICTCard = ({title,qty,value})=>(
<div style={{
background:"linear-gradient(135deg,#6366F1,#9333EA)",
color:"white",
padding:"18px",
borderRadius:"16px",
boxShadow:"0 6px 16px rgba(0,0,0,.15)",
minHeight:"120px",
display:"flex",
flexDirection:"column",
justifyContent:"space-between"
}}>
<div style={{fontSize:"14px",opacity:0.9}}>{title}</div>

<div>
<div style={{fontSize:"22px",fontWeight:"bold"}}>
{qty} Units
</div>

<div style={{fontSize:"14px"}}>
₱{value.toLocaleString()}
</div>
</div>
</div>
);

/* STYLES */
const grid={
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",
gap:16,
marginBottom:24
};

const ictGrid = {
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
gap:18,
marginBottom:30
};

const table={
width:"100%",
borderCollapse:"collapse",
marginBottom:20
};

const th={border:"1px solid #999",padding:6,textAlign:"left"};
const td={border:"1px solid #ccc",padding:6};

const searchBox={
padding:10,
width:"100%",
marginBottom:12
};

export default App;
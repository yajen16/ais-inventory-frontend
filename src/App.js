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
  Title
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

  const [data,setData]=useState([]);
  const [search,setSearch]=useState("");

  useEffect(()=>{
    fetch("https://ais-inventory-backend.onrender.com/api/inventory")
      .then(res=>res.json())
      .then(setData)
  },[]);

  const columns=[
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
    "End-User"
  ];

  const filtered=useMemo(()=>{
    return data.filter(row=>
      Object.values(row).join(" ").toLowerCase()
      .includes(search.toLowerCase())
    )
  },[data,search]);

  function getIctDeviceType(desc=""){
    const d=desc.toLowerCase();

    if(d.includes("projector"))return "Projector";
    if(d.includes("smart tv"))return "Smart TV";
    if(d.includes("monitor"))return "Monitor";
    if(d.includes("laptop")||d.includes("notebook"))return "Laptop";
    if(d.includes("desktop")||d.includes("cpu")||d.includes("computer"))return "Desktop";
    if(d.includes("printer")||d.includes("epson")||d.includes("canon")||d.includes("brother"))return "Printer";
    if(d.includes("router")||d.includes("switch"))return "Router / Network";
    return "Others";
  }

  const ictSummary=useMemo(()=>{
    const summary={};

    data
    .filter(r=>(r["Article"]||"").trim().toLowerCase()==="ict equipment")
    .forEach(row=>{
      const type=getIctDeviceType(row["DESCRIPTION"]);
      const unitValue=Number(row["Unit Value"])||0;
      const qty=
        Number(row["On Hand Per Count (Qty)"])||
        Number(row["Balance per Card (Qty)"])||0;

      if(!summary[type])summary[type]={qty:0,value:0};

      summary[type].qty+=qty;
      summary[type].value+=unitValue*qty;
    });

    return summary;
  },[data]);

  const totalInventoryValue=Object.values(ictSummary)
  .reduce((s,a)=>s+a.value,0);

  const ictLabels=Object.keys(ictSummary);
  const ictValues=Object.values(ictSummary).map(v=>v.qty);

  const ictPieData={
    labels:ictLabels,
    datasets:[{
      data:ictValues,
      backgroundColor:[
        "#6366F1",
        "#22C55E",
        "#06B6D4",
        "#F59E0B",
        "#EF4444",
        "#8B5CF6",
        "#F43F5E",
        "#0EA5E9"
      ]
    }]
  };

  const ictPieOptions={
    plugins:{
      legend:{position:"right"},
      title:{
        display:true,
        text:"ICT Device Quantity Distribution"
      },
      tooltip:{
        callbacks:{
          label:(ctx)=>`${ctx.label}: ${ctx.parsed} units`
        }
      }
    }
  };

  return(

    <div style={{padding:20,fontFamily:"Arial"}}>

      {/* SEARCH */}
      <input
        style={searchBox}
        placeholder="Search inventory..."
        value={search}
        onChange={(e)=>setSearch(e.target.value)}
      />

      {/* ICT CARDS */}
      <h2 style={{marginTop:"30px"}}>ICT Equipment Dashboard</h2>

      <div style={grid}>
      {
        Object.entries(ictSummary).map(([type,val])=>(
          <ICTCard
            key={type}
            title={type}
            qty={val.qty}
            value={val.value}
          />
        ))
      }
      </div>

      {/* ICT PIE */}
      <div style={panel}>
        <Doughnut data={ictPieData} options={ictPieOptions}/>
      </div>

      {/* TABLE */}
      <div style={{maxHeight:"70vh",overflow:"auto"}}>
        <table style={table}>
        <thead>
          <tr>
            {columns.map(c=>(
              <th key={c} style={th}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
        {
          filtered.map((row,i)=>(
            <tr key={i}>
            {
              columns.map(c=>(
                <td key={c} style={td}>{row[c]??""}</td>
              ))
            }
            </tr>
          ))
        }
        </tbody>
        </table>
      </div>

    </div>
  );
}

/* ICT CARD */

function ICTCard({title,qty,value}){
return(
<div style={{
background:"linear-gradient(135deg,#6366F1,#9333EA)",
color:"white",
padding:"18px",
borderRadius:"16px",
boxShadow:"0 6px 16px rgba(0,0,0,0.15)",
minHeight:"120px",
display:"flex",
flexDirection:"column",
justifyContent:"space-between"
}}>
<div style={{fontSize:"14px"}}>{title}</div>
<div>
<div style={{fontSize:"22px",fontWeight:"bold"}}>
{qty} Units
</div>
<div style={{fontSize:"14px"}}>
₱{value.toLocaleString()}
</div>
</div>
</div>
)
}

/* STYLES */

const grid={
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",
gap:"18px",
marginBottom:"20px"
};

const panel={
background:"white",
padding:"20px",
borderRadius:"16px",
boxShadow:"0 6px 14px rgba(0,0,0,.15)",
marginBottom:"30px"
};

const table={
width:"100%",
borderCollapse:"collapse"
};

const th={
border:"1px solid #999",
padding:6
};

const td={
border:"1px solid #ccc",
padding:6
};

const searchBox={
padding:10,
width:"100%",
marginBottom:12
};

export default App;
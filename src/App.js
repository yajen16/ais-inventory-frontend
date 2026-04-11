import { useEffect, useMemo, useState } from "react";

function App(){

const [data,setData]=useState([]);
const [search,setSearch]=useState("");

useEffect(()=>{
fetch("https://ais-inventory-backend.onrender.com/api/inventory")
.then(res=>res.json())
.then(setData)
.catch(err=>console.error(err));
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
Object.values(row).join(" ")
.toLowerCase()
.includes(search.toLowerCase())
);
},[data,search]);

// ✅ DEVICE TYPE CLASSIFICATION
function getDeviceType(desc=""){
const d=desc.toLowerCase();

if(d.includes("projector"))return"Projector";
if(d.includes("smart tv"))return"Smart TV";
if(d.includes("monitor"))return"Monitor";

if(d.includes("laptop")||d.includes("notebook"))
return"Laptop";

if(
d.includes("desktop")||
d.includes("cpu")||
(d.includes("pc")&&!d.includes("printer"))
)
return"Desktop";

if(
d.includes("printer")||
d.includes("epson")||
d.includes("canon")||
d.includes("brother")
)
return"Printer";

if(d.includes("router")||d.includes("switch"))
return"Router / Network";

if(d.includes("hard drive")||d.includes("ssd"))
return"External Storage";

return"Others";
}

// ✅ STATUS READER FRIENDLY
function getStatus(remarks=""){
const r=(remarks||"").toLowerCase();

if(r.includes("unserviceable"))return"unserviceable";
if(r.includes("defective"))return"defective";

return"serviceable";
}

// ✅ ARTICLE + DEVICE + STATUS BREAKDOWN
const articleDeviceSummary=useMemo(()=>{

const result={};

data.forEach(row=>{

const article=row["Article"]||"Unspecified";
const type=getDeviceType(row["DESCRIPTION"]||"");
const status=getStatus(row["Remarks"]||"");

const unitValue=Number(row["Unit Value"])||0;
const qty=
Number(row["On Hand Per Count (Qty)"])||
Number(row["Balance per Card (Qty)"])||0;

if(!result[article])result[article]={};

if(!result[article][type])
result[article][type]={
qty:0,
value:0,
serviceable:0,
defective:0,
unserviceable:0
};

result[article][type].qty+=qty;
result[article][type].value+=unitValue*qty;
result[article][type][status]+=qty;

});

return result;

},[data]);

// ✅ KPI TOTALS
const totalValue=data.reduce((s,row)=>{
const uv=Number(row["Unit Value"])||0;
const qty=
Number(row["On Hand Per Count (Qty)"])||
Number(row["Balance per Card (Qty)"])||0;
return s+(uv*qty);
},0);

const totalQty=data.reduce((s,row)=>
s+
(
Number(row["On Hand Per Count (Qty)"])
||
Number(row["Balance per Card (Qty)"])
||
0
),0);

return(
<div style={{padding:20,fontFamily:"Arial"}}>

<h1>AIS Inventory Dashboard</h1>

<div style={grid}>
<StatCard title="Total Inventory Value"
value={`₱${totalValue.toLocaleString()}`}/>
<StatCard title="Total Articles"
value={Object.keys(articleDeviceSummary).length}/>
<StatCard title="Total Quantity"
value={totalQty}/>
</div>

<h2 style={{marginTop:"30px"}}>
Article Breakdown
</h2>

{
Object.entries(articleDeviceSummary)
.map(([article,devices])=>(

<div key={article}>

<h3 style={{marginTop:"25px"}}>{article}</h3>

<div style={ictGrid}>
{
Object.entries(devices)
.sort((a,b)=>b[1].value-a[1].value)
.map(([type,val])=>(
<ICTCard
key={type}
title={type}
qty={val.qty}
value={val.value}
serviceable={val.serviceable}
defective={val.defective}
unserviceable={val.unserviceable}
/>
))
}
</div>

</div>
))
}

<input
style={searchBox}
placeholder="Search inventory..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
/>

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
{filtered.map((row,i)=>(
<tr key={i}>
{columns.map(c=>(
<td key={c} style={td}>{row[c]??""}</td>
))}
</tr>
))}
</tbody>
</table>
</div>

</div>
);
}

const StatCard=({title,value})=>(
<div style={{
background:"linear-gradient(135deg,#6366F1,#9333EA)",
color:"#fff",
padding:"18px",
borderRadius:"16px",
boxShadow:"0 6px 16px rgba(0,0,0,.15)"
}}>
<div style={{fontSize:13}}>{title}</div>
<div style={{fontSize:26,fontWeight:"bold"}}>{value}</div>
</div>
);

const ICTCard=({title,qty,value,
serviceable,defective,unserviceable})=>(

<div style={{
background:"linear-gradient(135deg,#6366F1,#9333EA)",
color:"white",
padding:"18px",
borderRadius:"16px",
boxShadow:"0 6px 16px rgba(0,0,0,.15)",
minHeight:"150px"
}}>

<div style={{fontSize:"14px"}}>{title}</div>

<div style={{fontSize:"22px",fontWeight:"bold"}}>
{qty} Units
</div>

<div style={{fontSize:"14px"}}>
₱{value.toLocaleString()}
</div>

<div style={{marginTop:"8px",
fontSize:"12px",
lineHeight:"18px"}}>

<div><b>Serviceable:</b> {serviceable}</div>
<div><b>Needs Repair (Defective):</b> {defective}</div>
<div><b>For Disposal (Unserviceable):</b> {unserviceable}</div>

</div>

</div>
);

const grid={
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",
gap:16,
marginBottom:24
};

const ictGrid={
display:"grid",
gridTemplateColumns:
"repeat(auto-fit,minmax(220px,1fr))",
gap:18,
marginBottom:30
};

const table={width:"100%",borderCollapse:"collapse"};
const th={border:"1px solid #999",padding:6};
const td={border:"1px solid #ccc",padding:6};

const searchBox={
padding:10,
width:"100%",
marginBottom:12
};

export default App;
import { useState, useMemo, useRef, useEffect } from "react";
import * as XLSX from "xlsx"; // requires: pnpm add xlsx
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceArea, Legend,
} from "recharts";

// ── Shared Brand ────────────────────────────────────────────────
const BRAND = {
  blue:"#1d4ed8", cyan:"#06b6d4", green:"#059669", purple:"#7c3aed",
  orange:"#d97706", red:"#dc2626", grey:"#f8fafc", border:"#e2e8f0",
  text:"#0f172a", sub:"#64748b", light:"#94a3b8",
};

const INDUSTRIES = ["Food & Beverage","Pharmaceuticals","Oil & Gas","Chemicals","Automotive","Steel & Metals","Cement","Paper & Pulp","Water Treatment","Other"];
const PLANT_SIZES = ["Small (< 50 assets)","Medium (50–200 assets)","Large (200–500 assets)","Enterprise (500+ assets)"];

// ================================================================
//  SECTION 1 — AI AGENTS (Maintenance, Energy, Quality)
// ================================================================
const MAINT_ASSETS = [
  { id:"P-101", name:"Centrifugal Pump", location:"Line A", failure:"Bearing Wear (Gradual)", color:BRAND.blue,
    sensors:["vibration","temperature","pressure"],
    thresholds:{ vibration:{warn:3.5,crit:5.0}, temperature:{warn:82,crit:92}, pressure:{warn:3.2,crit:2.8} },
    units:{ vibration:"mm/s", temperature:"°C", pressure:"bar" },
    failureStart:480, failureCrit:600,
    agentData:{ anomalyScore:0.94, confidence:94, historicalMatches:847,
      rootCause:"Inner race bearing degradation — vibration pattern matches 94% of past bearing failures across 847 historical records",
      recommendations:[
        { priority:"CRITICAL", action:"Schedule immediate bearing replacement within 12 hours", saving:420000, urgency:"< 12 hrs", confidence:94, icon:"🔴" },
        { priority:"HIGH", action:"Reduce pump load by 15% to extend RUL by ~8 days", saving:180000, urgency:"< 24 hrs", confidence:88, icon:"🟠" },
        { priority:"HIGH", action:"Alert maintenance team and order spare bearing kit", saving:95000, urgency:"< 6 hrs", confidence:97, icon:"🟠" },
        { priority:"MEDIUM", action:"Increase vibration monitoring frequency to every 15 min", saving:40000, urgency:"< 2 hrs", confidence:91, icon:"🟡" },
      ],
    },
  },
  { id:"C-204", name:"Compressor Unit", location:"Line B", failure:"Surge Event (Sudden)", color:BRAND.purple,
    sensors:["vibration","temperature","pressure"],
    thresholds:{ vibration:{warn:4.0,crit:6.5}, temperature:{warn:88,crit:98}, pressure:{warn:7.5,crit:6.8} },
    units:{ vibration:"mm/s", temperature:"°C", pressure:"bar" },
    failureStart:504, failureCrit:648,
    agentData:{ anomalyScore:0.71, confidence:71, historicalMatches:312,
      rootCause:"Surge precursor pattern detected — pressure fluctuation combined with vibration spikes matches 71% of compressor surge events",
      recommendations:[
        { priority:"HIGH", action:"Inspect inlet guide vanes and anti-surge valve", saving:180000, urgency:"< 48 hrs", confidence:71, icon:"🟠" },
        { priority:"HIGH", action:"Verify operating point is within stable surge envelope", saving:120000, urgency:"< 24 hrs", confidence:78, icon:"🟠" },
        { priority:"MEDIUM", action:"Review process flow conditions and adjust setpoints", saving:60000, urgency:"< 72 hrs", confidence:65, icon:"🟡" },
      ],
    },
  },
  { id:"M-312", name:"Drive Motor", location:"Line C", failure:"Overheating (Thermal Drift)", color:BRAND.green,
    sensors:["vibration","temperature","current"],
    thresholds:{ vibration:{warn:2.8,crit:4.5}, temperature:{warn:90,crit:105}, current:{warn:48,crit:55} },
    units:{ vibration:"mm/s", temperature:"°C", current:"A" },
    failureStart:360, failureCrit:576,
    agentData:{ anomalyScore:0.55, confidence:55, historicalMatches:198,
      rootCause:"Thermal drift pattern — gradual temperature rise with increased current draw suggests insulation degradation or cooling system blockage",
      recommendations:[
        { priority:"MEDIUM", action:"Inspect cooling system and clean air vents", saving:95000, urgency:"< 5 days", confidence:55, icon:"🟡" },
        { priority:"MEDIUM", action:"Check motor insulation resistance (Megger test)", saving:60000, urgency:"< 3 days", confidence:62, icon:"🟡" },
        { priority:"LOW", action:"Schedule thermal imaging scan at next maintenance window", saving:30000, urgency:"< 2 weeks", confidence:48, icon:"🟢" },
      ],
    },
  },
];
const ENERGY_ASSETS = [
  { id:"EL-01", name:"Production Line 1", location:"Zone A", type:"High Consumption", color:BRAND.orange,
    agentData:{ anomalyScore:0.87, confidence:87, historicalMatches:623,
      rootCause:"Line 1 consuming 34% above baseline during off-peak hours — motors running at idle, compressed air leaks detected, and inefficient heat recovery contributing to ₹2.1L monthly excess cost",
      kpis:{ consumption:"48,200 kWh", cost:"₹14.5L/mo", efficiency:"64%", peakDemand:"210 kW" },
      recommendations:[
        { priority:"HIGH", action:"Implement auto-shutdown for idle motors during shift breaks", saving:840000, urgency:"< 48 hrs", confidence:87, icon:"🟠" },
        { priority:"HIGH", action:"Fix compressed air leak on conveyor section C3", saving:420000, urgency:"< 24 hrs", confidence:92, icon:"🟠" },
        { priority:"MEDIUM", action:"Optimise heat recovery exchanger settings for 12% efficiency gain", saving:310000, urgency:"< 1 week", confidence:79, icon:"🟡" },
        { priority:"MEDIUM", action:"Shift 3 non-critical loads to off-peak tariff window (11pm–6am)", saving:260000, urgency:"< 3 days", confidence:83, icon:"🟡" },
      ],
    },
  },
  { id:"EL-02", name:"Production Line 2", location:"Zone B", type:"Moderate Consumption", color:BRAND.cyan,
    agentData:{ anomalyScore:0.62, confidence:62, historicalMatches:341,
      rootCause:"Power factor degrading to 0.74 — below optimal 0.95 threshold. Ageing capacitor banks causing reactive power draw penalty of ₹0.8L/month from utility",
      kpis:{ consumption:"31,800 kWh", cost:"₹9.6L/mo", efficiency:"78%", peakDemand:"145 kW" },
      recommendations:[
        { priority:"HIGH", action:"Replace capacitor bank on Panel B-2 to restore power factor to 0.95+", saving:320000, urgency:"< 1 week", confidence:88, icon:"🟠" },
        { priority:"MEDIUM", action:"Install energy sub-metering on 4 sub-circuits for granular monitoring", saving:180000, urgency:"< 2 weeks", confidence:71, icon:"🟡" },
        { priority:"LOW", action:"Upgrade 6 legacy fluorescent fixtures to LED in production area", saving:95000, urgency:"< 1 month", confidence:95, icon:"🟢" },
      ],
    },
  },
  { id:"EL-03", name:"Utilities Block", location:"Zone C", type:"Peak Demand", color:BRAND.green,
    agentData:{ anomalyScore:0.45, confidence:45, historicalMatches:189,
      rootCause:"Peak demand spikes of 280 kW detected on 8 occasions last month — primary driver is simultaneous HVAC startup at shift change. Demand charge penalty averaging ₹1.2L/month",
      kpis:{ consumption:"18,400 kWh", cost:"₹5.5L/mo", efficiency:"82%", peakDemand:"280 kW" },
      recommendations:[
        { priority:"MEDIUM", action:"Stagger HVAC startup by 15-min intervals to reduce peak demand by 40 kW", saving:480000, urgency:"< 1 week", confidence:82, icon:"🟡" },
        { priority:"LOW", action:"Install demand controller to cap peak at 220 kW automatically", saving:360000, urgency:"< 1 month", confidence:74, icon:"🟢" },
        { priority:"LOW", action:"Evaluate battery storage (50 kWh) for peak shaving ROI", saving:240000, urgency:"< 3 months", confidence:61, icon:"🟢" },
      ],
    },
  },
];
const QUALITY_ASSETS = [
  { id:"QP-01", name:"Filling Line A", location:"Unit 1", type:"Defect Risk: High", color:BRAND.red,
    agentData:{ anomalyScore:0.91, confidence:91, historicalMatches:534,
      rootCause:"Fill weight drift detected — mean shifting +2.3% above nominal over last 48 batches. Temperature variance in sealing zone causing 3.2% seal failure rate and batch rejection risk",
      kpis:{ defectRate:"3.2%", batchScore:"61/100", driftIndex:"High", oosAlerts:7 },
      recommendations:[
        { priority:"CRITICAL", action:"Recalibrate fill nozzle #3 and #7 — showing 4.1% overfill deviation", saving:680000, urgency:"< 4 hrs", confidence:91, icon:"🔴" },
        { priority:"HIGH", action:"Reduce sealing zone temperature variance — tighten PID control loop", saving:420000, urgency:"< 8 hrs", confidence:87, icon:"🟠" },
        { priority:"HIGH", action:"Hold current batch BT-2847 for 100% inspection before dispatch", saving:380000, urgency:"Immediate", confidence:93, icon:"🟠" },
        { priority:"MEDIUM", action:"Increase SPC sampling frequency from every 30 to every 10 mins", saving:210000, urgency:"< 2 hrs", confidence:85, icon:"🟡" },
      ],
    },
  },
  { id:"QP-02", name:"Mixing Station B", location:"Unit 2", type:"Process Drift: Medium", color:BRAND.orange,
    agentData:{ anomalyScore:0.68, confidence:68, historicalMatches:298,
      rootCause:"Viscosity drifting upward over 6-hour cycle — likely raw material batch variation from Supplier 2. pH readings showing ±0.4 variance against ±0.1 spec",
      kpis:{ defectRate:"1.8%", batchScore:"74/100", driftIndex:"Medium", oosAlerts:3 },
      recommendations:[
        { priority:"HIGH", action:"Adjust mixing RPM from 180 to 165 to compensate viscosity drift", saving:290000, urgency:"< 2 hrs", confidence:74, icon:"🟠" },
        { priority:"MEDIUM", action:"Quarantine Supplier 2 raw material lot and run incoming QC test", saving:240000, urgency:"< 4 hrs", confidence:81, icon:"🟡" },
        { priority:"MEDIUM", action:"Recalibrate pH probe — last calibration was 18 days ago", saving:160000, urgency:"< 6 hrs", confidence:88, icon:"🟡" },
      ],
    },
  },
  { id:"QP-03", name:"Packaging Unit C", location:"Unit 3", type:"Batch Score: Good", color:BRAND.green,
    agentData:{ anomalyScore:0.32, confidence:32, historicalMatches:142,
      rootCause:"Minor label placement drift detected — 0.8mm average offset trending over last 200 units. Within spec currently but trajectory suggests OOS condition within ~4 hours",
      kpis:{ defectRate:"0.4%", batchScore:"88/100", driftIndex:"Low", oosAlerts:1 },
      recommendations:[
        { priority:"MEDIUM", action:"Adjust label applicator guide rail by 0.8mm — preventive correction", saving:120000, urgency:"< 4 hrs", confidence:76, icon:"🟡" },
        { priority:"LOW", action:"Schedule applicator head cleaning at next planned break", saving:60000, urgency:"< 8 hrs", confidence:82, icon:"🟢" },
        { priority:"LOW", action:"Review camera inspection sensitivity threshold — may need recalibration", saving:40000, urgency:"< 1 day", confidence:58, icon:"🟢" },
      ],
    },
  },
];

const AGENT_PIPELINE_STEPS = {
  maintenance:[
    { id:"observe", label:"Observe", icon:"👁", color:BRAND.blue },
    { id:"detect", label:"Detect", icon:"🔍", color:BRAND.purple },
    { id:"reason", label:"Reason", icon:"🧠", color:BRAND.orange },
    { id:"recommend", label:"Recommend", icon:"📋", color:BRAND.green },
    { id:"act", label:"Act", icon:"⚡", color:BRAND.red },
  ],
  energy:[
    { id:"meter", label:"Meter", icon:"📊", color:BRAND.orange },
    { id:"baseline", label:"Baseline", icon:"📉", color:BRAND.cyan },
    { id:"detect", label:"Detect", icon:"🔍", color:BRAND.purple },
    { id:"optimise", label:"Optimise", icon:"⚙️", color:BRAND.green },
    { id:"save", label:"Save", icon:"💰", color:BRAND.blue },
  ],
  quality:[
    { id:"inspect", label:"Inspect", icon:"🔬", color:BRAND.red },
    { id:"drift", label:"Drift", icon:"📈", color:BRAND.orange },
    { id:"root", label:"Root Cause", icon:"🧠", color:BRAND.purple },
    { id:"correct", label:"Correct", icon:"✅", color:BRAND.green },
    { id:"prevent", label:"Prevent", icon:"🛡", color:BRAND.blue },
  ],
};

const AGENT_PIPELINE_DESC = {
  maintenance:{ observe:"Real-time sensor ingestion · 720hrs history · Multi-sensor fusion", detect:"ML anomaly scoring 0–1 · Confidence calibration · Pattern fingerprinting", reason:"847+ historical matches · Root cause inference · RUL estimation", recommend:"Priority ranked actions · Urgency windows · Step-by-step guidance", act:"Cost saving estimates · Downtime prevention · ROI calculation" },
  energy:{ meter:"Real-time kWh metering · Power factor monitoring · Demand tracking", baseline:"30-day rolling baseline · Shift-pattern normalisation · Benchmark vs industry", detect:"Consumption anomaly scoring · Peak demand alerts · Efficiency degradation", optimise:"Load scheduling · Motor efficiency tuning · Heat recovery", save:"Cost saving quantification · Carbon reduction · ROI reporting" },
  quality:{ inspect:"In-line sensor fusion · Vision system data · SPC chart monitoring", drift:"Process drift detection · Mean shift analysis · OOS prediction", root:"Multi-variate root cause · Supplier traceability · Batch matching", correct:"Corrective action generation · Parameter adjustment · Operator alert", prevent:"SPC limit optimisation · Supplier quality scoring · Yield improvement" },
};

const pColor = { CRITICAL:BRAND.red, HIGH:"#f97316", MEDIUM:BRAND.orange, LOW:BRAND.green };
const pBg = { CRITICAL:"#fff5f5", HIGH:"#fff7ed", MEDIUM:"#fffbeb", LOW:"#f0fdf4" };

function genMaintData(asset) {
  const d = [];
  for (let h = 0; h < 720; h++) {
    let row = { hour:h, label:`D${Math.floor(h/24)+1}` };
    if (asset.id==="P-101") {
      const w = h>=asset.failureStart ? Math.pow((h-asset.failureStart)/240,1.6)*4 : 0;
      row.vibration = +(2.0+Math.sin(h*0.25)*0.3+w+Math.random()*0.25).toFixed(2);
      row.temperature = +(72+Math.cos(h*0.18)*2.5+w*3.5+Math.random()*1.2).toFixed(1);
    } else if (asset.id==="C-204") {
      const s = h>=asset.failureStart&&h<=asset.failureStart+18 ? Math.sin(((h-asset.failureStart)/18)*Math.PI)*5 : 0;
      row.vibration = +(2.8+Math.sin(h*0.3)*0.4+s+Math.random()*0.3).toFixed(2);
      row.temperature = +(78+Math.sin(h*0.2)*3+s*2.2+Math.random()*1.5).toFixed(1);
    } else {
      const drift = h>=asset.failureStart ? ((h-asset.failureStart)/360)*22 : 0;
      row.vibration = +(1.8+Math.sin(h*0.22)*0.3+drift*0.04+Math.random()*0.2).toFixed(2);
      row.temperature = +(75+drift+Math.sin(h*0.1)*2+Math.random()*1.8).toFixed(1);
    }
    let score = 100;
    asset.sensors.forEach(s => {
      const val = row[s]||0; const {warn,crit} = asset.thresholds[s];
      if(s==="pressure"){if(val<crit)score-=35;else if(val<warn)score-=15;}
      else{if(val>=crit)score-=35;else if(val>=warn)score-=15;}
    });
    row.health = Math.max(0,Math.min(100,score));
    d.push(row);
  }
  return d;
}

function genEnergyData(asset) {
  const d = []; const base = asset.id==="EL-01"?1800:asset.id==="EL-02"?1200:700;
  for (let h = 0; h < 720; h++) {
    const shift = h%24>=8&&h%24<=17; const waste = asset.id==="EL-01"?(h%24<6||h%24>22?0.34:0.08):0.05;
    d.push({ hour:h, label:`D${Math.floor(h/24)+1}`, consumption:+(base*(shift?1.2:0.7)*(1+waste)+Math.random()*50).toFixed(0), efficiency:+(100-waste*100-Math.random()*5).toFixed(1) });
  }
  return d;
}

function genQualityData(asset) {
  const d = []; const baseDefect = asset.id==="QP-01"?2.8:asset.id==="QP-02"?1.4:0.3;
  for (let b = 0; b < 100; b++) {
    const drift = b>60?(b-60)*0.04:0;
    d.push({ batch:`B${b+1}`, batchNum:b, defectRate:+(baseDefect+drift+Math.random()*0.6).toFixed(2), batchScore:Math.max(0,Math.min(100,Math.round(95-drift*8-Math.random()*8))) });
  }
  return d;
}

function AgentCard({ asset, state, step, msgs, chartData, chartKey, chartColor, thresholdY, onRun, onReset, onViewActions, kpiItems }) {
  return (
    <div style={{background:"#fff",border:`2px solid ${state==="done"?asset.color:BRAND.border}`,borderRadius:12,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.05)",transition:"border-color 0.3s"}}>
      <div style={{padding:"14px 18px",borderBottom:`3px solid ${asset.color}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontFamily:"Inter,sans-serif",fontSize:15,fontWeight:800,color:BRAND.text}}>{asset.id} · {asset.name}</div>
          <div style={{fontSize:11,color:BRAND.sub}}>{asset.location} · {asset.type||asset.failure}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"Inter,sans-serif",fontSize:17,fontWeight:800,color:asset.agentData.anomalyScore>0.8?BRAND.red:asset.agentData.anomalyScore>0.6?BRAND.orange:BRAND.green}}>{(asset.agentData.anomalyScore*100).toFixed(0)}</div>
          <div style={{fontSize:10,color:BRAND.light}}>Anomaly Score</div>
        </div>
      </div>
      <div style={{padding:"8px 12px 0",background:"#fafafa"}}>
        <ResponsiveContainer width="100%" height={55}>
          <LineChart data={chartData} margin={{top:2,right:4,bottom:2,left:0}}>
            <Line type="monotone" dataKey={chartKey} stroke={chartColor||asset.color} strokeWidth={1.5} dot={false}/>
            {thresholdY&&<ReferenceLine y={thresholdY} stroke={BRAND.red} strokeDasharray="3 2" strokeWidth={1}/>}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{padding:"8px 16px",borderTop:`1px solid ${BRAND.border}`,borderBottom:`1px solid ${BRAND.border}`,display:"flex",gap:8}}>
        {kpiItems.map((k,i)=>(
          <div key={i} style={{flex:1,background:BRAND.grey,borderRadius:8,padding:"5px 8px",textAlign:"center"}}>
            <div style={{fontSize:9,color:BRAND.light}}>{k.label}</div>
            <div style={{fontSize:12,fontWeight:800,color:k.color||asset.color,marginTop:1}}>{k.value}</div>
          </div>
        ))}
      </div>
      <div style={{padding:"10px 16px"}}>
        <div style={{display:"flex",gap:3,marginBottom:8}}>
          {AGENT_PIPELINE_STEPS[asset._agentType||"maintenance"].map((ps,i)=>(
            <div key={ps.id} style={{flex:1,textAlign:"center"}}>
              <div style={{width:"100%",height:4,borderRadius:2,background:i<=step&&state!=="idle"?ps.color:BRAND.border,transition:"background 0.4s",marginBottom:2}}/>
              <div style={{fontSize:8,color:i<=step&&state!=="idle"?ps.color:BRAND.light,fontWeight:600}}>{ps.icon} {ps.label}</div>
            </div>
          ))}
        </div>
        <div style={{minHeight:48,marginBottom:8}}>
          {msgs.map((m,i)=>(<div key={i} style={{fontSize:11,padding:"5px 8px",background:"#f1f5f9",borderRadius:5,marginBottom:4,borderLeft:`3px solid ${asset.color}`,color:i===msgs.length-1?BRAND.text:"#94a3b8",lineHeight:1.5}}>{m}</div>))}
          {state==="running"&&<div style={{fontSize:11,color:BRAND.light,display:"flex",alignItems:"center",gap:5}}><span style={{animation:"pulse 1.5s infinite"}}>●</span> Agent processing...</div>}
        </div>
        <div style={{display:"flex",gap:6}}>
          {state!=="running"&&(<button onClick={onRun} style={{flex:1,padding:"8px",background:state==="done"?BRAND.grey:`linear-gradient(135deg,${asset.color},${asset.color}dd)`,color:state==="done"?BRAND.sub:"#fff",border:"none",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>{state==="done"?"▶ Re-run":"▶ Run Agent"}</button>)}
          {state==="done"&&(<button onClick={onViewActions} style={{flex:1,padding:"8px",background:asset.color,color:"#fff",border:"none",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>📋 Actions</button>)}
          {state!=="idle"&&(<button onClick={onReset} style={{padding:"8px 10px",background:BRAND.grey,color:BRAND.sub,border:"none",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer"}}>✕</button>)}
        </div>
      </div>
    </div>
  );
}

// ================================================================
//  SECTION 2 — ASSET DASHBOARD
// ================================================================
const DASH_ASSETS = [
  { id:"P-101", name:"Centrifugal Pump", type:"Pump", location:"Line A", failure:"Bearing Wear (Gradual)", sensors:["vibration","temperature","pressure"], thresholds:{ vibration:{warn:3.5,crit:5.0}, temperature:{warn:82,crit:92}, pressure:{warn:3.2,crit:2.8} }, units:{ vibration:"mm/s", temperature:"°C", pressure:"bar" }, color:"#1d4ed8", failureStart:480, failureCrit:600, downtimeRisk:18, costRisk:420000 },
  { id:"C-204", name:"Compressor Unit", type:"Compressor", location:"Line B", failure:"Surge Event (Sudden)", sensors:["vibration","temperature","pressure"], thresholds:{ vibration:{warn:4.0,crit:6.5}, temperature:{warn:88,crit:98}, pressure:{warn:7.5,crit:6.8} }, units:{ vibration:"mm/s", temperature:"°C", pressure:"bar" }, color:"#7c3aed", failureStart:504, failureCrit:648, downtimeRisk:6, costRisk:180000 },
  { id:"M-312", name:"Drive Motor", type:"Motor", location:"Line C", failure:"Overheating (Thermal Drift)", sensors:["vibration","temperature","current"], thresholds:{ vibration:{warn:2.8,crit:4.5}, temperature:{warn:90,crit:105}, current:{warn:48,crit:55} }, units:{ vibration:"mm/s", temperature:"°C", current:"A" }, color:"#059669", failureStart:360, failureCrit:576, downtimeRisk:4, costRisk:95000 },
];

function genDashData(asset, hours=720) {
  const data = [];
  for (let h = 0; h < hours; h++) {
    const day = Math.floor(h/24)+1; const label = `D${day}`;
    let row = { hour:h, label, day };
    if (asset.id==="P-101") {
      const wear = h>=asset.failureStart ? Math.pow((h-asset.failureStart)/(hours-asset.failureStart),1.6)*4.0 : 0;
      row.vibration = +(2.0+Math.sin(h*0.25)*0.3+wear+Math.random()*0.25).toFixed(2);
      row.temperature = +(72+Math.cos(h*0.18)*2.5+wear*3.5+Math.random()*1.2).toFixed(1);
      row.pressure = +(4.5-wear*0.5+Math.sin(h*0.12)*0.2+Math.random()*0.15).toFixed(2);
    } else if (asset.id==="C-204") {
      const isSurge1 = h>=asset.failureStart&&h<=asset.failureStart+18;
      const s = isSurge1 ? Math.sin(((h-asset.failureStart)/18)*Math.PI)*5.0 : 0;
      row.vibration = +(2.8+Math.sin(h*0.3)*0.4+s+Math.random()*0.3).toFixed(2);
      row.temperature = +(78+Math.sin(h*0.2)*3+s*2.2+Math.random()*1.5).toFixed(1);
      row.pressure = +(8.5+Math.cos(h*0.15)*0.5-s*0.8+Math.random()*0.2).toFixed(2);
    } else {
      const drift = h>=asset.failureStart ? ((h-asset.failureStart)/(hours-asset.failureStart))*22 : 0;
      row.vibration = +(1.8+Math.sin(h*0.22)*0.3+drift*0.04+Math.random()*0.2).toFixed(2);
      row.temperature = +(75+drift+Math.sin(h*0.1)*2+Math.random()*1.8).toFixed(1);
      row.current = +(38+drift*0.7+Math.cos(h*0.3)*1.5+Math.random()*1.2).toFixed(1);
    }
    let score = 100;
    asset.sensors.forEach(s => {
      const val = row[s]; const {warn,crit} = asset.thresholds[s];
      if(s==="pressure"){if(val<crit)score-=35;else if(val<warn)score-=15;}
      else{if(val>=crit)score-=35;else if(val>=warn)score-=15;}
    });
    row.health = Math.max(0,Math.min(100,score));
    row.rul = Math.max(0,Math.round(((720-h)*(1-((100-row.health)/100)*0.6))/24));
    data.push(row);
  }
  return data;
}

const DashStatusBadge = ({ health }) => {
  const [color,label] = health>=75?["#059669","HEALTHY"]:health>=45?["#d97706","DEGRADING"]:["#dc2626","CRITICAL"];
  return <span style={{background:`${color}15`,color,border:`1px solid ${color}40`,borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:700,letterSpacing:0.8}}>{label}</span>;
};

const DashTooltip = ({ active, payload, label, units }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:"10px 14px",boxShadow:"0 4px 12px rgba(0,0,0,0.1)",fontSize:12}}>
      <div style={{color:"#64748b",marginBottom:6,fontWeight:600}}>{label}</div>
      {payload.map((p,i)=>(<div key={i} style={{color:p.color,fontWeight:600}}>{p.name}: {p.value} {units?.[p.name]||""}</div>))}
    </div>
  );
};

// ================================================================
//  SECTION 3 — BUSINESS VALUE & ROI
// ================================================================
const ROI_DEFAULTS = { monthlyDowntimeHrs:18, downtimeCostPerHr:85000, monthlyMaintCost:2800000, energyCostMonthly:420000, implementationCost:1800000 };
const ROI_IMPROVEMENTS = { downtimeReduction:0.75, maintCostReduction:0.38, energySavings:0.12 };
const BEFORE_AFTER = [
  { metric:"Unplanned Downtime", before:"18 hrs/month", after:"4.5 hrs/month", improvement:"75% reduction", color:"#1d4ed8", icon:"⏱" },
  { metric:"Maintenance Cost", before:"₹28L/month", after:"₹17.4L/month", improvement:"₹10.6L saved", color:"#059669", icon:"💰" },
  { metric:"Asset Utilization", before:"71%", after:"89%", improvement:"+18% uplift", color:"#7c3aed", icon:"⚙️" },
  { metric:"Mean Time Between Failures", before:"22 days", after:"61 days", improvement:"2.8× improvement", color:"#d97706", icon:"📈" },
  { metric:"Energy Cost", before:"₹4.2L/month", after:"₹3.7L/month", improvement:"12% reduction", color:"#dc2626", icon:"⚡" },
  { metric:"Emergency Work Orders", before:"12/month", after:"3/month", improvement:"75% reduction", color:"#0891b2", icon:"🔧" },
];

const ValueTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:"10px 14px",fontSize:12}}>
      <div style={{color:"#64748b",marginBottom:6,fontWeight:600}}>{label}</div>
      {payload.map((p,i)=>(<div key={i} style={{color:p.color,fontWeight:600}}>{p.name}: {typeof p.value==="number"?`₹${(p.value/100000).toFixed(1)}L`:p.value}</div>))}
    </div>
  );
};

const RoiSlider = ({ label, value, min, max, step, unit, onChange, color }) => (
  <div style={{marginBottom:14}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
      <span style={{fontSize:12,color:"#475569",fontWeight:600}}>{label}</span>
      <span style={{fontSize:12,fontWeight:800,color}}>{unit==="₹"?`₹${(value/100000).toFixed(1)}L`:`${value}${unit}`}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))} style={{width:"100%",accentColor:color,cursor:"pointer"}}/>
  </div>
);

// ================================================================
//  SECTION 4 — DEMO OVERVIEW
// ================================================================
const DEMO_ASSETS = [
  { id:"P-101", name:"Centrifugal Pump", location:"Line A", rul:12, health:34, status:"critical", vibration:5.8, temp:94, pressure:3.1 },
  { id:"C-204", name:"Compressor Unit",  location:"Line B", rul:38, health:67, status:"warning",  vibration:3.2, temp:81, pressure:3.9 },
  { id:"M-312", name:"Drive Motor",      location:"Line C", rul:85, health:91, status:"normal",   vibration:1.8, temp:71, pressure:4.3 },
  { id:"HX-055",name:"Heat Exchanger",   location:"Line A", rul:61, health:78, status:"normal",   vibration:2.1, temp:76, pressure:4.1 },
];
const DEMO_RECS = [
  { asset:"P-101", priority:"CRITICAL", action:"Schedule immediate bearing replacement", saving:"₹4.2L downtime prevented", icon:"🔴" },
  { asset:"P-101", priority:"HIGH",     action:"Reduce load by 15% until maintenance",  saving:"Extends RUL by ~8 days",   icon:"🟠" },
  { asset:"C-204", priority:"MEDIUM",   action:"Inspect shaft alignment & lubrication", saving:"₹1.8L cost avoidance",     icon:"🟡" },
  { asset:"C-204", priority:"MEDIUM",   action:"Schedule vibration analysis next week", saving:"Prevents escalation",      icon:"🟡" },
];
const DEMO_KPIS = [
  { label:"Downtime Prevented", value:"23 hrs",  sub:"This month",          color:"#0891b2", icon:"⏱" },
  { label:"Cost Savings",       value:"₹18.4L",  sub:"Vs reactive maint.",  color:"#059669", icon:"💰" },
  { label:"Assets Monitored",   value:"4 / 4",   sub:"100% coverage",       color:"#7c3aed", icon:"📡" },
  { label:"Alerts Resolved",    value:"7 / 9",   sub:"78% resolution rate", color:"#d97706", icon:"✅" },
];
const genSensorData = () => {
  const data = [];
  for (let i = 0; i < 72; i++) {
    const anom = i>=52; const crit = i>=62;
    data.push({ hour:`${Math.floor(i/24)}d ${i%24}h`, vibration:+(2.1+Math.sin(i*0.3)*0.4+(anom?(i-52)*0.18:0)+Math.random()*0.3).toFixed(2), temperature:+(68+Math.cos(i*0.2)*3+(anom?(i-52)*0.6:0)+Math.random()*1.5).toFixed(1), rul:Math.max(0,100-i*0.8-(anom?(i-52)*1.2:0)), status:crit?"critical":anom?"warning":"normal" });
  }
  return data;
};
const sensorData = genSensorData();

const DemoStatusBadge = ({ status }) => {
  const cfg = { critical:["#fef2f2","#ef4444","CRITICAL"], warning:["#fffbeb","#f59e0b","WARNING"], normal:["#f0fdf4","#22c55e","NORMAL"] };
  const [bg,color,label] = cfg[status];
  return <span style={{background:bg,color,border:`1px solid ${color}`,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700,letterSpacing:1}}>{label}</span>;
};

const DemoHealthRing = ({ value, status }) => {
  const color = status==="critical"?"#ef4444":status==="warning"?"#f59e0b":"#0891b2";
  const r=28, c=2*Math.PI*r, offset=c-(value/100)*c;
  return (
    <svg width="60" height="60" viewBox="0 0 70 70">
      <circle cx="35" cy="35" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6"/>
      <circle cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 35 35)" style={{transition:"stroke-dashoffset 1s ease"}}/>
      <text x="35" y="40" textAnchor="middle" fill={color} fontSize="13" fontWeight="bold">{value}%</text>
    </svg>
  );
};


// ================================================================
//  UPLOAD MODAL — Per Asset Excel Upload
// ================================================================
const ASSET_TYPE_LABELS = {
  "P-101":"Pump", "C-204":"Compressor", "M-312":"Motor"
};

function UploadModal({ asset, onClose, onUpload }) {
  const [status, setStatus] = useState("idle"); // idle | parsing | success | error
  const [errMsg, setErrMsg] = useState("");
  const [parsedRows, setParsedRows] = useState(0);
  const fileRef = useRef(null);

  const downloadTemplate = () => {
    const sensorCols = asset.sensors.map(s => `${s} (${asset.units[s]})`);
    const headers = ["Hour", ...sensorCols];
    const rows = Array.from({length:72}, (_, i) => [i, ...asset.sensors.map(() => "")]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(() => ({wch:18}));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SensorData");
    XLSX.writeFile(wb, `${asset.id}_${ASSET_TYPE_LABELS[asset.id]||"asset"}_template.xlsx`);
  };

  const parseFile = (file) => {
    if (!file) return;
    setStatus("parsing"); setErrMsg("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), {type:"array"});
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);
        if (!json.length) throw new Error("No data rows found in the file.");
        // Normalise keys to lowercase
        const normalised = json.map(row => {
          const out = {};
          Object.keys(row).forEach(k => {
            const clean = k.toLowerCase().split(" ")[0].split("(")[0].trim();
            out[clean] = parseFloat(row[k]) || row[k];
          });
          return out;
        });
        setParsedRows(normalised.length);
        onUpload(asset.id, normalised);
        setStatus("success");
      } catch(err) {
        setStatus("error");
        setErrMsg(err.message || "Failed to parse file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:16,padding:"28px 28px",width:"100%",maxWidth:480,boxShadow:"0 24px 64px rgba(0,0,0,0.25)",fontFamily:"Inter,sans-serif"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{fontFamily:"Inter,sans-serif",fontSize:17,fontWeight:800,color:"#0f172a"}}>📤 Upload Your Data</div>
            <div style={{fontSize:12,color:"#64748b",marginTop:3}}>{asset.id} · {asset.name} · {ASSET_TYPE_LABELS[asset.id]||"Asset"}</div>
          </div>
          <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:14,color:"#64748b"}}>✕</button>
        </div>

        {/* Expected format */}
        <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 14px",marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:700,color:"#475569",marginBottom:8}}>📋 Expected Excel Columns</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {["Hour", ...asset.sensors.map(s=>`${s} (${asset.units[s]})`)].map((col,i)=>(
              <span key={i} style={{background:i===0?"#e2e8f0":"#dbeafe",color:i===0?"#475569":"#1d4ed8",borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:600}}>{col}</span>
            ))}
          </div>
          <div style={{fontSize:11,color:"#94a3b8",marginTop:8}}>Rows: 1 per hour · Recommended: 24–720 rows</div>
        </div>

        {/* Template download */}
        <button onClick={downloadTemplate} style={{width:"100%",padding:"10px",background:"#eff6ff",border:"2px dashed #bfdbfe",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:700,color:"#1d4ed8",marginBottom:14,fontFamily:"Inter,sans-serif"}}>
          ⬇ Download Excel Template for {asset.id}
        </button>

        {/* Upload zone */}
        <div
          onDragOver={e=>{e.preventDefault();e.currentTarget.style.background="#eff6ff";}}
          onDragLeave={e=>{e.currentTarget.style.background="#f8fafc";}}
          onDrop={e=>{e.preventDefault();e.currentTarget.style.background="#f8fafc";parseFile(e.dataTransfer.files[0]);}}
          onClick={()=>fileRef.current?.click()}
          style={{background:"#f8fafc",border:"2px dashed #e2e8f0",borderRadius:10,padding:"28px 20px",textAlign:"center",cursor:"pointer",transition:"all 0.2s",marginBottom:14}}>
          <div style={{fontSize:28,marginBottom:8}}>📊</div>
          <div style={{fontSize:13,fontWeight:700,color:"#334155",marginBottom:4}}>Drag & drop your Excel file here</div>
          <div style={{fontSize:12,color:"#94a3b8"}}>or click to browse · .xlsx files only</div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={e=>parseFile(e.target.files?.[0])}/>
        </div>

        {/* Status */}
        {status==="parsing" && <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#92400e",fontWeight:600}}>⏳ Parsing your file...</div>}
        {status==="success" && (
          <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"10px 14px"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#059669",marginBottom:3}}>✅ {parsedRows} rows uploaded successfully!</div>
            <div style={{fontSize:12,color:"#64748b"}}>Go to <strong>📈 Sensor Charts</strong> tab to see your data vs synthetic comparison.</div>
          </div>
        )}
        {status==="error" && <div style={{background:"#fff5f5",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#dc2626",fontWeight:600}}>❌ {errMsg}</div>}
      </div>
    </div>
  );
}

// ================================================================
//  SIGN-IN SCREEN
// ================================================================
function SignInScreen({ onSubmit }) {
  const [form, setForm] = useState({ name:"",company:"",email:"" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const set = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const validate = () => {
    const e = {};
    if(!form.name.trim()) e.name="Required";
    if(!form.company.trim()) e.company="Required";
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email="Valid email required";
    return e;
  };
  const handleSubmit = async () => {
    const e = validate(); if(Object.keys(e).length){setErrors(e);return;}
    setSubmitting(true);
    try {
      await fetch("https://formspree.io/f/xqeywrry",{ method:"POST", headers:{"Content-Type":"application/json","Accept":"application/json"}, body:JSON.stringify({ name:form.name, company:form.company, email:form.email, _subject:`AriLinc Platform Sign-in: ${form.name} — ${form.company}` }) });
    } catch(_){}
    onSubmit(form);
  };
  const inp = key => ({ width:"100%",padding:"11px 14px",borderRadius:8,fontSize:14,border:`1.5px solid ${errors[key]?"#fca5a5":"rgba(255,255,255,0.25)"}`,outline:"none",fontFamily:"Inter,sans-serif",color:"#0f172a",background:"#fff",marginTop:5 });
  const lbl = {fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.75)",letterSpacing:0.3};
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 45%,#3b82f6 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"Inter,sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0;}.lb:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,0,0,0.2);}@media(max-width:480px){.sfc{padding:24px 18px!important;}}`}</style>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:64,height:64,background:"rgba(255,255,255,0.15)",borderRadius:16,marginBottom:16,border:"1px solid rgba(255,255,255,0.25)"}}>
            <span style={{fontSize:28}}>⚡</span>
          </div>
          <div style={{fontFamily:"Inter,sans-serif",fontSize:28,fontWeight:800,color:"#fff",marginBottom:4}}>AriLinc</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",letterSpacing:2,textTransform:"uppercase",fontWeight:600}}>Agentic AI Platform · by AriPrus</div>
        </div>
        <div className="sfc" style={{background:"rgba(255,255,255,0.08)",backdropFilter:"blur(20px)",borderRadius:20,padding:"32px 32px",border:"1px solid rgba(255,255,255,0.18)",boxShadow:"0 24px 64px rgba(0,0,0,0.35)"}}>
          <div style={{fontFamily:"Inter,sans-serif",fontSize:20,fontWeight:800,color:"#fff",marginBottom:4,textAlign:"center"}}>User Sign In</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",textAlign:"center",marginBottom:24}}>Agents · Assets · Value · Overview</div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div><label style={lbl}>Full Name *</label><input style={inp("name")} value={form.name} onChange={set("name")} placeholder="Jane Smith"/>{errors.name&&<div style={{fontSize:11,color:"#fca5a5",marginTop:3}}>{errors.name}</div>}</div>
            <div><label style={lbl}>Company *</label><input style={inp("company")} value={form.company} onChange={set("company")} placeholder="Acme Manufacturing"/>{errors.company&&<div style={{fontSize:11,color:"#fca5a5",marginTop:3}}>{errors.company}</div>}</div>
            <div><label style={lbl}>Work Email *</label><input type="email" style={inp("email")} value={form.email} onChange={set("email")} placeholder="you@company.com"/>{errors.email&&<div style={{fontSize:11,color:"#fca5a5",marginTop:3}}>{errors.email}</div>}</div>
          </div>
          <button className="lb" onClick={handleSubmit} disabled={submitting} style={{width:"100%",marginTop:28,padding:"14px",background:submitting?"rgba(255,255,255,0.15)":"#fff",color:submitting?"rgba(255,255,255,0.4)":"#1d4ed8",border:"none",borderRadius:10,fontSize:15,fontWeight:800,cursor:submitting?"not-allowed":"pointer",fontFamily:"Inter,sans-serif",transition:"all 0.2s"}}>
            {submitting?"⏳ Launching...":"🚀 Launch Platform"}
          </button>
          <div style={{textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:14}}>🔒 Secure · <a href="mailto:info@ariprus.com" style={{color:"rgba(255,255,255,0.6)",textDecoration:"none",fontWeight:600}}>info@ariprus.com</a></div>
        </div>
        <div style={{textAlign:"center",marginTop:18,fontSize:12,color:"rgba(255,255,255,0.25)"}}>© 2026 AriPrus · <a href="https://ariprus.com" style={{color:"rgba(255,255,255,0.45)",textDecoration:"none"}}>ariprus.com</a></div>
      </div>
    </div>
  );
}

// ================================================================
//  MAIN APP
// ================================================================
export default function AriLincPlatform() {
  const [user, setUser] = useState(null);
  const [section, setSection] = useState("assets");

  // ── Upload state ──
  const [uploadedData, setUploadedData] = useState({});
  const [showUpload, setShowUpload] = useState(null); // asset object or null

  // ── Agents state ──
  const [agentType, setAgentType] = useState("maintenance");
  const [agentTab, setAgentTab] = useState("agent");
  const [agentStates, setAgentStates] = useState({});
  const [pipelineStep, setPipelineStep] = useState({});
  const [pipelineMsgs, setPipelineMsgs] = useState({});
  const [selectedAsset, setSelectedAsset] = useState(null);
  const intervalRef = useRef({});
  useEffect(()=>{ const refs=intervalRef.current; return()=>Object.values(refs).forEach(clearInterval); },[]);

  // ── Asset Dashboard state ──
  const [dashTab, setDashTab] = useState("dashboard");
  const [activeSensor, setActiveSensor] = useState("vibration");
  const dashData = useMemo(()=>{ const m={}; DASH_ASSETS.forEach(a=>{m[a.id]=genDashData(a,720);}); return m; },[]);
  const dashLatests = DASH_ASSETS.map(a=>dashData[a.id][dashData[a.id].length-1]);
  const dashPlantHealth = Math.round(dashLatests.reduce((s,l)=>s+l.health,0)/DASH_ASSETS.length);
  const dashAtRisk = dashLatests.filter(l=>l.health<75).length;
  const dashDowntime = DASH_ASSETS.filter((_,i)=>dashLatests[i].health<75).reduce((s,a)=>s+a.downtimeRisk,0);
  const dashCost = DASH_ASSETS.filter((_,i)=>dashLatests[i].health<75).reduce((s,a)=>s+a.costRisk,0);

  // ── Value state ──
  const [valueTab, setValueTab] = useState("overview");
  const [roiInputs, setRoiInputs] = useState(ROI_DEFAULTS);
  const setRoi = k => v => setRoiInputs(p=>({...p,[k]:v}));
  const calc = useMemo(()=>{
    const ds = roiInputs.monthlyDowntimeHrs*ROI_IMPROVEMENTS.downtimeReduction*roiInputs.downtimeCostPerHr;
    const ms = roiInputs.monthlyMaintCost*ROI_IMPROVEMENTS.maintCostReduction;
    const es = roiInputs.energyCostMonthly*ROI_IMPROVEMENTS.energySavings;
    const tm = ds+ms+es; const ta = tm*12;
    const pb = Math.ceil(roiInputs.implementationCost/tm);
    const roi = ((ta*3-roiInputs.implementationCost)/roiInputs.implementationCost*100).toFixed(0);
    const monthly = Array.from({length:12},(_,i)=>({ month:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i], downtime:Math.round(ds*(0.85+Math.random()*0.3)), maintenance:Math.round(ms*(0.88+Math.random()*0.24)), energy:Math.round(es*(0.9+Math.random()*0.2)) }));
    const cumulative = []; let cum=-roiInputs.implementationCost;
    for(let m=0;m<=36;m++){cum+=m===0?0:tm;if(m%3===0)cumulative.push({month:`M${m}`,cumulative:Math.round(cum)});}
    return {ds,ms,es,tm,ta,pb,roi,monthly,cumulative};
  },[roiInputs]);

  // ── Demo state ──
  const [demoSelected, setDemoSelected] = useState(DEMO_ASSETS[0]);
  const [demoTab, setDemoTab] = useState("overview");
  const [demoMsgs, setDemoMsgs] = useState([]);
  const [demoThinking, setDemoThinking] = useState(false);
  const [demoTime, setDemoTime] = useState(new Date().toLocaleTimeString());
  useEffect(()=>{ const t=setInterval(()=>setDemoTime(new Date().toLocaleTimeString()),1000); return()=>clearInterval(t); },[]);

  // Agents helpers
  const agentCurrentAssets = agentType==="maintenance"?MAINT_ASSETS:agentType==="energy"?ENERGY_ASSETS:QUALITY_ASSETS;
  const agentTypeConfig = {
    maintenance:{ icon:"🔧", label:"Maintenance", color:BRAND.blue, desc:"Predict failures · Reduce downtime · Optimise maintenance" },
    energy:{ icon:"⚡", label:"Energy", color:BRAND.orange, desc:"Cut energy costs · Improve efficiency · Reduce carbon" },
    quality:{ icon:"🎯", label:"Quality", color:BRAND.red, desc:"Detect defects · Fix process drift · Improve yield" },
  };

  const buildAgentMsgs = asset => {
    const type = asset._agentType||"maintenance"; const total = asset.agentData.recommendations.reduce((s,r)=>s+r.saving,0);
    if(type==="maintenance") return [`👁  Ingesting ${asset.sensors?.length||3} sensor streams from ${asset.id}`,`🔍  Anomaly: ${asset.agentData.anomalyScore} · Confidence: ${asset.agentData.confidence}%`,`🧠  ${asset.agentData.historicalMatches} cases matched · ${asset.agentData.rootCause.substring(0,80)}...`,`📋  ${asset.agentData.recommendations.length} actions · Top: ${asset.agentData.recommendations[0].priority} within ${asset.agentData.recommendations[0].urgency}`,`⚡  Saving: ₹${(total/100000).toFixed(1)}L`];
    if(type==="energy") return [`📊  Metering energy for ${asset.id}`,`📉  Efficiency: ${asset.agentData.kpis.efficiency} · Anomaly: ${asset.agentData.anomalyScore}`,`🔍  ${asset.agentData.historicalMatches} patterns matched`,`⚙️  ${asset.agentData.recommendations.length} optimisations · Top saving ₹${(asset.agentData.recommendations[0].saving/100000).toFixed(1)}L`,`💰  Total potential: ₹${(total/100000).toFixed(1)}L/mo`];
    return [`🔬  SPC & batch data for ${asset.id}`,`📈  Drift: ${asset.agentData.kpis.driftIndex} · Defects: ${asset.agentData.kpis.defectRate}`,`🧠  ${asset.agentData.historicalMatches} batches analysed`,`✅  ${asset.agentData.recommendations.length} actions · ${asset.agentData.kpis.oosAlerts} OOS alerts`,`🛡  Quality loss avoided: ₹${(total/100000).toFixed(1)}L`];
  };

  const runAgent = asset => {
    const key = asset.id; if(agentStates[key]==="running") return;
    setAgentStates(p=>({...p,[key]:"running"})); setPipelineStep(p=>({...p,[key]:0})); setPipelineMsgs(p=>({...p,[key]:[]}));
    const msgs = buildAgentMsgs(asset); let step=0;
    intervalRef.current[key] = setInterval(()=>{ setPipelineStep(p=>({...p,[key]:step})); setPipelineMsgs(p=>({...p,[key]:[...(p[key]||[]),msgs[step]]})); step++; if(step>=msgs.length){clearInterval(intervalRef.current[key]);setAgentStates(p=>({...p,[key]:"done"}));} },900);
  };
  const resetAgent = id => { clearInterval(intervalRef.current[id]); setAgentStates(p=>({...p,[id]:"idle"})); setPipelineStep(p=>({...p,[id]:-1})); setPipelineMsgs(p=>({...p,[id]:[]})); };

  const getChartProps = a => {
    if(agentType==="maintenance"){ const d=(genMaintData(a)||[]).filter((_,i)=>i%8===0); return {chartData:d,chartKey:"vibration",chartColor:a.color,thresholdY:a.thresholds?.vibration?.crit}; }
    if(agentType==="energy"){ const d=genEnergyData(a).filter((_,i)=>i%8===0); return {chartData:d,chartKey:"consumption",chartColor:BRAND.orange,thresholdY:null}; }
    const d=genQualityData(a).filter((_,i)=>i%2===0); return {chartData:d,chartKey:"defectRate",chartColor:BRAND.red,thresholdY:2.0};
  };
  const getKpiItems = a => {
    if(agentType==="maintenance") return [{label:"Anomaly",value:a.agentData.anomalyScore,color:a.agentData.anomalyScore>0.8?BRAND.red:BRAND.orange},{label:"Confidence",value:`${a.agentData.confidence}%`,color:a.color},{label:"Saving",value:`₹${(a.agentData.recommendations.reduce((s,r)=>s+r.saving,0)/100000).toFixed(1)}L`,color:BRAND.purple}];
    if(agentType==="energy") return [{label:"Consumption",value:a.agentData.kpis.consumption,color:BRAND.orange},{label:"Efficiency",value:a.agentData.kpis.efficiency,color:parseInt(a.agentData.kpis.efficiency)<70?BRAND.red:BRAND.green},{label:"Saving",value:`₹${(a.agentData.recommendations.reduce((s,r)=>s+r.saving,0)/100000).toFixed(1)}L`,color:BRAND.purple}];
    return [{label:"Defects",value:a.agentData.kpis.defectRate,color:parseFloat(a.agentData.kpis.defectRate)>2?BRAND.red:BRAND.orange},{label:"Batch",value:a.agentData.kpis.batchScore+"/100",color:a.agentData.kpis.batchScore>80?BRAND.green:BRAND.orange},{label:"OOS",value:a.agentData.kpis.oosAlerts,color:a.agentData.kpis.oosAlerts>5?BRAND.red:BRAND.orange}];
  };
  const anyAgentRun = agentCurrentAssets.some(a=>agentStates[a.id]==="done"||agentStates[a.id]==="running");

  const runDemoAgent = () => {
    setDemoThinking(true); setDemoMsgs([]);
    const msgs = [`🔍 Scanning sensor streams for ${demoSelected.id}...`,`📊 Vibration: ${demoSelected.vibration} mm/s · Temp: ${demoSelected.temp}°C`,`🧠 AI confidence: 94% — bearing wear detected...`,`⚡ Generating action plan & cost-benefit analysis...`,`✅ Replace bearing within ${demoSelected.rul} hrs · Saving: ₹4.2L`];
    let i=0; const iv=setInterval(()=>{ setDemoMsgs(p=>[...p,msgs[i]]); i++; if(i>=msgs.length){clearInterval(iv);setDemoThinking(false);} },900);
  };

  const sectionConfig = [
    { key:"assets",   icon:"📊", label:"Asset Dashboard" },
    { key:"agents",   icon:"🤖", label:"AI Agents" },
    { key:"value",    icon:"💰", label:"Business Value" },
    { key:"overview", icon:"📋", label:"Executive View" },
  ];

  if(!user) return <SignInScreen onSubmit={setUser}/>;

  return (
    <div style={{background:BRAND.grey,minHeight:"100vh",color:BRAND.text,fontFamily:"Inter,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .nb{background:none;border:none;cursor:pointer;padding:7px 13px;border-radius:6px;font-size:13px;font-weight:600;color:${BRAND.sub};transition:all 0.2s;font-family:Inter,sans-serif;white-space:nowrap;}
        .nb:hover{background:${BRAND.border};color:${BRAND.text};}
        .na{background:#dbeafe!important;color:${BRAND.blue}!important;}
        .sec-btn{padding:12px 20px;border:none;background:none;cursor:pointer;font-family:Inter,sans-serif;font-size:14px;font-weight:600;color:${BRAND.sub};border-bottom:3px solid transparent;transition:all 0.2s;white-space:nowrap;display:flex;align-items:center;gap:6px;}
        .sec-btn:hover{color:${BRAND.text};background:#f1f5f9;}
        .at-btn{padding:10px 18px;border:none;background:none;cursor:pointer;font-family:Inter,sans-serif;font-size:13px;font-weight:600;color:${BRAND.sub};border-bottom:3px solid transparent;transition:all 0.2s;white-space:nowrap;}
        .at-btn:hover{color:${BRAND.text};}
        .rc{border-radius:10px;padding:12px 14px;margin-bottom:8px;border-left:4px solid;transition:all 0.2s;}
        .rc:hover{transform:translateX(2px);}
        .card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px;box-shadow:0 1px 4px rgba(0,0,0,0.05);}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.35;}}
        .hdr{background:#fff;border-bottom:1px solid ${BRAND.border};padding:10px 24px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
        .sec-bar{background:#fff;border-bottom:2px solid ${BRAND.border};padding:0 24px;display:flex;overflow-x:auto;}
        .sub-bar{background:#fff;border-bottom:1px solid ${BRAND.border};padding:0 24px;display:flex;gap:0;overflow-x:auto;}
        .pp{padding:20px 24px 28px;}
        .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
        .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        .g5{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:18px;}
        .fw{padding:12px 24px;border-top:1px solid ${BRAND.border};display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;background:#fff;}
        @media(max-width:900px){.g3{grid-template-columns:repeat(2,1fr);}.g4{grid-template-columns:repeat(2,1fr);}.g5{grid-template-columns:repeat(3,1fr);}.g2{grid-template-columns:1fr;}.pp{padding:14px;}}
        @media(max-width:600px){.hdr{flex-direction:column;align-items:flex-start;padding:10px 12px;}.sec-bar{padding:0 12px;}.sub-bar{padding:0 12px;}.pp{padding:10px;}.g3{grid-template-columns:1fr;}.g4{grid-template-columns:repeat(2,1fr);}.g5{grid-template-columns:repeat(2,1fr);}.g2{grid-template-columns:1fr;}.sec-btn{padding:10px 14px;font-size:13px;}.fw{padding:10px 12px;flex-direction:column;}}
      `}</style>

      {/* Top Header */}
      <div className="hdr">
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <div style={{fontFamily:"Inter,sans-serif",fontSize:20,fontWeight:800,color:BRAND.blue}}>AriLinc</div>
          <span style={{background:`${BRAND.cyan}15`,color:BRAND.cyan,border:`1px solid ${BRAND.cyan}40`,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>PLATFORM</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:12,color:BRAND.light}}>👋 {user.name} · {user.company}</div>
          <button onClick={()=>setUser(null)} style={{fontSize:11,color:BRAND.light,background:"none",border:`1px solid ${BRAND.border}`,borderRadius:6,padding:"4px 10px",cursor:"pointer"}}>Sign Out</button>
        </div>
      </div>

      {/* Section Selector */}
      <div className="sec-bar">
        {sectionConfig.map(s=>(
          <button key={s.key} className="sec-btn"
            style={{color:section===s.key?BRAND.blue:BRAND.sub,borderBottomColor:section===s.key?BRAND.blue:"transparent",fontWeight:section===s.key?800:600}}
            onClick={()=>setSection(s.key)}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* ── SECTION 1: AI AGENTS ── */}
      {section==="agents" && (
        <>
          <div className="sub-bar">
            {Object.entries(agentTypeConfig).map(([key,cfg])=>(
              <button key={key} className="at-btn"
                style={{color:agentType===key?cfg.color:BRAND.sub,borderBottom:`3px solid ${agentType===key?cfg.color:"transparent"}`}}
                onClick={()=>{setAgentType(key);setAgentTab("agent");setSelectedAsset(null);}}>
                {cfg.icon} {cfg.label} Agent
              </button>
            ))}
            <div style={{marginLeft:"auto",display:"flex"}}>
              {[["agent","🤖 Agent"],["pipeline","⚙️ Pipeline"],["actions","📋 Actions"]].map(([v,l])=>(
                <button key={v} className="at-btn nb" style={{borderBottom:`3px solid ${agentTab===v?BRAND.blue:"transparent"}`,color:agentTab===v?BRAND.blue:BRAND.sub}} onClick={()=>setAgentTab(v)}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{background:`${agentTypeConfig[agentType].color}08`,borderBottom:`1px solid ${agentTypeConfig[agentType].color}20`,padding:"6px 24px",fontSize:12,color:agentTypeConfig[agentType].color,fontWeight:600}}>
            {agentTypeConfig[agentType].icon} <strong>{agentTypeConfig[agentType].label} Agent</strong> — {agentTypeConfig[agentType].desc}
          </div>
          <div className="pp">
            {agentTab==="agent" && (
              <div>
                <div style={{fontFamily:"Inter,sans-serif",fontSize:18,fontWeight:800,color:BRAND.text,marginBottom:4}}>{agentTypeConfig[agentType].icon} {agentTypeConfig[agentType].label} AI Agent</div>
                <div style={{fontSize:13,color:BRAND.sub,marginBottom:18}}>Run the agent to detect issues, reason through root causes and get prioritised recommendations</div>
                <div className="g3">
                  {agentCurrentAssets.map(a=>{
                    const key=a.id; const state=agentStates[key]||"idle"; const step=pipelineStep[key]??-1; const msgs=pipelineMsgs[key]||[];
                    const cp=getChartProps(a); const ki=getKpiItems(a);
                    return <AgentCard key={key} asset={{...a,_agentType:agentType}} state={state} step={step} msgs={msgs} {...cp} kpiItems={ki} onRun={()=>runAgent({...a,_agentType:agentType})} onReset={()=>resetAgent(key)} onViewActions={()=>{setSelectedAsset(a);setAgentTab("actions");}}/>;
                  })}
                </div>
              </div>
            )}
            {agentTab==="pipeline" && (
              <div>
                <div style={{fontFamily:"Inter,sans-serif",fontSize:18,fontWeight:800,color:BRAND.text,marginBottom:18}}>How AriLinc {agentTypeConfig[agentType].label} Agent Thinks</div>
                <div className="g5">
                  {AGENT_PIPELINE_STEPS[agentType].map((ps,i)=>(
                    <div key={ps.id} style={{background:"#fff",border:`2px solid ${ps.color}25`,borderRadius:12,padding:14,borderTop:`4px solid ${ps.color}`,position:"relative"}}>
                      {i<4&&<div style={{position:"absolute",right:-12,top:"38%",fontSize:12,color:BRAND.border,zIndex:1}}>→</div>}
                      <div style={{fontSize:22,marginBottom:6}}>{ps.icon}</div>
                      <div style={{fontFamily:"Inter,sans-serif",fontSize:13,fontWeight:800,color:ps.color,marginBottom:4}}>{ps.label}</div>
                      <div style={{fontSize:10,color:BRAND.sub,lineHeight:1.6,background:BRAND.grey,borderRadius:5,padding:"6px 8px"}}>{AGENT_PIPELINE_DESC[agentType][ps.id]}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {agentTab==="actions" && (
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
                  <div>
                    <div style={{fontFamily:"Inter,sans-serif",fontSize:18,fontWeight:800,color:BRAND.text,marginBottom:2}}>Prioritised Action Queue</div>
                    <div style={{fontSize:13,color:BRAND.sub}}>AI-generated recommendations sorted by priority</div>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {agentCurrentAssets.map(a=>(<button key={a.id} onClick={()=>setSelectedAsset(selectedAsset?.id===a.id?null:a)} style={{background:selectedAsset?.id===a.id?a.color:"#fff",color:selectedAsset?.id===a.id?"#fff":BRAND.sub,border:`2px solid ${selectedAsset?.id===a.id?a.color:BRAND.border}`,borderRadius:6,padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>{a.id}</button>))}
                  </div>
                </div>
                {!anyAgentRun&&<div style={{background:"#fffbeb",border:`1px solid ${BRAND.orange}40`,borderLeft:`4px solid ${BRAND.orange}`,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:BRAND.orange,fontWeight:600,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>⚠ Run an agent first — <button onClick={()=>setAgentTab("agent")} style={{background:BRAND.orange,color:"#fff",border:"none",borderRadius:5,padding:"2px 10px",fontSize:12,fontWeight:700,cursor:"pointer"}}>🤖 Go to Agent</button></div>}
                <div className="g4" style={{marginBottom:20}}>
                  {[{label:"Total Recs",value:agentCurrentAssets.reduce((s,a)=>s+a.agentData.recommendations.length,0),color:BRAND.blue},{label:"Critical",value:agentCurrentAssets.reduce((s,a)=>s+a.agentData.recommendations.filter(r=>r.priority==="CRITICAL").length,0),color:BRAND.red},{label:"High Priority",value:agentCurrentAssets.reduce((s,a)=>s+a.agentData.recommendations.filter(r=>r.priority==="HIGH").length,0),color:"#f97316"},{label:"Total Saving",value:`₹${(agentCurrentAssets.reduce((s,a)=>s+a.agentData.recommendations.reduce((x,r)=>x+r.saving,0),0)/100000).toFixed(1)}L`,color:BRAND.purple}].map((k,i)=>(
                    <div key={i} style={{background:"#fff",border:`2px solid ${k.color}20`,borderRadius:10,padding:"12px 16px",borderTop:`3px solid ${k.color}`}}>
                      <div style={{fontFamily:"Inter,sans-serif",fontSize:22,fontWeight:800,color:k.color}}>{k.value}</div>
                      <div style={{fontSize:11,color:BRAND.sub,marginTop:3}}>{k.label}</div>
                    </div>
                  ))}
                </div>
                {agentCurrentAssets.filter(a=>!selectedAsset||a.id===selectedAsset.id).map(a=>(
                  <div key={a.id} style={{marginBottom:20}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:a.color}}/>
                      <div style={{fontFamily:"Inter,sans-serif",fontSize:15,fontWeight:800,color:BRAND.text}}>{a.id} · {a.name}</div>
                      <div style={{fontSize:12,color:BRAND.light}}>— {a.type||a.failure}</div>
                    </div>
                    <div style={{background:`${a.color}08`,border:`1px solid ${a.color}25`,borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:12,color:BRAND.text,lineHeight:1.6}}>
                      <strong style={{color:a.color}}>🧠 Root Cause: </strong>{a.agentData.rootCause}
                    </div>
                    {a.agentData.recommendations.map((r,i)=>(
                      <div key={i} className="rc" style={{background:pBg[r.priority],borderLeftColor:pColor[r.priority]}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap"}}>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,flexWrap:"wrap"}}>
                              <span style={{background:pColor[r.priority],color:"#fff",borderRadius:4,padding:"2px 7px",fontSize:10,fontWeight:700}}>{r.priority}</span>
                              <span style={{fontSize:11,color:BRAND.light}}>Confidence: <strong style={{color:r.confidence>=80?BRAND.green:BRAND.orange}}>{r.confidence}%</strong></span>
                              <span style={{fontSize:11,color:BRAND.light}}>· {r.urgency}</span>
                            </div>
                            <div style={{fontSize:13,fontWeight:600,color:BRAND.text}}>{r.action}</div>
                          </div>
                          <div style={{background:"#fff",border:`1px solid ${BRAND.border}`,borderRadius:7,padding:"6px 12px",textAlign:"center",flexShrink:0}}>
                            <div style={{fontSize:9,color:BRAND.light}}>Est. Saving</div>
                            <div style={{fontSize:14,fontWeight:800,color:BRAND.purple}}>₹{(r.saving/100000).toFixed(1)}L</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── SECTION 2: ASSET DASHBOARD ── */}
      {section==="assets" && (
        <>
          <div className="sub-bar">
            {[["dashboard","📊 Dashboard"],["charts","📈 Sensor Charts"],["health","🏥 Health Trends"]].map(([v,l])=>(
              <button key={v} className="at-btn" style={{color:dashTab===v?BRAND.blue:BRAND.sub,borderBottom:`3px solid ${dashTab===v?BRAND.blue:"transparent"}`}} onClick={()=>setDashTab(v)}>{l}</button>
            ))}
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",padding:"0 8px",fontSize:12,color:"#94a3b8"}}>
              Plant: <span style={{color:dashPlantHealth>=75?"#059669":dashPlantHealth>=45?"#d97706":"#dc2626",fontWeight:700,marginLeft:4}}>{dashPlantHealth>=75?"Healthy":dashPlantHealth>=45?"At Risk":"Critical"}</span>
            </div>
          </div>
          <div className="pp">
            <div className="g4" style={{marginBottom:20}}>
              {[{icon:"🏭",label:"Plant Health",value:`${dashPlantHealth}%`,sub:`${DASH_ASSETS.length-dashAtRisk} of ${DASH_ASSETS.length} healthy`,color:dashPlantHealth>=75?"#059669":dashPlantHealth>=45?"#d97706":"#dc2626"},{icon:"⚠️",label:"Assets at Risk",value:`${dashAtRisk} / ${DASH_ASSETS.length}`,sub:`${dashLatests.filter(l=>l.health<45).length} critical`,color:"#dc2626"},{icon:"⏱",label:"Downtime Risk",value:`${dashDowntime} hrs`,sub:"If unaddressed",color:"#d97706"},{icon:"💰",label:"Cost at Risk",value:`₹${(dashCost/100000).toFixed(1)}L`,sub:"Potential loss",color:"#7c3aed"}].map((k,i)=>(
                <div key={i} style={{background:"#fff",border:`2px solid ${k.color}30`,borderRadius:12,padding:"16px 18px",borderTop:`4px solid ${k.color}`,boxShadow:"0 2px 6px rgba(0,0,0,0.05)"}}>
                  <div style={{fontSize:22,marginBottom:6}}>{k.icon}</div>
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:24,fontWeight:800,color:k.color}}>{k.value}</div>
                  <div style={{fontSize:12,fontWeight:700,color:"#334155",marginTop:3}}>{k.label}</div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{k.sub}</div>
                </div>
              ))}
            </div>
            {dashTab==="dashboard" && (
              <div>
                <div style={{fontFamily:"Inter,sans-serif",fontSize:17,fontWeight:800,color:BRAND.text,marginBottom:14}}>Asset Status Overview</div>
                <div className="g3">
                  {DASH_ASSETS.map((a,idx)=>{
                    const last=dashLatests[idx]; const data=dashData[a.id].filter((_,i)=>i%12===0);
                    return (
                      <div key={a.id} style={{background:"#fff",border:`2px solid ${a.color}30`,borderRadius:12,overflow:"hidden",boxShadow:"0 2px 6px rgba(0,0,0,0.05)"}}>
                        <div style={{padding:"12px 16px",borderBottom:`3px solid ${a.color}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div><div style={{fontFamily:"Inter,sans-serif",fontSize:16,fontWeight:800,color:BRAND.text}}>{a.id}</div><div style={{fontSize:11,color:"#64748b"}}>{a.name} · {a.location}</div></div>
                          <DashStatusBadge health={last.health}/>
                        </div>
                        <div style={{padding:"12px 16px",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,borderBottom:"1px solid #f1f5f9"}}>
                          {a.sensors.map(s=>{
                            const val=last[s]; const {warn,crit}=a.thresholds[s];
                            const isAlert=s==="pressure"?val<crit:val>=crit; const isWarn=!isAlert&&(s==="pressure"?val<warn:val>=warn);
                            const color=isAlert?"#dc2626":isWarn?"#d97706":"#059669";
                            return (<div key={s} style={{background:`${color}08`,border:`1px solid ${color}25`,borderRadius:7,padding:"6px 8px",textAlign:"center"}}>
                              <div style={{fontSize:9,color:"#94a3b8",textTransform:"capitalize",marginBottom:2}}>{s}</div>
                              <div style={{fontSize:14,fontWeight:800,color}}>{val}</div>
                              <div style={{fontSize:9,color:"#94a3b8"}}>{a.units[s]}</div>
                              {isAlert&&<div style={{fontSize:8,color:"#dc2626",fontWeight:700,marginTop:1}}>⚠ CRIT</div>}
                              {isWarn&&<div style={{fontSize:8,color:"#d97706",fontWeight:700,marginTop:1}}>⚠ WARN</div>}
                            </div>);
                          })}
                        </div>
                        <div style={{padding:"8px 16px 4px"}}>
                          <div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>Vibration trend (30 days)</div>
                          <ResponsiveContainer width="100%" height={55}>
                            <LineChart data={data} margin={{top:2,right:4,bottom:2,left:0}}>
                              <Line type="monotone" dataKey="vibration" stroke={a.color} strokeWidth={1.5} dot={false}/>
                              <ReferenceLine y={a.thresholds.vibration.warn} stroke="#d97706" strokeDasharray="3 2" strokeWidth={1}/>
                              <ReferenceLine y={a.thresholds.vibration.crit} stroke="#dc2626" strokeDasharray="3 2" strokeWidth={1}/>
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div style={{padding:"6px 16px 12px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                            <span style={{fontSize:10,color:"#94a3b8"}}>Health: <strong style={{color:last.health>=75?"#059669":last.health>=45?"#d97706":"#dc2626"}}>{last.health}%</strong></span>
                            <span style={{fontSize:10,color:"#94a3b8"}}>RUL: <strong style={{color:last.rul<=3?"#dc2626":last.rul<=7?"#d97706":"#059669"}}>{last.rul}d</strong></span>
                          </div>
                          <div style={{background:"#f1f5f9",borderRadius:4,height:5}}>
                            <div style={{height:5,borderRadius:4,width:`${last.health}%`,background:last.health>=75?"#059669":last.health>=45?"#d97706":"#dc2626",transition:"width 1s"}}/>
                          </div>
                          <div style={{fontSize:10,color:a.color,fontWeight:600,marginTop:6}}>⚠ {a.failure}</div>
                          <div style={{display:"flex",gap:6,marginTop:10}}>
                            <button onClick={()=>setShowUpload(a)} style={{flex:1,padding:"7px",background:`${a.color}10`,border:`1px solid ${a.color}40`,borderRadius:7,fontSize:11,fontWeight:700,color:a.color,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
                              📤 Upload Your Data
                            </button>
                            {uploadedData[a.id]&&<div style={{padding:"7px 10px",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:7,fontSize:11,fontWeight:700,color:"#059669",whiteSpace:"nowrap"}}>✓ {uploadedData[a.id].length} rows</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {dashTab==="charts" && (
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:17,fontWeight:800,color:BRAND.text}}>Sensor Trends — All Assets · 30 Days</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {["vibration","temperature","pressure","current"].map(s=>(
                      <button key={s} onClick={()=>setActiveSensor(s)} style={{background:activeSensor===s?BRAND.blue:"#fff",color:activeSensor===s?"#fff":"#475569",border:`1px solid ${activeSensor===s?BRAND.blue:"#e2e8f0"}`,borderRadius:6,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer",textTransform:"capitalize"}}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="g3">
                  {DASH_ASSETS.map(a=>{
                    if(!a.sensors.includes(activeSensor)) return (<div key={a.id} style={{background:"#fff",border:"2px solid #e2e8f0",borderRadius:12,padding:20,display:"flex",alignItems:"center",justifyContent:"center",minHeight:260}}><div style={{textAlign:"center",color:"#94a3b8"}}><div style={{fontSize:20,marginBottom:6}}>—</div><div style={{fontSize:12}}>{a.id} — no <strong>{activeSensor}</strong> sensor</div></div></div>);
                    const chartData=dashData[a.id].filter((_,i)=>i%4===0); const thresh=a.thresholds[activeSensor]; const unit=a.units[activeSensor];
                    const latestVal=dashData[a.id][dashData[a.id].length-1][activeSensor];
                    const isAlert=activeSensor==="pressure"?latestVal<thresh?.crit:latestVal>=thresh?.crit;
                    const isWarn=!isAlert&&(activeSensor==="pressure"?latestVal<thresh?.warn:latestVal>=thresh?.warn);
                    return (
                      <div key={a.id} style={{background:"#fff",border:`2px solid ${isAlert?"#fecaca":isWarn?"#fde68a":"#e2e8f0"}`,borderRadius:12,overflow:"hidden",boxShadow:"0 2px 6px rgba(0,0,0,0.05)"}}>
                        <div style={{padding:"12px 16px",borderBottom:`3px solid ${a.color}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div><div style={{fontFamily:"Inter,sans-serif",fontSize:14,fontWeight:800,color:BRAND.text}}>{a.id} · {activeSensor.charAt(0).toUpperCase()+activeSensor.slice(1)}</div><div style={{fontSize:11,color:"#64748b"}}>{a.name} · {unit}</div></div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontFamily:"Inter,sans-serif",fontSize:18,fontWeight:800,color:isAlert?"#dc2626":isWarn?"#d97706":"#059669"}}>{latestVal} <span style={{fontSize:11,fontWeight:400,color:"#94a3b8"}}>{unit}</span></div>
                            <DashStatusBadge health={isAlert?20:isWarn?60:90}/>
                          </div>
                        </div>
                        <div style={{padding:"12px 10px 6px"}}>
                          {uploadedData[a.id]&&<div style={{display:"flex",alignItems:"center",gap:12,padding:"6px 10px",background:"#f0fdf4",borderRadius:6,marginBottom:8,fontSize:11,flexWrap:"wrap",gap:8}}>
                            <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{display:"inline-block",width:16,height:3,background:a.color,borderRadius:2}}/><span style={{color:"#475569"}}>Synthetic</span></span>
                            <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{display:"inline-block",width:16,height:3,background:"#059669",borderRadius:2}}/><span style={{color:"#059669",fontWeight:700}}>Your Data ({uploadedData[a.id].length} rows)</span></span>
                          </div>}
                          <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={(()=>{
                              const synth = chartData;
                              const uploaded = uploadedData[a.id];
                              if(!uploaded) return synth;
                              return synth.map((row,i)=>{
                                const uRow = uploaded[i*4] || uploaded[Math.min(i*4,uploaded.length-1)];
                                const uVal = uRow?.[activeSensor]??uRow?.[activeSensor.toLowerCase()]??null;
                                return {...row, uploaded_val: typeof uVal==="number"?+uVal.toFixed(2):null};
                              });
                            })()} margin={{top:8,right:14,bottom:4,left:0}}>
                              <ReferenceArea x1={`D${Math.floor(a.failureStart/24)+1}`} x2={`D${Math.floor(a.failureCrit/24)+1}`} fill="#fef9c3" fillOpacity={0.6}/>
                              <ReferenceArea x1={`D${Math.floor(a.failureCrit/24)+1}`} fill="#fee2e2" fillOpacity={0.6}/>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                              <XAxis dataKey="label" stroke="#e2e8f0" tick={{fill:"#94a3b8",fontSize:9}} interval={29}/>
                              <YAxis stroke="#e2e8f0" tick={{fill:"#94a3b8",fontSize:9}} width={34}/>
                              <Tooltip content={<DashTooltip units={{[activeSensor]:unit, uploaded_val:unit}}/>}/>
                              <ReferenceLine y={thresh?.warn} stroke="#d97706" strokeDasharray="5 3" strokeWidth={1.5}/>
                              <ReferenceLine y={thresh?.crit} stroke="#dc2626" strokeDasharray="5 3" strokeWidth={1.5}/>
                              <Line type="monotone" dataKey={activeSensor} stroke={a.color} strokeWidth={2} dot={false} name="Synthetic" strokeDasharray={uploadedData[a.id]?"5 3":undefined} strokeOpacity={uploadedData[a.id]?0.5:1}/>
                              {uploadedData[a.id]&&<Line type="monotone" dataKey="uploaded_val" stroke="#059669" strokeWidth={2.5} dot={false} name="Your Data"/>}
                            </LineChart>
                          </ResponsiveContainer>
                          {uploadedData[a.id]&&(()=>{
                            const uploaded = uploadedData[a.id];
                            const vals = uploaded.map(r=>+(r[activeSensor]||r[activeSensor.toLowerCase()]||0)).filter(v=>v>0);
                            if(!vals.length) return null;
                            const maxVal = Math.max(...vals); const avgVal = +(vals.reduce((s,v)=>s+v,0)/vals.length).toFixed(2);
                            const thresh = a.thresholds[activeSensor];
                            const isAlert = activeSensor==="pressure"?maxVal<thresh?.crit:maxVal>=thresh?.crit;
                            const isWarn = !isAlert&&(activeSensor==="pressure"?maxVal<thresh?.warn:maxVal>=thresh?.warn);
                            return (
                              <div style={{padding:"8px 10px",background:"#f0fdf4",borderRadius:6,marginTop:6,display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                                {[{label:"Your Max",value:`${maxVal} ${unit}`,color:isAlert?"#dc2626":isWarn?"#d97706":"#059669"},{label:"Your Avg",value:`${avgVal} ${unit}`,color:"#475569"},{label:"Status",value:isAlert?"⚠ Critical":isWarn?"⚠ Warning":"✓ Normal",color:isAlert?"#dc2626":isWarn?"#d97706":"#059669"}].map((s,i)=>(
                                  <div key={i} style={{textAlign:"center"}}><div style={{fontSize:9,color:"#94a3b8"}}>{s.label}</div><div style={{fontSize:11,fontWeight:700,color:s.color,marginTop:1}}>{s.value}</div></div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {dashTab==="health" && (
              <div>
                <div style={{fontFamily:"Inter,sans-serif",fontSize:17,fontWeight:800,color:BRAND.text,marginBottom:16}}>Health Score & RUL Trends</div>
                <div className="g3" style={{marginBottom:18}}>
                  {DASH_ASSETS.map((a,idx)=>{
                    const chartData=dashData[a.id].filter((_,i)=>i%6===0); const last=dashLatests[idx];
                    return (
                      <div key={a.id} style={{background:"#fff",border:"2px solid #e2e8f0",borderRadius:12,overflow:"hidden",boxShadow:"0 2px 6px rgba(0,0,0,0.05)"}}>
                        <div style={{padding:"12px 16px",borderBottom:`3px solid ${a.color}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div><div style={{fontFamily:"Inter,sans-serif",fontSize:14,fontWeight:800,color:BRAND.text}}>{a.id} · Health</div><div style={{fontSize:11,color:"#64748b"}}>{a.failure}</div></div>
                          <div style={{textAlign:"right"}}><div style={{fontFamily:"Inter,sans-serif",fontSize:20,fontWeight:800,color:last.health>=75?"#059669":last.health>=45?"#d97706":"#dc2626"}}>{last.health}%</div><div style={{fontSize:11,color:"#94a3b8"}}>RUL: <strong style={{color:last.rul<=3?"#dc2626":"#059669"}}>{last.rul}d</strong></div></div>
                        </div>
                        <div style={{padding:"12px 10px 4px"}}>
                          <ResponsiveContainer width="100%" height={140}>
                            <LineChart data={chartData} margin={{top:4,right:10,bottom:4,left:0}}>
                              <ReferenceArea x1={`D${Math.floor(a.failureStart/24)+1}`} fill="#fee2e2" fillOpacity={0.4}/>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                              <XAxis dataKey="label" stroke="#e2e8f0" tick={{fill:"#94a3b8",fontSize:9}} interval={19}/>
                              <YAxis stroke="#e2e8f0" tick={{fill:"#94a3b8",fontSize:9}} width={28} domain={[0,100]}/>
                              <Tooltip content={<DashTooltip units={{health:"%"}}/>}/>
                              <ReferenceLine y={75} stroke="#059669" strokeDasharray="4 3" strokeWidth={1}/>
                              <ReferenceLine y={45} stroke="#d97706" strokeDasharray="4 3" strokeWidth={1}/>
                              <Line type="monotone" dataKey="health" stroke={a.color} strokeWidth={2} dot={false} name="health"/>
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{background:"#fff",border:"2px solid #e2e8f0",borderRadius:12,overflow:"hidden"}}>
                  <div style={{padding:"12px 18px",borderBottom:"1px solid #f1f5f9",fontFamily:"Inter,sans-serif",fontSize:14,fontWeight:800,color:BRAND.text}}>Plant-Wide Risk Summary</div>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:560}}>
                      <thead><tr style={{background:"#f8fafc"}}>{["Asset","Type","Health","RUL","Failure Risk","Downtime","Cost Risk","Status"].map(h=>(<th key={h} style={{padding:"8px 14px",textAlign:"left",color:"#475569",fontWeight:700,borderBottom:"2px solid #e2e8f0",whiteSpace:"nowrap"}}>{h}</th>))}</tr></thead>
                      <tbody>{DASH_ASSETS.map((a,i)=>{ const last=dashLatests[i]; return (<tr key={a.id} style={{borderBottom:"1px solid #f1f5f9",background:last.health<45?"#fff5f5":last.health<75?"#fffbeb":"#fff"}}>
                        <td style={{padding:"8px 14px",fontWeight:700,color:BRAND.text}}>{a.id}</td>
                        <td style={{padding:"8px 14px",color:"#64748b"}}>{a.type}</td>
                        <td style={{padding:"8px 14px",fontWeight:700,color:last.health>=75?"#059669":last.health>=45?"#d97706":"#dc2626"}}>{last.health}%</td>
                        <td style={{padding:"8px 14px",fontWeight:700,color:last.rul<=3?"#dc2626":last.rul<=7?"#d97706":"#059669"}}>{last.rul}d</td>
                        <td style={{padding:"8px 14px",color:"#334155",whiteSpace:"nowrap"}}>{a.failure}</td>
                        <td style={{padding:"8px 14px",fontWeight:600,color:"#d97706"}}>{a.downtimeRisk} hrs</td>
                        <td style={{padding:"8px 14px",fontWeight:600,color:"#7c3aed"}}>₹{(a.costRisk/100000).toFixed(1)}L</td>
                        <td style={{padding:"8px 14px"}}><DashStatusBadge health={last.health}/></td>
                      </tr>); })}</tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Upload Modal */}
          {showUpload && <UploadModal asset={showUpload} onClose={()=>setShowUpload(null)} onUpload={(id,rows)=>setUploadedData(p=>({...p,[id]:rows}))}/>}
        </>
      )}

      {/* ── SECTION 3: BUSINESS VALUE ── */}
      {section==="value" && (
        <>
          <div className="sub-bar">
            {[["overview","💰 Value Overview"],["calculator","🧮 ROI Calculator"],["charts","📊 Charts"],["summary","🏆 Executive Summary"]].map(([v,l])=>(
              <button key={v} className="at-btn" style={{color:valueTab===v?BRAND.blue:BRAND.sub,borderBottom:`3px solid ${valueTab===v?BRAND.blue:"transparent"}`}} onClick={()=>setValueTab(v)}>{l}</button>
            ))}
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",padding:"0 10px",fontSize:12,color:BRAND.sub}}>3-yr ROI: <span style={{color:"#059669",fontWeight:700,marginLeft:4}}>{calc.roi}%</span></div>
          </div>
          <div className="pp">
            <div className="g4" style={{marginBottom:20}}>
              {[{icon:"💰",label:"Annual Savings",value:`₹${(calc.ta/100000).toFixed(1)}L`,sub:"Downtime + Maint + Energy",color:"#059669"},{icon:"📅",label:"Payback Period",value:`${calc.pb} months`,sub:`On ₹${(roiInputs.implementationCost/100000).toFixed(1)}L investment`,color:"#1d4ed8"},{icon:"📈",label:"3-Year ROI",value:`${calc.roi}%`,sub:"Net return",color:"#7c3aed"},{icon:"⏱",label:"Monthly Savings",value:`₹${(calc.tm/100000).toFixed(1)}L`,sub:"Avg all categories",color:"#d97706"}].map((k,i)=>(
                <div key={i} style={{background:"#fff",border:`2px solid ${k.color}25`,borderRadius:12,padding:"16px 18px",borderTop:`4px solid ${k.color}`,boxShadow:"0 2px 6px rgba(0,0,0,0.05)"}}>
                  <div style={{fontSize:20,marginBottom:5}}>{k.icon}</div>
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:24,fontWeight:800,color:k.color}}>{k.value}</div>
                  <div style={{fontSize:12,fontWeight:700,color:"#334155",marginTop:3}}>{k.label}</div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{k.sub}</div>
                </div>
              ))}
            </div>
            {valueTab==="overview" && (
              <div>
                <div style={{fontFamily:"Inter,sans-serif",fontSize:17,fontWeight:800,color:BRAND.text,marginBottom:16}}>Before vs After — AriLinc Impact</div>
                <div className="g2" style={{marginBottom:20}}>
                  {BEFORE_AFTER.map((item,i)=>(
                    <div key={i} className="card">
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><span style={{fontSize:18}}>{item.icon}</span><span style={{fontWeight:700,fontSize:13,color:BRAND.text}}>{item.metric}</span></div>
                      <div style={{display:"flex",gap:10,alignItems:"center"}}>
                        <div style={{flex:1,background:"#fff5f5",border:"1px solid #fecaca",borderRadius:7,padding:"8px 12px",textAlign:"center"}}><div style={{fontSize:9,color:"#94a3b8",marginBottom:2}}>BEFORE</div><div style={{fontSize:14,fontWeight:800,color:"#dc2626"}}>{item.before}</div></div>
                        <div style={{fontSize:16,color:"#e2e8f0"}}>→</div>
                        <div style={{flex:1,background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:7,padding:"8px 12px",textAlign:"center"}}><div style={{fontSize:9,color:"#94a3b8",marginBottom:2}}>AFTER</div><div style={{fontSize:14,fontWeight:800,color:"#059669"}}>{item.after}</div></div>
                      </div>
                      <div style={{marginTop:8,background:`${item.color}10`,border:`1px solid ${item.color}30`,borderRadius:5,padding:"4px 10px",textAlign:"center",fontSize:11,fontWeight:700,color:item.color}}>✓ {item.improvement}</div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:15,fontWeight:800,color:BRAND.text,marginBottom:14}}>Monthly Savings Breakdown</div>
                  <div className="g3">
                    {[{label:"Downtime Prevention",value:calc.ds,color:"#1d4ed8",icon:"⏱",pct:"75% reduction"},{label:"Maintenance Savings",value:calc.ms,color:"#059669",icon:"🔧",pct:"38% reduction"},{label:"Energy Efficiency",value:calc.es,color:"#d97706",icon:"⚡",pct:"12% reduction"}].map((s,i)=>(
                      <div key={i} style={{background:`${s.color}08`,border:`2px solid ${s.color}25`,borderRadius:10,padding:"14px 16px"}}>
                        <div style={{fontSize:18,marginBottom:5}}>{s.icon}</div>
                        <div style={{fontFamily:"Inter,sans-serif",fontSize:22,fontWeight:800,color:s.color}}>₹{(s.value/100000).toFixed(1)}L</div>
                        <div style={{fontSize:11,color:"#475569",fontWeight:600,marginTop:3}}>{s.label}</div>
                        <div style={{fontSize:10,color:s.color,marginTop:3,fontWeight:600}}>{s.pct}</div>
                        <div style={{marginTop:8,background:"#fff",borderRadius:3,height:5}}><div style={{height:5,borderRadius:3,background:s.color,width:`${(s.value/calc.tm)*100}%`}}/></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {valueTab==="calculator" && (
              <div className="g2">
                <div className="card">
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:15,fontWeight:800,color:BRAND.text,marginBottom:4}}>🧮 Adjust Your Plant Parameters</div>
                  <div style={{fontSize:12,color:"#94a3b8",marginBottom:18}}>Drag sliders — ROI updates live</div>
                  <RoiSlider label="Monthly Downtime Hours" value={roiInputs.monthlyDowntimeHrs} min={2} max={60} step={1} unit=" hrs" onChange={setRoi("monthlyDowntimeHrs")} color="#1d4ed8"/>
                  <RoiSlider label="Downtime Cost per Hour" value={roiInputs.downtimeCostPerHr} min={10000} max={300000} step={5000} unit="₹" onChange={setRoi("downtimeCostPerHr")} color="#dc2626"/>
                  <RoiSlider label="Monthly Maintenance Budget" value={roiInputs.monthlyMaintCost} min={500000} max={10000000} step={100000} unit="₹" onChange={setRoi("monthlyMaintCost")} color="#059669"/>
                  <RoiSlider label="Monthly Energy Cost" value={roiInputs.energyCostMonthly} min={100000} max={2000000} step={50000} unit="₹" onChange={setRoi("energyCostMonthly")} color="#d97706"/>
                  <RoiSlider label="Implementation Cost" value={roiInputs.implementationCost} min={500000} max={10000000} step={100000} unit="₹" onChange={setRoi("implementationCost")} color="#7c3aed"/>
                  <button onClick={()=>setRoiInputs(ROI_DEFAULTS)} style={{width:"100%",marginTop:6,padding:"9px",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:7,fontSize:13,fontWeight:600,color:"#475569",cursor:"pointer",fontFamily:"Inter,sans-serif"}}>↺ Reset</button>
                </div>
                <div className="card">
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:15,fontWeight:800,color:BRAND.text,marginBottom:14}}>📊 Live ROI Results</div>
                  <div className="g2">
                    {[{label:"Monthly Savings",value:`₹${(calc.tm/100000).toFixed(2)}L`,color:"#059669"},{label:"Annual Savings",value:`₹${(calc.ta/100000).toFixed(1)}L`,color:"#1d4ed8"},{label:"Payback Period",value:`${calc.pb} months`,color:"#d97706"},{label:"3-Year Net",value:`₹${((calc.ta*3-roiInputs.implementationCost)/100000).toFixed(1)}L`,color:"#7c3aed"},{label:"3-Year ROI",value:`${calc.roi}%`,color:"#059669"},{label:"Investment",value:`₹${(roiInputs.implementationCost/100000).toFixed(1)}L`,color:"#94a3b8"}].map((r,i)=>(
                      <div key={i} style={{background:"#f8fafc",borderRadius:9,padding:"12px 14px",border:`1px solid ${r.color}20`}}>
                        <div style={{fontSize:11,color:"#94a3b8"}}>{r.label}</div>
                        <div style={{fontFamily:"Inter,sans-serif",fontSize:20,fontWeight:800,color:r.color,marginTop:3}}>{r.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {valueTab==="charts" && (
              <div style={{display:"flex",flexDirection:"column",gap:18}}>
                <div className="card">
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:15,fontWeight:800,color:BRAND.text,marginBottom:3}}>3-Year Cumulative Savings vs Investment</div>
                  <div style={{fontSize:12,color:"#94a3b8",marginBottom:14}}>Breakeven at month {calc.pb} · 3-year net: ₹{((calc.ta*3-roiInputs.implementationCost)/100000).toFixed(1)}L</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={calc.cumulative} margin={{top:8,right:18,bottom:4,left:10}}>
                      <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#059669" stopOpacity={0.25}/><stop offset="95%" stopColor="#059669" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                      <XAxis dataKey="month" stroke="#e2e8f0" tick={{fill:"#94a3b8",fontSize:11}}/>
                      <YAxis stroke="#e2e8f0" tick={{fill:"#94a3b8",fontSize:11}} tickFormatter={v=>`₹${(v/100000).toFixed(0)}L`} width={56}/>
                      <Tooltip content={<ValueTooltip/>}/>
                      <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="4 3" label={{value:"Breakeven",fill:"#dc2626",fontSize:10}}/>
                      <Area type="monotone" dataKey="cumulative" stroke="#059669" fill="url(#cg)" strokeWidth={2.5} name="Cumulative Savings"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="card">
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:15,fontWeight:800,color:BRAND.text,marginBottom:14}}>Monthly Savings Breakdown</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={calc.monthly} margin={{top:4,right:10,bottom:4,left:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                      <XAxis dataKey="month" stroke="#e2e8f0" tick={{fill:"#94a3b8",fontSize:10}}/>
                      <YAxis stroke="#e2e8f0" tick={{fill:"#94a3b8",fontSize:10}} tickFormatter={v=>`₹${(v/100000).toFixed(0)}L`} width={48}/>
                      <Tooltip content={<ValueTooltip/>}/>
                      <Legend wrapperStyle={{fontSize:11}}/>
                      <Bar dataKey="downtime" stackId="a" fill="#1d4ed8" name="Downtime" radius={[0,0,0,0]}/>
                      <Bar dataKey="maintenance" stackId="a" fill="#059669" name="Maintenance"/>
                      <Bar dataKey="energy" stackId="a" fill="#d97706" name="Energy" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            {valueTab==="summary" && (
              <div>
                <div style={{background:"linear-gradient(135deg,#1d4ed8,#7c3aed)",borderRadius:16,padding:"28px 24px",marginBottom:20,color:"#fff"}}>
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:22,fontWeight:800,marginBottom:6}}>AriLinc — Business Value Summary</div>
                  <div style={{fontSize:13,opacity:0.85,maxWidth:600,lineHeight:1.7}}>AI-powered predictive maintenance delivering measurable, quantified business outcomes — from sensor to savings.</div>
                  <div className="g4" style={{marginTop:20}}>
                    {[{label:"Annual Savings",value:`₹${(calc.ta/100000).toFixed(1)}L`},{label:"Payback Period",value:`${calc.pb} months`},{label:"3-Year ROI",value:`${calc.roi}%`},{label:"Assets Protected",value:"3 / 3"}].map((s,i)=>(
                      <div key={i} style={{background:"rgba(255,255,255,0.15)",borderRadius:10,padding:"14px 16px"}}>
                        <div style={{fontFamily:"Inter,sans-serif",fontSize:22,fontWeight:800}}>{s.value}</div>
                        <div style={{fontSize:11,opacity:0.8,marginTop:3}}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="g3" style={{marginBottom:20}}>
                  {[{icon:"⏱",title:"75% Less Downtime",desc:"From 18 hrs/month to 4.5 hrs — recovering 162 production hours/year",color:"#1d4ed8"},{icon:"💰",title:"₹10.6L/month Maintenance Saving",desc:"Shift from reactive to predictive — eliminating emergency work orders",color:"#059669"},{icon:"⚙️",title:"+18% Asset Utilization",desc:"From 71% to 89% — more output from existing assets, zero CAPEX",color:"#7c3aed"},{icon:"📈",title:"2.8× MTBF Improvement",desc:"Mean time between failures rises from 22 to 61 days",color:"#d97706"},{icon:"⚡",title:"12% Energy Savings",desc:"AI-optimised operating points reduce energy consumption continuously",color:"#dc2626"},{icon:"🎯",title:"94% Detection Accuracy",desc:"AI catches 94% of failures before they happen — 3.1% false positive rate",color:"#0891b2"}].map((o,i)=>(
                    <div key={i} style={{background:"#fff",border:`2px solid ${o.color}20`,borderRadius:12,padding:"16px 18px",borderLeft:`4px solid ${o.color}`}}>
                      <div style={{fontSize:20,marginBottom:6}}>{o.icon}</div>
                      <div style={{fontFamily:"Inter,sans-serif",fontSize:14,fontWeight:800,color:BRAND.text,marginBottom:5}}>{o.title}</div>
                      <div style={{fontSize:12,color:"#64748b",lineHeight:1.6}}>{o.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:"#fff",border:"2px solid #e2e8f0",borderRadius:12,padding:"20px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
                  <div>
                    <div style={{fontFamily:"Inter,sans-serif",fontSize:16,fontWeight:700,color:BRAND.text,marginBottom:3}}>Ready to see this with your plant data?</div>
                    <div style={{fontSize:13,color:"#64748b"}}>AriLinc connects to SCADA, PLC, IoT sensors and historian systems — real-time intelligence across your entire plant.</div>
                    <div style={{marginTop:6,fontSize:12,color:"#94a3b8"}}>✉ <a href="mailto:info@ariprus.com" style={{color:BRAND.blue,textDecoration:"none",fontWeight:600}}>info@ariprus.com</a></div>
                  </div>
                  <a href="https://agents.ariprus.com" target="_blank" rel="noopener noreferrer" style={{background:"linear-gradient(135deg,#1d4ed8,#7c3aed)",color:"#fff",border:"none",borderRadius:8,padding:"12px 24px",fontSize:14,fontWeight:700,cursor:"pointer",textDecoration:"none",whiteSpace:"nowrap"}}>Book a Live Demo →</a>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── SECTION 4: DEMO OVERVIEW ── */}
      {section==="overview" && (
        <>
          <div className="sub-bar">
            {[["overview","📋 Overview"],["sensors","📈 Sensors"],["agent","🤖 AI Agent"],["value","💰 Value"]].map(([v,l])=>(
              <button key={v} className="at-btn" style={{color:demoTab===v?BRAND.blue:BRAND.sub,borderBottom:`3px solid ${demoTab===v?BRAND.blue:"transparent"}`}} onClick={()=>setDemoTab(v)}>{l}</button>
            ))}
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,padding:"0 12px",background:"#f0fdf4",margin:"6px 0",borderRadius:20,border:"1px solid #bbf7d0"}}>
              <span style={{color:"#059669",fontSize:10,animation:"pulse 1.5s infinite"}}>●</span>
              <span style={{fontSize:12,fontWeight:700,color:"#059669"}}>LIVE</span>
              <span style={{fontSize:11,color:"#64748b"}}>{demoTime}</span>
            </div>
          </div>
          <div className="pp">
            <div className="g4" style={{marginBottom:20}}>
              {DEMO_KPIS.map((k,i)=>(<div key={i} className="card" style={{borderTop:`3px solid ${k.color}`}}><div style={{fontSize:20,marginBottom:5}}>{k.icon}</div><div style={{fontFamily:"Inter,sans-serif",fontSize:22,fontWeight:800,color:k.color}}>{k.value}</div><div style={{fontSize:12,fontWeight:600,color:"#334155",marginTop:2}}>{k.label}</div><div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{k.sub}</div></div>))}
            </div>
            {demoTab==="overview" && (
              <div className="g2">
                <div className="card">
                  <div style={{fontSize:13,fontWeight:700,color:"#64748b",marginBottom:12,letterSpacing:1}}>MONITORED ASSETS</div>
                  {DEMO_ASSETS.map(a=>(
                    <div key={a.id} onClick={()=>setDemoSelected(a)} style={{padding:"10px 14px",borderRadius:8,cursor:"pointer",border:`1px solid ${demoSelected.id===a.id?"#1d4ed8":"transparent"}`,background:demoSelected.id===a.id?"#eff6ff":"transparent",marginBottom:6,transition:"all 0.2s"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div><div style={{fontWeight:700,fontSize:13,color:BRAND.text}}>{a.id} — {a.name}</div><div style={{fontSize:11,color:"#64748b",marginTop:1}}>{a.location}</div></div>
                        <DemoStatusBadge status={a.status}/>
                      </div>
                      <div style={{marginTop:6,background:"#f1f5f9",borderRadius:3,height:4}}><div style={{height:4,borderRadius:3,width:`${a.health}%`,background:a.status==="critical"?"#ef4444":a.status==="warning"?"#f59e0b":"#0891b2",transition:"width 0.8s"}}/></div>
                      <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>Health: {a.health}% · RUL: {a.rul} days</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div className="card">
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:16}}>
                      <div><div style={{fontFamily:"Inter,sans-serif",fontSize:18,fontWeight:800,color:BRAND.text}}>{demoSelected.id} · {demoSelected.name}</div><div style={{color:"#64748b",fontSize:12,marginTop:2}}>{demoSelected.location} · Last updated: just now</div></div>
                      <div style={{display:"flex",gap:10,alignItems:"center"}}><DemoHealthRing value={demoSelected.health} status={demoSelected.status}/><DemoStatusBadge status={demoSelected.status}/></div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                      {[{label:"Vibration",value:`${demoSelected.vibration} mm/s`,warn:demoSelected.vibration>4.5,threshold:"Threshold: 4.5"},{label:"Temperature",value:`${demoSelected.temp}°C`,warn:demoSelected.temp>85,threshold:"Threshold: 85°C"},{label:"Pressure",value:`${demoSelected.pressure} bar`,warn:demoSelected.pressure<3.5,threshold:"Min: 3.5 bar"}].map((s,i)=>(
                        <div key={i} style={{background:s.warn?"#fff5f5":"#f8fafc",borderRadius:8,padding:"12px 14px",border:`1px solid ${s.warn?"#fecaca":"#e2e8f0"}`}}>
                          <div style={{fontSize:10,color:"#64748b",marginBottom:3}}>{s.label}</div>
                          <div style={{fontFamily:"Inter,sans-serif",fontSize:20,fontWeight:800,color:s.warn?"#ef4444":"#1d4ed8"}}>{s.value}</div>
                          <div style={{fontSize:10,color:s.warn?"#ef4444":"#94a3b8",marginTop:3}}>{s.warn?"⚠ EXCEEDS LIMIT":s.threshold}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{marginTop:14,background:"#f8fafc",borderRadius:8,padding:14,border:"1px solid #e2e8f0"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12,fontWeight:600,color:"#64748b"}}>Remaining Useful Life</span><span style={{fontSize:16,fontWeight:800,color:demoSelected.rul<20?"#ef4444":demoSelected.rul<45?"#f59e0b":"#1d4ed8"}}>{demoSelected.rul} days</span></div>
                      <div style={{background:"#e2e8f0",borderRadius:4,height:7}}><div style={{height:7,borderRadius:4,width:`${demoSelected.rul}%`,background:demoSelected.rul<20?"#ef4444":demoSelected.rul<45?"#f59e0b":"#1d4ed8",transition:"width 1s"}}/></div>
                      <div style={{fontSize:10,color:"#94a3b8",marginTop:5}}>Predicted failure: {demoSelected.rul<20?"⚠ IMMINENT":`~${demoSelected.rul} days from now`}</div>
                    </div>
                  </div>
                  <div className="card">
                    <div style={{fontSize:13,fontWeight:700,color:"#64748b",marginBottom:12,letterSpacing:1}}>🤖 AI RECOMMENDATIONS</div>
                    {DEMO_RECS.filter(r=>r.asset===demoSelected.id).length===0
                      ? <div style={{color:"#059669",fontSize:13}}>✅ No immediate actions required.</div>
                      : DEMO_RECS.filter(r=>r.asset===demoSelected.id).map((r,i)=>(
                        <div key={i} style={{background:"#f8fafc",borderLeft:`3px solid ${r.priority==="CRITICAL"?"#ef4444":r.priority==="HIGH"?"#f97316":"#f59e0b"}`,borderRadius:7,padding:"10px 14px",marginBottom:8}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                            <span style={{fontSize:12,fontWeight:700,color:BRAND.text}}>{r.icon} {r.action}</span>
                            <span style={{fontSize:11,color:BRAND.blue,background:"#eff6ff",padding:"2px 8px",borderRadius:4,border:"1px solid #bfdbfe"}}>{r.saving}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
            {demoTab==="sensors" && (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div className="card">
                  <div style={{fontSize:15,fontWeight:700,color:BRAND.text,marginBottom:3}}>{demoSelected.id} · Vibration Trend (72hr Window)</div>
                  <div style={{fontSize:12,color:"#94a3b8",marginBottom:14}}>Anomaly at Hour 52 · Critical threshold crossed at Hour 62</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={sensorData}>
                      <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.2}/><stop offset="95%" stopColor="#1d4ed8" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                      <XAxis dataKey="hour" stroke="#e2e8f0" tick={{fill:"#94a3b8",fontSize:10}} interval={11}/>
                      <YAxis stroke="#e2e8f0" tick={{fill:"#94a3b8",fontSize:11}}/>
                      <Tooltip contentStyle={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8}}/>
                      <ReferenceLine y={4.5} stroke="#ef4444" strokeDasharray="4 4" label={{value:"Critical",fill:"#ef4444",fontSize:11}}/>
                      <ReferenceLine y={3.5} stroke="#f59e0b" strokeDasharray="4 4" label={{value:"Warning",fill:"#f59e0b",fontSize:11}}/>
                      <Area type="monotone" dataKey="vibration" stroke="#1d4ed8" fill="url(#sg)" strokeWidth={2} dot={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="g2">
                  <div className="card">
                    <div style={{fontSize:14,fontWeight:700,color:BRAND.text,marginBottom:12}}>Temperature (°C)</div>
                    <ResponsiveContainer width="100%" height={170}>
                      <LineChart data={sensorData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                        <XAxis dataKey="hour" stroke="#e2e8f0" tick={{fill:"#94a3b8",fontSize:10}} interval={11}/>
                        <YAxis stroke="#e2e8f0" tick={{fill:"#94a3b8",fontSize:11}}/>
                        <Tooltip contentStyle={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8}}/>
                        <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="4 4"/>
                        <Line type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={2} dot={false}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card">
                    <div style={{fontSize:14,fontWeight:700,color:BRAND.text,marginBottom:12}}>Remaining Useful Life (%)</div>
                    <ResponsiveContainer width="100%" height={170}>
                      <AreaChart data={sensorData}>
                        <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2}/><stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                        <XAxis dataKey="hour" stroke="#e2e8f0" tick={{fill:"#94a3b8",fontSize:10}} interval={11}/>
                        <YAxis stroke="#e2e8f0" tick={{fill:"#94a3b8",fontSize:11}}/>
                        <Tooltip contentStyle={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8}}/>
                        <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="4 4" label={{value:"Critical",fill:"#ef4444",fontSize:11}}/>
                        <Area type="monotone" dataKey="rul" stroke="#7c3aed" fill="url(#rg)" strokeWidth={2} dot={false}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
            {demoTab==="agent" && (
              <div className="g2">
                <div className="card">
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:16,fontWeight:800,color:BRAND.text,marginBottom:4}}>🤖 AriLinc AI Agent</div>
                  <div style={{fontSize:12,color:"#64748b",marginBottom:18}}>Observe · Reason · Recommend · Act</div>
                  <div style={{background:"#f8fafc",borderRadius:10,padding:16,marginBottom:16,border:"1px solid #e2e8f0"}}>
                    <div style={{fontSize:12,color:"#64748b",marginBottom:10,fontWeight:600}}>AGENT PIPELINE — {demoSelected.id}</div>
                    {[{step:"1. Observe",desc:`Live sensor ingestion from ${demoSelected.id}`,color:"#1d4ed8"},{step:"2. Detect",desc:"Anomaly score 0.94 — bearing wear signature (94% confidence)",color:"#7c3aed"},{step:"3. Reason",desc:"847 historical failures matched · MTBF pattern confirmed",color:"#d97706"},{step:"4. Recommend",desc:"Bearing replacement · Load reduction · Maintenance alert",color:"#059669"},{step:"5. Value",desc:"₹4.2L downtime avoided · 23 production hours saved",color:"#f97316"}].map((s,i)=>(
                      <div key={i} style={{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"}}>
                        <div style={{width:7,height:7,borderRadius:"50%",background:s.color,marginTop:5,flexShrink:0,animation:"pulse 2s infinite"}}/>
                        <div><div style={{fontSize:11,fontWeight:700,color:s.color}}>{s.step}</div><div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{s.desc}</div></div>
                      </div>
                    ))}
                  </div>
                  <button onClick={runDemoAgent} disabled={demoThinking} style={{width:"100%",padding:"11px",background:demoThinking?"#94a3b8":`linear-gradient(135deg,${BRAND.blue},${BRAND.purple})`,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:demoThinking?"not-allowed":"pointer",fontFamily:"Inter,sans-serif"}}>
                    {demoThinking?"🧠 Agent Running...":`▶ Run AI Agent on ${demoSelected.id}`}
                  </button>
                  {demoMsgs.length>0&&(<div style={{marginTop:12,background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:8,padding:12,lineHeight:1.8}}>
                    {demoMsgs.map((m,i)=>(<div key={i} style={{fontSize:12,color:i===demoMsgs.length-1?BRAND.blue:"#94a3b8",marginBottom:i<demoMsgs.length-1?3:0}}>{m}</div>))}
                  </div>)}
                </div>
                <div className="card">
                  <div style={{fontSize:15,fontWeight:700,color:BRAND.text,marginBottom:14}}>📋 Action Queue</div>
                  {DEMO_RECS.map((r,i)=>(<div key={i} className="rc" style={{background:pBg[r.priority]||"#f8fafc",borderLeftColor:pColor[r.priority]||"#94a3b8"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:11,fontWeight:700,color:pColor[r.priority]}}>{r.icon} {r.priority} · {r.asset}</span></div>
                    <div style={{fontSize:12,color:BRAND.text,marginBottom:3}}>{r.action}</div>
                    <div style={{fontSize:11,color:BRAND.blue}}>💡 {r.saving}</div>
                  </div>))}
                </div>
              </div>
            )}
            {demoTab==="value" && (
              <div className="g2">
                <div className="card">
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:16,fontWeight:800,color:BRAND.text,marginBottom:16}}>💰 Business Value Delivered</div>
                  {[{label:"Unplanned Downtime",before:"18 hrs/mo",after:"4 hrs/mo",saving:"78% reduction",color:"#0891b2"},{label:"Maintenance Cost",before:"₹28L/mo",after:"₹17L/mo",saving:"₹11L saved",color:"#059669"},{label:"MTBF",before:"22 days",after:"61 days",saving:"2.8× improvement",color:"#7c3aed"},{label:"Asset Utilization",before:"71%",after:"89%",saving:"+18% uplift",color:"#d97706"},{label:"Emergency Work Orders",before:"12/mo",after:"3/mo",saving:"75% reduction",color:"#f59e0b"}].map((v,i)=>(
                    <div key={i} style={{marginBottom:12,background:"#f8fafc",borderRadius:8,padding:12,border:"1px solid #e2e8f0"}}>
                      <div style={{fontSize:12,fontWeight:600,color:"#64748b",marginBottom:6}}>{v.label}</div>
                      <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
                        <div style={{textAlign:"center"}}><div style={{fontSize:10,color:"#94a3b8"}}>Before</div><div style={{fontSize:13,fontWeight:700,color:"#ef4444"}}>{v.before}</div></div>
                        <div style={{color:"#cbd5e1",fontSize:14}}>→</div>
                        <div style={{textAlign:"center"}}><div style={{fontSize:10,color:"#94a3b8"}}>After AriLinc</div><div style={{fontSize:13,fontWeight:700,color:"#059669"}}>{v.after}</div></div>
                        <div style={{marginLeft:"auto",background:`${v.color}15`,border:`1px solid ${v.color}40`,borderRadius:5,padding:"3px 9px",fontSize:11,fontWeight:700,color:v.color}}>{v.saving}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div className="card">
                    <div style={{fontSize:15,fontWeight:700,color:BRAND.text,marginBottom:14}}>📊 ROI Summary</div>
                    {[{label:"Annual Cost Savings",value:"₹1.32 Cr",color:"#059669"},{label:"Implementation Cost",value:"₹18L",color:"#64748b"},{label:"Payback Period",value:"< 2 months",color:"#1d4ed8"},{label:"3-Year ROI",value:"634%",color:"#7c3aed"}].map((r,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f1f5f9"}}><span style={{fontSize:12,color:"#64748b"}}>{r.label}</span><span style={{fontFamily:"Inter,sans-serif",fontSize:15,fontWeight:800,color:r.color}}>{r.value}</span></div>))}
                  </div>
                  <div className="card">
                    <div style={{fontSize:15,fontWeight:700,color:BRAND.text,marginBottom:12}}>🏭 About This Demo</div>
                    <div style={{fontSize:12,color:"#64748b",lineHeight:1.8,marginBottom:12}}>Synthetic sensor data simulating a real plant with 4 assets over 72 hours. AI detects bearing degradation on <strong style={{color:"#ef4444"}}>P-101</strong> with 94% confidence. In production, AriLinc connects to <strong style={{color:"#0891b2"}}>SCADA, PLC, IoT sensors</strong> in real-time.</div>
                    <div style={{background:"linear-gradient(135deg,#eff6ff,#f5f3ff)",border:"1px solid #bfdbfe",borderRadius:8,padding:14,textAlign:"center"}}>
                      <div style={{fontSize:13,color:"#1d4ed8",fontWeight:700,marginBottom:4}}>Ready to see this with your plant data?</div>
                      <a href="mailto:info@ariprus.com" style={{fontSize:12,color:"#64748b",textDecoration:"none",display:"block",marginBottom:10}}>✉ info@ariprus.com</a>
                      <a href="https://agents.ariprus.com" target="_blank" rel="noopener noreferrer" style={{display:"block",background:"linear-gradient(135deg,#1d4ed8,#7c3aed)",color:"#fff",padding:"10px",borderRadius:8,fontWeight:700,fontSize:13,textDecoration:"none"}}>Book a Live Demo →</a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="fw">
        <div style={{fontSize:12,color:BRAND.light}}><span style={{color:BRAND.green}}>●</span> AriLinc Platform · Assets · AI Agents · Value · Executive View · Powered by AriPrus</div>
        <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
          <a href="mailto:info@ariprus.com" style={{fontSize:12,color:BRAND.sub,textDecoration:"none"}}>✉ info@ariprus.com</a>
          <a href="https://ariprus.com/contact-us/" target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:BRAND.blue,fontWeight:700,textDecoration:"none"}}>Talk to us about your plant →</a>
        </div>
      </div>
    </div>
  );
}

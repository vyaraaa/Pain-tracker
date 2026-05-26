import { useState, useEffect } from "react";

// ─── STORAGE ──────────────────────────────────────────────────────────────────
async function loadEntries() {
  try { const r = localStorage.getItem("pt-entries"); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
async function saveEntries(e) {
  try { localStorage.setItem("pt-entries", JSON.stringify(e)); } catch {}
}
async function loadCommunity() {
  try { const r = localStorage.getItem("pt-community"); return r ? JSON.parse(r) : { total:0, triggers:{}, days:{} }; }
  catch { return { total:0, triggers:{}, days:{} }; }
}
async function saveCommunity(d) {
  try { localStorage.setItem("pt-community", JSON.stringify(d)); } catch {}
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ZONES = [
  { id:"temple_l", label:"Ляво слепоочие", x:28, y:14 },
  { id:"temple_r", label:"Дясно слепоочие", x:72, y:14 },
  { id:"forehead",  label:"Чело",           x:50, y:9  },
  { id:"ear_l",     label:"Зад лявото ухо", x:16, y:36 },
  { id:"ear_r",     label:"Зад дясното ухо",x:84, y:36 },
  { id:"jaw_l",     label:"Лява челюст",    x:26, y:52 },
  { id:"jaw_r",     label:"Дясна челюст",   x:74, y:52 },
  { id:"neck_l",    label:"Ляв врат",       x:34, y:70 },
  { id:"neck_r",    label:"Десен врат",     x:66, y:70 },
  { id:"occiput",   label:"Тил",            x:50, y:80 },
  { id:"shoulder_l",label:"Ляво рамо",      x:12, y:88 },
  { id:"shoulder_r",label:"Дясно рамо",     x:88, y:88 },
];

const TRIGGERS = [
  { id:"stress",   emoji:"😰", label:"Стрес"            },
  { id:"sleep",    emoji:"😴", label:"Лош сън"          },
  { id:"screen",   emoji:"💻", label:"Много екран"      },
  { id:"caffeine", emoji:"☕", label:"Кофеин / Алкохол" },
  { id:"food",     emoji:"🍽", label:"Определена храна" },
  { id:"hormones", emoji:"🔄", label:"Хормони"          },
  { id:"weather",  emoji:"🌩", label:"Времето"          },
  { id:"clench",   emoji:"😬", label:"Стискане на зъби" },
  { id:"posture",  emoji:"📱", label:"Лоша стойка"      },
  { id:"none",     emoji:"❓", label:"Не знам"          },
];

const DAYS_BG = ["Нд","Пн","Вт","Ср","Чт","Пт","Сб"];
const MONTHS_BG = ["Яну","Фев","Мар","Апр","Май","Юни","Юли","Авг","Сеп","Окт","Ное","Дек"];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function ic(v) {
  if (!v || v===0) return "#D8CFC4";
  if (v<=3) return "#6FA888";
  if (v<=6) return "#E8A558";
  return "#C5654A";
}
function il(v) {
  if (!v||v===0) return "Без болка";
  if (v<=2) return "Лека";
  if (v<=4) return "Умерена";
  if (v<=7) return "Силна";
  return "Много силна";
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]       = useState("home");
  const [entries, setEntries]     = useState([]);
  const [community, setCommunity] = useState({ total:0, triggers:{}, days:{} });
  const [loading, setLoading]     = useState(true);

  // form
  const [step, setStep]           = useState(1);
  const [intensity, setIntensity] = useState(0);
  const [zones, setZones]         = useState([]);
  const [trigs, setTrigs]         = useState([]);
  const [mood, setMood]           = useState(null);
  const [note, setNote]           = useState("");
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const e = await loadEntries();
      const c = await loadCommunity();
      setEntries(e);
      setCommunity(c);
      const te = e.find(x => x.date === todayKey());
      if (te) {
        setIntensity(te.intensity); setZones(te.zones);
        setTrigs(te.triggers); setMood(te.mood); setNote(te.note||"");
        setJustSaved(true);
      }
      setLoading(false);
    })();
  }, []);

  const toggleZone = id => setZones(z => z.includes(id) ? z.filter(x=>x!==id) : [...z,id]);
  const toggleTrig = id => setTrigs(t => t.includes(id) ? t.filter(x=>x!==id) : [...t,id]);

  const handleSave = async () => {
    const entry = { date:todayKey(), intensity, zones, triggers:trigs, mood, note, ts:Date.now() };
    const updated = [...entries.filter(e=>e.date!==todayKey()), entry];
    setEntries(updated);
    await saveEntries(updated);
    const c = await loadCommunity();
    const nc = { ...c, total:(c.total||0)+1, triggers:{...(c.triggers||{})}, days:{...(c.days||{})} };
    trigs.forEach(t => { nc.triggers[t]=(nc.triggers[t]||0)+1; });
    if (intensity>0) { const dow=new Date().getDay(); nc.days[dow]=(nc.days[dow]||0)+1; }
    await saveCommunity(nc);
    setCommunity(nc);
    setJustSaved(true);
    setTimeout(()=>{ setScreen("stats"); }, 600);
  };

  const todayEntry = entries.find(e=>e.date===todayKey());
  const last7 = Array.from({length:7},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-(6-i));
    const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    return { key:k, dow:DAYS_BG[d.getDay()], entry:entries.find(e=>e.date===k) };
  });
  const myTrigCount = {};
  entries.forEach(e=>(e.triggers||[]).forEach(t=>{ myTrigCount[t]=(myTrigCount[t]||0)+1; }));
  const topTrig = Object.entries(myTrigCount).sort((a,b)=>b[1]-a[1])[0];
  const topTrigObj = topTrig ? TRIGGERS.find(t=>t.id===topTrig[0]) : null;
  const avgInt = entries.length ? (entries.reduce((s,e)=>s+(e.intensity||0),0)/entries.length).toFixed(1) : null;
  const commTopTrig = Object.entries(community.triggers||{}).sort((a,b)=>b[1]-a[1])[0];
  const commTopTrigObj = commTopTrig ? TRIGGERS.find(t=>t.id===commTopTrig[0]) : null;
  const streak = (() => {
    let s=0;
    for(let i=0;i<60;i++){
      const d=new Date(); d.setDate(d.getDate()-i);
      const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      if(entries.find(e=>e.date===k)) s++; else break;
    }
    return s;
  })();

  const isDark = screen==="log";

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#0F0F0F",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}>
      <div style={{fontSize:40}}>🧠</div>
      <div style={{fontFamily:"Georgia,serif",fontSize:16,color:"rgba(245,238,230,0.4)"}}>Зареждане…</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:isDark?"#0F0F0F":"#F7F2EB",maxWidth:480,margin:"0 auto",position:"relative",fontFamily:"Georgia, serif",transition:"background 0.35s"}}>

      {screen==="home"  && <HomeScreen  {...{entries,last7,todayEntry,avgInt,topTrigObj,streak,community,commTopTrigObj,setScreen,setStep,setIntensity,setZones,setTrigs,setMood,setNote,setJustSaved}} />}
      {screen==="log"   && <LogScreen   {...{step,setStep,intensity,setIntensity,zones,toggleZone,trigs,toggleTrig,mood,setMood,note,setNote,justSaved,handleSave,setScreen}} />}
      {screen==="stats" && <StatsScreen {...{entries,last7,avgInt,topTrigObj,myTrigCount,community,commTopTrigObj,setScreen}} />}
      {screen==="share" && <ShareScreen {...{entries,avgInt,topTrigObj,last7,community,setScreen}} />}

      <NavBar screen={screen} setScreen={setScreen} todayEntry={todayEntry} isDark={isDark} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// HOME
// ═══════════════════════════════════════════════════════
function HomeScreen({ entries, last7, todayEntry, avgInt, topTrigObj, streak, community, commTopTrigObj, setScreen, setStep, setIntensity, setZones, setTrigs, setMood, setNote, setJustSaved }) {
  const openLog = () => { setStep(1); setIntensity(0); setZones([]); setTrigs([]); setMood(null); setNote(""); setJustSaved(false); setScreen("log"); };

  return (
    <div style={{paddingBottom:88}}>
      {/* Hero header */}
      <div style={{background:"#1B1410",padding:"52px 24px 32px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-50,right:-50,width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle, rgba(197,101,74,0.22) 0%, transparent 68%)",pointerEvents:"none"}}/>
        <div style={{fontSize:10,letterSpacing:4,color:"#C5654A",textTransform:"uppercase",marginBottom:14}}>Дневник на болката</div>
        <div style={{fontSize:34,fontWeight:700,color:"#F5EEE6",lineHeight:1.15,marginBottom:6}}>
          Как се<br/>чувстваш<br/><em style={{color:"#D4A080",fontStyle:"italic"}}>днес?</em>
        </div>
        <div style={{fontSize:12,color:"rgba(245,238,230,0.38)",marginTop:10,letterSpacing:1}}>ТМС · Мигрена · Бруксизъм</div>
        <div style={{marginTop:24,display:"flex",gap:10,flexWrap:"wrap"}}>
          {todayEntry ? (
            <div style={{background:"rgba(111,168,136,0.18)",border:"1px solid rgba(111,168,136,0.35)",borderRadius:12,padding:"10px 16px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:16}}>✅</span>
              <span style={{fontSize:13,color:"#A8D4B8"}}>Днешният запис е готов</span>
            </div>
          ) : (
            <button onClick={openLog} style={{background:"#C5654A",border:"none",borderRadius:12,padding:"13px 26px",color:"white",fontSize:15,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer",letterSpacing:0.5}}>
              + Запиши днес
            </button>
          )}
          {streak > 1 && (
            <div style={{background:"rgba(197,101,74,0.14)",border:"1px solid rgba(197,101,74,0.28)",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:6}}>
              <span>🔥</span>
              <span style={{fontSize:13,color:"#D4A080"}}>{streak} дни подред</span>
            </div>
          )}
        </div>
      </div>

      <div style={{padding:"22px 18px 0"}}>
        {/* 7-day bars */}
        <div style={{marginBottom:26}}>
          <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#9A8878",marginBottom:12}}>Последните 7 дни</div>
          <div style={{display:"flex",gap:5,height:64,alignItems:"flex-end"}}>
            {last7.map(({key,dow,entry})=>(
              <div key={key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{
                  width:"100%",borderRadius:6,
                  background: entry ? ic(entry.intensity) : "#E5DDD3",
                  height: entry && entry.intensity>0 ? `${Math.max(10,entry.intensity*6)}px` : "10px",
                  border: key===todayKey()?"2px solid #C5654A":"2px solid transparent",
                  transition:"all 0.3s",display:"flex",alignItems:"center",justifyContent:"center",
                }}>
                  {entry && entry.intensity>0 && <span style={{fontSize:9,color:"white",fontWeight:700}}>{entry.intensity}</span>}
                </div>
                <span style={{fontSize:9,color:"#B8A898"}}>{dow}</span>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:10,marginTop:8,flexWrap:"wrap"}}>
            {[["#6FA888","Лека"],["#E8A558","Умерена"],["#C5654A","Силна"]].map(([c,l])=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:8,height:8,borderRadius:2,background:c}}/>
                <span style={{fontSize:10,color:"#B8A898"}}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        {entries.length > 0 && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
            <MiniCard icon="📊" title="Средна болка" value={`${avgInt}/10`} sub={`${entries.length} записа`} />
            <MiniCard icon="🎯" title="Основен тригер" value={topTrigObj?`${topTrigObj.emoji} ${topTrigObj.label}`:"—"} sub="твоят личен" />
          </div>
        )}

        {/* Community box */}
        {community.total > 0 && (
          <div style={{background:"#1B1410",borderRadius:16,padding:20,marginBottom:20}}>
            <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#C5654A",marginBottom:8}}>👥 Общност</div>
            <div style={{fontSize:13,color:"rgba(245,238,230,0.7)",lineHeight:1.65}}>
              <strong style={{color:"#F5EEE6"}}>{community.total}</strong> потребители са записали симптоми.
              {commTopTrigObj && <> Най-честият тригер е <strong style={{color:"#D4A080"}}>{commTopTrigObj.emoji} {commTopTrigObj.label}</strong>.</>}
            </div>
            <button onClick={()=>setScreen("share")} style={{marginTop:12,background:"transparent",border:"1px solid rgba(197,101,74,0.35)",borderRadius:8,padding:"8px 14px",color:"#D4A080",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>Сподели резултатите си →</button>
          </div>
        )}

        {entries.length===0 && (
          <div style={{textAlign:"center",padding:"32px 20px",background:"white",borderRadius:16,border:"1px dashed #D4C4B4"}}>
            <div style={{fontSize:44,marginBottom:12}}>📋</div>
            <div style={{fontSize:20,fontWeight:700,marginBottom:8}}>Започни дневника си</div>
            <div style={{fontSize:13,color:"#9A8878",lineHeight:1.65}}>Записвай всеки ден. След 7 дни ще видиш кои са твоите лични тригери.</div>
            <button onClick={openLog} style={{marginTop:18,background:"#C5654A",border:"none",borderRadius:10,padding:"13px 28px",color:"white",fontSize:14,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:700}}>Запиши първия запис</button>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniCard({ icon, title, value, sub }) {
  return (
    <div style={{background:"white",borderRadius:14,padding:"16px 14px",border:"1px solid #E8DDD0"}}>
      <div style={{fontSize:22,marginBottom:6}}>{icon}</div>
      <div style={{fontSize:10,color:"#9A8878",letterSpacing:1,marginBottom:3}}>{title.toUpperCase()}</div>
      <div style={{fontSize:15,fontWeight:700,color:"#1A1410",marginBottom:2,lineHeight:1.2}}>{value}</div>
      <div style={{fontSize:10,color:"#B8A898"}}>{sub}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// LOG
// ═══════════════════════════════════════════════════════
function LogScreen({ step, setStep, intensity, setIntensity, zones, toggleZone, trigs, toggleTrig, mood, setMood, note, setNote, justSaved, handleSave, setScreen }) {
  const stepLabels = ["","Интензивност","Местоположение","Тригери","Настроение"];
  return (
    <div style={{minHeight:"100vh",background:"#0F0F0F",color:"#F5EEE6",paddingBottom:88}}>
      {/* Top bar */}
      <div style={{padding:"22px 20px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>step>1?setStep(step-1):setScreen("home")} style={{background:"rgba(255,255,255,0.07)",border:"none",borderRadius:8,padding:"7px 14px",color:"rgba(245,238,230,0.55)",fontSize:13,cursor:"pointer",fontFamily:"Georgia,serif"}}>← Назад</button>
        <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#C5654A"}}>{step}/4 — {stepLabels[step]}</div>
        <div style={{width:70}}/>
      </div>
      <div style={{margin:"14px 20px 0",height:3,background:"rgba(255,255,255,0.07)",borderRadius:2}}>
        <div style={{height:"100%",borderRadius:2,background:"#C5654A",width:`${(step/4)*100}%`,transition:"width 0.4s"}}/>
      </div>

      <div style={{padding:"28px 20px"}}>

        {/* ── STEP 1 ── */}
        {step===1 && (
          <div>
            <div style={{fontSize:28,fontWeight:700,lineHeight:1.2,marginBottom:6}}>Колко силна е<br/>болката днес?</div>
            <div style={{fontSize:12,color:"rgba(245,238,230,0.38)",marginBottom:30}}>0 = никаква · 10 = непоносима</div>
            <div style={{textAlign:"center",marginBottom:24}}>
              <div style={{fontSize:96,fontWeight:700,lineHeight:1,color:intensity===0?"rgba(245,238,230,0.15)":ic(intensity),transition:"color 0.3s"}}>{intensity}</div>
              <div style={{fontSize:16,color:"rgba(245,238,230,0.4)",marginTop:6,fontStyle:"italic"}}>{intensity===0?"Премести плъзгача":il(intensity)}</div>
            </div>
            <input type="range" min={0} max={10} value={intensity} onChange={e=>setIntensity(+e.target.value)}
              style={{width:"100%",marginBottom:20,accentColor:"#C5654A",cursor:"pointer",height:6}} />
            <div style={{display:"grid",gridTemplateColumns:"repeat(11,1fr)",gap:3,marginBottom:28}}>
              {[...Array(11)].map((_,i)=>(
                <button key={i} onClick={()=>setIntensity(i)} style={{
                  padding:"11px 0",borderRadius:8,border:"none",cursor:"pointer",
                  background:intensity===i?ic(i||1):"rgba(255,255,255,0.06)",
                  color:intensity===i?"white":"rgba(245,238,230,0.45)",
                  fontSize:13,fontWeight:700,fontFamily:"Georgia,serif",transition:"all 0.2s",
                }}>{i}</button>
              ))}
            </div>
            <button onClick={()=>intensity>0&&setStep(2)} style={{
              width:"100%",padding:16,borderRadius:12,border:"none",cursor:"pointer",
              background:intensity>0?"#C5654A":"rgba(255,255,255,0.07)",
              color:intensity>0?"white":"rgba(245,238,230,0.28)",
              fontSize:16,fontFamily:"Georgia,serif",fontWeight:700,transition:"all 0.3s",
            }}>Напред →</button>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step===2 && (
          <div>
            <div style={{fontSize:28,fontWeight:700,lineHeight:1.2,marginBottom:6}}>Къде те боли?</div>
            <div style={{fontSize:12,color:"rgba(245,238,230,0.38)",marginBottom:20}}>Маркирай всички за��егнати зони</div>
            {/* Head SVG map */}
            <div style={{position:"relative",width:240,height:240,margin:"0 auto 20px"}}>
              <svg width="240" height="240" viewBox="0 0 100 100" style={{position:"absolute",inset:0}}>
                <ellipse cx="50" cy="34" rx="26" ry="30" fill="none" stroke="rgba(245,238,230,0.12)" strokeWidth="1.2"/>
                <path d="M32 61 Q50 86 68 61" fill="none" stroke="rgba(245,238,230,0.12)" strokeWidth="1.2"/>
                <line x1="50" y1="4" x2="50" y2="8" stroke="rgba(245,238,230,0.08)" strokeWidth="1"/>
              </svg>
              {ZONES.map(z=>(
                <button key={z.id} onClick={()=>toggleZone(z.id)} title={z.label} style={{
                  position:"absolute",
                  left:`${z.x}%`,top:`${z.y}%`,
                  transform:"translate(-50%,-50%)",
                  width:24,height:24,borderRadius:"50%",border:"none",cursor:"pointer",
                  background:zones.includes(z.id)?"#C5654A":"rgba(245,238,230,0.1)",
                  border:zones.includes(z.id)?"2px solid #E8A080":"2px solid rgba(245,238,230,0.2)",
                  transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",
                }}>
                  {zones.includes(z.id)&&<span style={{fontSize:9,color:"white"}}>●</span>}
                </button>
              ))}
            </div>
            {/* Label chips */}
            <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:26}}>
              {ZONES.map(z=>(
                <button key={z.id} onClick={()=>toggleZone(z.id)} style={{
                  padding:"5px 11px",borderRadius:100,cursor:"pointer",fontSize:12,fontFamily:"Georgia,serif",border:"none",
                  background:zones.includes(z.id)?"rgba(197,101,74,0.22)":"rgba(255,255,255,0.06)",
                  color:zones.includes(z.id)?"#D4A080":"rgba(245,238,230,0.52)",
                  border:zones.includes(z.id)?"1px solid rgba(197,101,74,0.45)":"1px solid rgba(255,255,255,0.09)",
                  transition:"all 0.2s",
                }}>{z.label}</button>
              ))}
            </div>
            <button onClick={()=>setStep(3)} style={{width:"100%",padding:16,borderRadius:12,border:"none",background:"#C5654A",color:"white",fontSize:16,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer"}}>Напред →</button>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step===3 && (
          <div>
            <div style={{fontSize:28,fontWeight:700,lineHeight:1.2,marginBottom:6}}>Какво го<br/>е предизвикало?</div>
            <div style={{fontSize:12,color:"rgba(245,238,230,0.38)",marginBottom:22}}>Избери всичко, което може да е причина</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:26}}>
              {TRIGGERS.map(t=>(
                <button key={t.id} onClick={()=>toggleTrig(t.id)} style={{
                  padding:"14px 12px",borderRadius:12,cursor:"pointer",textAlign:"left",
                  background:trigs.includes(t.id)?"rgba(197,101,74,0.18)":"rgba(255,255,255,0.05)",
                  border:trigs.includes(t.id)?"1px solid rgba(197,101,74,0.5)":"1px solid rgba(255,255,255,0.08)",
                  fontFamily:"Georgia,serif",transition:"all 0.2s",
                }}>
                  <div style={{fontSize:24,marginBottom:4}}>{t.emoji}</div>
                  <div style={{fontSize:13,color:trigs.includes(t.id)?"#D4A080":"rgba(245,238,230,0.6)"}}>{t.label}</div>
                </button>
              ))}
            </div>
            <button onClick={()=>setStep(4)} style={{width:"100%",padding:16,borderRadius:12,border:"none",background:"#C5654A",color:"white",fontSize:16,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer"}}>Напред →</button>
          </div>
        )}

        {/* ── STEP 4 ── */}
        {step===4 && (
          <div>
            <div style={{fontSize:28,fontWeight:700,lineHeight:1.2,marginBottom:6}}>Как е<br/>настроението?</div>
            <div style={{fontSize:12,color:"rgba(245,238,230,0.38)",marginBottom:24}}>Болката влияе на цялото ни самочувствие</div>
            <div style={{display:"flex",gap:9,justifyContent:"center",marginBottom:26}}>
              {[["😔","Много лошо"],["😕","Лошо"],["😐","Нормално"],["🙂","Добре"],["😊","Отлично"]].map(([em,lb],i)=>(
                <button key={i} onClick={()=>setMood(i+1)} style={{
                  flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5,
                  padding:"12px 6px",borderRadius:12,cursor:"pointer",
                  background:mood===i+1?"rgba(197,101,74,0.2)":"rgba(255,255,255,0.05)",
                  border:mood===i+1?"1px solid rgba(197,101,74,0.5)":"1px solid rgba(255,255,255,0.08)",
                  fontFamily:"Georgia,serif",transition:"all 0.2s",
                }}>
                  <span style={{fontSize:28}}>{em}</span>
                  <span style={{fontSize:9,color:"rgba(245,238,230,0.38)",lineHeight:1.2,textAlign:"center"}}>{lb}</span>
                </button>
              ))}
            </div>
            <div style={{marginBottom:22}}>
              <div style={{fontSize:11,color:"rgba(245,238,230,0.38)",marginBottom:8,letterSpacing:1}}>Бележка (по желание)</div>
              <textarea value={note} onChange={e=>setNote(e.target.value)}
                placeholder="Нещо, което искаш да запомниш за деня…"
                rows={3}
                style={{width:"100%",padding:"12px",borderRadius:12,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"#F5EEE6",fontSize:14,fontFamily:"Georgia,serif",resize:"none",outline:"none",boxSizing:"border-box"}}
              />
            </div>
            <button onClick={handleSave} style={{
              width:"100%",padding:16,borderRadius:12,border:"none",cursor:"pointer",
              background:justSaved?"#6FA888":"#C5654A",color:"white",
              fontSize:16,fontFamily:"Georgia,serif",fontWeight:700,transition:"all 0.4s",
            }}>{justSaved?"✓ Записано!":"Запиши ✓"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════
function StatsScreen({ entries, last7, avgInt, topTrigObj, myTrigCount, community, commTopTrigObj, setScreen }) {
  const goodDays = last7.filter(d=>d.entry&&d.entry.intensity>0&&d.entry.intensity<=3).length;
  const sortedTrigs = Object.entries(myTrigCount).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const zoneCount = {};
  entries.forEach(e=>(e.zones||[]).forEach(z=>{ zoneCount[z]=(zoneCount[z]||0)+1; }));
  const topZones = Object.entries(zoneCount).sort((a,b)=>b[1]-a[1]).slice(0,4);

  return (
    <div style={{background:"#F7F2EB",paddingBottom:88}}>
      <div style={{background:"#1B1410",padding:"40px 20px 28px"}}>
        <div style={{fontSize:10,letterSpacing:4,textTransform:"uppercase",color:"#C5654A",marginBottom:8}}>Моята статистика</div>
        <div style={{fontSize:30,fontWeight:700,color:"#F5EEE6",lineHeight:1.15}}>Анализ на<br/><em style={{color:"#D4A080"}}>твоите записи</em></div>
      </div>

      <div style={{padding:"18px 16px"}}>
        {entries.length < 3 ? (
          <div style={{background:"white",borderRadius:16,padding:28,textAlign:"center",border:"1px solid #E8DDD0"}}>
            <div style={{fontSize:44,marginBottom:10}}>📈</div>
            <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>Нужни са повече данни</div>
            <div style={{fontSize:13,color:"#9A8878",lineHeight:1.65}}>Запиши поне 3 дни, за да видиш своя личен анализ.</div>
            <button onClick={()=>setScreen("log")} style={{marginTop:16,background:"#C5654A",border:"none",borderRadius:10,padding:"12px 26px",color:"white",fontSize:14,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:700}}>+ Запиши днес</button>
          </div>
        ) : (<>
          {/* Summary */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
            {[
              { v:avgInt, sub:`${entries.length} записа`, label:"Средна болка", color:ic(+avgInt) },
              { v:goodDays, sub:"добри дни (1–3)", label:"Добри дни", color:"#6FA888" },
              { v:entries.length, sub:"общо записа", label:"Проследяване", color:"#7B6EA8" },
            ].map(({v,sub,label,color})=>(
              <div key={label} style={{background:"white",borderRadius:13,padding:"14px 10px",border:"1px solid #E8DDD0",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#9A8878",letterSpacing:1,marginBottom:3,textTransform:"uppercase"}}>{label}</div>
                <div style={{fontSize:26,fontWeight:700,color,lineHeight:1}}>{v}</div>
                <div style={{fontSize:9,color:"#B8A898",marginTop:3,lineHeight:1.3}}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Weekly chart */}
          <div style={{background:"white",borderRadius:16,padding:18,marginBottom:16,border:"1px solid #E8DDD0"}}>
            <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#9A8878",marginBottom:14}}>Тази седмица</div>
            <div style={{display:"flex",gap:6,alignItems:"flex-end",height:72}}>
              {last7.map(({key,dow,entry})=>(
                <div key={key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{
                    width:"100%",borderRadius:5,
                    background:entry&&entry.intensity>0?ic(entry.intensity):"#F0E8E0",
                    height:entry&&entry.intensity>0?`${Math.max(8,entry.intensity*7)}px`:"8px",
                    transition:"height 0.5s",
                  }}/>
                  <span style={{fontSize:9,color:"#B8A898"}}>{dow}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trigger bars */}
          {sortedTrigs.length > 0 && (
            <div style={{background:"white",borderRadius:16,padding:18,marginBottom:16,border:"1px solid #E8DDD0"}}>
              <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#C5654A",marginBottom:14}}>Твоите тригери</div>
              {sortedTrigs.map(([id,count])=>{
                const t=TRIGGERS.find(x=>x.id===id); if(!t)return null;
                const pct=Math.round((count/entries.length)*100);
                return (
                  <div key={id} style={{marginBottom:13}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <span style={{fontSize:13}}>{t.emoji} {t.label}</span>
                      <span style={{fontSize:12,color:"#9A8878"}}>{count}× ({pct}%)</span>
                    </div>
                    <div style={{height:7,borderRadius:4,background:"#F0E8E0"}}>
                      <div style={{height:"100%",borderRadius:4,background:"#C5654A",width:`${pct}%`,transition:"width 0.7s"}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Top zones */}
          {topZones.length > 0 && (
            <div style={{background:"white",borderRadius:16,padding:18,marginBottom:16,border:"1px solid #E8DDD0"}}>
              <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#5B7C6E",marginBottom:12}}>Най-засегнати зони</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {topZones.map(([id,count])=>{
                  const z=ZONES.find(x=>x.id===id); if(!z)return null;
                  return (
                    <div key={id} style={{background:"#F7F2EB",borderRadius:10,padding:"10px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:13,color:"#3A3028"}}>{z.label}</span>
                      <span style={{fontSize:12,color:"#9A8878",fontWeight:700}}>{count}×</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Personal insight */}
          {topTrigObj && (
            <div style={{background:"#1B1410",borderRadius:16,padding:20,marginBottom:16}}>
              <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#C5654A",marginBottom:10}}>💡 Личен извод</div>
              <div style={{fontSize:14,color:"rgba(245,238,230,0.78)",lineHeight:1.7}}>
                Твоят най-чест тригер е <strong style={{color:"#D4A080"}}>{topTrigObj.emoji} {topTrigObj.label}</strong>. Внимавай особено в дни с висок стрес или нарушен сън — точно тогава рискът е най-висок.
              </div>
            </div>
          )}

          {/* Community */}
          {community.total > 1 && (
            <div style={{background:"white",borderRadius:16,padding:18,marginBottom:16,border:"1px solid #E8DDD0"}}>
              <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#5B7C6E",marginBottom:10}}>👥 Общностна статистика</div>
              <div style={{fontSize:13,color:"#5A5040",lineHeight:1.7}}>
                <strong>{community.total}</strong> потребители са използвали дневника.
                {commTopTrigObj && <> Най-честият общ тригер е <strong>{commTopTrigObj.emoji} {commTopTrigObj.label}</strong>.</>}
              </div>
              <button onClick={()=>setScreen("share")} style={{marginTop:14,width:"100%",padding:12,borderRadius:10,border:"1px solid #C5654A",background:"transparent",color:"#C5654A",fontSize:13,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:700}}>
                📸 Сподели в Instagram Stories
              </button>
            </div>
          )}
        </>)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SHARE
// ═══════════════════════════════════════════════════════
function ShareScreen({ entries, avgInt, topTrigObj, last7, community, setScreen }) {
  const [copied, setCopied] = useState(false);
  const goodDays = last7.filter(d=>d.entry&&d.entry.intensity>0&&d.entry.intensity<=3).length;

  const caption = [
    `📊 Дневникът ми на болката — ${entries.length} дни`,
    ``,
    `Средна интензивност: ${avgInt||"—"}/10`,
    `Добри дни тази седмица: ${goodDays}/7`,
    topTrigObj ? `Основен тригер: ${topTrigObj.emoji} ${topTrigObj.label}` : "",
    ``,
    `🔗 Проследи и ти своята болка → линк в bio`,
    ``,
    `#ТМС #МигренаБългария #БруксизъмБГ #ДневникНаБолката #ЗдравеБГ #ТМСдисфункция`,
  ].filter(l=>l!==undefined).join("\n");

  const copy = () => {
    navigator.clipboard.writeText(caption).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2500); });
  };

  return (
    <div style={{background:"#F7F2EB",paddingBottom:88}}>
      <div style={{background:"#1B1410",padding:"40px 20px 28px"}}>
        <div style={{fontSize:10,letterSpacing:4,textTransform:"uppercase",color:"#C5654A",marginBottom:8}}>Сподели</div>
        <div style={{fontSize:30,fontWeight:700,color:"#F5EEE6",lineHeight:1.15}}>Твоята карта<br/><em style={{color:"#D4A080"}}>за Instagram</em></div>
      </div>

      <div style={{padding:"18px 16px"}}>
        {/* Story card preview */}
        <div style={{borderRadius:20,background:"linear-gradient(155deg,#1B1410,#261A12)",padding:26,marginBottom:16,border:"2px solid rgba(197,101,74,0.3)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle,rgba(197,101,74,0.18) 0%,transparent 70%)",pointerEvents:"none"}}/>
          <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#C5654A",marginBottom:16}}>📊 Дневникът ми на болката</div>
          {/* Mini bars */}
          <div style={{display:"flex",gap:4,alignItems:"flex-end",height:44,marginBottom:16}}>
            {last7.map(({dow,entry},i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{width:"100%",borderRadius:3,background:entry&&entry.intensity>0?ic(entry.intensity):"rgba(255,255,255,0.08)",height:entry&&entry.intensity>0?`${Math.max(5,entry.intensity*4)}px`:"5px"}}/>
                <span style={{fontSize:7,color:"rgba(245,238,230,0.28)"}}>{dow}</span>
              </div>
            ))}
          </div>
          {/* Numbers row */}
          <div style={{display:"flex",gap:10,marginBottom:14}}>
            {[
              { v:avgInt||"—", label:"средна болка", color:ic(+(avgInt||0)) },
              { v:goodDays, label:"добри дни", color:"#6FA888" },
              { v:entries.length, label:"записа", color:"#D4A080" },
            ].map(({v,label,color})=>(
              <div key={label} style={{flex:1,background:"rgba(255,255,255,0.05)",borderRadius:9,padding:"11px 8px",textAlign:"center"}}>
                <div style={{fontSize:24,fontWeight:700,color,lineHeight:1}}>{v}</div>
                <div style={{fontSize:9,color:"rgba(245,238,230,0.35)",marginTop:3}}>{label}</div>
              </div>
            ))}
          </div>
          {topTrigObj && (
            <div style={{background:"rgba(197,101,74,0.12)",border:"1px solid rgba(197,101,74,0.22)",borderRadius:9,padding:"9px 12px",marginBottom:14}}>
              <div style={{fontSize:10,color:"rgba(245,238,230,0.35)",marginBottom:2}}>Основен тригер</div>
              <div style={{fontSize:14,color:"#D4A080"}}>{topTrigObj.emoji} {topTrigObj.label}</div>
            </div>
          )}
          <div style={{fontSize:11,color:"rgba(245,238,230,0.28)",textAlign:"center",fontStyle:"italic"}}>🔗 Линк в bio → Проследи и ти</div>
        </div>

        {/* Caption box */}
        <div style={{background:"white",borderRadius:16,padding:18,marginBottom:16,border:"1px solid #E8DDD0"}}>
          <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#9A8878",marginBottom:10}}>Caption за поста</div>
          <pre style={{fontSize:13,color:"#5A5040",lineHeight:1.75,whiteSpace:"pre-wrap",background:"#F7F2EB",borderRadius:10,padding:14,marginBottom:14,fontFamily:"Georgia,serif"}}>{caption}</pre>
          <button onClick={copy} style={{
            width:"100%",padding:13,borderRadius:10,border:"none",cursor:"pointer",
            background:copied?"#6FA888":"#C5654A",color:"white",
            fontSize:14,fontFamily:"Georgia,serif",fontWeight:700,transition:"all 0.35s",
          }}>{copied?"✓ Копирано!":"📋 Копирай Caption"}</button>
        </div>

        {/* Channels guide */}
        <div style={{background:"white",borderRadius:16,padding:18,border:"1px solid #E8DDD0"}}>
          <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#5B7C6E",marginBottom:14}}>Как да споделиш в Instagram</div>
          {[
            ["📸","Stories","Скрийншот на картата → качи в Stories → добави стикер с линк към приложението"],
            ["🔗","Bio линк","Постави линка в Instagram bio → всеки последовател може да отвори дневника"],
            ["📱","Feed Post","Копирай caption → публикувай в Feed с скрийншот → тагни хора с ТМС/Мигрена"],
            ["📊","QR код","Сподели QR код в Stories → хората сканират и отварят дневника директно"],
          ].map(([ic2,t,d])=>(
            <div key={t} style={{display:"flex",gap:12,marginBottom:14,alignItems:"flex-start"}}>
              <div style={{fontSize:22,minWidth:28,marginTop:2}}>{ic2}</div>
              <div>
                <div style={{fontSize:14,fontWeight:700,marginBottom:3}}>{t}</div>
                <div style={{fontSize:12,color:"#9A8878",lineHeight:1.55}}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// NAV BAR
// ═══════════════════════════════════════════════════════
function NavBar({ screen, setScreen, todayEntry, isDark }) {
  const tabs = [
    { id:"home",  icon:"🏠", label:"Начало"  },
    { id:"log",   icon:"✏️", label:"Запиши"  },
    { id:"stats", icon:"📊", label:"Анализ"  },
    { id:"share", icon:"📸", label:"Сподели" },
  ];
  return (
    <div style={{
      position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
      width:"100%",maxWidth:480,zIndex:100,
      background:isDark?"#0F0F0F":"white",
      borderTop:`1px solid ${isDark?"rgba(255,255,255,0.07)":"#E8DDD0"}`,
      display:"flex",padding:"8px 4px 14px",
    }}>
      {tabs.map(t=>{
        const active = screen===t.id;
        return (
          <button key={t.id} onClick={()=>setScreen(t.id)} style={{
            flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,
            background:"none",border:"none",cursor:"pointer",padding:"4px 0",position:"relative",
          }}>
            <span style={{fontSize:21,filter:active?"none":"grayscale(1) opacity(0.4)",transition:"filter 0.2s"}}>
              {t.icon}
            </span>
            <span style={{
              fontSize:9,letterSpacing:0.5,fontFamily:"Georgia,serif",
              color:active?"#C5654A":(isDark?"rgba(245,238,230,0.3)":"#B8A898"),
              fontWeight:active?700:400,transition:"color 0.2s",
            }}>{t.label}</span>
            {t.id==="log"&&!todayEntry&&<div style={{position:"absolute",top:2,right:"50%",marginRight:-16,width:7,height:7,borderRadius:"50%",background:"#C5654A"}}/>
          </button>
        );
      })}
    </div>
  );
}
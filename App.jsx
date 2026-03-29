import { useState, useEffect } from "react";

// ─── COLOR SYSTEM (light theme) ───────────────────────────────────────────────
const C = {
  pitBlue:    "#003594",
  pitGold:    "#B87800",
  pitGoldBg:  "#FFB81C",
  bg:         "#EEF3FA",
  bgAlt:      "#E3EAF5",
  surface:    "#FFFFFF",
  surfaceHi:  "#F5F8FF",
  border:     "rgba(0,53,148,0.15)",
  borderGold: "rgba(184,120,0,0.25)",
  text:       "#0D1B3E",
  textSub:    "#344870",
  muted:      "#6B7FA3",
  win:        "#1A7A3F",
  loss:       "#C0243E",
  cyan:       "#0066BB",
  pending:    "#B87800",
  header:     "#003594",
  headerText: "#FFFFFF",
};

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const SPORTS_FILTER = ["All", "NBA", "MLB", "NCAAB", "NCAAB Baseball", "PGA"];

// ── Tier 1: Auto-tagged BET TYPE (always set from bet description) ──
const BET_TYPES    = ["Moneyline", "Spread", "Total", "Team Total", "Prop", "Futures", "Parlay"];
const BET_TYPE_COLORS = {
  Moneyline: "#0077CC", Spread: "#2563EB", Total: "#7B3FA0",
  "Team Total": "#9B59B6", Prop: "#B87800", Futures: "#D4500A", Parlay: "#C0243E"
};

// ── Tier 2: Auto-tagged LEAGUE (always set from sport field) ──
const LEAGUE_COLORS = {
  NBA: "#C0243E", MLB: "#0077CC", NCAAB: "#D4500A", "NCAAB Baseball": "#2563EB",
  PGA: "#1A7A3F", NFL: "#003594", NHL: "#0E4C96",
  CFB: "#7B3FA0", Other: "#6B7FA3"
};

// ── Tier 3: Custom strategy tags (user-selected, multiple allowed) ──
const STRATEGY_TAGS = ["Value", "Sharp", "Fade", "Fade Sharp", "Tail", "Contrarian", "Public", "System", "Live", "Dog", "Juice"];
const STRATEGY_COLORS = {
  Value: "#B87800", Sharp: "#0066BB", Fade: "#C0243E", "Fade Sharp": "#D4500A",
  Tail: "#1A7A3F", Contrarian: "#7B3FA0", Public: "#6B7FA3", System: "#9B59B6",
  Live: "#C0243E", Dog: "#D4500A", Juice: "#2563EB"
};

// All colors merged for Tag component
const ALL_TAG_COLORS = { ...BET_TYPE_COLORS, ...LEAGUE_COLORS, ...STRATEGY_COLORS };

// ── Auto-detect bet type from bet description string ──
function detectBetType(betStr) {
  const b = (betStr || "").toLowerCase();
  if (/parlay|\+\d.*\+\d/.test(b)) return "Parlay";
  if (/team total|alt total/.test(b)) return "Team Total";
  if (/over|under|o\d|u\d/.test(b)) return "Total";
  if (/ml$|moneyline|to win/.test(b)) return "Moneyline";
  if (/[+-]\d+\.?\d*$/.test(b.trim()) && !/prop|pts|reb|ast|yds|tds|hits|k/.test(b)) return "Spread";
  if (/prop|pts|points|reb|rebounds|ast|assists|yds|yards|tds|touchdowns|hits|strikeouts|\+k|k\b/.test(b)) return "Prop";
  if (/future|season|award|mvp|championship|world series|super bowl/.test(b)) return "Futures";
  // ML by odds shape — very short bet descriptions that are likely ML
  if (b.split(" ").length <= 3 && !b.includes(".")) return "Moneyline";
  return "Spread"; // default
}

// ─── DAILY ODDS — Sun Mar 29, 2026 (DraftKings via ESPN/FanDuel) ─────────────
// To get tomorrow's update: message Claude "update today's odds for Power Picks HQ"
const ODDS_DATE = "Sun Mar 29, 2026";
const GAMES = [
  // ── NBA (DraftKings via ESPN odds page) ─────────────────────────────────────
  // Pacers +9.5 vs Heat; Kings -1.5 vs Nets; Celtics -1.5 vs Hornets (even ML)
  // Magic +2.5 vs Raptors; Knicks +8.5 @ Thunder; Warriors +? @ Nuggets
  { id:1,  sport:"NBA",   away:"Indiana Pacers",          home:"Miami Heat",             time:"6:00 PM",  awayOdds:+320,  homeOdds:-400,  spread:+9.5,  spreadOdds:-115, awaySpread:-9.5,  awaySpreadOdds:-105, total:245.5, overOdds:-110, underOdds:-110, status:"upcoming" },
  { id:2,  sport:"NBA",   away:"Sacramento Kings",        home:"Brooklyn Nets",          time:"6:00 PM",  awayOdds:-120,  homeOdds:+100,  spread:-1.5,  spreadOdds:-105, awaySpread:+1.5,  awaySpreadOdds:-115, total:221.5, overOdds:-110, underOdds:-110, status:"upcoming" },
  { id:3,  sport:"NBA",   away:"Boston Celtics",          home:"Charlotte Hornets",      time:"6:00 PM",  awayOdds:-110,  homeOdds:-110,  spread:-1.5,  spreadOdds:+100, awaySpread:+1.5,  awaySpreadOdds:-120, total:215.5, overOdds:-110, underOdds:-110, status:"upcoming" },
  { id:4,  sport:"NBA",   away:"Orlando Magic",           home:"Toronto Raptors",        time:"6:00 PM",  awayOdds:+114,  homeOdds:-135,  spread:+2.5,  spreadOdds:-112, awaySpread:-2.5,  awaySpreadOdds:-108, total:226.5, overOdds:-105, underOdds:-115, status:"upcoming" },
  { id:5,  sport:"NBA",   away:"New York Knicks",         home:"Oklahoma City Thunder",  time:"7:30 PM",  awayOdds:+290,  homeOdds:-360,  spread:+8.5,  spreadOdds:-110, awaySpread:-8.5,  awaySpreadOdds:-110, total:223.5, overOdds:-110, underOdds:-110, status:"upcoming" },
  { id:6,  sport:"NBA",   away:"Golden State Warriors",   home:"Denver Nuggets",         time:"9:00 PM",  awayOdds:+145,  homeOdds:-175,  spread:+4.5,  spreadOdds:-110, awaySpread:-4.5,  awaySpreadOdds:-110, total:232.5, overOdds:-110, underOdds:-110, status:"upcoming" },
  { id:7,  sport:"NBA",   away:"Washington Wizards",      home:"Portland Trail Blazers", time:"9:00 PM",  awayOdds:+155,  homeOdds:-185,  spread:+4.5,  spreadOdds:-110, awaySpread:-4.5,  awaySpreadOdds:-110, total:230.5, overOdds:-110, underOdds:-110, status:"upcoming" },
  { id:8,  sport:"NBA",   away:"Houston Rockets",         home:"New Orleans Pelicans",   time:"7:00 PM",  awayOdds:-175,  homeOdds:+148,  spread:-4.0,  spreadOdds:-110, awaySpread:+4.0,  awaySpreadOdds:-110, total:228.0, overOdds:-110, underOdds:-110, status:"upcoming" },
  { id:9,  sport:"NBA",   away:"LA Clippers",             home:"Milwaukee Bucks",        time:"7:00 PM",  awayOdds:-145,  homeOdds:+122,  spread:-3.0,  spreadOdds:-110, awaySpread:+3.0,  awaySpreadOdds:-110, total:230.0, overOdds:-110, underOdds:-110, status:"upcoming" },
  // ── MLB (DraftKings via ESPN/Covers — Sunday 12-game slate) ─────────────────
  // NCAAB games moved to Sunday — confirmed Elite Eight round 2
  { id:10, sport:"MLB",   away:"Tampa Bay Rays",          home:"St. Louis Cardinals",    time:"1:15 PM",  awayOdds:+105,  homeOdds:-125,  spread:+1.5,  spreadOdds:-175, awaySpread:-1.5,  awaySpreadOdds:+145, total:8.0,  overOdds:-110, underOdds:-110, status:"upcoming" },
  { id:11, sport:"MLB",   away:"Washington Nationals",    home:"Chicago Cubs",           time:"2:20 PM",  awayOdds:+220,  homeOdds:-270,  spread:+1.5,  spreadOdds:-145, awaySpread:-1.5,  awaySpreadOdds:+125, total:8.5,  overOdds:-110, underOdds:-110, status:"upcoming" },
  { id:12, sport:"MLB",   away:"Sacramento Athletics",    home:"Toronto Blue Jays",      time:"1:35 PM",  awayOdds:+155,  homeOdds:-185,  spread:+1.5,  spreadOdds:-165, awaySpread:-1.5,  awaySpreadOdds:+140, total:8.0,  overOdds:-110, underOdds:-110, status:"upcoming" },
  { id:13, sport:"MLB",   away:"Minnesota Twins",         home:"Baltimore Orioles",      time:"1:35 PM",  awayOdds:+115,  homeOdds:-135,  spread:+1.5,  spreadOdds:-175, awaySpread:-1.5,  awaySpreadOdds:+148, total:8.0,  overOdds:-110, underOdds:-110, status:"upcoming" },
  { id:14, sport:"MLB",   away:"Texas Rangers",           home:"Philadelphia Phillies",  time:"1:35 PM",  awayOdds:+148,  homeOdds:-175,  spread:+1.5,  spreadOdds:-155, awaySpread:-1.5,  awaySpreadOdds:+130, total:8.5,  overOdds:-110, underOdds:-110, status:"upcoming" },
  { id:15, sport:"MLB",   away:"Boston Red Sox",          home:"Cincinnati Reds",        time:"1:40 PM",  awayOdds:-155,  homeOdds:+130,  spread:-1.5,  spreadOdds:+135, awaySpread:+1.5,  awaySpreadOdds:-160, total:7.5,  overOdds:-110, underOdds:-110, status:"upcoming" },
  { id:16, sport:"MLB",   away:"Pittsburgh Pirates",      home:"New York Mets",          time:"1:40 PM",  awayOdds:+188,  homeOdds:-230,  spread:+1.5,  spreadOdds:-130, awaySpread:-1.5,  awaySpreadOdds:+110, total:8.0,  overOdds:-110, underOdds:-110, status:"upcoming" },
  { id:17, sport:"MLB",   away:"New York Yankees",        home:"San Francisco Giants",   time:"4:05 PM",  awayOdds:-175,  homeOdds:+148,  spread:-1.5,  spreadOdds:+125, awaySpread:+1.5,  awaySpreadOdds:-150, total:8.0,  overOdds:-110, underOdds:-110, status:"upcoming" },
  { id:18, sport:"MLB",   away:"Los Angeles Angels",      home:"Houston Astros",         time:"2:10 PM",  awayOdds:+145,  homeOdds:-170,  spread:+1.5,  spreadOdds:-160, awaySpread:-1.5,  awaySpreadOdds:+135, total:8.5,  overOdds:-110, underOdds:-110, status:"upcoming" },
  { id:19, sport:"MLB",   away:"Chicago White Sox",       home:"Milwaukee Brewers",      time:"2:10 PM",  awayOdds:+235,  homeOdds:-290,  spread:+1.5,  spreadOdds:-125, awaySpread:-1.5,  awaySpreadOdds:+105, total:7.5,  overOdds:-110, underOdds:-110, status:"upcoming" },
  { id:20, sport:"MLB",   away:"Kansas City Royals",      home:"Atlanta Braves",         time:"3:10 PM",  awayOdds:+148,  homeOdds:-178,  spread:+1.5,  spreadOdds:-155, awaySpread:-1.5,  awaySpreadOdds:+132, total:8.0,  overOdds:-110, underOdds:-110, status:"upcoming" },
  { id:21, sport:"MLB",   away:"Arizona Diamondbacks",    home:"Los Angeles Dodgers",    time:"4:00 PM",  awayOdds:+195,  homeOdds:-240,  spread:+1.5,  spreadOdds:-130, awaySpread:-1.5,  awaySpreadOdds:+110, total:8.5,  overOdds:-110, underOdds:-110, status:"upcoming" },
  // ── NCAAB — Elite Eight Day 2 (DraftKings confirmed via DK Network) ──────────
  // Michigan -7.5 (-310 ML) vs Tennessee +250 · O/U 146.5
  // Duke -5.5 (-220 ML) vs UConn +180 · O/U 134.5
  { id:22, sport:"NCAAB", away:"#6 Tennessee Volunteers", home:"#1 Michigan Wolverines", time:"2:09 PM",  awayOdds:+250,  homeOdds:-310,  spread:+7.5,  spreadOdds:-108, awaySpread:-7.5,  awaySpreadOdds:-112, total:146.5, overOdds:-110, underOdds:-110, status:"upcoming" },
  { id:23, sport:"NCAAB", away:"#4 UConn Huskies",        home:"#1 Duke Blue Devils",    time:"5:05 PM",  awayOdds:+180,  homeOdds:-220,  spread:+5.5,  spreadOdds:-115, awaySpread:-5.5,  awaySpreadOdds:-105, total:134.5, overOdds:-110, underOdds:-110, status:"upcoming" },
  // ── PGA — Houston Open Final Round (Memorial Park) ───────────────────────────
  { id:24, sport:"PGA",   home:"Gary Woodland",           away:"Win Outright",           time:"R4 Today", homeOdds:+350,  awayOdds:null, spread:null,  spreadOdds:null, total:null, overOdds:null, underOdds:null, status:"live",   note:"Leads entering R4 | -13 thru 54" },
  { id:25, sport:"PGA",   home:"Min Woo Lee",             away:"Win Outright",           time:"R4 Today", homeOdds:+450,  awayOdds:null, spread:null,  spreadOdds:null, total:null, overOdds:null, underOdds:null, status:"live",   note:"T2 at -10 | Defending champ" },
  { id:26, sport:"PGA",   home:"Nicolai Højgaard",        away:"Win Outright",           time:"R4 Today", homeOdds:+550,  awayOdds:null, spread:null,  spreadOdds:null, total:null, overOdds:null, underOdds:null, status:"live",   note:"T2 at -10" },
  { id:27, sport:"PGA",   home:"Jason Day",               away:"Win Outright",           time:"R4 Today", homeOdds:+650,  awayOdds:null, spread:null,  spreadOdds:null, total:null, overOdds:null, underOdds:null, status:"live",   note:"T4 at -9" },
];

// ─── SHARP MONEY — Sun Mar 29, 2026 ─────────────────────────────────────────
// Sources: DK Network betting splits, SBR line movement, ESPN betting buzz
const SHARP_DATA = [
  // NCAAB: 59% of bets on UConn but line hasn't moved off Duke -5.5 → sharp money on Duke
  // Duke opened -5, moved to -5.5 at most books — sharp action drove that move early
  { id:1, game:"UConn @ Duke – Elite 8",         bet:"Duke -5.5",       betPct:41, moneyPct:68, sharpSide:"Duke",      movement:"-5 → -5.5",         steam:true,  reverseLineMove:false, sport:"NCAAB" },
  // NCAAB: Over 133.5 getting 65% of early bets, total already moved from 133.5 → 134.5
  { id:2, game:"UConn @ Duke – Elite 8",         bet:"Over 134.5",      betPct:65, moneyPct:72, sharpSide:"Over",      movement:"133.5 → 134.5",     steam:true,  reverseLineMove:false, sport:"NCAAB" },
  // NCAAB: Michigan opened -7.5, getting solid public support but no movement → sharp fade on Tennessee
  // ESPN notes heavy public on Michigan but line frozen → classic sharp Tennessee angle
  { id:3, game:"Tennessee @ Michigan – Elite 8", bet:"Tennessee +7.5",  betPct:35, moneyPct:61, sharpSide:"Tennessee", movement:"-7.5 → -7.5",      steam:false, reverseLineMove:true,  sport:"NCAAB" },
  // NBA: Thunder opened -8 vs Knicks, moved to -8.5 — massive public on OKC (big market fav)
  // But sharp money buying Knicks +8.5 at key number, handle % diverging from bet %
  { id:4, game:"Knicks @ Thunder",               bet:"Knicks +8.5",     betPct:28, moneyPct:55, sharpSide:"Knicks",    movement:"-8 → -8.5",         steam:false, reverseLineMove:true,  sport:"NBA"   },
  // NBA: Rockets -4 opened vs Pelicans, moved to -4 with sharp steam on Pelicans ML
  // Houston public darling right now; sharp books taking Pelicans plus the points
  { id:5, game:"Rockets @ Pelicans",             bet:"Pelicans +4",     betPct:33, moneyPct:62, sharpSide:"Pelicans",  movement:"-4.5 → -4",         steam:false, reverseLineMove:true,  sport:"NBA"   },
  // NBA: Nuggets opened -4.5 vs Warriors, sharp steam pushed to -4.5 after opening -4
  // Denver is a sharp-side favorite here on rest advantage and home floor
  { id:6, game:"Warriors @ Nuggets",             bet:"Nuggets -4.5",    betPct:52, moneyPct:74, sharpSide:"Nuggets",   movement:"-4 → -4.5",         steam:true,  reverseLineMove:false, sport:"NBA"   },
  // MLB: Dodgers drawing massive public action (-240) vs D-Backs — 78% of bets on LA
  // But total moved down 8.5 → 8 indicating sharp under action despite public over lean
  { id:7, game:"D-Backs @ Dodgers",              bet:"Under 8.5",       betPct:44, moneyPct:69, sharpSide:"Under",     movement:"9 → 8.5",           steam:true,  reverseLineMove:false, sport:"MLB"   },
  // MLB: Cubs massive public fav (-270), sharp books have seen Nationals line shorten
  // Classic fade-the-public spot: 76% on Cubs but Washington offering value at +220
  { id:8, game:"Nationals @ Cubs",               bet:"Nationals +ML",   betPct:24, moneyPct:58, sharpSide:"Nationals", movement:"Cubs -290 → -270",  steam:false, reverseLineMove:true,  sport:"MLB"   },
  // MLB: Red Sox public fav on road; sharp move on Reds total — under getting sharp $
  { id:9, game:"Red Sox @ Reds",                 bet:"Under 7.5",       betPct:38, moneyPct:66, sharpSide:"Under",     movement:"8 → 7.5",           steam:true,  reverseLineMove:false, sport:"MLB"   },
  // PGA: Woodland massive fav entering R4, sharp outright money flowing to Højgaard
  // Woodland known as a front-runner who struggles under pressure — sharps backing Højgaard
  { id:10, game:"Houston Open – R4",             bet:"Højgaard Win",    betPct:18, moneyPct:52, sharpSide:"Højgaard",  movement:"+700 → +550",       steam:true,  reverseLineMove:false, sport:"PGA"   },
];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt  = (o) => o === null || o === undefined ? "—" : o > 0 ? `+${o}` : `${o}`;
const pct  = (w, t) => t > 0 ? ((w / t) * 100).toFixed(1) : "0.0";

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Roboto+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #EEF3FA; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: #EEF3FA; }
  ::-webkit-scrollbar-thumb { background: #003594; border-radius: 3px; }
  input, textarea, select { font-family: 'Montserrat', sans-serif; color: #0D1B3E; background: #fff; }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes goldGlow { 0%,100%{text-shadow:0 0 6px rgba(0,53,148,.3)} 50%{text-shadow:0 0 14px rgba(0,53,148,.5)} }
  @keyframes spin { to { transform: rotate(360deg); } }
  .fade-up { animation: fadeUp .35s ease forwards; }
  .card-hover { transition: border-color .2s, box-shadow .2s, transform .15s; }
  .card-hover:hover { border-color: rgba(0,53,148,.4) !important; box-shadow: 0 4px 20px rgba(0,53,148,.1) !important; transform: translateY(-1px); }
  .btn-ghost { transition: background .15s, color .15s; }
  .btn-ghost:hover { background: rgba(0,53,148,.08) !important; color: #003594 !important; }
`;

function Orb() { return null; } // removed for light theme

function Tag({ label, xs, onClick, active }) {
  const col = ALL_TAG_COLORS[label] || "#6B7FA3";
  return (
    <span onClick={onClick} style={{
      display:"inline-flex", alignItems:"center",
      padding: xs ? "1px 7px" : "2px 9px", borderRadius:20,
      fontSize: xs ? 10 : 11, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase",
      background: active ? `${col}30` : `${col}15`,
      border:`1px solid ${active ? col+"88" : col+"44"}`, color:col,
      fontFamily:"'Montserrat',sans-serif",
      cursor: onClick ? "pointer" : "default", whiteSpace:"nowrap",
      transition:"all .12s"
    }}>
      {label}
    </span>
  );
}

function Chip({ odds, sm }) {
  if (odds === null || odds === undefined) return null;
  const pos = odds > 0;
  return (
    <span style={{ display:"inline-block", padding: sm ? "2px 8px" : "3px 10px", borderRadius:5,
      fontSize: sm ? 12 : 13, fontWeight:700, fontFamily:"'Roboto Mono',monospace",
      background: pos ? "rgba(26,122,63,.08)" : "rgba(192,36,62,.08)",
      border:`1px solid ${pos ? "rgba(26,122,63,.35)" : "rgba(192,36,62,.35)"}`,
      color: pos ? C.win : C.loss }}>
      {fmt(odds)}
    </span>
  );
}

function SportBadge({ sport }) {
  return (
    <span style={{ fontSize:10, fontWeight:800, color:C.bg, background:C.pitGold,
      padding:"2px 7px", borderRadius:3, letterSpacing:".08em", fontFamily:"'Montserrat',sans-serif" }}>
      {sport}
    </span>
  );
}

function LivePip() {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
      <span style={{ width:7, height:7, borderRadius:"50%", background:"#FF3C5A", boxShadow:"0 0 8px #FF3C5A", animation:"pulse 1.1s infinite" }} />
      <span style={{ fontSize:10, fontWeight:800, color:"#FF3C5A", letterSpacing:".1em", fontFamily:"'Montserrat',sans-serif" }}>LIVE</span>
    </span>
  );
}

function StatPill({ label, value, sub, accent = C.pitGold }) {
  return (
    <div style={{ background: C.surface, border:`1px solid ${C.border}`, borderTop:`3px solid ${accent}`,
      borderRadius:10, padding:"10px 12px", boxShadow:"0 2px 8px rgba(0,53,148,.07)", overflow:"hidden" }}>
      <div style={{ fontSize:9, fontWeight:700, letterSpacing:".12em", color:C.muted, textTransform:"uppercase", marginBottom:4, fontFamily:"'Montserrat',sans-serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{label}</div>
      <div style={{ fontSize:18, fontWeight:900, color:accent, fontFamily:"'Montserrat',sans-serif", lineHeight:1.1, whiteSpace:"nowrap" }}>{value}</div>
      {sub && <div style={{ fontSize:9, color:C.muted, marginTop:2, fontFamily:"'Montserrat',sans-serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{sub}</div>}
    </div>
  );
}

// ─── GAME CARD ────────────────────────────────────────────────────────────────
function GameCard({ g, onAddPick }) {
  const [view, setView] = useState(g.sport === "PGA" ? "ml" : "spread");
  const isPGA  = g.sport === "PGA";
  const isFinal = g.status === "final";

  return (
    <div className="card-hover" style={{ background:C.surface,
      border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px",
      boxShadow:"0 2px 10px rgba(0,53,148,.07)", display:"flex", flexDirection:"column", gap:10 }}>

      {/* top row */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", gap:7, alignItems:"center" }}>
          <SportBadge sport={g.sport} />
          {g.status === "live" ? <LivePip /> : isFinal
            ? <span style={{ fontSize:10, fontWeight:700, color:C.muted }}>FINAL</span>
            : <span style={{ fontSize:11, color:C.muted, fontWeight:500 }}>{g.time} ET</span>}
        </div>
        <span style={{ fontSize:9, fontWeight:800, color:"#fff", background:C.pitBlue,
          padding:"2px 7px", borderRadius:3, letterSpacing:".1em" }}>
          {g.lastUpdated ? (g.bookmaker || "DK") + " LIVE" : "DK"}
        </span>
      </div>

      {/* teams / players */}
      {isPGA ? (
        <div>
          <div style={{ fontSize:15, fontWeight:800, color:C.pitBlue }}>{g.home}</div>
          {g.note && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{g.note}</div>}
          {g.lastUpdated && <div style={{ fontSize:9, color:C.muted, marginTop:2 }}>Updated {new Date(g.lastUpdated).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>}
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {[{team:g.away, score:g.awayScore}, {team:g.home, score:g.homeScore}].map(({team,score},i)=>(
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"5px 0", borderBottom: i===0 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize:13, fontWeight:600, color:C.text, lineHeight:1.3, flex:1, paddingRight:4 }}>{team}</span>
              {score !== undefined && <span style={{ fontSize:17, fontWeight:900, color:C.pitGold, fontFamily:"'Roboto Mono',monospace" }}>{score}</span>}
            </div>
          ))}
        </div>
      )}

      {/* bet type toggle */}
      {!isPGA && (
        <div style={{ display:"flex", gap:4 }}>
          {["spread","ml","total"].map(t=>(
            <button key={t} onClick={()=>setView(t)} style={{ flex:1, padding:"5px 0", borderRadius:5,
              border: view===t ? `1px solid ${C.pitBlue}` : `1px solid ${C.border}`,
              background: view===t ? C.pitBlue : C.surfaceHi,
              color: view===t ? "#fff" : C.muted, cursor:"pointer",
              fontSize:10, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase",
              fontFamily:"'Montserrat',sans-serif", transition:"all .15s" }}>
              {t==="ml" ? "ML" : t==="spread" ? "Spread" : "Total"}
            </button>
          ))}
        </div>
      )}

      {/* odds display */}
      <div style={{ display:"flex", gap:8 }}>
        {isPGA ? (
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            <span style={{ fontSize:10, color:C.muted, fontWeight:600 }}>Win Outright</span>
            <Chip odds={g.homeOdds} />
          </div>
        ) : view==="spread" ? (
          <>
            <div style={{ flex:1, textAlign:"center" }}>
              <div style={{ fontSize:10, color:C.muted, marginBottom:3, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{g.away.split(" ").slice(-1)[0]}</div>
              <div style={{ display:"flex", gap:4, justifyContent:"center", alignItems:"center", flexWrap:"wrap" }}>
                <span style={{ fontSize:12, color:C.muted, fontFamily:"'Roboto Mono',monospace" }}>{g.spread > 0 ? `+${g.spread}` : g.spread}</span>
                <Chip odds={-110} sm />
              </div>
            </div>
            <div style={{ flex:1, textAlign:"center" }}>
              <div style={{ fontSize:10, color:C.muted, marginBottom:3, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{g.home.split(" ").slice(-1)[0]}</div>
              <div style={{ display:"flex", gap:4, justifyContent:"center", alignItems:"center", flexWrap:"wrap" }}>
                <span style={{ fontSize:12, color:C.muted, fontFamily:"'Roboto Mono',monospace" }}>{g.spread > 0 ? `-${g.spread}` : `+${-g.spread}`}</span>
                <Chip odds={-110} sm />
              </div>
            </div>
          </>
        ) : view==="ml" ? (
          <>
            <div style={{ flex:1, textAlign:"center" }}>
              <div style={{ fontSize:10, color:C.muted, marginBottom:3, fontWeight:600 }}>{g.away.split(" ").slice(-1)[0]}</div>
              <Chip odds={g.awayOdds} sm />
            </div>
            <div style={{ flex:1, textAlign:"center" }}>
              <div style={{ fontSize:10, color:C.muted, marginBottom:3, fontWeight:600 }}>{g.home.split(" ").slice(-1)[0]}</div>
              <Chip odds={g.homeOdds} sm />
            </div>
          </>
        ) : (
          <>
            <div style={{ flex:1, textAlign:"center" }}>
              <div style={{ fontSize:10, color:C.muted, marginBottom:3, fontWeight:600 }}>Over {g.total ?? "—"}</div>
              <Chip odds={g.overOdds || -110} sm />
            </div>
            <div style={{ flex:1, textAlign:"center" }}>
              <div style={{ fontSize:10, color:C.muted, marginBottom:3, fontWeight:600 }}>Under {g.total ?? "—"}</div>
              <Chip odds={g.underOdds || -110} sm />
            </div>
          </>
        )}
      </div>

      {/* add pick */}
      {!isFinal && (
        <button className="btn-ghost" onClick={()=>onAddPick(g)} style={{
          padding:"8px 0", borderRadius:6, border:`1px solid ${C.pitBlue}`,
          background:C.pitBlue, color:"#fff", cursor:"pointer",
          fontSize:11, fontWeight:700, letterSpacing:".08em",
          fontFamily:"'Montserrat',sans-serif" }}>
          + Add Pick
        </button>
      )}
    </div>
  );
}

// ─── PICK ROW ────────────────────────────────────────────────────────────────
function PickRow({ pick }) {
  const rCol = pick.result === "win" ? C.win : pick.result === "loss" ? C.loss : C.pending;
  const profStr = pick.result === "pending" ? "—" : pick.profit >= 0 ? `+$${pick.profit.toFixed(2)}` : `-$${Math.abs(pick.profit).toFixed(2)}`;
  return (
    <div style={{ padding:"12px 14px", borderBottom:`1px solid ${C.border}`,
      background:C.surface, transition:"background .12s" }}
      onMouseEnter={e=>e.currentTarget.style.background=C.surfaceHi}
      onMouseLeave={e=>e.currentTarget.style.background=C.surface}>
      {/* Row 1: bet + result badge */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6, gap:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.text, lineHeight:1.4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{pick.bet}</div>
          <div style={{ fontSize:10, color:C.muted, marginTop:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {pick.game}{pick.date ? <span style={{ marginLeft:6, opacity:.6 }}>· {pick.date}</span> : null}
          </div>
        </div>
        <span style={{ flexShrink:0, fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:12,
          background:`${rCol}18`, border:`1px solid ${rCol}55`, color:rCol,
          textTransform:"uppercase", letterSpacing:".07em", fontFamily:"'Montserrat',sans-serif", whiteSpace:"nowrap" }}>
          {pick.result}
        </span>
      </div>
      {/* Row 2: auto tags + strategy tags + odds + stake + P&L */}
      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
        {pick.league && <Tag label={pick.league||pick.sport} xs />}
        {pick.betType && <Tag label={pick.betType} xs />}
        {(pick.strategyTags||[]).map(t=>(
          <span key={t} style={{ padding:"1px 7px", borderRadius:20, fontSize:9, fontWeight:700,
            background:"rgba(0,53,148,.1)", border:"1px solid rgba(0,53,148,.25)", color:C.pitBlue,
            textTransform:"uppercase", letterSpacing:".05em" }}>{t}</span>
        ))}
        <Chip odds={pick.odds} sm />
        <span style={{ fontSize:10, color:C.muted, fontFamily:"'Roboto Mono',monospace" }}>${pick.stake.toFixed(0)}</span>
        <span style={{ marginLeft:"auto", fontSize:13, fontWeight:800, color:rCol, fontFamily:"'Roboto Mono',monospace", whiteSpace:"nowrap" }}>{profStr}</span>
      </div>
    </div>
  );
}

// ─── SHARP CARD ───────────────────────────────────────────────────────────────
function SharpCard({ d }) {
  const highlight = d.steam ? C.cyan : d.reverseLineMove ? "#FF6B35" : C.border;
  return (
    <div style={{ background:C.surface,
      border:`2px solid ${highlight}66`, borderRadius:10, padding:16,
      boxShadow:"0 2px 10px rgba(0,53,148,.07)", position:"relative" }}>
      {d.steam && <span style={{ position:"absolute", top:10, right:10, fontSize:9, fontWeight:800,
        color:C.cyan, background:"rgba(0,207,255,.1)", border:"1px solid rgba(0,207,255,.3)",
        padding:"2px 8px", borderRadius:3, letterSpacing:".1em" }}>⚡ STEAM</span>}
      {d.reverseLineMove && <span style={{ position:"absolute", top:10, right:10, fontSize:9, fontWeight:800,
        color:"#FF6B35", background:"rgba(255,107,53,.1)", border:"1px solid rgba(255,107,53,.3)",
        padding:"2px 8px", borderRadius:3, letterSpacing:".1em" }}>↩ RLM</span>}

      <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:3 }}>{d.sport}</div>
      <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:3, lineHeight:1.4 }}>{d.game}</div>
      <div style={{ fontSize:14, fontWeight:800, color:C.pitBlue, marginBottom:12 }}>{d.bet}</div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
        {[["Bet %", d.betPct + "%", d.betPct > 60 ? C.loss : C.win],
          ["Money %", d.moneyPct + "%", d.moneyPct > 60 ? C.win : C.loss]].map(([lbl,val,col])=>(
          <div key={lbl} style={{ textAlign:"center", padding:"9px 6px", background:"rgba(0,53,148,.14)",
            borderRadius:6, border:`1px solid ${C.border}`, background:C.surfaceHi }}>
            <div style={{ fontSize:9, color:C.muted, letterSpacing:".1em", textTransform:"uppercase", marginBottom:4, fontWeight:700 }}>{lbl}</div>
            <div style={{ fontSize:20, fontWeight:900, color:col, fontFamily:"'Roboto Mono',monospace" }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:C.muted, marginBottom:4, fontWeight:600 }}>
          <span>Public {d.betPct}%</span><span>{100-d.betPct}%</span>
        </div>
        <div style={{ height:5, borderRadius:3, background:C.bgAlt, overflow:"hidden" }}>
          <div style={{ width:`${d.betPct}%`, height:"100%", background:`linear-gradient(90deg,${C.pitBlue},#0055CC)`, borderRadius:2 }} />
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:9, color:C.muted, textTransform:"uppercase", letterSpacing:".1em", fontWeight:700 }}>Line Move</div>
          <div style={{ fontSize:12, color:C.pitBlue, fontFamily:"'Roboto Mono',monospace", fontWeight:700, marginTop:2 }}>{d.movement}</div>
        </div>
        <div>
          <div style={{ fontSize:9, color:C.muted, textTransform:"uppercase", letterSpacing:".1em", fontWeight:700, marginBottom:4 }}>Sharp Side</div>
          <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:12,
            background:`${C.pitBlue}15`, border:`1px solid ${C.pitBlue}55`, color:C.pitBlue }}>{d.sharpSide}</span>
        </div>
      </div>
    </div>
  );
}

// ─── ADD PICK MODAL (also handles editing existing picks) ────────────────────
function AddPickModal({ game, onClose, onSave, existingPick }) {
  const isEdit = !!existingPick;
  const defaultBet = game
    ? game.sport === "PGA" ? `${game.home} Win Outright` : `${game.home.split(" ").slice(-1)[0]} ML`
    : "";
  const todayStr = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState(isEdit ? { ...existingPick } : {
    game:  game ? (game.sport === "PGA" ? `${game.home} – Tour Event` : `${game.away} @ ${game.home}`) : "",
    sport: game?.sport || "NBA",
    bet:   defaultBet,
    odds:  game?.homeOdds || -110,
    stake: 100,
    strategyTags: [],
    betType: detectBetType(defaultBet),
    betTypeOverride: false,
    notes: "",
    result: "pending",
    date:  todayStr,
  });
  const [customGame, setCustomGame] = useState(isEdit || !game);
  const [customTagInput, setCustomTagInput] = useState("");
  // Load persisted custom tags from localStorage
  const [savedCustomTags, setSavedCustomTags] = useState(() => loadCustomTagsSync());
  const autoBetType = form.betTypeOverride ? form.betType : detectBetType(form.bet);

  const inputStyle = {
    width:"100%", padding:"9px 12px", borderRadius:6,
    background:C.surfaceHi, border:`1px solid ${C.border}`,
    color:C.text, fontSize:13, fontFamily:"'Montserrat',sans-serif", outline:"none",
  };

  const toggleStrategy = (tag) => setForm(f => ({
    ...f, strategyTags: f.strategyTags.includes(tag)
      ? f.strategyTags.filter(t=>t!==tag) : [...f.strategyTags, tag]
  }));

  const addCustomTag = () => {
    const t = customTagInput.trim();
    if (!t || form.strategyTags.includes(t)) return;
    setForm(f => ({ ...f, strategyTags: [...f.strategyTags, t] }));
    // Persist new tag globally so it appears in future picks
    if (!savedCustomTags.includes(t)) {
      const updated = [...savedCustomTags, t];
      setSavedCustomTags(updated);
      saveCustomTagsSync(updated);
    }
    setCustomTagInput("");
  };

  const handleSave = () => {
    const finalBetType = form.betTypeOverride ? form.betType : detectBetType(form.bet);
    if (isEdit) {
      onSave({ ...form, betType: finalBetType, league: form.sport || form.league });
    } else {
      onSave({ ...form, id: Date.now(), profit: 0,
        date: form.date || new Date().toISOString().split("T")[0],
        betType: finalBetType, league: form.sport });
    }
    onClose();
  };

  const lbl = (text) => (
    <label style={{ fontSize:9, fontWeight:700, color:C.muted, letterSpacing:".12em",
      textTransform:"uppercase", display:"block", marginBottom:4 }}>{text}</label>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", backdropFilter:"blur(10px)",
      zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:24,
        width:"100%", maxWidth:520, maxHeight:"92vh", overflowY:"auto",
        boxShadow:"0 8px 40px rgba(0,53,148,.2)" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:900, color:C.pitBlue }}>{isEdit ? "EDIT PICK" : game ? "ADD PICK" : "CUSTOM BET"}</div>
            {game && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{form.game}</div>}
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, fontSize:20, cursor:"pointer", padding:4 }}>✕</button>
        </div>

        {/* Game toggle */}
        {game && (
          <div style={{ display:"flex", gap:6, marginBottom:14 }}>
            {["Use This Game","Custom Entry"].map((lbl,i)=>(
              <button key={i} onClick={()=>setCustomGame(i===1)} style={{ flex:1, padding:"7px 0", borderRadius:6, border:"none", cursor:"pointer",
                fontSize:11, fontWeight:700, fontFamily:"'Montserrat',sans-serif",
                background:customGame===(i===1)?C.pitBlue:C.surfaceHi,
                color:customGame===(i===1)?"#fff":C.muted }}>{lbl}</button>
            ))}
          </div>
        )}

        {/* Custom game fields */}
        {(customGame || !game) && (
          <div style={{ marginBottom:14 }}>
            <div style={{ marginBottom:10 }}>
              {lbl("Game / Event")}
              <input style={inputStyle} value={form.game} onChange={e=>setForm(f=>({...f,game:e.target.value}))} placeholder="e.g. Lakers vs Celtics" />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                {lbl("League")}
                <select style={inputStyle} value={form.sport} onChange={e=>setForm(f=>({...f,sport:e.target.value,league:e.target.value}))}>
                  {["NBA","MLB","NCAAB","NCAAB Baseball","PGA","NFL","NHL","CFB","Other"].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display:"flex", flexDirection:"column", justifyContent:"flex-end", paddingBottom:1 }}>
                <div style={{ fontSize:9, color:C.muted, fontWeight:700, letterSpacing:".1em", marginBottom:5 }}>AUTO-TAGGED</div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  <Tag label={form.sport} xs />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bet */}
        {lbl("Bet Description")}
        <input style={{...inputStyle, marginBottom:8}} value={form.bet}
          onChange={e=>setForm(f=>({...f,bet:e.target.value}))}
          placeholder="e.g. Celtics -4.5 · Over 228.5 · LeBron O25.5 pts" />

        {/* Bet Type — auto-detect with manual override */}
        <div style={{ marginBottom:14 }}>
          {lbl("Bet Type")}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:6 }}>
            {["Moneyline","Spread","Total","Team Total","Prop","Parlay","Futures"].map(bt => (
              <button key={bt} onClick={()=>setForm(f=>({...f, betType:bt, betTypeOverride:true}))}
                style={{ padding:"5px 11px", borderRadius:16, border:"none", cursor:"pointer",
                  fontSize:10, fontWeight:700, fontFamily:"'Montserrat',sans-serif", transition:"all .12s",
                  background: autoBetType===bt ? `${BET_TYPE_COLORS[bt]}22` : C.surfaceHi,
                  color: autoBetType===bt ? BET_TYPE_COLORS[bt] : C.muted,
                  outline: autoBetType===bt ? `1.5px solid ${BET_TYPE_COLORS[bt]}66` : `1px solid ${C.border}` }}>
                {bt}
              </button>
            ))}
          </div>
          <div style={{ fontSize:9, color:C.muted, fontStyle:"italic" }}>
            {form.betTypeOverride ? "✎ Manually set" : `Auto-detected from description → ${autoBetType}`}
            {form.betTypeOverride && <span onClick={()=>setForm(f=>({...f,betTypeOverride:false}))}
              style={{ marginLeft:8, color:C.pitBlue, cursor:"pointer", fontStyle:"normal", fontWeight:700 }}>Reset auto</span>}
          </div>
        </div>

        {/* Odds + Stake + Date */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 }}>
          <div>{lbl("Odds")}<input type="number" style={inputStyle} value={form.odds} onChange={e=>setForm(f=>({...f,odds:Number(e.target.value)}))} /></div>
          <div>{lbl("Stake ($)")}<input type="number" style={inputStyle} value={form.stake} onChange={e=>setForm(f=>({...f,stake:Number(e.target.value)}))} /></div>
          <div>{lbl("Date")}<input type="date" style={inputStyle} value={form.date || ""} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></div>
        </div>

        {/* Strategy tags — built-in + user-created custom tags */}
        <div style={{ marginBottom:8 }}>
          <div style={{ fontSize:9, fontWeight:700, color:C.muted, letterSpacing:".12em", textTransform:"uppercase", marginBottom:6 }}>
            Strategy Tags <span style={{ textTransform:"none", letterSpacing:0, fontWeight:400 }}>(optional · pick multiple)</span>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {[...STRATEGY_TAGS, ...savedCustomTags.filter(t=>!STRATEGY_TAGS.includes(t))].map(t=>(
              <Tag key={t} label={t} xs active={form.strategyTags.includes(t)} onClick={()=>toggleStrategy(t)} />
            ))}
          </div>
        </div>

        {/* Custom tag */}
        <div style={{ display:"flex", gap:6, marginBottom:14 }}>
          <input value={customTagInput} onChange={e=>setCustomTagInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&addCustomTag()}
            placeholder="Custom tag (press Enter)"
            style={{...inputStyle, flex:1, fontSize:12}} />
          <button onClick={addCustomTag} style={{ padding:"0 14px", borderRadius:6,
            border:`1px solid ${C.border}`, background:C.surfaceHi, color:C.pitBlue,
            cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"'Montserrat',sans-serif" }}>+</button>
        </div>

        {/* Tags preview */}
        {(form.strategyTags.length > 0) && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:14, padding:"8px 10px",
            background:C.surfaceHi, borderRadius:6, border:`1px solid ${C.border}` }}>
            <span style={{ fontSize:9, color:C.muted, fontWeight:700, alignSelf:"center", marginRight:3 }}>TAGS:</span>
            <Tag label={form.sport} xs />
            <Tag label={autoBetType} xs />
            {form.strategyTags.map(t=>(
              <span key={t} style={{ display:"inline-flex", alignItems:"center", gap:3,
                padding:"1px 8px", borderRadius:20, fontSize:10, fontWeight:700,
                background:"rgba(0,53,148,.1)", border:"1px solid rgba(0,53,148,.25)", color:C.pitBlue }}>
                {t}
                <span onClick={()=>setForm(f=>({...f,strategyTags:f.strategyTags.filter(x=>x!==t)}))}
                  style={{ cursor:"pointer", opacity:.6, fontSize:12, lineHeight:1 }}>×</span>
              </span>
            ))}
          </div>
        )}

        {lbl("Notes (optional)")}
        <textarea style={{...inputStyle, resize:"vertical", minHeight:54, marginBottom:18}} value={form.notes}
          onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Reasoning, matchup notes…" />

        <button onClick={handleSave} style={{ width:"100%", padding:"13px 0", borderRadius:8, border:"none",
          background:C.pitBlue, color:"#fff", fontSize:13, fontWeight:900, cursor:"pointer",
          letterSpacing:".08em", fontFamily:"'Montserrat',sans-serif" }}>
          {isEdit ? "SAVE CHANGES" : "TRACK THIS BET"}
        </button>
      </div>
    </div>
  );
}

function UpdateResultModal({ pick, onClose, onUpdate }) {
  const [result, setResult] = useState(pick.result);
  const calcProfit = (res) => {
    if (res === "pending") return 0;
    if (res === "win") return pick.odds > 0 ? (pick.stake * pick.odds / 100) : (pick.stake * 100 / Math.abs(pick.odds));
    return -pick.stake;
  };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", backdropFilter:"blur(10px)",
      zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:C.surface,
        border:`1px solid ${C.borderGold}`, borderRadius:14, padding:28, width:"100%", maxWidth:380,
        boxShadow:`0 0 60px rgba(0,53,148,.5)` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ fontSize:15, fontWeight:800, color:C.pitBlue }}>UPDATE RESULT</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, fontSize:18, cursor:"pointer", padding:4 }}>✕</button>
        </div>
        <div style={{ fontSize:13, color:C.text, marginBottom:4, fontWeight:600 }}>{pick.bet}</div>
        <div style={{ fontSize:11, color:C.muted, marginBottom:20 }}>{pick.game} · <Chip odds={pick.odds} sm /></div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:20 }}>
          {["pending","win","loss"].map(r=>{
            const col = r==="win" ? C.win : r==="loss" ? C.loss : C.pending;
            return (
              <button key={r} onClick={()=>setResult(r)} style={{ padding:"12px 0", borderRadius:7,
                border:`1px solid ${result===r ? col+"88" : col+"22"}`,
                background: result===r ? `${col}22` : `${col}08`, color: result===r ? col : col+"77",
                cursor:"pointer", fontSize:12, fontWeight:800, textTransform:"uppercase",
                letterSpacing:".08em", fontFamily:"'Montserrat',sans-serif", transition:"all .15s" }}>
                {r}
              </button>
            );
          })}
        </div>
        {result !== "pending" && (
          <div style={{ padding:"10px 14px", borderRadius:7, background:`${result==="win"?C.win:C.loss}15`,
            border:`1px solid ${result==="win"?C.win:C.loss}33`, marginBottom:16, textAlign:"center" }}>
            <span style={{ fontSize:16, fontWeight:900, color:result==="win"?C.win:C.loss, fontFamily:"'Roboto Mono',monospace" }}>
              {result==="win" ? `+$${calcProfit("win").toFixed(2)}` : `-$${pick.stake.toFixed(2)}`}
            </span>
          </div>
        )}
        <button onClick={()=>{ onUpdate({ ...pick, result, profit: calcProfit(result) }); onClose(); }}
          style={{ width:"100%", padding:"12px 0", borderRadius:8, border:"none",
            background:`linear-gradient(135deg,${C.pitGold},#e6a000)`, color:C.bg,
            fontSize:13, fontWeight:900, cursor:"pointer", letterSpacing:".08em",
            fontFamily:"'Montserrat',sans-serif" }}>
          SAVE RESULT
        </button>
      </div>
    </div>
  );
}

// ─── PICKS TAB (with update result) ──────────────────────────────────────────
function PicksTab({ picks, setPicks, onAdd }) {
  const [sportF, setSportF] = useState("All");
  const [labelF, setLabelF] = useState("All");
  const [updating, setUpdating] = useState(null);
  const [editing, setEditing] = useState(null);

  const filtered = picks.filter(p=>
    (sportF==="All"||(p.league||p.sport)===sportF||p.sport===sportF) &&
    (labelF==="All"||p.betType===labelF)
  );
  const record = { w: picks.filter(p=>p.result==="win").length, l: picks.filter(p=>p.result==="loss").length };
  const settled = picks.filter(p=>p.result!=="pending");
  const roi = settled.length > 0 ? ((settled.reduce((s,p)=>s+p.profit,0)/settled.reduce((s,p)=>s+p.stake,0))*100).toFixed(1) : "0.0";

  return (
    <div className="fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:900, color:C.pitBlue, letterSpacing:".03em" }}>MY PICKS</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Track, label, and grade every wager</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {picks.length > 0 && (
            <>
              {/* Export backup */}
              <button onClick={()=>{
                const blob = new Blob([JSON.stringify(picks, null, 2)], {type:"application/json"});
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `powerpicks-backup-${new Date().toISOString().split("T")[0]}.json`;
                a.click(); URL.revokeObjectURL(url);
              }} style={{ padding:"9px 14px", borderRadius:7,
                border:`1px solid ${C.border}`, background:C.surfaceHi,
                color:C.muted, cursor:"pointer", fontSize:11, fontWeight:700,
                fontFamily:"'Montserrat',sans-serif", letterSpacing:".04em" }}
                title="Download a backup of all your picks as JSON">
                ↓ Backup
              </button>
              <button onClick={()=>{
                if (window.confirm(`Delete all ${picks.length} picks? This cannot be undone.`)) {
                  setPicks([]);
                }
              }} style={{ padding:"9px 14px", borderRadius:7,
                border:"1px solid rgba(192,36,62,.3)", background:"rgba(192,36,62,.07)",
                color:C.loss, cursor:"pointer", fontSize:11, fontWeight:700,
                fontFamily:"'Montserrat',sans-serif", letterSpacing:".06em" }}>
                Clear All
              </button>
            </>
          )}
          {/* Import restore */}
          <label style={{ padding:"9px 14px", borderRadius:7, cursor:"pointer",
            border:`1px solid ${C.border}`, background:C.surfaceHi,
            color:C.muted, fontSize:11, fontWeight:700,
            fontFamily:"'Montserrat',sans-serif", letterSpacing:".04em" }}
            title="Restore picks from a backup JSON file">
            ↑ Restore
            <input type="file" accept=".json" style={{ display:"none" }}
              onChange={e=>{
                const file = e.target.files?.[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                  try {
                    const data = JSON.parse(ev.target.result);
                    if (Array.isArray(data) && data.length > 0) {
                      if (window.confirm(`Import ${data.length} picks? This will replace your current picks.`)) {
                        setPicks(data);
                      }
                    } else { alert("Invalid backup file."); }
                  } catch { alert("Could not read file."); }
                };
                reader.readAsText(file);
                e.target.value = "";
              }} />
          </label>
          <button onClick={()=>onAdd(null)} style={{ padding:"9px 18px", borderRadius:7,
            border:`1px solid ${C.pitBlue}`, background:C.pitBlue,
            color:"#fff", cursor:"pointer", fontSize:12, fontWeight:700,
            fontFamily:"'Montserrat',sans-serif", letterSpacing:".06em" }}>
            + Custom Bet
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:14 }}>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ fontSize:9, fontWeight:700, color:C.muted, letterSpacing:".1em", textTransform:"uppercase", marginRight:2, flexShrink:0 }}>League</span>
          {["All","NBA","MLB","NCAAB","NCAAB Baseball","PGA","NFL","NHL","CFB","Other"].map(s=>(
            <button key={s} onClick={()=>setSportF(s)} style={{ padding:"4px 10px", borderRadius:16, border:"none", cursor:"pointer",
              fontSize:10, fontWeight:700, fontFamily:"'Montserrat',sans-serif",
              background:sportF===s?C.pitBlue:C.surface, color:sportF===s?"#fff":C.muted,
              outline:sportF===s?"none":`1px solid ${C.border}` }}>{s}</button>
          ))}
        </div>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ fontSize:9, fontWeight:700, color:C.muted, letterSpacing:".1em", textTransform:"uppercase", marginRight:2, flexShrink:0 }}>Bet Type</span>
          {["All",...BET_TYPES].map(b=>(
            <button key={b} onClick={()=>setLabelF(labelF===b?"All":b)} style={{ padding:"4px 10px", borderRadius:16, border:"none", cursor:"pointer",
              fontSize:10, fontWeight:700, fontFamily:"'Montserrat',sans-serif",
              background:labelF===b?C.pitBlue:C.surface, color:labelF===b?"#fff":C.muted,
              outline:labelF===b?"none":`1px solid ${C.border}` }}>{b}</button>
          ))}
        </div>
      </div>

      {picks.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 20px", color:C.muted }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🎯</div>
          <div style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>No picks yet</div>
          <div style={{ fontSize:13 }}>Add picks from the Odds Board or create a custom bet above.</div>
        </div>
      ) : (
        <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
          <div style={{ padding:"9px 14px", background:C.pitBlue,
            borderBottom:`1px solid ${C.border}`, display:"flex", gap:16 }}>
            {["Bet · Label · Sport","Odds · Stake","P&L · Result"].map(h=>(
              <div key={h} style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,.7)", letterSpacing:".1em", textTransform:"uppercase" }}>{h}</div>
            ))}
          </div>
          {filtered.map(p=>(
            <div key={p.id} style={{ position:"relative" }}>
              <PickRow pick={p} />
              <div style={{ padding:"0 14px 10px", background:C.surface, display:"flex", gap:8 }}>
                {p.result==="pending" && (
                  <button onClick={()=>setUpdating(p)} style={{
                    flex:1, padding:"7px 0", borderRadius:6,
                    border:`1px solid ${C.pitBlue}`, background:"transparent",
                    color:C.pitBlue, cursor:"pointer", fontSize:11, fontWeight:700,
                    fontFamily:"'Montserrat',sans-serif", letterSpacing:".05em" }}>
                    ✓ Grade This Pick
                  </button>
                )}
                <button onClick={()=>setEditing(p)} style={{
                  padding:"7px 14px", borderRadius:6,
                  border:`1px solid ${C.border}`, background:C.surfaceHi,
                  color:C.muted, cursor:"pointer", fontSize:11, fontWeight:700,
                  fontFamily:"'Montserrat',sans-serif", letterSpacing:".04em" }}>
                  ✎ Edit
                </button>
                <button onClick={()=>{
                  if (window.confirm(`Delete "${p.bet}"? This cannot be undone.`)) {
                    setPicks(prev => prev.filter(x => x.id !== p.id));
                  }
                }} style={{
                  padding:"7px 12px", borderRadius:6,
                  border:"1px solid rgba(192,36,62,.3)", background:"rgba(192,36,62,.06)",
                  color:C.loss, cursor:"pointer", fontSize:11, fontWeight:700,
                  fontFamily:"'Montserrat',sans-serif" }}
                  title="Delete this pick">
                  🗑
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding:"24px", textAlign:"center", color:C.muted, fontSize:13 }}>No picks match current filters.</div>
          )}
        </div>
      )}

      {updating && <UpdateResultModal pick={updating} onClose={()=>setUpdating(null)} onUpdate={updated=>{
        setPicks(prev=>prev.map(p=>p.id===updated.id?updated:p));
      }} />}
      {editing && <AddPickModal
        game={null}
        existingPick={editing}
        onClose={()=>setEditing(null)}
        onSave={updated=>setPicks(prev=>prev.map(p=>p.id===updated.id?updated:p))}
      />}
    </div>
  );
}

// ─── CHART HELPERS ────────────────────────────────────────────────────────────
function buildCumSeries(settledPicks, metric) {
  const pts = [];
  let cumPL = 0, cumW = 0, cumStake = 0;
  settledPicks.forEach((p, i) => {
    cumPL += p.profit;
    cumStake += p.stake;
    if (p.result === "win") cumW++;
    const n = i + 1;
    const val = metric === "cumPL"   ? cumPL
              : metric === "winRate" ? (cumW / n) * 100
              : cumStake > 0         ? (cumPL / cumStake) * 100
              : 0;
    pts.push({ i: n, val, profit: p.profit, bet: p.bet, date: p.date });
  });
  return pts;
}

// Multi-series SVG line chart
function MultiLineChart({ series, metric, height = 180 }) {
  if (!series.length || series.every(s => s.data.length < 2)) {
    return (
      <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center",
        color:C.muted, fontSize:12, fontStyle:"italic" }}>
        Need at least 2 settled picks to plot a chart
      </div>
    );
  }
  const W = 640, H = height, PAD = { t:12, r:16, b:30, l:54 };
  const allVals = series.flatMap(s => s.data.map(d => d.val));
  const minV = Math.min(...allVals, 0);
  const maxV = Math.max(...allVals, 0);
  const range = maxV - minV || 1;
  const maxN  = Math.max(...series.flatMap(s => s.data.map(d => d.i)));
  const xScale = n => PAD.l + (n - 1) / Math.max(maxN - 1, 1) * (W - PAD.l - PAD.r);
  const yScale = v => H - PAD.b - ((v - minV) / range) * (H - PAD.t - PAD.b);
  const zero = yScale(0);
  const fmtY = v => metric === "cumPL" ? `$${Math.round(v)}` : `${v.toFixed(0)}%`;
  const nTicks = 5;
  const yTicks = Array.from({ length: nTicks }, (_, i) => minV + (range * i / (nTicks - 1)));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height, overflow:"visible" }}>
      {/* grid lines */}
      {yTicks.map((v, i) => (
        <line key={i} x1={PAD.l} y1={yScale(v)} x2={W - PAD.r} y2={yScale(v)}
          stroke={C.border} strokeWidth="1" strokeDasharray={v === 0 ? "none" : "3,3"} />
      ))}
      {/* zero line bold */}
      <line x1={PAD.l} y1={zero} x2={W - PAD.r} y2={zero}
        stroke={C.muted} strokeWidth="1.5" strokeDasharray="5,3" />
      {/* series */}
      {series.map(({ data, color, label }) => {
        if (data.length < 2) return null;
        const d0 = data[0], dN = data[data.length - 1];
        const pathD = data.map((d, i) =>
          `${i === 0 ? "M" : "L"}${xScale(d.i).toFixed(1)},${yScale(d.val).toFixed(1)}`
        ).join(" ");
        const fillD = `${pathD} L${xScale(dN.i).toFixed(1)},${zero.toFixed(1)} L${xScale(d0.i).toFixed(1)},${zero.toFixed(1)} Z`;
        return (
          <g key={label}>
            <path d={fillD} fill={`${color}12`} />
            <path d={pathD} fill="none" stroke={color} strokeWidth="2.5"
              strokeLinejoin="round" strokeLinecap="round" />
            {data.map((d, i) => (
              <circle key={i} cx={xScale(d.i)} cy={yScale(d.val)} r={data.length > 20 ? 2 : 3.5}
                fill={d.profit >= 0 ? C.win : C.loss} stroke="#fff" strokeWidth="1.5">
                <title>{`[${label}] Pick #${d.i} · ${d.bet} · ${d.profit >= 0 ? "+" : ""}$${d.profit?.toFixed(2)}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
      {/* Y axis */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={PAD.l - 4} y1={yScale(v)} x2={PAD.l} y2={yScale(v)} stroke={C.border} strokeWidth="1" />
          <text x={PAD.l - 7} y={yScale(v) + 4} textAnchor="end" fontSize="9" fill={C.muted}>{fmtY(v)}</text>
        </g>
      ))}
      {/* X axis label */}
      <text x={(W - PAD.l - PAD.r) / 2 + PAD.l} y={H - 4} textAnchor="middle" fontSize="9" fill={C.muted}>
        Pick #
      </text>
    </svg>
  );
}

// ─── ANALYTICS TAB ────────────────────────────────────────────────────────────
function AnalyticsTab({ picks }) {
  const [chartDim, setChartDim]       = useState("league");   // league | betType | strategy
  const [chartMetric, setChartMetric] = useState("cumPL");    // cumPL | winRate | roi
  const [filterLeague, setFilterLeague]   = useState("All");
  const [filterBetType, setFilterBetType] = useState("All");
  const [filterStrategy, setFilterStrategy] = useState("All");

  const filtered = picks.filter(p => {
    if (filterLeague   !== "All" && (p.league || p.sport) !== filterLeague) return false;
    if (filterBetType  !== "All" && p.betType !== filterBetType) return false;
    if (filterStrategy !== "All" && !(p.strategyTags || []).includes(filterStrategy)) return false;
    return true;
  });

  const settled = filtered.filter(p => p.result !== "pending");
  const wins = settled.filter(p => p.result === "win").length;
  const totalStake  = settled.reduce((s, p) => s + p.stake, 0);
  const totalProfit = settled.reduce((s, p) => s + p.profit, 0);
  const roi = totalStake > 0 ? ((totalProfit / totalStake) * 100).toFixed(1) : "0.0";

  const allLeagues   = [...new Set(picks.map(p => p.league || p.sport).filter(Boolean))];
  const allBetTypes  = [...new Set(picks.map(p => p.betType).filter(Boolean))];
  const allStrategies= [...new Set(picks.flatMap(p => p.strategyTags || []).filter(Boolean))];

  // ── Build multi-series chart data by dimension ─────────────────────────────
  const SERIES_PALETTE = [C.pitBlue, "#C0243E", "#1A7A3F", "#B87800", "#7B3FA0", "#0066BB", "#D4500A", "#2563EB"];

  const chartSeries = (() => {
    if (chartDim === "league") {
      return allLeagues.map((lg, i) => {
        const sub = settled.filter(p => (p.league || p.sport) === lg);
        return { label: lg, data: buildCumSeries(sub, chartMetric), color: LEAGUE_COLORS[lg] || SERIES_PALETTE[i % SERIES_PALETTE.length] };
      }).filter(s => s.data.length >= 2);
    }
    if (chartDim === "betType") {
      return allBetTypes.map((bt, i) => {
        const sub = settled.filter(p => p.betType === bt);
        return { label: bt, data: buildCumSeries(sub, chartMetric), color: BET_TYPE_COLORS[bt] || SERIES_PALETTE[i % SERIES_PALETTE.length] };
      }).filter(s => s.data.length >= 2);
    }
    if (chartDim === "strategy") {
      return allStrategies.map((st, i) => {
        const sub = settled.filter(p => (p.strategyTags || []).includes(st));
        return { label: st, data: buildCumSeries(sub, chartMetric), color: STRATEGY_COLORS[st] || SERIES_PALETTE[i % SERIES_PALETTE.length] };
      }).filter(s => s.data.length >= 2);
    }
    // "all" — single series
    return [{ label: "All Picks", data: buildCumSeries(settled, chartMetric), color: C.pitBlue }];
  })();

  // ── Breakdown table helpers ────────────────────────────────────────────────
  function makeStats(label, subPicks) {
    const s = subPicks.filter(p => p.result !== "pending");
    const w = s.filter(p => p.result === "win").length;
    const net = s.reduce((acc, p) => acc + p.profit, 0);
    const stk = s.reduce((acc, p) => acc + p.stake, 0);
    const winPct = s.length > 0 ? Math.round((w / s.length) * 100) : 0;
    const r = stk > 0 ? ((net / stk) * 100).toFixed(1) : "—";
    return { label, w, losses: s.length - w, total: s.length, net, roi: r, winPct };
  }

  const leagueStats   = allLeagues.map(l => makeStats(l, filtered.filter(p => (p.league||p.sport) === l))).filter(x => x.total > 0);
  const betTypeStats  = allBetTypes.map(b => makeStats(b, filtered.filter(p => p.betType === b))).filter(x => x.total > 0);
  const stratStats    = allStrategies.map(t => makeStats(t, filtered.filter(p => (p.strategyTags||[]).includes(t)))).filter(x => x.total > 0);

  const SectionHead = ({ t, sub }) => (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:12, fontWeight:800, color:C.pitBlue, letterSpacing:".07em", textTransform:"uppercase" }}>{t}</div>
      {sub && <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{sub}</div>}
      <div style={{ height:2, background:C.bgAlt, marginTop:8, borderRadius:1 }} />
    </div>
  );

  const StatRow = ({ label, w, losses, total, net, roi, winPct }) => {
    const col = ALL_TAG_COLORS[label] || C.pitBlue;
    return (
      <div style={{ marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
          <div style={{ display:"flex", gap:6, alignItems:"center", minWidth:0, flex:1 }}>
            <Tag label={label} xs />
            <span style={{ fontSize:10, color:C.muted, whiteSpace:"nowrap" }}>{w}-{losses} ({total})</span>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center", flexShrink:0 }}>
            <span style={{ fontSize:10, color:C.muted, fontFamily:"'Roboto Mono',monospace" }}>ROI {roi}%</span>
            <span style={{ fontSize:12, fontWeight:800,
              color: winPct >= 55 ? C.win : winPct >= 45 ? C.pitGold : C.loss,
              fontFamily:"'Roboto Mono',monospace", minWidth:34, textAlign:"right" }}>{winPct}%</span>
            <span style={{ fontSize:12, fontWeight:800, color: net >= 0 ? C.win : C.loss,
              fontFamily:"'Roboto Mono',monospace", minWidth:58, textAlign:"right" }}>
              {net >= 0 ? "+" : ""}${net.toFixed(0)}
            </span>
          </div>
        </div>
        <div style={{ display:"flex", height:5, borderRadius:3, overflow:"hidden", background:C.bgAlt }}>
          <div style={{ width:`${winPct}%`, background:`linear-gradient(90deg,${col},${col}aa)`,
            transition:"width .5s ease", borderRadius:3 }} />
        </div>
      </div>
    );
  };

  const FilterChip = ({ val, active, onClick }) => (
    <button onClick={onClick} style={{ padding:"4px 11px", borderRadius:16, border:"none", cursor:"pointer",
      fontSize:10, fontWeight:700, fontFamily:"'Montserrat',sans-serif",
      background: active ? C.pitBlue : C.surfaceHi, color: active ? "#fff" : C.muted,
      transition:"all .15s" }}>{val}</button>
  );

  if (picks.length === 0) return (
    <div className="fade-up" style={{ textAlign:"center", padding:"80px 20px", color:C.muted }}>
      <div style={{ fontSize:40, marginBottom:14 }}>📈</div>
      <div style={{ fontSize:15, fontWeight:700, color:C.pitBlue, marginBottom:6 }}>No data yet</div>
      <div style={{ fontSize:13 }}>Start tracking picks and your analytics will populate here automatically.</div>
    </div>
  );

  return (
    <div className="fade-up">
      {/* ── Page title ── */}
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:20, fontWeight:900, color:C.pitBlue, letterSpacing:".03em" }}>ANALYTICS</div>
        <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
          Performance graphs filtered by league, bet type & strategy tag
        </div>
      </div>

      {/* ── Global filters ── */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10,
        padding:"14px 16px", marginBottom:16, boxShadow:"0 2px 8px rgba(0,53,148,.05)" }}>
        <div style={{ fontSize:9, fontWeight:800, color:C.muted, letterSpacing:".12em",
          textTransform:"uppercase", marginBottom:10 }}>Filter All Views</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:14 }}>
          {/* League filter */}
          <div>
            <div style={{ fontSize:9, color:C.muted, fontWeight:700, letterSpacing:".1em", marginBottom:5 }}>LEAGUE</div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              <FilterChip val="All" active={filterLeague==="All"} onClick={()=>setFilterLeague("All")} />
              {allLeagues.map(l => <FilterChip key={l} val={l} active={filterLeague===l} onClick={()=>setFilterLeague(l===filterLeague?"All":l)} />)}
            </div>
          </div>
          {/* Bet type filter */}
          {allBetTypes.length > 0 && (
            <div>
              <div style={{ fontSize:9, color:C.muted, fontWeight:700, letterSpacing:".1em", marginBottom:5 }}>BET TYPE</div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                <FilterChip val="All" active={filterBetType==="All"} onClick={()=>setFilterBetType("All")} />
                {allBetTypes.map(b => <FilterChip key={b} val={b} active={filterBetType===b} onClick={()=>setFilterBetType(b===filterBetType?"All":b)} />)}
              </div>
            </div>
          )}
          {/* Strategy filter */}
          {allStrategies.length > 0 && (
            <div>
              <div style={{ fontSize:9, color:C.muted, fontWeight:700, letterSpacing:".1em", marginBottom:5 }}>STRATEGY TAG</div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                <FilterChip val="All" active={filterStrategy==="All"} onClick={()=>setFilterStrategy("All")} />
                {allStrategies.map(s => <FilterChip key={s} val={s} active={filterStrategy===s} onClick={()=>setFilterStrategy(s===filterStrategy?"All":s)} />)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Summary KPIs ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10, marginBottom:18 }}>
        <StatPill label="Record"   value={`${wins}-${settled.length-wins}`} sub={`${filtered.filter(p=>p.result==="pending").length} pending`} accent={C.pitBlue} />
        <StatPill label="Win %"    value={`${settled.length>0?pct(wins,settled.length):0}%`} sub="settled bets" accent={C.cyan} />
        <StatPill label="ROI"      value={`${roi}%`} sub="return on investment" accent={Number(roi)>=0?C.win:C.loss} />
        <StatPill label="Net P&L"  value={`${totalProfit>=0?"+":""}$${totalProfit.toFixed(0)}`} sub="total profit/loss" accent={totalProfit>=0?C.win:C.loss} />
        <StatPill label="Avg Odds" value={settled.length>0?fmt(Math.round(settled.reduce((s,p)=>s+p.odds,0)/settled.length)):"—"} sub="on settled bets" accent={C.pitGold} />
      </div>

      {/* ── Performance Line Chart ── */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10,
        padding:18, marginBottom:16, boxShadow:"0 2px 8px rgba(0,53,148,.05)" }}>
        {/* chart controls */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
          flexWrap:"wrap", gap:10, marginBottom:14 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:800, color:C.pitBlue, letterSpacing:".06em",
              textTransform:"uppercase" }}>Performance Chart</div>
            <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>
              {chartSeries.length > 1
                ? `${chartSeries.length} series · hover dots for details`
                : "Hover dots to see pick details"}
            </div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {/* Dimension selector */}
            <div style={{ display:"flex", gap:3, background:C.bgAlt, borderRadius:8, padding:3 }}>
              {[["all","Overall"],["league","By League"],["betType","By Bet Type"],["strategy","By Strategy"]].map(([k,lbl]) => (
                <button key={k} onClick={()=>setChartDim(k)} style={{
                  padding:"4px 10px", borderRadius:6, border:"none", cursor:"pointer",
                  fontSize:10, fontWeight:700, fontFamily:"'Montserrat',sans-serif",
                  background: chartDim===k ? C.pitBlue : "transparent",
                  color: chartDim===k ? "#fff" : C.muted, whiteSpace:"nowrap" }}>{lbl}</button>
              ))}
            </div>
            {/* Metric selector */}
            <div style={{ display:"flex", gap:3, background:C.bgAlt, borderRadius:8, padding:3 }}>
              {[["cumPL","P&L $"],["winRate","Win %"],["roi","ROI %"]].map(([k,lbl])=>(
                <button key={k} onClick={()=>setChartMetric(k)} style={{
                  padding:"4px 10px", borderRadius:6, border:"none", cursor:"pointer",
                  fontSize:10, fontWeight:700, fontFamily:"'Montserrat',sans-serif",
                  background: chartMetric===k ? "#fff" : "transparent",
                  color: chartMetric===k ? C.pitBlue : C.muted,
                  boxShadow: chartMetric===k ? "0 1px 4px rgba(0,53,148,.15)" : "none" }}>{lbl}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        {chartSeries.length > 1 && (
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:12 }}>
            {chartSeries.map(s => (
              <div key={s.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:14, height:3, borderRadius:2, background:s.color }} />
                <span style={{ fontSize:10, color:C.muted, fontWeight:600 }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        <MultiLineChart series={chartSeries} metric={chartMetric} />
        <div style={{ fontSize:9, color:C.muted, textAlign:"center", marginTop:6 }}>
          Each dot = 1 settled pick · Colored by result (green = win, red = loss)
        </div>
      </div>

      {/* ── Three breakdown panels ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:14 }}>

        {/* By League */}
        {leagueStats.length > 0 && (
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10,
            padding:18, boxShadow:"0 2px 8px rgba(0,53,148,.05)" }}>
            <SectionHead t="By League" sub="Win %, ROI, Net P&L per league" />
            {leagueStats.map(s => <StatRow key={s.label} {...s} />)}
          </div>
        )}

        {/* By Bet Type */}
        {betTypeStats.length > 0 && (
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10,
            padding:18, boxShadow:"0 2px 8px rgba(0,53,148,.05)" }}>
            <SectionHead t="By Bet Type" sub="Moneyline, Spread, Total, etc." />
            {betTypeStats.map(s => <StatRow key={s.label} {...s} />)}
          </div>
        )}

        {/* By Strategy Tag */}
        {stratStats.length > 0 && (
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10,
            padding:18, boxShadow:"0 2px 8px rgba(0,53,148,.05)" }}>
            <SectionHead t="By Strategy Tag" sub="Custom tags you applied to picks" />
            {stratStats.map(s => <StatRow key={s.label} {...s} />)}
          </div>
        )}
      </div>

      {/* ── By Team ── */}
      {(() => {
        // Extract team names from pick.game field "Away @ Home" or "Team – Event"
        const teamMap = {};
        filtered.forEach(p => {
          if (p.result === "pending") return;
          // Try to extract team from bet description first (most reliable)
          const betWords = (p.bet || "").split(" ");
          const candidates = [];
          // From game field: "Away @ Home" → both teams
          const gameParts = (p.game || "").split(/\s+@\s+|vs\.?\s+/i);
          gameParts.forEach(part => {
            const t = part.trim().replace(/[#\d\s]+$/, "").trim(); // strip seed numbers
            if (t.length > 2) candidates.push(t);
          });
          // Use first candidate as "the team being bet" (away = first)
          const team = candidates[0] || p.game || "Unknown";
          if (!teamMap[team]) teamMap[team] = { label: team, wins: 0, losses: 0, net: 0 };
          if (p.result === "win") { teamMap[team].wins++; teamMap[team].net += p.profit; }
          else { teamMap[team].losses++; teamMap[team].net += p.profit; }
        });
        const teamStats = Object.values(teamMap)
          .filter(t => t.wins + t.losses >= 1)
          .sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses))
          .slice(0, 15);
        if (teamStats.length === 0) return null;
        return (
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10,
            padding:18, marginTop:14, boxShadow:"0 2px 8px rgba(0,53,148,.05)" }}>
            <SectionHead t="By Team" sub="Most-bet teams · win/loss record & net P&L" />
            {teamStats.map(({ label, wins, losses, net }) => {
              const total = wins + losses;
              const winPct = total > 0 ? Math.round((wins / total) * 100) : 0;
              return (
                <div key={label} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                    <div style={{ display:"flex", gap:8, alignItems:"center", minWidth:0, flex:1 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:C.text, whiteSpace:"nowrap",
                        overflow:"hidden", textOverflow:"ellipsis", maxWidth:160 }}>{label}</span>
                      <span style={{ fontSize:10, color:C.muted, whiteSpace:"nowrap" }}>{wins}-{losses} ({total} bets)</span>
                    </div>
                    <div style={{ display:"flex", gap:10, alignItems:"center", flexShrink:0 }}>
                      <span style={{ fontSize:12, fontWeight:800, fontFamily:"'Roboto Mono',monospace",
                        color: winPct>=55?C.win:winPct>=45?C.pitGold:C.loss }}>{winPct}%</span>
                      <span style={{ fontSize:12, fontWeight:800, fontFamily:"'Roboto Mono',monospace",
                        color:net>=0?C.win:C.loss, minWidth:58, textAlign:"right" }}>
                        {net>=0?"+":""}${net.toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:"flex", height:5, borderRadius:3, overflow:"hidden", background:C.bgAlt }}>
                    <div style={{ width:`${winPct}%`, background:`linear-gradient(90deg,${C.pitBlue},${C.pitBlue}88)`,
                      transition:"width .5s ease", borderRadius:3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {settled.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 20px", color:C.muted, marginTop:8 }}>
          <div style={{ fontSize:28, marginBottom:10 }}>🎯</div>
          <div style={{ fontSize:13 }}>Grade your pending picks to unlock performance charts.</div>
        </div>
      )}
    </div>
  );
}


// ─── PERSISTENT STORAGE ──────────────────────────────────────────────────────
// On a real hosted domain (Vercel, Netlify, etc.) localStorage is completely
// reliable and persists indefinitely until the user manually clears their browser.
// This is the production storage layer for Power Picks HQ.
const STORAGE_KEY       = "powerpickshq-picks-v1";
const CUSTOM_TAGS_KEY   = "powerpickshq-custom-tags-v1";

function loadCustomTagsSync() {
  try { const r = localStorage.getItem(CUSTOM_TAGS_KEY); return r ? JSON.parse(r) : []; }
  catch(_) { return []; }
}
function saveCustomTagsSync(tags) {
  try { localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(tags)); } catch(_) {}
}

async function loadPicks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Failed to load picks:", e);
  }
  return [];
}

async function savePicks(picks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(picks));
  } catch (e) {
    console.error("Failed to save picks:", e);
    throw e; // re-throw so the UI can show error status
  }
}


// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]               = useState("odds");
  const [picks, setPicks]           = useState([]);
  const [loaded, setLoaded]         = useState(false);
  const [sportF, setSportF]         = useState("All");
  const [addGame, setAddGame]       = useState(null);
  const [sharpF, setSharpF]         = useState("All");
  const [showCustomBet, setShowCustomBet] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // ── Games come from static GAMES constant — updated daily ──
  const [sportF_odds, setSportF_odds] = useState("All");

  // ── Load picks on mount ──
  useEffect(() => {
    loadPicks().then(savedPicks => {
      setPicks(savedPicks);
      setLoaded(true);
    }).catch(() => {
      setLoaded(true);
    });
  }, []);

  // ── Fetch odds when API key is set ──


  // ── Auto-save picks on every change (after initial load) ──
  useEffect(() => {
    if (!loaded) return;
    setSaveStatus("saving");
    savePicks(picks)
      .then(() => {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(""), 2500);
      })
      .catch((err) => {
        console.error("Pick save failed:", err);
        setSaveStatus("error");
        setTimeout(() => setSaveStatus(""), 4000);
      });
  }, [picks, loaded]);

  // ── Loading screen ──
  if (!loaded) {
    return (
      <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center",
        justifyContent:"center", flexDirection:"column", gap:16, fontFamily:"'Montserrat',sans-serif" }}>
        <style>{css}</style>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width:38, height:38, borderRadius:"50%",
          border:`3px solid ${C.bgAlt}`, borderTopColor:C.pitBlue,
          animation:"spin .75s linear infinite" }} />
        <div style={{ fontSize:12, color:C.muted, letterSpacing:".15em", textTransform:"uppercase" }}>
          Loading your picks…
        </div>
      </div>
    );
  }

  const filteredGames = sportF === "All" ? GAMES : GAMES.filter(g => g.sport === sportF);
  const filteredSharp = sharpF === "All" ? SHARP_DATA : SHARP_DATA.filter(d => d.sport === sharpF);
  const pending = picks.filter(p=>p.result==="pending").length;
  const settled = picks.filter(p=>p.result!=="pending");
  const wins = settled.filter(p=>p.result==="win").length;
  const netPL = settled.reduce((s,p)=>s+p.profit,0);

  const handleSavePick = (pick) => {
    setPicks(prev => [pick, ...prev]);
  };


  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text,
      fontFamily:"'Montserrat',sans-serif", position:"relative" }}>
      <style>{css}</style>

      {/* ── HEADER ── */}
      <header style={{ position:"sticky", top:0, zIndex:100, minHeight:56,
        display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 14px",
        flexWrap:"wrap", gap:8,
        borderBottom:`2px solid ${C.pitGoldBg}`, background:C.header, boxShadow:"0 2px 12px rgba(0,53,148,.25)" }}>

        {/* logo — custom SVG: gold lightning bolt inside Pitt blue shield */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Shield shape */}
            <path d="M18 2L4 8V18C4 25.7 10.2 32.8 18 34C25.8 32.8 32 25.7 32 18V8L18 2Z"
              fill="#003594" stroke="#FFB81C" strokeWidth="1.5"/>
            {/* Gold lightning bolt */}
            <path d="M21 5L12 19H18L15 31L26 15H20L21 5Z"
              fill="#FFB81C" stroke="#B87800" strokeWidth="0.5"/>
          </svg>
          <div>
            <div style={{ fontSize:15, fontWeight:900, color:C.pitGoldBg, letterSpacing:".06em",
              animation:"goldGlow 3.5s ease infinite" }}>
              POWER PICKS HQ
            </div>
            <div style={{ fontSize:8, color:"rgba(255,184,28,.6)", letterSpacing:".15em", textTransform:"uppercase", marginTop:1 }}>
              Sports Betting Tracker
            </div>
          </div>
        </div>

        {/* nav */}
        <nav style={{ display:"flex", gap:2 }}>
          {[["odds","⚡ Odds"],["picks","📋 Picks"],["analytics","📈 Analytics"],["sharp","🔬 Sharp"]].map(([t,lbl])=>(
            <button key={t} onClick={()=>setTab(t)} style={{ padding:"6px 14px", borderRadius:6, border:"none",
              cursor:"pointer", fontSize:11, fontWeight:700, letterSpacing:".05em", textTransform:"uppercase",
              fontFamily:"'Montserrat',sans-serif", transition:"all .15s",
              background: tab===t ? "rgba(255,184,28,.2)" : "transparent",
              color: tab===t ? C.pitGoldBg : "rgba(255,255,255,.7)",
              borderBottom: tab===t ? `2px solid ${C.pitGoldBg}` : "2px solid transparent" }}>
              {lbl}
              {t==="picks" && picks.length>0 && (
                <span style={{ marginLeft:5, fontSize:9, background:C.pitGold, color:C.bg,
                  borderRadius:10, padding:"1px 5px", fontWeight:900, background:C.pitGoldBg, color:C.pitBlue }}>{picks.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* bankroll area */}
        <div style={{ display:"flex", gap:14, alignItems:"center" }}>
          {/* save status pill */}
          {saveStatus && (
            <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px",
              borderRadius:20, fontSize:10, fontWeight:700, letterSpacing:".08em",
              transition:"opacity .3s",
              background: saveStatus==="saved" ? "rgba(61,219,122,.12)" : saveStatus==="error" ? "rgba(255,76,107,.12)" : "rgba(255,184,28,.1)",
              border: `1px solid ${saveStatus==="saved" ? "rgba(61,219,122,.35)" : saveStatus==="error" ? "rgba(255,76,107,.35)" : "rgba(255,184,28,.3)"}`,
              color: saveStatus==="saved" ? C.win : saveStatus==="error" ? C.loss : C.pitGold }}>
              {saveStatus==="saving" && <span style={{ width:7,height:7,borderRadius:"50%",border:`1.5px solid currentColor`,borderTopColor:"transparent",display:"inline-block",animation:"spin .6s linear infinite" }} />}
              {saveStatus==="saved"  && <span>✓</span>}
              {saveStatus==="error"  && <span>!</span>}
              <span>{saveStatus==="saving" ? "Saving…" : saveStatus==="saved" ? "Saved" : "Save error"}</span>
            </div>
          )}
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, color:"rgba(255,255,255,.6)", letterSpacing:".12em", textTransform:"uppercase" }}>Net P&L</div>
            <div style={{ fontSize:14, fontWeight:900, color: netPL>=0?C.win:netPL<0?C.loss:C.muted,
              fontFamily:"'Roboto Mono',monospace", color: netPL>0?C.win:netPL<0?"#FF6B7A":"rgba(255,255,255,.9)" }}>
              {netPL===0 ? "$0.00" : `${netPL>0?"+":""}$${netPL.toFixed(2)}`}
            </div>
          </div>
          <button onClick={()=>setShowCustomBet(true)} style={{ padding:"7px 14px", borderRadius:7,
            border:`1px solid ${C.pitGoldBg}`, background:C.pitGoldBg,
            color:C.pitBlue, cursor:"pointer", fontSize:11, fontWeight:800,
            fontFamily:"'Montserrat',sans-serif", letterSpacing:".06em" }}>
            + Bet
          </button>
        </div>
      </header>

      {/* ── STAT BAR ── */}
      <div style={{ padding:"10px 14px", borderBottom:`1px solid ${C.border}`, background:C.bgAlt }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
          <StatPill label="Record" value={`${wins}-${settled.length-wins}`} sub={`${pending} pending`} accent={C.pitBlue} />
          <StatPill label="Win %" value={`${settled.length>0?pct(wins,settled.length):0}%`} sub="settled" accent={C.cyan} />
          <StatPill label="ROI" value={`${settled.length>0?((netPL/settled.reduce((s,p)=>s+p.stake,0))*100).toFixed(1):0}%`} sub="settled bets" accent={netPL>=0?C.win:C.loss} />
          <StatPill label="Picks" value={picks.length} sub={`${pending} open`} accent={C.pitGoldBg} />
          <StatPill label="Sharp" value={SHARP_DATA.filter(d=>d.steam).length} sub="steam today" accent={C.cyan} />
        </div>
      </div>

      {/* ── MAIN ── */}
      <main style={{ padding:"16px", maxWidth:1400, margin:"0 auto" }}>

        {/* ═══ ODDS BOARD ═══ */}
        {tab === "odds" && (
          <div className="fade-up">

            {/* ── Daily lines banner ── */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14,
              padding:"8px 14px", background:C.surface, borderRadius:8,
              border:`1px solid ${C.border}`, flexWrap:"wrap" }}>
              <span style={{ width:8,height:8,borderRadius:"50%",background:C.win,flexShrink:0 }} />
              <span style={{ fontSize:11, fontWeight:700, color:C.win }}>DraftKings Lines</span>
              <span style={{ fontSize:10, color:C.muted }}>Updated daily · {ODDS_DATE}</span>
              <span style={{ fontSize:10, color:C.muted, marginLeft:"auto" }}>{GAMES.length} games loaded</span>
            </div>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
              <div>
                <div style={{ fontSize:20, fontWeight:900, color:C.pitBlue, letterSpacing:".03em" }}>ODDS BOARD</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                  `DraftKings · ${ODDS_DATE} · ${GAMES.length} games`
                </div>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {SPORTS_FILTER.map(s=>(
                  <button key={s} onClick={()=>setSportF(s)} style={{ padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer",
                    fontSize:11, fontWeight:700,
                    background: sportF===s ? C.pitBlue : C.surface,
                    border: sportF===s ? "none" : `1px solid ${C.border}`,
                    color: sportF===s ? "#fff" : C.muted,
                    fontFamily:"'Montserrat',sans-serif", transition:"all .15s" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>



            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:12 }}>
              {filteredGames.map(g=><GameCard key={g.id} g={g} onAddPick={game=>setAddGame(game)} />)}
            </div>
          </div>
        )}

        {/* ═══ PICKS ═══ */}
        {tab === "picks" && (
          <PicksTab picks={picks} setPicks={setPicks} onAdd={(g)=>{ if(g===null) setShowCustomBet(true); else setAddGame(g); }} />
        )}

        {/* ═══ SHARP ═══ */}
        {tab === "sharp" && (
          <div className="fade-up">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:12 }}>
              <div>
                <div style={{ fontSize:20, fontWeight:900, color:C.pitBlue, letterSpacing:".03em" }}>SHARP MONEY TRACKER</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Steam moves, reverse line movement & money %</div>
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center", padding:"6px 12px",
                background:`${C.pitBlue}10`, border:`1px solid ${C.pitBlue}33`, borderRadius:6 }}>
                <span style={{ width:7, height:7, borderRadius:"50%", background:C.pitGoldBg, boxShadow:`0 0 8px ${C.pitGoldBg}`, animation:"pulse 1.4s infinite" }} />
                <span style={{ fontSize:10, color:C.pitBlue, fontWeight:700, letterSpacing:".1em" }}>LIVE TRACKING</span>
              </div>
            </div>

            <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
              {[{lbl:"⚡ STEAM", c:C.pitBlue, d:"Rapid sharp money causing line move"},
                {lbl:"↩ RLM", c:"#D4500A", d:"Line moved opposite to public betting"}].map(({lbl,c,d})=>(
                <div key={lbl} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px",
                  background:`${c}0d`, border:`1px solid ${c}30`, borderRadius:7 }}>
                  <span style={{ fontSize:11, fontWeight:800, color:c, fontFamily:"'Montserrat',sans-serif" }}>{lbl}</span>
                  <span style={{ fontSize:11, color:C.muted }}>{d}</span>
                </div>
              ))}
            </div>

            <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
              {["All","NBA","MLB","NCAAB","PGA"].map(s=>(
                <button key={s} onClick={()=>setSharpF(s)} style={{ padding:"5px 13px", borderRadius:20, border:"none", cursor:"pointer",
                  fontSize:11, fontWeight:700, background: sharpF===s ? C.cyan : "rgba(0,53,148,.2)",
                  color: sharpF===s ? C.bg : C.muted, fontFamily:"'Montserrat',sans-serif" }}>{s}</button>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:12 }}>
              {filteredSharp.map(d=><SharpCard key={d.id} d={d} />)}
            </div>
          </div>
        )}

        {/* ═══ ANALYTICS ═══ */}
        {tab === "analytics" && <AnalyticsTab picks={picks} />}
      </main>

      {/* footer */}
      <footer style={{ padding:"14px 20px", borderTop:`1px solid ${C.border}`, marginTop:40, position:"relative", zIndex:1,
        display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
        <div style={{ fontSize:10, color:"rgba(255,255,255,.7)", fontWeight:700, letterSpacing:".1em" }}>POWER PICKS HQ</div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,.6)" }}>For entertainment only. Gamble responsibly. 21+</div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,.5)" }}>© 2026</div>
      </footer>

      {/* ── MODALS ── */}
      {addGame !== null && (
        <AddPickModal game={addGame} onClose={()=>setAddGame(null)} onSave={handleSavePick} />
      )}
      {showCustomBet && (
        <AddPickModal game={null} onClose={()=>setShowCustomBet(false)} onSave={handleSavePick} />
      )}
    </div>
  );
}

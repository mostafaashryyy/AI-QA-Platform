// Page CSS. Tokens, header band, cards, pills, filters, tables and the ⓘ tooltip are those of
// reports/AIPromptOutputHistory.html; the sticky section tabs follow reports/qa-journal (same tokens).
module.exports = `
:root{--bg:#f5f6f8;--card:#fff;--ink:#1d2330;--muted:#5d6675;--line:#e1e4ea;--accent:#3b4f9a;--hdr:#fff;--code:#f0f2f5;
--ok:#1e7f3c;--ok-bg:#e6f4ea;--bad:#b3261e;--bad-bg:#fbe9e7;--warn:#8a5a00;--warn-bg:#fff4dc;--neu:#3d4757;--neu-bg:#e9edf3;--dir:#1e5f8a;--dir-bg:#e3f0fa;--inf:#6b4fa0;--inf-bg:#efe9fa;
--f-ok:#2e9e4f;--f-bad:#d0453b;--f-warn:#e09a1f;--f-neu:#9aa3b2;--f-dir:#2f7fbf;--f-b1:#3b4f9a;--f-b2:#8a5fc7;color-scheme:light}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#14171c;--card:#1d2128;--ink:#e6e9ef;--muted:#a2abb9;--line:#323844;--accent:#9fb0ee;--hdr:#0d1014;--code:#262b34;
--ok:#6fd38c;--ok-bg:#183323;--bad:#ff8a80;--bad-bg:#3a1d1b;--warn:#ffcc66;--warn-bg:#3a2f14;--neu:#c9d1de;--neu-bg:#2a303a;--dir:#8cc8f0;--dir-bg:#16293a;--inf:#c3aef0;--inf-bg:#271f3a;
--f-ok:#4fbf6f;--f-bad:#f0645a;--f-warn:#f0b445;--f-neu:#6b7585;--f-dir:#5aa8e0;--f-b1:#8fa2ec;--f-b2:#b79af0;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#14171c;--card:#1d2128;--ink:#e6e9ef;--muted:#a2abb9;--line:#323844;--accent:#9fb0ee;--hdr:#0d1014;--code:#262b34;
--ok:#6fd38c;--ok-bg:#183323;--bad:#ff8a80;--bad-bg:#3a1d1b;--warn:#ffcc66;--warn-bg:#3a2f14;--neu:#c9d1de;--neu-bg:#2a303a;--dir:#8cc8f0;--dir-bg:#16293a;--inf:#c3aef0;--inf-bg:#271f3a;
--f-ok:#4fbf6f;--f-bad:#f0645a;--f-warn:#f0b445;--f-neu:#6b7585;--f-dir:#5aa8e0;--f-b1:#8fa2ec;--f-b2:#b79af0;color-scheme:dark}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%;scroll-padding-top:64px}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;overflow-x:hidden}
.wrap{max-width:1180px;margin:0 auto;padding:0 16px 48px}
header.top{background:var(--accent);color:var(--hdr);padding:22px 0 16px}header.top .wrap{padding-bottom:0}
header.top h1{margin:0 0 4px;font-size:1.6rem;line-height:1.25}header.top p{margin:0;opacity:.92}code.hc{background:transparent;color:inherit;padding:0}
.meta{display:flex;flex-wrap:wrap;gap:6px 18px;margin:12px 0 0;padding:0;list-style:none;font-size:.86rem}.meta li{opacity:.95;overflow-wrap:anywhere}.meta b{font-weight:600;opacity:.8;margin-right:4px}
.hdr-flags{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.flag{display:inline-flex;align-items:center;border-radius:999px;padding:2px 11px;font-size:.8rem;font-weight:700;background:var(--hdr);color:var(--accent)}
.flag.draft{background:var(--warn-bg);color:var(--warn);letter-spacing:.03em}
.flag.qa{background:transparent;color:var(--hdr);border:1px solid currentColor;font-weight:600}
nav.secnav{position:sticky;top:0;z-index:30;background:var(--card);border-bottom:1px solid var(--line);margin-bottom:16px}
nav.secnav .wrap{display:flex;gap:4px;overflow-x:auto;padding-top:6px;padding-bottom:6px;scrollbar-width:thin}
nav.secnav a{white-space:nowrap;text-decoration:none;color:var(--muted);padding:6px 11px;border-radius:8px;font-size:.88rem}
nav.secnav a .n{font-variant-numeric:tabular-nums;opacity:.7;margin-right:5px}
nav.secnav a:hover{color:var(--ink);background:var(--code)}nav.secnav a[aria-current="true"]{background:var(--dir-bg);color:var(--accent);font-weight:600}
.banner-draft{border:1px dashed var(--warn);background:var(--warn-bg);color:var(--ink);border-radius:10px;padding:10px 14px;margin:0 0 16px;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center}
.banner-draft b{color:var(--warn);letter-spacing:.02em}
section{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px;margin:0 0 18px;min-width:0}
h2{margin:0 0 14px;font-size:1.2rem;border-left:4px solid var(--accent);padding-left:10px;display:flex;align-items:center;flex-wrap:wrap;gap:4px 6px}
h2 .sn{display:inline-grid;place-items:center;min-width:1.6em;height:1.6em;border-radius:6px;background:var(--dir-bg);color:var(--accent);font-size:.85rem;margin-right:4px}
h3{margin:14px 0 8px;font-size:1.02rem;overflow-wrap:anywhere}p,li{overflow-wrap:anywhere}
.lead{margin:12px 0}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0 0 14px}.cards.k8{grid-template-columns:repeat(auto-fit,minmax(128px,1fr))}
.card,.mc{border:1px solid var(--line);border-top:4px solid var(--accent);border-radius:10px;padding:12px;background:var(--card);min-width:0}
.card .v,.mc .v{font-size:1.5rem;font-weight:700;line-height:1.2}.card .v .pill{font-size:1rem}.card .l,.mc .l{color:var(--muted);font-size:.84rem}
.card .sub{font-size:.8rem;color:var(--muted);margin-top:4px;overflow-wrap:anywhere}
.card.ok,.mc.ok{border-top-color:var(--ok)}.card.ok .v{color:var(--ok)}.card.bad,.mc.bad{border-top-color:var(--bad)}.card.bad .v{color:var(--bad)}
.card.warn,.mc.warn{border-top-color:var(--warn)}.card.warn .v{color:var(--warn)}.card.neu,.mc.neu{border-top-color:var(--neu)}
.card.b1{border-top-color:var(--f-b1)}.card.b2{border-top-color:var(--f-b2)}
.mcs{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin:8px 0}.mc{border-top-width:3px;padding:9px}.mc .v{font-size:1.2rem}
.frac{display:block;font-size:.76rem;color:var(--muted);font-weight:400}td .frac{display:inline}.na{font-size:.8rem;color:var(--muted)}
.two{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px;margin:0 0 12px}.two>*,.reco-grid>*,.bind-grid>*{min-width:0}
.box{border:1px solid var(--line);border-radius:10px;padding:12px 14px;background:var(--card);min-width:0}.box h3{margin-top:0}
code{font-family:ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace;font-size:.85em;background:var(--code);padding:1px 5px;border-radius:4px;overflow-wrap:anywhere}
code.path{font-size:.8em}a{color:var(--accent);overflow-wrap:anywhere}
.kv{display:grid;grid-template-columns:minmax(110px,max-content) 1fr;gap:6px 14px;margin:0}.kv dt{color:var(--muted);font-size:.88rem}.kv dd{margin:0;min-width:0;overflow-wrap:anywhere}
.src{font-size:.85rem;color:var(--muted);margin:4px 0}.muted{color:var(--muted);font-size:.88rem}.rule{border-left:3px solid var(--line);padding-left:10px;font-size:.9rem}
.filters{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin:10px 0}
.filters label{font-size:.85rem;color:var(--muted);display:flex;flex-direction:column;gap:3px;max-width:100%}
.filters select,.filters input,.btn{font:inherit;font-size:.9rem;padding:6px 10px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--ink);max-width:100%}
.filters input[type=search]{min-width:min(240px,100%)}.btn{cursor:pointer}.btn:hover{background:var(--code)}.btn.sm{padding:3px 9px;font-size:.8rem}
.count{font-size:.85rem;color:var(--muted);align-self:center}
.pill{display:inline-block;padding:2px 9px;border-radius:999px;font-size:.8rem;font-weight:600;white-space:nowrap}
.pill.ok{color:var(--ok);background:var(--ok-bg)}.pill.bad{color:var(--bad);background:var(--bad-bg)}.pill.warn{color:var(--warn);background:var(--warn-bg)}.pill.neutral{color:var(--neu);background:var(--neu-bg)}
.cls{font-family:ui-monospace,Consolas,monospace;font-size:.8rem;background:var(--code);border-radius:4px;padding:0 5px}
.rid{display:block;font-family:ui-monospace,Consolas,monospace;font-size:.72rem;color:var(--muted)}
.tbl{overflow-x:auto;border:1px solid var(--line);border-radius:8px;margin:6px 0 12px}
table{border-collapse:collapse;width:100%;font-size:.86rem}th,td{padding:6px 9px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
th{background:var(--code);white-space:nowrap;position:relative}tr:last-child td{border-bottom:0}
table.sortable th{cursor:pointer;user-select:none}table.sortable th::after{content:"↕";opacity:.35;margin-left:5px;font-size:.8em}
table.sortable th[aria-sort="ascending"]::after{content:"↑";opacity:.9}table.sortable th[aria-sort="descending"]::after{content:"↓";opacity:.9}
td:first-child,td code.path{white-space:nowrap}td code{overflow-wrap:anywhere}
.nw{white-space:nowrap}tr.hidden{display:none}tr.crit td:first-child{box-shadow:inset 4px 0 0 var(--bad)}tr.sub-h td{background:var(--code);font-weight:600;font-size:.8rem;color:var(--muted)}
details{margin:6px 0}summary{cursor:pointer;font-weight:600;font-size:.92rem}details.evd{margin:0}details.evd summary{font-weight:400;font-size:.84rem;color:var(--accent);white-space:nowrap}details.evd ul{margin:4px 0;padding-left:18px;font-size:.84rem}
details.sec{border:1px solid var(--line);border-radius:8px;margin:10px 0}details.sec>summary{padding:9px 12px}details.sec>.in{padding:0 12px 10px}
ul.clean,ol.clean{margin:6px 0;padding-left:20px}ul.clean li,ol.clean li{margin:3px 0}
ul.checklist{list-style:none;margin:6px 0;padding:0}ul.checklist li{padding:4px 0 4px 26px;position:relative}ul.checklist li::before{content:"";position:absolute;left:2px;top:8px;width:13px;height:13px;border:2px solid var(--muted);border-radius:3px}
.callout{border-left:4px solid var(--warn);background:var(--warn-bg);padding:10px 12px;border-radius:6px;margin:8px 0}.callout.info{border-left-color:var(--dir);background:var(--dir-bg)}
.checks{display:flex;flex-direction:column;gap:4px;margin:0 0 10px;font-size:.88rem}
.bind-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:14px;margin:6px 0 14px}
.bind{border:1px solid var(--line);border-left:4px solid var(--f-b1);border-radius:10px;padding:12px 14px;min-width:0}.bind.b2{border-left-color:var(--f-b2)}.bind h3{margin:0}
.orig,.verify{white-space:nowrap}
.reco{display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center;justify-content:space-between;border:1px solid var(--line);border-left:6px solid var(--neu);border-radius:12px;padding:14px 18px;background:var(--neu-bg);margin:0 0 12px}
.reco .reco-k{font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-weight:600}
.reco .reco-v{font-size:1.6rem;font-weight:800;line-height:1.2}.reco.big .reco-v{font-size:2rem}.reco .reco-t{margin-top:2px}
.reco .reco-r{display:flex;flex-direction:column;gap:4px;max-width:420px;font-size:.86rem}.reco-rule{font-weight:600}.reco-disc{color:var(--muted)}
.reco.go{border-left-color:var(--ok);background:var(--ok-bg)}.reco.go .reco-v{color:var(--ok)}
.reco.cond{border-left-color:var(--warn);background:var(--warn-bg)}.reco.cond .reco-v{color:var(--warn)}
.reco.nogo{border-left-color:var(--bad);background:var(--bad-bg)}.reco.nogo .reco-v{color:var(--bad)}.reco.insuf .reco-v{color:var(--neu)}
.reco-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin:10px 0}.reco-grid .wide{grid-column:span 2}
.disclaimer{border-top:1px solid var(--line);padding-top:10px;margin-top:12px;font-size:.88rem;color:var(--muted)}
figure.chart{margin:0 0 12px;border:1px solid var(--line);border-radius:10px;padding:10px 12px;min-width:0}
figure.chart figcaption{font-weight:600;font-size:.9rem;margin-bottom:8px}figure.chart svg{width:100%;height:auto;display:block}figure.chart svg.bars{max-width:600px}svg.stack{height:34px}
.f-ok{fill:var(--f-ok);background:var(--f-ok)}.f-bad{fill:var(--f-bad);background:var(--f-bad)}.f-warn{fill:var(--f-warn);background:var(--f-warn)}.f-neu{fill:var(--f-neu);background:var(--f-neu)}
.f-dir{fill:var(--f-dir);background:var(--f-dir)}.f-b1{fill:var(--f-b1);background:var(--f-b1)}.f-b2{fill:var(--f-b2);background:var(--f-b2)}
svg text{fill:var(--ink);font-size:12px}svg text.val{fill:var(--muted);font-size:11px}svg .axis{stroke:var(--line)}
ul.legend{list-style:none;display:flex;flex-wrap:wrap;gap:4px 14px;margin:8px 0 0;padding:0;font-size:.82rem}ul.legend .sw{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}
footer{color:var(--muted);font-size:.84rem;padding:10px 0 30px;border-top:1px solid var(--line);margin-top:8px;overflow-wrap:anywhere}
.hint{display:inline-flex;align-items:center;justify-content:center;min-width:1.3em;min-height:1.3em;margin-inline-start:3px;border-radius:50%;font:400 .8rem/1 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:var(--muted);opacity:.6;cursor:help;vertical-align:middle;text-transform:none;letter-spacing:0;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
.hint::before{content:"\\24D8"}
.hint{position:relative}.hint::after{content:"";position:absolute;inset:-4px;border-radius:50%}
.hint:hover,.hint:focus-visible,.hint[aria-expanded="true"]{opacity:1;color:var(--accent)}
.hint:focus{outline:none}.hint:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
header.top .hint,.pill .hint,.flag .hint{color:inherit}
header.top .hint:hover,header.top .hint:focus-visible,header.top .hint[aria-expanded="true"]{color:inherit;outline-color:currentColor}
#hint-tip{position:fixed;z-index:1000;top:0;left:0;max-width:min(340px,calc(100vw - 24px));padding:9px 12px;border-radius:8px;background:var(--ink);color:var(--card);font:400 .87rem/1.75 "Segoe UI",Tahoma,system-ui,-apple-system,Roboto,Arial,sans-serif;text-align:right;box-shadow:0 6px 22px rgba(0,0,0,.28);overflow-wrap:anywhere;pointer-events:none}
#hint-tip[hidden]{display:none}
@media (max-width:640px){header.top h1{font-size:1.3rem}section{padding:14px}.reco-grid .wide{grid-column:auto}.reco.big .reco-v{font-size:1.6rem}.two,.bind-grid{grid-template-columns:1fr}}
@media print{body{background:#fff;color:#000}nav.secnav,.filters,.btn{display:none}header.top{background:none;color:#000;padding:0}.flag.qa{color:#000}tr.hidden{display:table-row}
section{break-inside:avoid-page;border-color:#999}.hint,#hint-tip{display:none!important}a{color:#000}}`;

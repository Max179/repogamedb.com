export const themeCSS = `/* R.E.P.O. industrial HUD theme: black steel, hazard yellow, warning red, bone text. */
:root{
  --bg:#080a08;--bg2:#0d100d;--panel:#121712;--panel2:#1a211a;--metal:#252d26;
  --line:#3b463b;--line2:#556354;--ink:#f1ecda;--bone:#d8d2bd;--muted:#a3ad9e;--dim:#7f8b7d;
  --hazard:#f2b705;--hazard2:#ffd23f;--danger:#d3402f;--danger2:#ff6a50;--crt:#a8cf6a;
  --accent:var(--hazard);--radius:2px;--shadow:0 18px 50px rgba(0,0,0,.45);
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:
  radial-gradient(1200px 700px at 18% -10%,rgba(242,183,5,.07),transparent 60%),
  radial-gradient(900px 500px at 100% 0%,rgba(211,64,47,.06),transparent 55%),
  repeating-linear-gradient(0deg,rgba(255,255,255,.018) 0 1px,transparent 1px 4px),
  var(--bg);
  color:var(--ink);font:16px/1.65 "Arial Narrow","Helvetica Neue",Arial,sans-serif;letter-spacing:.01em}
body:before{content:"";position:fixed;inset:0;z-index:60;pointer-events:none;background:repeating-linear-gradient(0deg,transparent 0 2px,rgba(0,0,0,.16) 2px 3px);opacity:.22;mix-blend-mode:multiply}
a{color:var(--hazard);text-decoration:none}a:hover{text-decoration:underline;text-underline-offset:.18em}
:focus-visible{outline:3px solid var(--hazard);outline-offset:3px}
.wrap{max-width:72rem;margin:0 auto;padding:0 1.15rem}
.skip{position:absolute;left:-9999px;top:0;z-index:100;background:var(--hazard);color:#0a0c09;padding:.6rem 1rem}
.skip:focus{left:12px}
h1,h2,h3,.brand span,.sectionHead h2{font-family:Impact,"Arial Narrow",Haettenschweiler,"Franklin Gothic Condensed",sans-serif;text-transform:uppercase;letter-spacing:.045em;line-height:1.02;font-weight:400}
h1{font-size:clamp(2.2rem,5vw,3.6rem);margin:.35rem 0 .7rem;text-shadow:0 2px 0 #000,0 0 24px rgba(242,183,5,.08)}
h2{font-size:clamp(1.5rem,2.6vw,2.1rem);margin:2.3rem 0 .7rem}
h3{font-size:1.2rem;letter-spacing:.05em;margin:1.5rem 0 .4rem}
p{margin:.7rem 0}
.lead{font-size:1.12rem;color:var(--bone);max-width:48rem}
.dim{color:var(--muted)}.small{font-size:.86rem}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:0;text-transform:none}
.kicker{color:var(--hazard);font:700 .74rem/1.4 ui-monospace,monospace;letter-spacing:.18em;text-transform:uppercase;margin:0 0 .35rem}
header.top{position:sticky;top:0;z-index:30;background:linear-gradient(180deg,rgba(11,14,11,.98),rgba(8,10,8,.96));border-bottom:1px solid var(--line);backdrop-filter:blur(8px)}
header.top:after{content:"";display:block;height:6px;background:repeating-linear-gradient(135deg,var(--hazard) 0 13px,#0a0c09 13px 26px)}
.bar{display:flex;align-items:center;gap:1rem;flex-wrap:wrap;padding:.72rem 1.15rem}
.brand{display:flex;align-items:center;gap:.6rem;color:var(--ink);font-weight:700;letter-spacing:.04em}
.brand img{width:36px;height:36px;border:1px solid var(--hazard);border-radius:2px;background:#0a0c09}
.brand span{font-size:1.28rem;text-transform:uppercase;letter-spacing:.02em;white-space:nowrap}
.brand em{color:var(--hazard);font-style:normal;font-weight:400;margin-left:.18rem}
nav.main{display:flex;gap:1.05rem;flex:1 1 auto;flex-wrap:wrap;align-items:center;padding-left:.7rem;border-left:1px solid var(--line)}
nav.main a{color:var(--muted);padding:.34rem 0;border-bottom:2px solid transparent;font:700 .76rem/1 ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase}
nav.main a:hover{color:var(--ink)}
nav.main a.on{color:var(--hazard);border-bottom-color:var(--hazard)}
.hsearch{display:flex;gap:0}
input[type=search]{padding:.6rem .75rem;background:#090c09;color:var(--ink);border:1px solid var(--line2);border-left:3px solid var(--hazard);border-radius:0;min-width:13rem;font:inherit}
input[type=search]::placeholder{color:var(--dim)}
button,.btn{padding:.58rem .95rem;border:1px solid var(--line2);background:linear-gradient(180deg,var(--panel2),var(--panel));color:var(--ink);border-radius:0;cursor:pointer;font:700 .8rem/1.2 ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;display:inline-block}
button:hover,.btn:hover{border-color:var(--hazard);color:var(--hazard);text-decoration:none}
.btn.primary,button[type=submit]{background:var(--hazard);color:#0a0c09;border-color:var(--hazard);font-weight:800}
.btn.primary:hover,button[type=submit]:hover{background:var(--hazard2);color:#0a0c09}
main{padding:1.6rem 1.15rem 3.5rem}
.hero{position:relative;display:grid;grid-template-columns:1.12fr .88fr;gap:1.8rem;align-items:center;padding:1.5rem;margin:.6rem 0 1rem;background:linear-gradient(155deg,#151c16,#0b0e0b 68%);border:1px solid var(--line);box-shadow:var(--shadow)}
.hero:before{content:"";position:absolute;left:0;right:0;top:0;height:7px;background:repeating-linear-gradient(135deg,var(--hazard) 0 14px,#0a0c09 14px 28px)}
.heroText{padding-top:.25rem}
.heroArt{position:relative;overflow:hidden;margin:0;border:1px solid var(--hazard);background:#070907}
.heroArt:before{content:"";position:absolute;z-index:2;left:0;top:0;width:96px;height:8px;background:repeating-linear-gradient(135deg,var(--danger) 0 9px,#0a0c09 9px 18px)}
.heroArt img{width:100%;height:auto;aspect-ratio:3/1;object-fit:cover;display:block;filter:saturate(1.05) contrast(1.06) brightness(.92)}
.heroArt:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 42%,rgba(5,7,5,.86))}
.heroArt figcaption{position:absolute;z-index:3;left:16px;right:16px;bottom:12px;color:var(--bone);font:600 .8rem/1.45 ui-monospace,monospace}
.heroSearch{display:flex;gap:.5rem;margin:1.1rem 0 .8rem}.heroSearch input{flex:1 1 auto}
.ctas{display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.8rem}
.block{margin:2.6rem 0}
.sectionHead{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:18px;padding-bottom:.7rem;border-bottom:1px solid var(--line)}
.sectionHead h2{margin:.15rem 0}
.sectionHead>a{color:var(--hazard);font:700 .8rem/1 ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em}
.categoryRail{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.categoryTile{position:relative;min-height:198px;padding:18px 16px 16px;display:flex;flex-direction:column;overflow:hidden;background:linear-gradient(150deg,#1c241d,#0d110e);border:1px solid var(--line);transition:transform .16s,border-color .16s,box-shadow .16s}
.categoryTile:before{content:"";position:absolute;left:0;top:0;width:62px;height:7px;background:repeating-linear-gradient(135deg,var(--hazard) 0 8px,transparent 8px 16px)}
.categoryTile:hover{transform:translateY(-3px);border-color:var(--hazard);box-shadow:0 10px 30px rgba(0,0,0,.45)}
.categoryIcon{position:absolute;right:-22px;top:-22px;width:112px;height:112px;object-fit:cover;opacity:.42;border-radius:50%;filter:saturate(.8) contrast(1.1)}
.categoryGlyph{position:relative;color:var(--hazard);font:400 30px/1 Impact,"Arial Narrow",sans-serif}
.categoryTile strong{position:relative;margin-top:auto;font-family:Impact,"Arial Narrow",sans-serif;font-size:1.35rem;text-transform:uppercase;letter-spacing:.03em}
.categoryTile>span:last-child{position:relative;margin-top:7px;color:var(--muted);font-size:.9rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(15rem,1fr));gap:1rem}
.card{position:relative;display:flex;flex-direction:column;gap:.42rem;background:linear-gradient(160deg,var(--panel2),var(--panel));border:1px solid var(--line);padding:.72rem;color:var(--ink);transition:border-color .15s,transform .15s}
.card:before{content:"";position:absolute;right:0;top:0;width:42px;height:5px;background:repeating-linear-gradient(135deg,var(--hazard) 0 6px,transparent 6px 12px);opacity:.75}
.card:hover{border-color:var(--hazard);transform:translateY(-2px);text-decoration:none}
.card img{width:100%;aspect-ratio:16/10;object-fit:cover;border:1px solid #050705;background:#000}
.card strong{font-family:Impact,"Arial Narrow",sans-serif;font-size:1.08rem;text-transform:uppercase;letter-spacing:.02em;line-height:1.15}
.card .dim{font-size:.9rem}
.chip{align-self:flex-start;font:700 .68rem/1.4 ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--hazard);border:1px solid var(--line2);padding:.12rem .5rem}
.qgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(16rem,1fr));gap:1rem}
.qcard{background:linear-gradient(160deg,var(--panel2),var(--panel));border:1px solid var(--line);border-left:3px solid var(--danger);padding:.95rem;display:flex;flex-direction:column;gap:.35rem}
.qcard strong{font-family:Impact,"Arial Narrow",sans-serif;text-transform:uppercase;letter-spacing:.02em}
.filter{display:flex;gap:.6rem;align-items:center;margin:1rem 0;flex-wrap:wrap}
.updates{list-style:none;padding:0}.updates li{padding:.45rem 0;border-bottom:1px solid var(--line)}.when{color:var(--dim);font-size:.85rem;margin-right:.5rem}
.entry{max-width:48rem}
.heroimg{margin:0 0 1.1rem}.heroimg img,.banner img{width:100%;height:auto;border:1px solid var(--hazard);display:block;box-shadow:0 12px 34px rgba(0,0,0,.4)}
.heroimg figcaption,.banner figcaption{margin-top:.5rem;color:var(--muted);font:.82rem/1.5 ui-monospace,monospace}
.oneline{font-size:1.08rem;background:linear-gradient(90deg,var(--panel2),var(--panel));border-left:4px solid var(--danger);padding:.8rem 1rem;max-width:48rem}
.facts{background:linear-gradient(160deg,var(--panel2),var(--panel));border:1px solid var(--line);border-top:3px solid var(--hazard);padding:.9rem 1.1rem;max-width:48rem}
.facts dl{display:grid;grid-template-columns:max-content 1fr;gap:.35rem 1rem;margin:.4rem 0 0}.facts dt{color:var(--hazard);font:700 .72rem/1.6 ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase}.facts dd{margin:0}
.verified li,.steps li{margin:.5rem 0}
.note{border-left:4px solid var(--hazard);background:linear-gradient(90deg,var(--panel2),var(--panel));padding:.85rem 1rem;max-width:48rem}
.note strong{color:var(--hazard)}
table{border-collapse:collapse;width:100%;font-size:.94rem}
td,th{border-bottom:1px solid var(--line);padding:.42rem .55rem;text-align:left;vertical-align:top}
th{color:var(--hazard);font:700 .72rem/1.4 ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;border-bottom:2px solid var(--hazard)}
tr:hover td{background:rgba(242,183,5,.035)}
footer.foot{border-top:3px solid var(--hazard);padding:1.8rem 0 2.8rem;margin-top:2.8rem;background:linear-gradient(180deg,var(--bg),#050605)}
footer.foot:before{content:"";display:block;height:6px;margin-top:-1.8rem;margin-bottom:1.4rem;background:repeating-linear-gradient(135deg,var(--hazard) 0 13px,#0a0c09 13px 26px)}
footer.foot p{margin:.4rem 0}
footer.foot a{color:var(--bone)}
/* search */
.searchPage{max-width:60rem}
.searchbox{display:flex;gap:.5rem;margin:1.2rem 0 .9rem}
.searchbox input{flex:1 1 auto;font-size:1.05rem;padding:.8rem .9rem}
.filters{display:flex;gap:.45rem;flex-wrap:wrap;margin:.8rem 0 1.2rem}
.filters button{background:var(--panel);border-color:var(--line);color:var(--muted);font-size:.72rem;padding:.42rem .7rem}
.filters button.on{background:var(--hazard);color:#0a0c09;border-color:var(--hazard)}
.results{display:flex;flex-direction:column;gap:.7rem}
.result{display:block;background:linear-gradient(160deg,var(--panel2),var(--panel));border:1px solid var(--line);border-left:3px solid var(--hazard);padding:.75rem .95rem;color:var(--ink)}
.result:hover{border-color:var(--hazard);text-decoration:none}
.result h2{font-size:1.15rem;margin:0 0 .2rem;letter-spacing:.03em}
.result .meta{font:700 .7rem/1.5 ui-monospace,monospace;color:var(--hazard);letter-spacing:.08em;text-transform:uppercase}
.result p{margin:.25rem 0 0;color:var(--muted);font-size:.92rem}
.empty{border:1px dashed var(--line2);padding:1.2rem;color:var(--muted)}
.tag{display:inline-block;border:1px solid var(--line2);color:var(--hazard);padding:0 .4rem;font:700 .68rem/1.4 ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em}
@media(max-width:980px){.categoryRail{grid-template-columns:1fr 1fr}.hero{grid-template-columns:1fr}.heroArt img{aspect-ratio:16/9}}
@media(max-width:720px){.bar{gap:.6rem}.hsearch{width:100%}.hsearch input{flex:1 1 auto;min-width:0}.categoryRail{grid-template-columns:1fr 1fr}.sectionHead{flex-direction:column;align-items:flex-start}nav.main{padding-left:0;border-left:0;border-top:1px solid var(--line);padding-top:.5rem;width:100%}main{padding:1.1rem .9rem 2.6rem}h1{font-size:2.4rem}}
@media(max-width:430px){.categoryRail{grid-template-columns:1fr}.ctas .btn{flex:1 1 100%;text-align:center}.searchbox{flex-direction:column}.filters button{flex:1 1 auto}}
`;

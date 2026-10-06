export function searchPage(t, locale, catalog) {
  const kinds = [t('search.all'), t('nav.enemies'), t('nav.items'), t('nav.levels')];
  return `<section class="page-shell" id="content"><p class="eyebrow">${t('catalog.eyebrow')}</p><h1>${t('search.h1')}</h1>
    <label for="q">${t('search.label')}</label><input class="search-input" id="q" type="search" placeholder="${t('search.placeholder')}" maxlength="120">
  <div class="filter-row" aria-label="Content type">${kinds.map((x, i) => `<button class="filter" data-kind="${i}" aria-pressed="${i === 0}">${x}</button>`).join('')}</div>
  <p id="result-count" role="status"></p><div id="results" class="search-results"></div><noscript>${catalog.map((p) => `<p><a href="${p.href}">${p.title}</a></p>`).join('')}</noscript></section>
  <script>const catalog=${JSON.stringify(catalog)};const input=document.getElementById('q');let kind=0;input.value=new URLSearchParams(location.search).get('q')||'';
  function draw(){const query=input.value.trim().toLowerCase();const rows=catalog.filter(p=>(kind===0||p.kind===kind)&&(!query||(p.title+' '+p.text).toLowerCase().includes(query)));document.getElementById('result-count').textContent=${JSON.stringify(t('search.results'))}.replace('{n}',rows.length);const out=document.getElementById('results');out.replaceChildren();rows.forEach(p=>{const a=document.createElement('a');a.className='search-result';a.href=p.href;const tag=document.createElement('span');tag.textContent=p.category;const h=document.createElement('h2');h.textContent=p.title;const text=document.createElement('p');text.textContent=p.text;a.append(tag,h,text);out.append(a)});if(!rows.length){const p=document.createElement('p');p.textContent=${JSON.stringify(t('search.noResults'))};out.append(p)}const url=new URL(location.href);query?url.searchParams.set('q',input.value):url.searchParams.delete('q');history.replaceState(null,'',url)}
  input.addEventListener('input',draw);document.querySelectorAll('[data-kind]').forEach(b=>b.addEventListener('click',()=>{kind=Number(b.dataset.kind);document.querySelectorAll('[data-kind]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));draw()}));draw();</script>`;
}

export function checklistPage(t, locale) {
  const checks = [t('tool.check1'), t('tool.check2'), t('tool.check3'), t('tool.check4'), t('tool.check5')];
  return `<section class="page-shell" id="content"><p class="eyebrow">${t('nav.tools')}</p><h1>${t('tool.h1')}</h1><p id="progress" role="status">0 / ${checks.length}</p><progress id="meter" max="${checks.length}" value="0"></progress><div class="checklist">${checks.map((c, i) => `<label><input type="checkbox" data-check="${i}"><span>${c}</span></label>`).join('')}</div><button class="button" id="reset">${t('tool.reset')}</button><p><a href="/${locale}/guide.html">${t('nav.guide')} →</a></p></section>
  <script>const boxes=[...document.querySelectorAll('[data-check]')];let saved=[];try{saved=JSON.parse(sessionStorage.getItem('repo-checklist')||'[]')}catch{}if(Array.isArray(saved))boxes.forEach((b,i)=>b.checked=saved[i]===true);function update(){const done=boxes.filter(b=>b.checked).length;document.getElementById('progress').textContent=${JSON.stringify(t('tool.progress'))}.replace('{done}',done).replace('{total}',boxes.length);document.getElementById('meter').value=done;try{sessionStorage.setItem('repo-checklist',JSON.stringify(boxes.map(b=>b.checked)))}catch{}}boxes.forEach(b=>b.addEventListener('change',update));document.getElementById('reset').addEventListener('click',()=>{boxes.forEach(b=>b.checked=false);update()});update();</script>`;
}

export const playerCSS = `
:root{--bg:#101011;--panel:#1c1c1e;--panel-2:#29292b;--text:#f4f4ec;--muted:#b8b8b4;--accent:#dfc652;--line:#3b3b3d}
body{background:#101011}.top{background:rgba(17,17,18,.96)}.brand .mark{background:#dfc652;border-radius:3px;box-shadow:none}.brand{font-size:17px}.bar{gap:20px}nav a{border-radius:4px}nav a[aria-current=page]{color:var(--accent);background:#29292b}.section,.page-shell{scroll-margin-top:88px}.hero{min-height:360px}.hero h1{font-family:'Arial Black',sans-serif;font-size:66px;text-shadow:3px 2px #853934}.hero:after{background:linear-gradient(90deg,rgba(12,12,13,.92),rgba(12,12,13,.35) 48%,transparent 76%)}.hero .lead{max-width:470px}.banner-art{object-position:center}.category,.guide-card,.utility,.mission-panel{background:#1c1c1e;box-shadow:none}.category-rail{gap:16px}.category{border-top:3px solid #c3a94b;min-height:165px}.category:nth-child(2){border-top-color:#78ad81}.category:nth-child(3){border-top-color:#9a8ac3}.category:nth-child(4){border-top-color:#cf776e}.category .icon{font-size:32px}.category b{display:none}.section-head h2{font-size:28px}.mission-copy{position:static}.mission-panel{border:0;padding:20px 0;background:transparent}.mission-tab{border-radius:4px}.feature-card{margin:20px 0}.feature-card figcaption{background:#101011d9;padding:8px}.guide-card,.guide-card:nth-child(1),.guide-card:nth-child(5){grid-column:span 4;min-height:205px}.button,.hero-search button{border-radius:4px}.button:active,button:active{transform:translateY(1px)}.search-input{display:block;width:100%;padding:16px;margin:12px 0 18px;font:inherit;background:#19191c;color:var(--text);border:1px solid #626265;border-radius:4px}.filter[aria-pressed=true]{background:var(--accent);color:#171717}.search-result{display:block;padding:22px 0;border-bottom:1px solid var(--line)}.search-result h2{font-size:23px;margin:8px 0}.search-result span{color:var(--accent);font-size:13px}.search-result p{color:var(--muted)}.search-result:hover h2{color:var(--accent)}.checklist{display:grid;gap:10px;margin:24px 0}.checklist label{display:flex;gap:16px;padding:18px;background:#242426;border-radius:4px;cursor:pointer}.checklist input{width:22px;height:22px;accent-color:var(--accent);flex-shrink:0}.checklist label:has(:checked) span{color:#8dc794}progress{width:100%;height:12px;accent-color:var(--accent)}footer{background:#0b0b0c}.page-shell{min-height:65vh}p{line-height:1.65}
.category{position:relative;overflow:hidden}.category-art{position:absolute;right:10px;top:10px;width:72px;height:72px;object-fit:cover;border-radius:6px;opacity:.82;filter:saturate(1.2) contrast(1.04)}.category .icon,.category strong,.category span{position:relative;z-index:1}.category strong{max-width:68%}.category span:last-child{max-width:78%}
.entry-art{display:block;width:100%;height:110px;object-fit:cover;border-radius:4px;margin:-2px 0 16px;filter:saturate(1.05) contrast(1.02)}
.entry-rail{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.entry-tile{display:grid;grid-template-rows:120px auto;min-height:220px;background:#191c1b;border:1px solid #3e4541;border-bottom:3px solid #dfc652;transition:.2s}.entry-tile:hover{transform:translateY(-3px);border-color:#dfc652}.entry-tile img{display:block;width:100%;height:120px;object-fit:cover}.entry-tile>div{display:flex;flex-direction:column;gap:7px;padding:14px}.entry-tile strong{font-size:1.2rem}.entry-tile span:last-child{color:var(--muted);font-size:.82rem}.entry-page{max-width:1224px;margin:auto;padding:52px 28px 80px}.entry-hero{display:grid;grid-template-columns:minmax(260px,420px) 1fr;gap:34px;align-items:end}.entry-hero img{width:100%;height:300px;object-fit:cover;border:1px solid #3e4541;background:#191c1b}.entry-hero h1{margin:4px 0 14px;font-size:clamp(3rem,7vw,6rem);line-height:.9}.entry-lead{max-width:42rem;color:var(--muted);font-size:1.1rem;line-height:1.6}.entry-facts{display:grid;grid-template-columns:repeat(3,1fr);margin:26px 0;border-top:1px solid #3e4541;border-bottom:1px solid #3e4541}.entry-facts div{display:grid;gap:8px;padding:16px;border-right:1px solid #3e4541}.entry-facts div:last-child{border-right:0}.entry-facts span{color:var(--accent);font:800 10px ui-monospace,monospace;text-transform:uppercase}.entry-columns{display:grid;grid-template-columns:1fr 260px;gap:60px}.entry-columns h2{font-size:2.2rem;max-width:18ch}.entry-columns p{max-width:60ch;color:var(--muted);line-height:1.7}.entry-steps{display:grid;gap:8px;padding:0;list-style:none}.entry-steps li{display:grid;grid-template-columns:34px 1fr;gap:10px;padding:14px;background:#191c1b;border-left:3px solid var(--accent)}.entry-steps b{color:var(--accent);font:800 11px ui-monospace,monospace}.entry-aside{display:flex;flex-direction:column;gap:10px;padding:18px;background:#191c1b;border:1px solid #3e4541;align-self:start}.entry-aside a{color:var(--text);padding:10px 0;border-bottom:1px solid #3e4541}.entry-aside a:last-child{border-bottom:0}
.entry-media{margin:0;display:flex;flex-direction:column}.entry-media img{width:100%;height:300px;object-fit:contain;border:1px solid #3e4541;background:#191c1b}.entry-media figcaption{display:flex;flex-direction:column;gap:5px;margin-top:10px;padding:12px;background:#191c1b;border:1px solid #3e4541;border-left:3px solid var(--accent);font-size:.8rem;line-height:1.5}.entry-media figcaption strong{color:var(--accent);font:800 10px ui-monospace,monospace;text-transform:uppercase}.entry-media figcaption span{color:var(--muted)}
.top nav a{text-transform:uppercase;letter-spacing:.08em;font-size:12px;border-radius:2px}.hero{border-bottom:2px solid #dfc652}.hero h1{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:clamp(3rem,6vw,5.2rem);letter-spacing:.02em;text-shadow:4px 4px #853934}.hero-search{border-radius:2px}.hero-search button,.button{border-radius:2px;text-transform:uppercase;letter-spacing:.04em}.category,.guide-card,.utility,.mission-panel,.feature-card,.step{border-radius:2px}.category{min-height:150px;border-width:1px 1px 3px;background:#1b1e1d}.category:hover{transform:translateY(-2px);box-shadow:0 8px 0 rgba(223,198,82,.15)}.category-art{border-radius:2px;opacity:.95;filter:saturate(1.08) contrast(1.08)}.mission-panel{border-left:3px solid var(--accent);background:#191c1b}.mission-tab{border-radius:2px;text-transform:uppercase;font:800 11px ui-monospace,monospace}.guide-card{background:#191c1b}.utility{background:#191c1b}
.langbar{display:flex;gap:6px;flex-wrap:wrap;padding:10px max(16px,calc((100% - 1224px)/2));background:#0d0d0e;border-bottom:1px solid var(--line);font-size:12px}.langbar a,.langbar span{padding:4px 9px;border:1px solid var(--line);border-radius:3px;color:var(--muted)}.langbar a[aria-current=true]{background:var(--accent);color:#171717;border-color:var(--accent)}
@media(max-width:900px){.bar{gap:10px}nav a{padding:9px}.hero{min-height:380px}.guide-card,.guide-card:nth-child(1),.guide-card:nth-child(5){grid-column:span 6}}
@media(max-width:720px){.hero h1{font-size:48px}.hero{min-height:370px}.hero .lead{max-width:310px}.hero:after{background:linear-gradient(90deg,#101011e8,#10101165)}.banner-art{object-position:65% center}.category strong{font-size:18px}.category span{font-size:13px}.section-head h2{font-size:25px}.guide-card,.guide-card:nth-child(1),.guide-card:nth-child(5){grid-column:1/-1}.top nav{background:#161617}.page-shell{padding:28px 16px}.page-shell>h1{font-size:36px}}
@media(max-width:720px){.entry-rail{grid-template-columns:repeat(2,1fr)}.entry-page{padding:34px 16px 60px}.entry-hero{grid-template-columns:1fr;gap:20px}.entry-hero img{height:220px}.entry-facts{grid-template-columns:1fr}.entry-facts div{border-right:0;border-bottom:1px solid #3e4541}.entry-facts div:last-child{border-bottom:0}.entry-columns{grid-template-columns:1fr;gap:24px}}
`;

/**
 * Base layer: reset, page frame, header, footer and tables. playerCSS above only re-themes these, so removing
 * this block leaves links as raw UA blue and headings black-on-black, which is exactly what happened when the old
 * single-stylesheet block was replaced. Kept separate so the theme can be edited without losing the frame.
 */
export const baseCSS = `
:root{color-scheme:dark;--focus:#8dc5ff}
html{scroll-behavior:smooth}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:#101011;color:var(--text);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.5}
a{color:inherit;text-decoration:none}
a:focus-visible,button:focus-visible,input:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.skip-link{position:fixed;left:12px;top:-90px;z-index:30;padding:10px 14px;background:var(--accent);color:#171717}
.skip-link:focus{top:12px}
.top{position:sticky;top:0;z-index:10;background:rgba(17,17,18,.96);border-bottom:1px solid var(--line);backdrop-filter:blur(14px)}
.bar{max-width:1280px;margin:auto;padding:14px 28px;display:flex;align-items:center;gap:24px}
.brand{display:flex;align-items:center;gap:10px;color:var(--text);font-weight:800;letter-spacing:.04em}
.mark{display:grid;place-items:center;width:38px;height:38px;background:var(--accent);color:#171717;font-weight:900}
nav{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
nav a{padding:9px 12px;color:var(--muted);font-size:14px;font-weight:700}
nav a:hover,nav a[aria-current="page"]{color:var(--text);background:var(--panel-2)}
.nav-toggle{display:none;margin-left:auto;padding:8px 12px;background:var(--panel);border:1px solid var(--line);color:var(--text);cursor:pointer;font:inherit}
.hero{position:relative;display:flex;align-items:flex-end;max-width:none;min-height:340px;padding:38px max(24px,calc((100% - 1224px)/2));isolation:isolate;overflow:hidden}
.banner-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2}
.hero:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(12,12,13,.92),rgba(12,12,13,.35) 48%,transparent 76%);z-index:-1}
.banner-copy{max-width:590px}
.hero h1{margin:0 0 12px;color:var(--text);font-size:clamp(3rem,6vw,4.4rem);line-height:1.02}
.hero .lead{color:#e4e6e4;font-size:1.05rem;max-width:470px}
.eyebrow{color:var(--accent);font:800 11px/1.2 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;margin:0 0 10px}
.lead{color:var(--muted);line-height:1.65}
.hero-search{display:flex;max-width:520px;margin:20px 0 14px;padding:5px;background:rgba(7,16,21,.72);border:1px solid var(--line)}
.hero-search input{min-width:0;flex:1;padding:12px 14px;background:transparent;border:0;color:var(--text);font:inherit}
.hero-search button,.button{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border:1px solid transparent;background:var(--panel-2);color:var(--text);font:inherit;font-weight:800;cursor:pointer}
.hero-search button:hover,.button:hover{background:var(--accent);color:#171717}
.primary{background:var(--accent);color:#171717}
.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
.section{max-width:1280px;margin:auto;padding:36px 28px;border-top:1px solid #303634}
.section-head{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:20px}
.section h2,.section-head h2{margin:3px 0;color:var(--text);font-size:clamp(1.6rem,2.6vw,2.4rem);font-weight:850;line-height:1.05}
.category-rail{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.category{position:relative;overflow:hidden;min-height:150px;padding:18px;background:#1b1e1d;border:1px solid var(--line);border-top:3px solid var(--accent);display:flex;flex-direction:column;gap:6px;transition:.2s}
.category:hover{transform:translateY(-2px)}
.category .icon{color:var(--accent);font-size:26px}
.category strong{margin-top:auto;color:var(--text)}
.category span{color:var(--muted);font-size:.88rem}
.category-art{position:absolute;right:10px;top:10px;width:72px;height:72px;object-fit:cover;opacity:.82}
.category .icon,.category strong,.category span{position:relative;z-index:1}
.steps{display:grid;gap:8px;margin:20px 0}
.step{display:grid;grid-template-columns:34px 1fr;gap:12px;padding:13px 14px;background:#191c1b;border-left:3px solid var(--accent)}
.step b{color:var(--accent);font:800 12px ui-monospace,monospace}
.page-shell{max-width:920px;padding:48px 28px 70px;margin:auto}
h1{margin:12px 0 18px;color:var(--text);font-size:clamp(2.2rem,5vw,3.4rem);font-weight:900;line-height:1.02}
h2{color:var(--text);font-size:clamp(1.4rem,2.4vw,2rem);margin:28px 0 10px}
p{line-height:1.65}
ul{line-height:1.7}
.note,table{background:var(--panel);border:1px solid var(--line);color:var(--text)}
.note{border-left:4px solid var(--accent);padding:16px;margin:18px 0}
.dim{color:var(--muted)}
table{width:100%;border-collapse:collapse;margin:18px 0}
th,td{padding:10px;text-align:left;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--accent);font:800 11px ui-monospace,monospace;text-transform:uppercase}
td a{color:var(--text);text-decoration:underline;text-decoration-color:var(--line)}
td a:hover{color:var(--accent)}
footer{margin:0;background:#0b0b0c;color:var(--muted);border-top:1px solid var(--line);padding:38px 28px}
.footer-inner{max-width:1224px;margin:auto;display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:32px}
.footer-title{color:var(--text);font-size:1.4rem;font-weight:900}
.footer-links{display:flex;gap:12px 18px;flex-wrap:wrap;margin-top:8px}
.footer-links a{color:var(--text)}
.footer-note{grid-column:1/-1;padding-top:18px;border-top:1px solid var(--line);font-size:.83rem;line-height:1.6}
@media(max-width:900px){.category-rail{grid-template-columns:1fr 1fr}.footer-inner{grid-template-columns:1fr 1fr}}
@media(max-width:720px){.bar{padding:10px 16px;gap:12px}.nav-toggle{display:block}.top nav{display:none;position:absolute;left:0;right:0;top:62px;padding:12px 16px;background:#161617;border-bottom:1px solid var(--line)}.top nav.is-open{display:grid}.hero{padding:30px 16px;min-height:300px}.hero-search{display:grid;grid-template-columns:1fr;gap:6px}.hero-search input,.hero-search button{width:100%}.actions{display:grid;grid-template-columns:1fr}.actions .button{width:100%}.section{padding:28px 16px}.category-rail{grid-template-columns:1fr}.footer-inner{grid-template-columns:1fr}.footer-note{grid-column:auto}.entry-media img{height:220px}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
`;


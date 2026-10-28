const $ = (s) => document.querySelector(s);
const escapeHTML = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storage = {get(key) {try {return localStorage.getItem(key);} catch {return null;}}, set(key,value) {try {localStorage.setItem(key,value);} catch { /* Reading remains usable without storage. */ }}};
let data, chapterData, readingLog, filter = 'all', query = '', observer, toastTimer;
let saved = storage.get('chronicle-position');
let tracking = false;
const expanded = new Set();
const sourceLink = (key) => {const s = data.sources[key];return `<a href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.title)} ↗</a>`;};
const eventTemplate = (e, index) => `<article class="event" id="${e.id}" aria-labelledby="title-${e.id}">
  <div class="event-body"><div class="event-meta"><span class="category ${e.category}">${e.category === 'main' ? '主線' : e.category === 'background' ? '官方回顧' : '檔案館'}</span><span>${escapeHTML(e.chapter)}</span><span>·</span><span>${escapeHTML(e.time)}</span></div>
  <h3 id="title-${e.id}">${escapeHTML(e.title)}</h3><p class="event-lead">${escapeHTML(e.summary)}</p><div class="people" aria-label="關聯人物">${e.people.map(p => `<span class="person">${escapeHTML(p)}</span>`).join('')}</div>
  ${e.visual?.src ? `<figure class="event-still"><img src="${escapeHTML(e.visual.src)}" alt="${escapeHTML(e.visual.title)}" loading="lazy"><figcaption><span>${escapeHTML(e.visual.number)}</span><div><p>${escapeHTML(e.visual.title)}</p><small>${escapeHTML(e.visual.caption)}</small></div></figcaption></figure>` : e.visual ? `<div class="event-figure" role="img" aria-label="${escapeHTML(e.visual.title)}"><span>${e.visual.number}</span><div><p>${escapeHTML(e.visual.title)}</p><small>${escapeHTML(e.visual.caption)}</small></div></div>` : ''}
  <div class="causality"><strong>這件事，改變了什麼？</strong>${escapeHTML(e.effect)}</div></div>
  <details data-id="${e.id}" ${expanded.has(e.id) ? 'open' : ''}><summary>考據筆記與來源 <span>DETAILS / ${String(index + 1).padStart(2,'0')}</span></summary><div class="detail-content"><h4>事件補充</h4><p>${escapeHTML(e.detail)}</p><h4>整理者解讀</h4><p>${escapeHTML(e.analysis)}</p><h4>年代依據與限制</h4><p>${escapeHTML(e.chronology)}</p><h4>回到來源</h4><div class="source-links">${e.sources.map(sourceLink).join('')}</div></div></details>
  <div class="event-bottom"><span>時間標記：${escapeHTML(e.certainty)}</span><button data-share="${e.id}" aria-label="複製事件連結：${escapeHTML(e.title)}">複製連結 ↗</button></div></article>`;

function showToast(message) {$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2400);}
let presentWatch;
function setRailOpen(open){const rail=document.querySelector('.arc-rail');const toggle=document.querySelector('.era-link[href="#present"]');if(!rail)return;rail.classList.toggle('is-open',open);rail.inert=!open;if(toggle)toggle.setAttribute('aria-expanded',String(open));}
function watchPresent(){presentWatch?.disconnect();const section=document.getElementById('present');const rail=document.querySelector('.arc-rail');if(!section||!rail||rail.hidden){setRailOpen(false);return;}presentWatch=new IntersectionObserver(([entry])=>setRailOpen(entry.isIntersecting),{rootMargin:'-80px 0px -30% 0px',threshold:0});presentWatch.observe(section);}
function setActive(era, arc) {document.querySelectorAll('.era-link').forEach(a=>{const active=a.hash===`#${era}`;const changed=active&&!a.classList.contains('active');a.classList.toggle('active',active);active?a.setAttribute('aria-current','location'):a.removeAttribute('aria-current');if(changed&&matchMedia('(max-width:720px)').matches)a.parentElement.scrollTo({left:Math.max(0,a.offsetLeft-a.parentElement.clientWidth/2+a.clientWidth/2),behavior:'instant'});});document.querySelectorAll('.arc-link').forEach(a=>{const active=!!arc&&a.hash===`#${arcAnchor(arc)}`;a.classList.toggle('active',active);active?a.setAttribute('aria-current','location'):a.removeAttribute('aria-current');});}
function trackEvents() {
  observer?.disconnect();
  observer = new IntersectionObserver(entries=>{
    const current=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];
    if(!current) return;
    const event=data.events.find(e=>e.id===current.target.id);
    setActive(event.era, event.arc);
    if(tracking) storage.set('chronicle-position',event.id);
  },{rootMargin:'-26% 0px -45% 0px',threshold:0});
  document.querySelectorAll('.event').forEach(e=>observer.observe(e));
}
function groupEvents(list) {
  const groups=[];
  for(const event of list){
    const last=groups.at(-1);
    if(event.band&&last?.band===event.band&&last.events.length<3) last.events.push(event);
    else groups.push({band:event.band||'',events:[event]});
  }
  return groups;
}
function renderEvents(list) {
  return groupEvents(list).map(group=>{
    const cards=group.events.map(e=>eventTemplate(e,data.events.indexOf(e))).join('');
    if(group.events.length<2) return cards;
    return `<div class="parallel" data-cols="${group.events.length}"><p class="parallel-label">同一時期<span class="parallel-hint parallel-hint-wide"> · 左右對照，由左至右仍是時間軸上的順序</span><span class="parallel-hint parallel-hint-narrow"> · 由上至下仍是時間軸上的順序</span></p>${cards}</div>`;
  }).join('');
}
const arcAnchor = (id) => `arc-${id}`;
function arcOf(event) {
  return data.eras.find(era=>era.id===event.era)?.arcs?.find(arc=>arc.id===event.arc);
}
function renderArcEvents(era, list) {
  if(!era.arcs) return renderEvents(list);
  const chunks=[];
  for(const event of list){
    const last=chunks.at(-1);
    if(last?.arc===event.arc) last.events.push(event);
    else chunks.push({arc:event.arc,events:[event]});
  }
  return chunks.map((chunk,index)=>{
    const arc=era.arcs.find(item=>item.id===chunk.arc);
    const heading=arc?`<header class="arc-heading${index?'':' arc-heading-first'}" id="${arcAnchor(arc.id)}"><p class="arc-kicker">${escapeHTML(arc.range)}</p><h3>${escapeHTML(arc.title)}</h3><p>${escapeHTML(arc.subtitle)}</p></header>`:'';
    return heading+renderEvents(chunk.events);
  }).join('');
}
function render() {
  const normalized=query.trim().toLocaleLowerCase();
  const events=data.events.filter(e=>{const arc=arcOf(e);return (filter==='all'||e.category===filter)&&(!normalized||[e.title,e.summary,e.chapter,e.time,arc?.title,arc?.range,...e.people].join(' ').toLocaleLowerCase().includes(normalized));});
  $('#event-total').textContent=`${String(events.length).padStart(2,'0')} EVENTS`;
  $('#result-status').textContent = query || filter!=='all' ? `找到 ${events.length} 則事件` : '第一批內容 · 以相對年代編排';
  $('#events').innerHTML=events.length ? data.eras.map(era=>{
    const list=events.filter(e=>e.era===era.id);
    if(!list.length){if(filter!=='all'||query)return '';return `<section class="era-section" id="${era.id}" aria-labelledby="heading-${era.id}"><header class="era-heading"><span class="era-number">${era.number}</span><div><h2 id="heading-${era.id}">${era.title}</h2><p>${era.subtitle}</p></div><span class="era-range">${era.range}</span></header><div class="era-gap"><strong>待官方資料核對</strong><p>本時期尚未收錄事件。以 BlablaLink 官方社群站的場景內容確認年代與因果後，再補入時間軸。</p></div></section>`;}
    return `<section class="era-section" id="${era.id}" aria-labelledby="heading-${era.id}">${era.id==='present'&&filter==='all'&&!query?'<div class="era-gap"><strong>⋯ 尚待拼回的歷史</strong><p>方舟封閉到現代之間，仍有地面奪還、人物過往等事件待補入。以下跨越了一段長時間。</p></div>':''}<header class="era-heading"><span class="era-number">${era.number}</span><div><h2 id="heading-${era.id}">${era.title}</h2><p>${era.subtitle}</p></div><span class="era-range">${era.range}</span></header>${renderArcEvents(era,list)}</section>`;
  }).join('') : '<div class="empty"><p>這段記憶還沒找到。</p><small>試試人物名稱、事件名稱，或切換來源分類。</small><button class="text-button" id="reset-filters">清除搜尋與篩選 →</button></div>';
  document.querySelectorAll('.era-link').forEach(a=>{const has=events.some(e=>`#${e.era}`===a.hash);a.hidden=!(filter==='all'&&!query)&&!has;});
  document.querySelectorAll('.arc-link').forEach(a=>{a.hidden=!events.some(e=>`#${arcAnchor(e.arc)}`===a.hash);});
  const rail=document.querySelector('.arc-rail');if(rail)rail.hidden=![...rail.querySelectorAll('.arc-link')].some(a=>!a.hidden);
  watchPresent();
  document.querySelectorAll('details').forEach(d=>d.addEventListener('toggle',()=>d.open?expanded.add(d.dataset.id):expanded.delete(d.dataset.id)));
  trackEvents();
}
function clearFilters() {query='';filter='all';$('#search').value='';updateFilters();render();}
function updateFilters() {document.querySelectorAll('.filter').forEach(b=>{const active=b.dataset.filter===filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});}
function navigateTo(id) {
  if(!document.getElementById(id)&&data?.events.some(e=>e.id===id))clearFilters();
  const target=document.getElementById(id);
  if(target){target.scrollIntoView({block:'start'});return true;}
  return false;
}
function setupSources() {
  $('#event-sources').innerHTML=Object.entries(data.sources).map(([key,s])=>`<div class="source-row">${sourceLink(key)}<span>${escapeHTML(s.type)}</span></div>`).join('');
  $('#chapter-index').innerHTML=chapterData.chapters.map(c=>{const log=readingLog.chapters.find(l=>l.chapter===c.chapter);return `<div class="chapter-row"><span>${c.chapter}</span><a href="${escapeHTML(log?.source||chapterData.source)}" target="_blank" rel="noopener noreferrer">${escapeHTML(c.title)} ↗</a><small>${escapeHTML(log?.status||'待逐場景整理')} · ${c.scene_count} 場景</small></div>`;}).join('');
}
$('#theme-button').addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;storage.set('chronicle-theme',next);updateThemeLabel();});
function updateThemeLabel(){const dark=document.documentElement.dataset.theme==='dark';$('#theme-button').setAttribute('aria-label',dark?'切換為淺色模式':'切換為深色模式');document.querySelector('meta[name="theme-color"]').content=dark?'#050505':'#ffffff';}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',e=>{if(!storage.get('chronicle-theme')){document.documentElement.dataset.theme=e.matches?'dark':'light';updateThemeLabel();}});
updateThemeLabel();
$('#search').addEventListener('input',e=>{query=e.target.value;render();});
document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;updateFilters();render();}));
document.addEventListener('click',async e=>{
  const share=e.target.closest('[data-share]');
  if(share){const url=new URL(location.href);url.hash=share.dataset.share;try{await navigator.clipboard.writeText(url.href);showToast('已複製這則事件的連結');}catch{location.hash=share.dataset.share;showToast('已定位事件，可複製網址列分享');}}
  if(e.target.closest('#reset-filters'))clearFilters();
  const link=e.target.closest('a[href^="#"]');
  if(link&&data){e.preventDefault();const id=decodeURIComponent(link.hash.slice(1));if(navigateTo(id)){history.pushState(null,'',`#${id}`);}}
});
addEventListener('popstate',()=>navigateTo(decodeURIComponent(location.hash.slice(1))||'top'));
function bindDialog(dialog, openSelectors, closeSelector) {
  openSelectors.forEach(s=>$(s).addEventListener('click',()=>dialog.showModal()));
  $(closeSelector).addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
}
bindDialog($('#sources-dialog'),['#sources-button','#coverage-button'],'#close-dialog');
bindDialog($('#rights-dialog'),['#rights-button','#rights-footer-button','#rights-note-button'],'#close-rights');
let frame;
addEventListener('scroll',()=>{tracking=true;if(!frame)frame=requestAnimationFrame(()=>{const max=document.documentElement.scrollHeight-innerHeight;$('#progress').style.width=`${max>0?Math.min(100,scrollY/max*100):0}%`;frame=null;});},{passive:true});
$('#resume-button').addEventListener('click',()=>{if(saved){clearFilters();navigateTo(saved);history.pushState(null,'',`#${saved}`);$('#resume').hidden=true;}});

try {
  const responses=await Promise.all([fetch('./data/timeline.json'),fetch('./data/main-story/index.json'),fetch('./data/main-story/reading-log.json')]);
  if(responses.some(r=>!r.ok))throw new Error('Data unavailable');
  [data,chapterData,readingLog]=await Promise.all(responses.map(r=>r.json()));
  $('#era-nav').innerHTML=data.eras.map(era=>{const arcs=(era.arcs||[]).map(arc=>`<a class="arc-link" href="#${arcAnchor(arc.id)}">${arc.title}<small>${arc.range}</small></a>`).join('');const rail=arcs?`<div class="arc-rail" id="${era.id}-arcs" data-era="${era.id}"><div class="arc-rail-clip">${arcs}</div></div>`:'';return `<a class="era-link" href="#${era.id}"${arcs?' aria-expanded="false" aria-controls="'+era.id+'-arcs"':''}>${era.nav}<small>${era.range}</small></a>${rail}`;}).join('');
  render();setupSources();setActive(data.eras[0].id);
  const savedEvent=data.events.find(e=>e.id===saved);
  if(savedEvent&&!location.hash){$('#resume').hidden=false;$('#resume-text').textContent=`上次讀到：${savedEvent.title}`;}
  if(location.hash){await document.fonts.ready;requestAnimationFrame(()=>{if(!navigateTo(decodeURIComponent(location.hash.slice(1))))showToast('找不到這則事件，已顯示完整時間軸');});}
} catch(error) {
  $('#events').innerHTML='<div class="empty"><h2>故事資料暫時無法載入</h2><p>請重新整理頁面。若正在本機預覽，請使用 HTTP 伺服器開啟網站。</p><button class="text-button" id="reload">重新載入 →</button></div>';
  $('#reload').addEventListener('click',()=>location.reload());
  $('#result-status').textContent='資料載入失敗';
  console.error('Chronicle data failed to load',error);
}

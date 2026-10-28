import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const data=JSON.parse(await readFile(resolve(root,'data/timeline.json'),'utf8'));
const chapters=JSON.parse(await readFile(resolve(root,'data/main-story/index.json'),'utf8'));
const names=JSON.parse(await readFile(resolve(root,'data/official-names.json'),'utf8'));
const readingLog=JSON.parse(await readFile(resolve(root,'data/main-story/reading-log.json'),'utf8'));
const ids=new Set(data.eras.map(e=>e.id));
assert.equal(ids.size,data.eras.length,'Duplicate era IDs');
let last=-1;
for(const event of data.events){
 assert(!ids.has(event.id),'Duplicate anchor ID');ids.add(event.id);
 const era=data.eras.findIndex(e=>e.id===event.era);assert(era>=last&&era>=0,'Events must follow era order');last=era;
 for(const field of ['title','summary','detail','analysis','chronology','certainty']){assert(event[field]?.length,`Missing ${field}: ${event.id}`);assert(!/[?\uFFFD]{3}/.test(event[field]),`Possible encoding damage: ${event.id}.${field}`);}
 assert(event.sources.length,'Missing evidence');
 for(const key of event.sources)assert(data.sources[key],`Missing source: ${key}`);
 if(event.band)assert(/^[a-z0-9-]+$/.test(event.band),`Invalid band: ${event.id}`);
}
const bands=new Map();
for(const event of data.events){if(!event.band)continue;const list=bands.get(event.band)||[];list.push(event);bands.set(event.band,list);}
for(const [band,list] of bands){
 assert(list.length>=2&&list.length<=3,`Band ${band} needs 2 or 3 events`);
 assert(new Set(list.map(e=>e.era)).size===1,`Band ${band} crosses eras`);
 const indexes=list.map(e=>data.events.indexOf(e));
 for(let i=1;i<indexes.length;i++)assert(indexes[i]===indexes[i-1]+1,`Band ${band} is not consecutive`);
}
for(const era of data.eras){
 if(!era.arcs)continue;
 assert(era.arcs.length>=2,`Era ${era.id} needs at least two arcs`);
 assert(new Set(era.arcs.map(arc=>arc.id)).size===era.arcs.length,`Duplicate arc in ${era.id}`);
 for(const arc of era.arcs){
  assert(/^[a-z0-9-]+$/.test(arc.id),`Invalid arc id: ${arc.id}`);
  for(const field of ['title','range','subtitle'])assert(arc[field]?.length,`Missing arc ${field}: ${arc.id}`);
 }
}
const arcs=new Map();
for(const event of data.events){
 const era=data.eras.find(item=>item.id===event.era);
 if(era.arcs)assert(event.arc,`Missing arc: ${event.id}`);
 else assert(!event.arc,`Unexpected arc: ${event.id}`);
 if(!event.arc)continue;
 assert(/^[a-z0-9-]+$/.test(event.arc),`Invalid arc: ${event.id}`);
 const list=arcs.get(event.arc)||[];list.push(event);arcs.set(event.arc,list);
}
for(const [arc,list] of arcs){
 assert(new Set(list.map(event=>event.era)).size===1,`Arc ${arc} crosses eras`);
 const era=data.eras.find(item=>item.id===list[0].era);
 assert(era.arcs.some(item=>item.id===arc),`Arc ${arc} is not listed on its era`);
 const indexes=list.map(event=>data.events.indexOf(event));
 for(let i=1;i<indexes.length;i++)assert(indexes[i]===indexes[i-1]+1,`Arc ${arc} is not consecutive`);
}
const assertOfficialSource=(url)=>{const parsed=new URL(url);assert.equal(parsed.protocol,'https:');assert(['www.blablalink.com','blablalink.com'].includes(parsed.hostname),`Only BlablaLink story sources are allowed: ${parsed.hostname}`);};
for(const source of Object.values(data.sources))assertOfficialSource(source.url);
assertOfficialSource(chapters.source);
if(chapters.sample_chapter?.source)assertOfficialSource(chapters.sample_chapter.source);
for(const scene of chapters.sample_chapter?.scenes||[])if(scene.source)assertOfficialSource(scene.source);
for(const chapter of readingLog.chapters){assertOfficialSource(chapter.source);for(const scene of chapter.scenes){assert(/^[a-z0-9_]+$/.test(scene.id),'Invalid scene ID');if(scene.status.startsWith('已讀'))assert(Object.values(data.sources).some(s=>s.url.endsWith('/'+scene.id)),`Read scene is missing from source registry: ${scene.id}`);}}
assertOfficialSource(names.source);
for(const character of names.scene_characters)assertOfficialSource(character.source);
const publishedText=[JSON.stringify(data),JSON.stringify(chapters),await readFile(resolve(root,'index.html'),'utf8'),await readFile(resolve(root,'app.js'),'utf8'),await readFile(resolve(root,'data/main-story/sample-summary.md'),'utf8')].join('\n');
for(const character of [...names.characters,...names.scene_characters])for(const incorrect of character.incorrect_translations)assert(!publishedText.includes(incorrect),`Incorrect translation: ${incorrect}; use official name ${character.name}`);
assert.equal(chapters.chapters.length,49);
for(const asset of ['index.html','styles.css','app.js','assets/surface.svg'])await access(resolve(root,asset));
console.log(`Validated ${data.events.length} sourced events, ${data.eras.length} eras, 49 chapter index entries.`);
console.log(`Checked official Chinese naming rules for ${names.characters.length+names.scene_characters.length} characters.`);

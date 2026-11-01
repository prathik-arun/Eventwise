// Unit tests for the planning logic. Injected into the app's scope by tests/eventwise.test.js
function runTests(){
const results=[],t=(name,fn)=>{let ok=false;try{ok=fn()===true}catch{}results.push({name,ok})};
const today=new Date(2026,0,1);
for(const type of Object.keys(PROFILES))t(`${type}: allocation sums to budget`,()=>[1000,123457,5e6].every(b=>allocate(type,b,[]).reduce((s,r)=>s+r.amount,0)===b));
t('priority increases category share',()=>{const k=Object.keys(PROFILES.wedding.alloc)[0];return allocate('wedding',1e6,[k])[0].amount>allocate('wedding',1e6,[])[0].amount});
t('contingency stays at its fixed share',()=>Math.abs(allocate('wedding',1e6,['Venue']).find(r=>r.cat==='Contingency').pct-5)<.01);
t('timeline is sorted and ends on event day',()=>{const d=addDays(today,200),tl=buildTimeline('wedding',today,d);return tl.every((x,i)=>!i||tl[i-1].inDays<=x.inDays)&&tl.at(-1).inDays===200});
t('short notice compresses without past dates',()=>{const tl=buildTimeline('wedding',today,addDays(today,3));return tl.every(x=>x.inDays>=0&&x.inDays<=3)&&tl.some(x=>x.compressed)});
t('rejects past date',()=>!!validate({type:'wedding',date:'2025-12-31',guests:10,budget:5000},today).errors.date);
t('rejects bad guests and budget',()=>{const e=validate({type:'birthday',date:'2026-03-01',guests:1.5,budget:999},today).errors;return !!e.guests&&!!e.budget});
t('accepts valid input and trims name',()=>{const r=validate({type:'community',name:'  Fest ',date:'2026-03-01',guests:50,budget:20000,vibe:'x',priorities:['Venue & permits','bogus']},today);return !Object.keys(r.errors).length&&r.value.name==='Fest'&&r.value.priorities.length===1});
t('rejects impossible calendar date',()=>parseDate('2026-02-30')===null);
t('DOM helper never parses HTML',()=>el('p',{},'<b>x</b>').children.length===0);
t('Amazon URL is encoded and on amazon.in',()=>amazon('a&b c')==='https://www.amazon.in/s?k=a%26b%20c');
t('requests for flowers and cake produce shop links',()=>{const l=buildShopping({type:'birthday',vibe:'Eco-friendly',requests:'Flowers and a cake'},allocate('birthday',50000,[])).map(s=>s.label);return l.includes('Flowers and garlands')&&l.includes('Cake toppers and candles')&&new Set(l).size===l.length});
t('history rejects unsafe or invalid entries',()=>cleanEntry({id:'1',type:'constructor',date:'2026-01-01',guests:5,budget:5000})===null&&cleanEntry({id:'1',type:'wedding',date:'bad',guests:5,budget:5000})===null);
t('history accepts a valid entry',()=>cleanEntry({id:'1',type:'wedding',date:'2026-01-01',guests:5,budget:5000,priorities:['Venue','x']}).priorities.length===1);
t('past entry replays original lead time',()=>{const r=entryToValue(cleanEntry({id:'1',type:'birthday',date:'2025-12-25',guests:10,budget:5000,created:new Date(2025,10,1).getTime()}),today);return r.v.past===true&&r.v.days===54});
t('warnings flag only the relevant insight',()=>{const r=buildInsights({type:'wedding',date:new Date(2026,2,10),days:5,guests:10,budget:1e6,priorities:[],past:false});return r.warn.has(1)&&!r.warn.has(0)});
t('profile data is consistent for every event type',()=>Object.entries(PROFILES).every(([k,p])=>{const cats=Object.keys(p.alloc);return Object.values(p.alloc).reduce((a,b)=>a+b,0)===100&&Object.keys(p.vendors).every(c=>cats.includes(c))&&cats.every(c=>p.vendors[c])&&p.milestones.some(m=>m[0]===0)&&p.milestones.every((m,i,a)=>!i||a[i-1][0]>m[0])&&IDEAS[k].length>=3&&Object.keys(SHOP[k]||{}).every(c=>cats.includes(c))}));
t('Maps URLs round location and encode areas',()=>mapsUrl('Banquet Halls',{lat:12.9716,lng:77.5946},'')==='https://www.google.com/maps/search/Banquet%20Halls/@12.97,77.59,13z'&&mapsUrl('Party Halls',null,'Indiranagar & co')==='https://www.google.com/maps/search/Party%20Halls%20in%20Indiranagar%20%26%20co'&&mapsUrl('Caterers',null,'')==='https://www.google.com/maps/search/Caterers');
t('every event type has an icon and venue list',()=>Object.keys(PROFILES).every(k=>ICONS[k]&&Array.isArray(VENUES[k])));
t('season tips: monsoon, peak season and weekend',()=>seasonTips(new Date(2026,6,15),'wedding').some(x=>/Monsoon/.test(x))&&!seasonTips(new Date(2026,6,15),'wedding').some(x=>/Weekend/.test(x))&&seasonTips(new Date(2026,10,14),'wedding').some(x=>/Peak/.test(x))&&seasonTips(new Date(2026,10,14),'wedding').some(x=>/Weekend/.test(x))&&!seasonTips(new Date(2026,10,14),'birthday').some(x=>/Peak/.test(x)));
t('spend tracker clamps input and flags overspend',()=>clampMoney('abc')===0&&clampMoney(-5)===0&&clampMoney(1e12)===1e9&&clampMoney('1500.7')===1500&&spendStatus(100,150).over&&spendStatus(100,150).left===-50&&!spendStatus(100,100).over);
t('offline advice names the biggest cost',()=>quickAdvice({v:{budget:1e6,guests:100},rows:allocate('wedding',1e6,[])}).includes('Venue'));
t('offline assistant answers the question asked',()=>{const v={type:'wedding',name:'Meera',date:new Date(2026,11,12),budget:1e6,guests:100,days:40,past:false},rows=allocate('wedding',1e6,[]),plan={v,rows,tl:buildTimeline('wedding',new Date(2026,10,1),v.date)};return /invited/.test(offlineAnswer('Write a short invitation message',plan))&&/risks/.test(offlineAnswer('What could go wrong?',plan))&&/Focus next/.test(offlineAnswer('What should I do this week?',plan))&&/extra guest/.test(offlineAnswer('what if too many people come?',plan))&&/biggest costs/.test(offlineAnswer('How can I save 15%?',plan))});
return results;
}

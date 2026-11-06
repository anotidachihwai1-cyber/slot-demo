import {config} from './config.js';
import {localSlots,catTime} from './booking.js';
import {apiHeaders,validateConfig,readResponse} from './auth.js';
const $=s=>document.querySelector(s);
let live=false,configError='';
try{live=validateConfig(config);}catch(e){configError=e.message;}
const samples=[{id:'demo-1',name:'The Fade Room',area:'Avondale',category:'barber',services:[{id:'s1',name:'Signature fade',duration_minutes:30,price_minor:800,currency:'USD'}]},{id:'demo-2',name:'Polished by Tadi',area:'Borrowdale',category:'nails',services:[{id:'s2',name:'Gel manicure',duration_minutes:60,price_minor:1500,currency:'USD'}]},{id:'demo-3',name:'First Chair',area:'CBD',category:'barber',services:[{id:'s3',name:'Cut & beard',duration_minutes:45,price_minor:1200,currency:'USD'}]}];
const directoryListings=[
  {
    "id": "directory-1",
    "name": "Styles Barbershop",
    "category": "barber",
    "area": "Fourth Street, Harare",
    "phone": "+263 77 533 0294",
    "closing": "18:00",
    "services": [],
    "directory": true
  },
  {
    "id": "directory-2",
    "name": "Bern The Barber",
    "category": "barber",
    "area": "Nelson Mandela Avenue, Harare",
    "phone": "+263 77 696 6462",
    "closing": "20:30",
    "services": [],
    "directory": true
  },
  {
    "id": "directory-3",
    "name": "Multimillion hairstylist barber",
    "category": "barber",
    "area": "Robert Mugabe Road, Harare",
    "phone": "+263 78 344 7631",
    "closing": "18:30",
    "services": [],
    "directory": true
  },
  {
    "id": "directory-4",
    "name": "The executive hair salon and barber",
    "category": "salon",
    "area": "Leonid Brezhnev Street, Harare",
    "phone": "+263 73 374 3154",
    "closing": "",
    "services": [],
    "directory": true
  },
  {
    "id": "directory-5",
    "name": "Glitz And Style Barbershop",
    "category": "barber",
    "area": "Ninth Street, Harare",
    "phone": "+263 78 990 2531",
    "closing": "17:00",
    "services": [],
    "directory": true
  },
  {
    "id": "directory-6",
    "name": "Cutting Edge. Salon. Barbershop",
    "category": "salon",
    "area": "Cork Road, Harare",
    "phone": "+263 77 385 4760",
    "closing": "18:30",
    "services": [],
    "directory": true
  },
  {
    "id": "directory-7",
    "name": "The Gentleman's corner barbershop",
    "category": "barber",
    "area": "Churchill Avenue, Harare",
    "phone": "+263 77 327 4921",
    "closing": "18:00",
    "services": [],
    "directory": true
  },
  {
    "id": "directory-8",
    "name": "I The Barber",
    "category": "barber",
    "area": "Grasmere Lane, Harare",
    "phone": "+263 77 826 0800",
    "closing": "19:00",
    "services": [],
    "directory": true
  },
  {
    "id": "directory-9",
    "name": "Vintage Classic Barbershop",
    "category": "barber",
    "area": "Windsor Avenue, Harare",
    "phone": "+263 77 737 0540",
    "closing": "18:30",
    "services": [],
    "directory": true
  },
  {
    "id": "directory-10",
    "name": "Divine Touch Salon",
    "category": "salon",
    "area": "Borowdale Village, Harare",
    "phone": "+263 78 006 4578",
    "closing": "16:00",
    "services": [],
    "directory": true
  },
  {
    "id": "directory-11",
    "name": "Mustard Seed Africa",
    "category": "arts",
    "area": "Upper East Rd, Harare",
    "phone": "+263 77 931 5901",
    "closing": "17:30",
    "services": [],
    "directory": true
  },
  {
    "id": "directory-12",
    "name": "The Salon",
    "category": "salon",
    "area": "Hindhead Avenue, Harare",
    "phone": "+263 78 097 1646",
    "closing": "17:00",
    "services": [],
    "directory": true
  },
  {
    "id": "directory-13",
    "name": "Good Looks Salon",
    "category": "salon",
    "area": "Stortford Parade, Harare",
    "phone": "",
    "closing": "",
    "services": [],
    "directory": true
  },
  {
    "id": "directory-14",
    "name": "curtleys salon and spa",
    "category": "spa",
    "area": "Arundel School Road & Candy Close, Harare",
    "phone": "+263 4 302 483",
    "closing": "17:00",
    "services": [],
    "directory": true
  }
];
let providers=[],category='all',selected,session=JSON.parse(sessionStorage.getItem('slot-session')||'null');
let demoBookings=JSON.parse(localStorage.getItem('slot-demo-bookings')||'[]');
const money=s=>`${s.currency} ${(s.price_minor/100).toFixed(2)}`;
async function api(path,body,method=body?'POST':'GET'){
 if(session?.refresh_token&&session.expires_at<Date.now()/1000+60){
  const refreshed=await fetch(config.url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:config.anonKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});
  if(!refreshed.ok){session=null;sessionStorage.removeItem('slot-session');throw Error('Session expired. Sign in again.');}
  session=await refreshed.json();session.expires_at=Math.floor(Date.now()/1000)+session.expires_in;sessionStorage.setItem('slot-session',JSON.stringify(session));
 }
 const r=await fetch(config.url.replace(/\/$/,'')+path,{method,headers:apiHeaders(config.anonKey,session?.access_token),...(body?{body:JSON.stringify(body)}:{})});
 return readResponse(r);
}
function text(tag,value,cls){const el=document.createElement(tag);el.textContent=value;if(cls)el.className=cls;return el;}
function render(){
 $('#list').replaceChildren();
 const labels={barber:'Barber',salon:'Hair salon',nails:'Nail artist',spa:'Beauty & spa',arts:'Arts & crafts'};
 const icons={barber:'✂',salon:'✂',nails:'✦',spa:'❋',arts:'◈'};
 const visible=providers.filter(p=>(category==='all'||p.category===category)&&[p.name,p.area,labels[p.category],p.phone||''].join(' ').toLowerCase().includes($('#search').value.trim().toLowerCase()));
 $('.heading h2').textContent=visible.length+' places to explore';
 visible.forEach(p=>{
  const card=text('article','','card');
  const art=text('div',icons[p.category]||'✦','art');art.setAttribute('aria-hidden','true');
  const body=text('div','','card-body');
  body.append(text('span',(labels[p.category]||'Business')+' · HARARE','tag'),text('h3',p.name),text('p',p.area,'muted'));
  const bottom=text('div','','card-bottom');bottom.style.flexWrap='wrap';bottom.style.gap='12px';
  if(p.directory){
   body.append(text('p','Community listing · Not bookable on SLOT yet','muted'));
   body.append(text('p',p.closing?'Listed closing time: '+p.closing+' CAT · confirm by phone':'Opening hours not supplied','muted'));
   if(p.phone){const call=text('a','Call '+p.phone,'primary');call.href='tel:'+p.phone.replace(/\s/g,'');call.style.cssText='border-radius:24px;text-decoration:none;font-size:13px;display:inline-block';bottom.append(call);}
   else body.append(text('p','Phone number not supplied','muted'));
   const map=text('a','Find on map');map.href='https://www.bing.com/maps?q='+encodeURIComponent(p.name+' '+p.area);map.target='_blank';map.rel='noopener noreferrer';map.style.cssText='font-size:13px;color:#6034c4';bottom.append(map);
   if(p.name==='I The Barber'){const instagram=text('a','Instagram');instagram.href='https://www.instagram.com/i_the_barber/';instagram.target='_blank';instagram.rel='noopener noreferrer';instagram.style.cssText='font-size:13px;color:#6034c4';bottom.append(instagram);}
  }else{
   body.append(text('p',live?'Book online':'Fictional business · Try the demo','muted'));
   const button=text('button',live?'Book a slot':'Try demo booking','primary');button.onclick=()=>openBooking(p);button.disabled=!p.services.length;
   bottom.append(text('span',p.services.length?'From '+money([...p.services].sort((a,b)=>a.price_minor-b.price_minor)[0]):'Services coming soon'),button);
  }
  body.append(bottom);card.append(art,body);$('#list').append(card);
 });
 if(!visible.length)$('#list').append(text('p','No businesses found. Try another search.'));
}
async function slots(){try{const s=selected.services.find(s=>s.id===$('#service').value);$('#time').replaceChildren();if(!s)return;
 const starts=live?await api('/rest/v1/rpc/available_slots',{p_service:s.id,p_day:$('#date').value}):localSlots($('#date').value,s.duration_minutes,demoBookings,selected.id);
 starts.forEach(v=>{const iso=typeof v==='string'?v:v.starts_at;const o=text('option',catTime(iso));o.value=iso;$('#time').append(o);});$('#confirm').disabled=!starts.length;if(!starts.length)$('#booking-message').textContent='No slots available. Try another date.';
}catch(e){$('#booking-message').textContent=e.message;$('#confirm').disabled=true;}}
function openBooking(p){selected=p;$('#provider-name').textContent=p.name;$('#service').replaceChildren();p.services.forEach(s=>{const o=text('option',`${s.name} · ${s.duration_minutes} min · ${money(s)}`);o.value=s.id;$('#service').append(o)});const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Harare',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());$('#date').min=day;$('#date').value=day;$('#booking-message').textContent='';$('#booking').showModal();slots();}
$('#service').onchange=slots;$('#date').onchange=slots;$('#close').onclick=()=>$('#booking').close();$('#search').oninput=render;
if(!live){
 for(const [value,label] of [['salon','Hair salons'],['spa','Spas'],['arts','Arts & crafts']]){const button=text('button',label);button.dataset.category=value;$('nav').insertBefore(button,$('#appointments'));}
 $('.hero > p:not(.eyebrow)').textContent='Explore Harare barbers, salons and local businesses. Contact them directly or try a demo booking.';
 $('.heading span').textContent='Community-supplied details · Confirm directly with the business';
 $('footer').textContent='SLOT · Discover local. Look good. Community listings are not verified SLOT partners. Demo bookings stay on this device.';
}
document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;document.querySelectorAll('[data-category]').forEach(n=>n.classList.toggle('active',n===b));render()});
$('#booking-form').onsubmit=async e=>{e.preventDefault();$('#confirm').disabled=true;try{const s=selected.services.find(s=>s.id===$('#service').value),start=$('#time').value;if(!start)throw Error('Choose a time.');if(live){if(!session)throw Error('Sign in before booking.');const signature=`${session.user.id}:${s.id}:${start}`;let pending=JSON.parse(sessionStorage.getItem('slot-pending')||'null');if(pending?.signature!==signature){pending={signature,key:crypto.randomUUID()};sessionStorage.setItem('slot-pending',JSON.stringify(pending));}await api('/rest/v1/rpc/book_appointment',{p_service:s.id,p_start:start,p_key:pending.key});sessionStorage.removeItem('slot-pending');}else{const valid=localSlots($('#date').value,s.duration_minutes,demoBookings,selected.id);if(!valid.includes(start))throw Error('That time is taken. Choose another.');demoBookings.push({id:crypto.randomUUID(),provider_id:selected.id,name:selected.name,service:s.name,starts_at:start,ends_at:new Date(+new Date(start)+s.duration_minutes*60000).toISOString(),status:'confirmed'});localStorage.setItem('slot-demo-bookings',JSON.stringify(demoBookings));}$('#booking').close();$('#status').textContent=live?'Appointment confirmed.':'Demo appointment saved on this device.';await showBookings();}catch(e){$('#booking-message').textContent=e.message+' Check My bookings before choosing another time if your connection dropped.';}finally{$('#confirm').disabled=!$('#time').options.length;}};
async function showBookings(){try{if(live&&!session)throw Error('Sign in to see your bookings.');const rows=live?await api('/rest/v1/appointments?select=*&order=starts_at.asc'):demoBookings;$('#bookings').hidden=false;$('#booking-list').replaceChildren();for(const b of rows){const item=text('div','','appointment');item.append(text('strong',b.name||providers.find(p=>p.id===b.provider_id)?.name||'Appointment'),text('p',`${new Date(b.starts_at).toLocaleDateString('en-GB',{timeZone:'Africa/Harare'})} · ${catTime(b.starts_at)} CAT · ${b.status}`));if(b.status==='confirmed'){const cancel=text('button','Cancel appointment');cancel.onclick=async()=>{try{if(live)await api('/rest/v1/rpc/cancel_appointment',{p_id:b.id});else{b.status='cancelled';localStorage.setItem('slot-demo-bookings',JSON.stringify(demoBookings));}await showBookings();}catch(e){$('#status').textContent=e.message;}};item.append(cancel);}$('#booking-list').append(item);}if(!rows.length)$('#booking-list').textContent='No appointments yet.';}catch(e){$('#status').textContent=e.message;}}
$('#appointments').onclick=showBookings;$('#account').onclick=()=>{if(!live){$('#status').textContent='Demo mode needs no account. Configure Supabase to enable real sign-in.';return;}$('#login').showModal();};$('#close-login').onclick=()=>$('#login').close();
$('#send-code').onclick=async()=>{if(!$('#email').reportValidity())return;const button=$('#send-code');button.disabled=true;try{await api('/auth/v1/otp',{email:$('#email').value.trim(),create_user:true});$('#login-message').textContent='Check your email for your sign-in code, then enter it above.';}catch(e){$('#login-message').textContent=e.message;}finally{button.disabled=false;}};
$('#login-form').onsubmit=async e=>{e.preventDefault();try{session=await api('/auth/v1/verify',{email:$('#email').value,token:$('#code').value,type:'email'});session.expires_at=Math.floor(Date.now()/1000)+session.expires_in;sessionStorage.setItem('slot-session',JSON.stringify(session));$('#login').close();$('#account').textContent='Account';$('#status').textContent='Signed in.';}catch(e){$('#login-message').textContent=e.message;}};
$('#logout').onclick=async()=>{try{if(session)await api('/auth/v1/logout',{});session=null;sessionStorage.removeItem('slot-session');$('#login').close();$('#status').textContent='Signed out.';}catch(e){$('#login-message').textContent=e.message;}};
async function init(){try{if(configError){$('#mode').textContent='Supabase configuration needs attention';throw Error(configError);}if(live){$('#mode').textContent='Live · Zimbabwe time · Pay at venue';providers=await api('/rest/v1/providers?select=*,services(*)&published=eq.true');providers.forEach(p=>p.services=p.services.filter(s=>s.active));}else {providers=[...directoryListings,...samples];$('#mode').textContent='14 community listings · Contact businesses directly · Sample bookings are separate';}$('#account').textContent=session?'Account':'Sign in';render();}catch(e){$('#status').textContent=e.message;}}init();

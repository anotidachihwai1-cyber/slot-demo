import {config} from './config.js';
import {localSlots,catTime} from './booking.js';
import {apiHeaders,validateConfig,readResponse} from './auth.js';
// Public frontend key only. Authentication is independent of demo bookings.
const authConfig={url:'https://pwghkuizlgvjvjlahpul.supabase.co',anonKey:'sb_publishable_CBuRlSMW6Cd2SIRPXWHFag_rN8AdbqW'};
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
 const publicAuth=path.startsWith('/auth/v1/otp')||path.startsWith('/auth/v1/verify');
 if(!publicAuth&&session?.refresh_token&&session.expires_at<Date.now()/1000+60){
  const refreshed=await fetch(authConfig.url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:apiHeaders(authConfig.anonKey),body:JSON.stringify({refresh_token:session.refresh_token})});
  if(!refreshed.ok){session=null;sessionStorage.removeItem('slot-session');$('#account').textContent='Sign in';throw Error('Session expired. Please sign in again.');}
  session=await readResponse(refreshed);saveSession(session);
 }
 const target=path.startsWith('/auth/')?authConfig:config;
 const r=await fetch(target.url.replace(/\/$/,'')+path,{method,headers:apiHeaders(target.anonKey,publicAuth?undefined:session?.access_token),...(body?{body:JSON.stringify(body)}:{})});
 return readResponse(r);
}
function saveSession(value){session=value;session.expires_at=Math.floor(Date.now()/1000)+(Number(session.expires_in)||3600);sessionStorage.setItem('slot-session',JSON.stringify(session));$('#account').textContent='Account';}
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
   body.append(text('p','Community listing · Confirm price and time directly','muted'));
   if(p.phone){const request=text('button','Request a booking','primary');request.onclick=()=>openBookingRequest(p);body.append(request);}else body.append(text('p','Booking requests unavailable until contact details are supplied','muted'));
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
$('#appointments').onclick=showBookings;
function openAccount(){
 const signed=Boolean(session?.user);
 $('#login-form h2').textContent=signed?'Your SLOT account':'Welcome to SLOT';
 $('#login-form > p').textContent=signed?'You are signed in. Business listings are public; sample bookings remain on this device.':'Enter your email. We will send a secure sign-in link—no password needed.';
 $('#email').closest('label').style.display=signed?'none':'';
 $('#email').required=!signed;
 $('#code').closest('label').style.display='none';
 $('#login-form button.primary').hidden=true;
 $('#send-code').hidden=signed;$('#send-code').textContent='Email me a sign-in link';
 $('#logout').hidden=!signed;
 $('#login-message').textContent=signed?session.user.email:'';
 $('#login').showModal();
}
$('#account').onclick=openAccount;
$('#close-login').onclick=()=>$('#login').close();
async function sendSignInLink(){
 if(!$('#email').reportValidity())return;
 const button=$('#send-code');button.disabled=true;
 $('#login-message').textContent='Sending your sign-in link…';
 try{
  await api('/auth/v1/otp?redirect_to='+encodeURIComponent('https://anotidachihwai1-cyber.github.io/slot-demo/'),{email:$('#email').value.trim(),create_user:true});
  $('#login-message').textContent='Check your inbox and spam folder. Click the sign-in link in the email to return to SLOT. Wait at least a minute before requesting another.';
 }catch(e){
  const message=e.message;
  $('#login-message').textContent=/authorized|email_address_not_authorized/i.test(message)?'Email delivery is currently limited to the project team. Please use your Supabase account email until the site owner connects an email-sending service.':/rate|too many|security purposes/i.test(message)?'Too many email requests. Please wait before trying again.':message;
 }finally{button.disabled=false;}
}
$('#send-code').onclick=sendSignInLink;
$('#login-form').onsubmit=e=>{e.preventDefault();if(!session)sendSignInLink();};
$('#logout').onclick=async()=>{const button=$('#logout');button.disabled=true;try{if(session)await api('/auth/v1/logout',{});session=null;sessionStorage.removeItem('slot-session');sessionStorage.removeItem('slot-pending');$('#account').textContent='Sign in';$('#login').close();$('#status').textContent='Signed out.';}catch(e){$('#login-message').textContent=e.message;}finally{button.disabled=false;}};
async function completeEmailSignIn(){
 const fragment=new URLSearchParams(location.hash.slice(1));
 const access=fragment.get('access_token');
 const error=fragment.get('error_description');
 if(!access&&!error)return false;
 history.replaceState(null,'',location.pathname+location.search);
 try{
  if(error)throw Error(error);
  const user=await readResponse(await fetch(authConfig.url+'/auth/v1/user',{headers:apiHeaders(authConfig.anonKey,access)}));
  saveSession({access_token:access,refresh_token:fragment.get('refresh_token'),expires_in:Number(fragment.get('expires_in'))||3600,user});
  $('#status').textContent='Signed in successfully.';return true;
 }catch(e){session=null;sessionStorage.removeItem('slot-session');$('#status').textContent='Sign-in failed: '+e.message+' Please request a fresh link.';return false;}
}
async function init(){try{if(configError){$('#mode').textContent='Supabase configuration needs attention';throw Error(configError);}if(live){$('#mode').textContent='Live · Zimbabwe time · Pay at venue';providers=await api('/rest/v1/providers?select=*,services(*)&published=eq.true');providers.forEach(p=>p.services=p.services.filter(s=>s.active));}else {providers=[...directoryListings,...samples];$('#mode').textContent='14 community listings · Contact businesses directly · Sample bookings are separate';}$('#account').textContent=session?'Account':'Sign in';render();}catch(e){$('#status').textContent=e.message;}}

// Requests are composed locally, then sent by the customer in their own messaging app.
// They do not reserve availability, confirm an appointment, or create a bill.
function setupBookingRequests(){
 const dialog=document.createElement('dialog');dialog.id='request-dialog';dialog.setAttribute('aria-labelledby','request-title');
 dialog.innerHTML='<form id="request-form"><button type="button" class="close" id="request-close" aria-label="Close booking request">✕</button><p class="eyebrow">REQUEST A TIME</p><h2 id="request-title"></h2><p>Propose a service and time. The business must confirm availability and price directly with you. This form does not reserve a slot.</p><label>Your name<input id="request-name" required maxlength="80" autocomplete="given-name"></label><label>What service would you like?<input id="request-service" required maxlength="120" placeholder="For example, a haircut or manicure"></label><label>Preferred date<input id="request-date" type="date" required></label><label>Preferred time (Zimbabwe / CAT)<input id="request-time" type="time" required></label><button class="primary" id="prepare-request">Prepare request</button><p id="request-status" role="status"></p><section id="request-preview" hidden><label>Your message<textarea id="request-message" rows="7" readonly style="width:100%;padding:12px;border:1px solid #dad3e3;border-radius:9px;font:inherit"></textarea></label><p><strong>Not sent. Not confirmed.</strong> Copy this message, or open your SMS app and tap Send there. Wait for the business to reply before travelling or paying.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><a id="request-sms" class="primary" style="display:inline-block;border-radius:24px;text-decoration:none">Open SMS app</a><button type="button" id="request-copy">Copy message</button></div></section></form>';
 document.body.append(dialog);
 $('#request-close').onclick=()=>dialog.close();
 $('#request-form').onsubmit=e=>{
  e.preventDefault();$('#request-preview').hidden=true;
  const start=new Date($('#request-date').value+'T'+$('#request-time').value+':00+02:00');
  if(!Number.isFinite(+start)||start<=new Date()){$('#request-status').textContent='Choose a future date and time in Zimbabwe.';return;}
  const provider=directoryListings.find(p=>p.id===dialog.dataset.provider);
  if(!provider?.phone){$('#request-status').textContent='No contact number is available for this business.';return;}
  const name=$('#request-name').value.trim(),service=$('#request-service').value.trim();
  if(!name||!service){$('#request-status').textContent='Enter your name and the service you would like.';return;}
  const message='Hello '+provider.name+', I found your listing on SLOT. My name is '+name+'. I would like '+service+' on '+$('#request-date').value+' at '+$('#request-time').value+' CAT. Please confirm availability, the service price and the appointment address. This is a request, not a confirmed booking.';
  $('#request-message').value=message;
  const separator=/iPad|iPhone|iPod/.test(navigator.userAgent)?'&':'?';
  $('#request-sms').href='sms:'+provider.phone.replace(/\s/g,'')+separator+'body='+encodeURIComponent(message);
  $('#request-preview').hidden=false;
  $('#request-status').textContent='Message prepared on this device. Nothing has been sent to the business.';
 };
 $('#request-copy').onclick=async()=>{try{await navigator.clipboard.writeText($('#request-message').value);$('#request-status').textContent='Message copied. Paste it into your preferred messaging app and send it yourself.';}catch{$('#request-status').textContent='Copy is unavailable. Select and copy the message above.';}};
 for(const id of ['request-name','request-service','request-date','request-time'])$('#'+id).addEventListener('input',()=>{$('#request-preview').hidden=true;$('#request-status').textContent='';});
 const fees=document.createElement('details');fees.style.cssText='margin:32px 0;padding:22px;background:#eee8fa;border-radius:18px';
 fees.innerHTML='<summary style="cursor:pointer;font-weight:700">For businesses · Our proposed 3% pilot fee</summary><p>No monthly subscription or featured-listing charges during the pilot. Our proposed fee is <strong>3% of eligible completed services</strong> from SLOT bookings, paid by participating businesses after agreeing to the terms.</p><p>For a US$10 completed service, the proposed SLOT fee is US$0.30. The customer pays the agreed service price to the business; the business pays SLOT its agreed fees separately. Requests and cancelled appointments do not generate a fee.</p><p><strong>No payments are collected on this demo.</strong> Listing a business does not subscribe it or create a fee agreement. Future price changes would be communicated and agreed before applying.</p>';
 document.querySelector('footer').before(fees);
 $('#appointments').textContent='Demo bookings';
}
function openBookingRequest(provider){
 const dialog=$('#request-dialog');dialog.dataset.provider=provider.id;$('#request-title').textContent=provider.name;
 $('#request-form').reset();$('#request-preview').hidden=true;$('#request-status').textContent='';
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Harare',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const part=key=>parts.find(p=>p.type===key).value;const today=part('year')+'-'+part('month')+'-'+part('day');
 $('#request-date').min=today;$('#request-date').value=today;dialog.showModal();
}
setupBookingRequests();

const returnedFromEmail=await completeEmailSignIn();await init();if(returnedFromEmail)openAccount();

export const overlaps=(a,b)=>new Date(a.start)<new Date(b.end)&&new Date(b.start)<new Date(a.end);
export function localSlots(day,duration,bookings,provider,now=new Date()){
 const result=[];
 for(let m=9*60;m+duration<=17*60;m+=30){
  const start=new Date(`${day}T${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}:00+02:00`);
  const end=new Date(+start+duration*60000);
  if(start>now&&!bookings.some(b=>b.provider_id===provider&&b.status==='confirmed'&&overlaps({start,end},{start:b.starts_at,end:b.ends_at})))result.push(start.toISOString());
 }return result;
}
export const catTime=iso=>new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Harare',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));

// Publishable keys belong in apikey; only user/legacy JWTs belong in Bearer.
export function apiHeaders(publicKey,accessToken){
 const headers={apikey:publicKey,'Content-Type':'application/json'};
 if(accessToken)headers.Authorization=`Bearer ${accessToken}`;
 else if(publicKey.startsWith('eyJ'))headers.Authorization=`Bearer ${publicKey}`;
 return headers;
}
export function validateConfig(config){
 if(!config.url&&!config.anonKey)return false;
 if(!config.url||!config.anonKey)throw Error('Supabase setup is incomplete: project URL and public key are both required.');
 const url=new URL(config.url);
 if(url.protocol!=='https:'||url.pathname!=='/'||url.search||url.hash)throw Error('Use the HTTPS Supabase project URL without a path.');
 if(config.anonKey.startsWith('sb_publishable_'))return true;
 try{
  const payload=JSON.parse(atob(config.anonKey.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
  if(payload.role==='anon')return true;
 }catch{}
 throw Error('Use a Supabase publishable key or legacy anon key. Secret and service-role keys must never be used in this app.');
}
export async function readResponse(response){
 const raw=await response.text();let data=null;
 if(raw){try{data=JSON.parse(raw);}catch{throw Error('Supabase returned an unexpected response. Try again.');}}
 if(!response.ok)throw Error(data?.message||data?.msg||data?.error_description||data?.error||`Request failed (${response.status})`);
 return data;
}

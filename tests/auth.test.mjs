import {test} from 'node:test';
import assert from 'node:assert/strict';
import {apiHeaders,validateConfig,readResponse} from '../auth.js';
test('publishable key is never sent as a Bearer token',()=>{
 assert.equal(apiHeaders('sb_publishable_example').Authorization,undefined);
 assert.equal(apiHeaders('sb_publishable_example','user-jwt').Authorization,'Bearer user-jwt');
});
test('configuration rejects secret keys and partial configuration',()=>{
 assert.equal(validateConfig({url:'',anonKey:''}),false);
 assert.equal(validateConfig({url:'https://example.supabase.co',anonKey:'sb_publishable_example'}),true);
 assert.throws(()=>validateConfig({url:'https://example.supabase.co',anonKey:'sb_secret_example'}));
 assert.throws(()=>validateConfig({url:'https://example.supabase.co',anonKey:''}));
 const token='eyJhbGciOiJIUzI1NiJ9.'+btoa(JSON.stringify({role:'service_role'}))+'.signature';
 assert.throws(()=>validateConfig({url:'https://example.supabase.co',anonKey:token}));
});
test('sign out accepts empty success responses and errors stay visible',async()=>{
 assert.equal(await readResponse(new Response(null,{status:204})),null);
 await assert.rejects(readResponse(new Response(JSON.stringify({msg:'Invalid code'}),{status:400})),/Invalid code/);
});

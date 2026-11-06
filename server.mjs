import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
http.createServer(async(req,res)=>{try{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=resolve(root,pathname==='/'?'index.html':'.'+pathname);
 const within=relative(root,file);
 if(within.startsWith('..')||isAbsolute(within))throw Error();
 const data=await readFile(file);
 res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'})[extname(file)]||'text/plain');
 res.setHeader('Cache-Control','no-store');res.end(data);
}catch{res.writeHead(404);res.end('Not found');}}).listen(5173,'127.0.0.1',()=>console.log('SLOT is running: http://127.0.0.1:5173/ — keep this process open while using the app.'));

const CONFIG = {
  driveFileId: "1y4HcX-otBQeT5-dTgUcleOB1BAtkVXML",
  folderId: "1fz0HedNuB2aLpdmwyIIkrBFdnBn-bok2",
  clientEmail: "dbchat@chat-490410.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDNgJdV7jFyCzHt\nnRLMBKaDNtTXlm9Ab8liUWAf7DFqVOt2bw8+g+ufmLPRrGIpQMlgJmHtE+e9iJJ7\nP0qRHnygmmXjwMK+jVeRk77KJA3aHpM9rGZjltl1TMffGxrWWCcGk+rJ4GWOkvR6\nwnRSmpVjPywRpCcB66LLwTKKSjOySZ6RIOOT4WIWDwM04qk75ueav80WarV+/scx\nh/6GrAJ8HXJijiPhQoFP47nrD8Cb/GQMVoCnIonkDybBATaAemlImSlsfigjMCCO\nj3iU16tMq+AbsFgZ9XefJ0GaIMWjvCnlm4UxZNlTD7qqx9V0vQZzKFnQWXoOsKSD\n48A1QSPvAgMBAAECggEABPRQsbWoY4N5lKzwwxJpoUg1IW1zCS6owEIN+zcKifG6\nK4TJ7Uvo5lQcIbXyN+Rj9nl2auzL7XnZbjc8aPs/LfAK/M6s40MtFUlmlCECZHvQ\nOPBrF4OPgpBzUSGqJ/jAGByA0JUkXaeVVVBS1Zr8dwQS3+oBNr6jkh36RfM8A9RP\neo0cw1P4nv71q1eVp7vfH+6/iN2f7QuyJEdsZhCmjq9+aWxNh/VlVgS0KT+aDDhl\n9MFp/RL+YLstGTeS/NUj2eprjO/+K6SsGlQ7Ln42o3AO3WdmEPuFdub+WcQvbDv9\nfqYDmvJETEMR7A3oeGNxvvS3Q7CGrF7GxsHLB7e7wQKBgQDp+rVMJJqzweC5uDOs\npXH6tJrIK8w3XRIsQCiumad+BgmY0/fDQ0QxmEggxlxJ4XZKSfinssxA+LksdQL5\n1yX4Ug+blTViTDZdol95RQkHvHKrqHJyKM2Ghf17QASn/hrAsZ7SkJDOu6zpZpI+\nk38sC5ZHffZ3SIHCJO4hMzCzJwKBgQDg18hhkieUkndqKtHSklIc4+WXcy4+L5h7\n1ovr4IihFdOCkBeE3lRMklXl83vXUxRUjK0ei9VmxspW6V9rQkLU7HKiCUMVnXts\nPSViB6RUOjy4bQrItze/cyzP80yH3hxFIUWRa2FzLI08/j3uAF1Dp/taMgQBVS25\n8LCiAPfl+QKBgQCIpEo2YnYaHlJgA2viGmia8dgmqDVF68uOHhXkCYXgOiRmpPtf\nhCwSDo2o3k7NMqdDMTnOrcNM+jQh+1+2imf5QestgBDCDCH/wrChAKkKZIpPJztW\n4e9M7Xkf/j354ZK8D77h111J7h5H3AfyFW9CSK4FqFFETgrBV5Hdv6hkJwKBgBS/\n1R4r/rsXSS3jBboJBsrjvSxc1MeoXMoQ4pjB/9ndyccixQjd+6mVV5gBAEy+vgGP\neep3vRne/o1GvCeJ1eEQcQPDFw3HmrxCaFDDo8aiGThr17LuNZbVai1GpqljNfir\nOWBSKIwYcHBQhiaQogq8VdXdB8GXusCOFb7dmAMBAoGBAMi/+6SAbISsMQGjoh1W\nrU0wgC168Ktz0D3E/8JJaVgh9kaFXHhwPz9hb7mzFUtioTaNq/tCFyMcLEEZHnDO\ne9Uym8/pdzzZlrZHj9/RlGe25aMxHOHz/+gNswnruJ0oc9uNQd8wI3c/fuD03umK\n5lykpzsqt9d8bflXTSS5d1CJ\n-----END PRIVATE KEY-----\n"
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const cookie = request.headers.get("Cookie") || "";
    const user = (cookie.match(/(?:^|; )user_session=([^;]*)/) || [])[1];
    const token = await getAccessToken();

    // 1. AUTH
    if (request.method === "POST" && (url.pathname === "/login" || url.pathname === "/register")) {
      const fd = await request.formData();
      const u = (fd.get("username") || "").trim().toLowerCase();
      const p = (fd.get("password") || "").trim();
      let db = await getDB(token);
      if (url.pathname === "/login") {
        if (db.users[u] && db.users[u].password === p) {
          return new Response("OK", { headers: { "Set-Cookie": `user_session=${u}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax` } });
        }
        return new Response("Unauthorized", { status: 401 });
      }
      db.users[u] = { name: u, password: p, lastSeen: Date.now(), bio: "Available", pic: null };
      await saveDB(token, db);
      return new Response("OK", { headers: { "Set-Cookie": `user_session=${u}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax` } });
    }

    if (!user) return new Response(renderAuth(), { headers: { "Content-Type": "text/html" } });

    // 2. API
    if (url.pathname === "/api/data") {
      let db = await getDB(token);
      if (db.users[user]) { db.users[user].lastSeen = Date.now(); await saveDB(token, db); }
      return new Response(JSON.stringify(db), { headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/media") {
      const id = url.searchParams.get("id");
      const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Range': request.headers.get("Range") || "" }
      });
      return new Response(driveRes.body, { headers: { "Content-Type": driveRes.headers.get("Content-Type") || "image/jpeg" } });
    }

    // 3. UPLOAD & CHAT
    if (request.method === "POST") {
      const fd = await request.formData();
      const action = fd.get("action");
      let db = await getDB(token);

      if (action === "chat" || action === "vn" || action === "update_profile") {
        const file = fd.get("file");
        let mediaId = null;
        if (file && file.size > 0) mediaId = await uploadToDrive(token, file);

        if (action === "update_profile") {
          if (mediaId) db.users[user].pic = mediaId;
          db.users[user].name = fd.get("name") || db.users[user].name;
        } else {
          const to = fd.get("to");
          const chatId = [user, to].sort().join("_");
          if (!db.privateChats[chatId]) db.privateChats[chatId] = [];
          db.privateChats[chatId].push({
            id: "m_" + Date.now(), from: user, text: fd.get("message") || "",
            fileId: mediaId, fileType: action === "vn" ? "audio" : (file && file.type.startsWith("image") ? "image" : "text"),
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          });
        }
        await saveDB(token, db);
        return new Response("OK");
      }
    }

    if (url.pathname === "/logout") return new Response("OK", { headers: { "Set-Cookie": "user_session=; Path=/; Max-Age=0", "Location": "/" }, status: 302 });

    return new Response(renderMain(user), { headers: { "Content-Type": "text/html" } });
  }
};

// --- DRIVE CORE ---
async function getDB(token) {
  try {
    const r = await fetch(`https://www.googleapis.com/drive/v3/files/${CONFIG.driveFileId}?alt=media`, { headers: { 'Authorization': `Bearer ${token}` } });
    return await r.json();
  } catch (e) { return { users: {}, privateChats: {} }; }
}
async function saveDB(token, db) {
  await fetch(`https://www.googleapis.com/upload/drive/v3/files/${CONFIG.driveFileId}?uploadType=media`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(db) });
}

async function uploadToDrive(token, file) {
  const metadata = { name: `${Date.now()}_${file.name}`, parents: [CONFIG.folderId] };
  const boundary = "BNDRY_" + Math.random().toString(36).substring(2);
  const head = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;
  const tail = `\r\n--${boundary}--`;
  
  const buf = await file.arrayBuffer();
  const body = new Uint8Array([...new TextEncoder().encode(head), ...new Uint8Array(buf), ...new TextEncoder().encode(tail)]);

  const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: body
  });
  const res = await r.json();
  return res.id || null;
}

async function getAccessToken() {
  const pem = CONFIG.privateKey.trim().replace(/\\n/g, '\n');
  const pemBody = pem.split('-----')[2].replace(/\s/g, '');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pemBody), c => c.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const h = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '');
  const p = btoa(JSON.stringify({ iss: CONFIG.clientEmail, scope: 'https://www.googleapis.com/auth/drive', aud: 'https://oauth2.googleapis.com/token', exp: Math.floor(Date.now()/1000)+3600, iat: Math.floor(Date.now()/1000)-30 })).replace(/=/g, '');
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${h}.${p}`));
  const jwt = `${h}.${p}.${btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '')}`;
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) });
  const data = await r.json(); return data.access_token;
}

// --- VIEWS ---
function renderAuth() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>
  <body class="bg-[#0b141a] text-[#e9edef] flex items-center justify-center min-h-screen">
    <div class="w-full max-w-xs p-8 bg-[#202c33] rounded-3xl text-center shadow-xl">
      <h1 class="text-3xl font-bold text-emerald-500 mb-8 font-serif">WhatsApp</h1>
      <input id="u" placeholder="Username" class="w-full p-4 rounded-xl bg-[#111b21] mb-4 outline-none border border-white/5">
      <input id="p" type="password" placeholder="Password" class="w-full p-4 rounded-xl bg-[#111b21] mb-6 outline-none border border-white/5">
      <button onclick="auth('/login')" class="w-full bg-emerald-600 p-4 rounded-xl font-bold mb-3 hover:bg-emerald-700 transition">MASUK</button>
      <button onclick="auth('/register')" class="w-full bg-[#2a3942] p-4 rounded-xl font-bold hover:bg-[#374954]">DAFTAR</button>
    </div>
    <script>async function auth(p){const fd=new FormData();fd.append('username',u.value);fd.append('password',p.value);const r=await fetch(p,{method:'POST',body:fd});if(r.ok)location.reload();else alert('Gagal');}</script>
  </body></html>`;
}

function renderMain(user) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><script src="https://cdn.tailwindcss.com"></script>
  <style>
    body{background:#0b141a;color:#e9edef;font-family:sans-serif;overflow:hidden;}
    .wa-bg{background-color:#0b141a;background-image:url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');background-blend-mode:overlay;}
    .hide-scroll::-webkit-scrollbar { display: none; }
    .msg-in { border-radius: 12px 12px 12px 0; }
    .msg-out { border-radius: 12px 12px 0 12px; }
  </style></head>
  <body class="h-screen flex flex-col relative">
    <div class="bg-[#202c33] p-4 flex justify-between items-center text-emerald-500 font-bold text-xl shadow-md z-20">
      <div>WhatsApp</div>
      <div id="myAv" onclick="pMod.classList.remove('hidden')" class="w-10 h-10 rounded-full overflow-hidden bg-zinc-700 cursor-pointer"></div>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <div id="side" class="w-full lg:w-96 bg-[#111b21] border-r border-white/5 overflow-y-auto hide-scroll"></div>
      
      <div id="chat" class="hidden lg:flex flex-1 flex-col wa-bg relative">
        <div class="p-3 bg-[#202c33] flex items-center gap-3 shadow-sm z-10">
          <button onclick="hideChat()" class="lg:hidden text-2xl">←</button>
          <div id="hAv" class="w-10 h-10 rounded-full overflow-hidden bg-zinc-700"></div>
          <div class="flex-1"><div id="hName" class="font-bold text-sm">Pilih Chat</div><div id="hStat" class="text-[10px] opacity-50"></div></div>
        </div>
        
        <div id="box" class="flex-1 p-4 overflow-y-auto flex flex-col gap-2 hide-scroll pb-24"></div>

        <div id="in" class="absolute bottom-0 left-0 right-0 p-3 bg-[#202c33] flex items-center gap-2 hidden z-30">
          <label class="cursor-pointer p-2 text-emerald-500 text-2xl font-bold"><input type="file" id="fIn" class="hidden" onchange="send()">+</label>
          <input id="mIn" class="flex-1 bg-[#2a3942] p-3 rounded-2xl outline-none text-sm" placeholder="Ketik pesan..." onkeypress="if(event.key==='Enter')send()">
          <button onmousedown="vS()" onmouseup="vE()" ontouchstart="vS()" ontouchend="vE()" id="vB" class="p-2 text-emerald-500 font-bold">MIC</button>
          <button onclick="send()" class="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold">KIRIM</button>
        </div>
      </div>
    </div>

    <div id="pMod" class="hidden fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
       <div class="bg-[#202c33] p-8 rounded-3xl text-center w-full max-w-xs border border-white/5">
          <input type="file" id="pIn" class="hidden" onchange="uP(this)">
          <div onclick="pIn.click()" id="pAv" class="w-32 h-32 mx-auto rounded-full overflow-hidden bg-zinc-700 mb-6 cursor-pointer border-4 border-emerald-500/20"></div>
          <button onclick="pMod.classList.add('hidden')" class="w-full bg-emerald-600 p-4 rounded-xl font-bold mb-3">TUTUP</button>
          <a href="/logout" class="block text-red-400 font-bold p-2 text-sm">KELUAR AKUN</a>
       </div>
    </div>

    <script>
      let db, selU = '', rec, chunks = [];
      const getAv = (id) => id ? \`/api/media?id=\${id}\` : 'https://www.w3schools.com/howto/img_avatar.png';
      
      async function up() {
        try {
          const r = await fetch('/api/data'); if(!r.ok) return;
          db = await r.json(); const me = db.users["${user}"];
          myAv.innerHTML = \`<img src="\${getAv(me.pic)}" class="w-full h-full object-cover">\`;
          pAv.innerHTML = \`<img src="\${getAv(me.pic)}" class="w-full h-full object-cover">\`;
          rSide(); if(selU) rChat();
        } catch(e){}
      }

      function rSide() {
        const users = Object.keys(db.users).filter(u=>u!=="${user}");
        side.innerHTML = users.length ? users.map(u => \`
          <div onclick="openChat('\${u}')" class="p-4 flex items-center gap-4 hover:bg-[#202c33] cursor-pointer \${selU===u?'bg-[#2a3942]':''}">
            <img src="\${getAv(db.users[u].pic)}" class="w-12 h-12 rounded-full object-cover bg-zinc-800">
            <div class="flex-1 border-b border-white/5 pb-2 truncate">
              <div class="font-bold text-sm">\${db.users[u].name || u}</div>
              <div class="text-[11px] opacity-40">\${db.users[u].bio || 'Available'}</div>
            </div>
          </div>\`).join('') : '<div class="p-10 text-center opacity-30 text-sm">Belum ada pengguna lain</div>';
      }

      function openChat(u) { selU = u; const c = document.getElementById('chat'); c.classList.remove('hidden'); c.classList.add('fixed','inset-0','z-40'); document.getElementById('in').classList.remove('hidden'); up(); }
      function hideChat() { const c = document.getElementById('chat'); c.classList.add('hidden'); c.classList.remove('fixed','inset-0'); selU = ''; }

      function rChat() {
        const u = db.users[selU], cId = ["${user}", selU].sort().join("_");
        hName.innerText = u.name || selU;
        hAv.innerHTML = \`<img src="\${getAv(u.pic)}" class="w-full h-full object-cover">\`;
        hStat.innerText = (Date.now()-u.lastSeen)<15000 ? 'online' : 'last seen recently';
        box.innerHTML = (db.privateChats[cId] || []).map(m => \`
          <div class="flex \${m.from==='${user}'?'justify-end':'justify-start'} mb-1">
            <div class="max-w-[85%] p-3 \${m.from==='${user}'?'bg-[#005c4b] msg-out':'bg-[#202c33] msg-in'} shadow-sm">
              \${m.fileId ? (m.fileType==='image' ? \`<img src="/api/media?id=\${m.fileId}" class="rounded-lg mb-1 max-h-60 w-full object-cover"> \` : \`<audio src="/api/media?id=\${m.fileId}" controls class="w-48"></audio>\`) : ''}
              <div class="text-[14px] leading-tight">\${m.text}</div>
              <div class="text-[9px] text-right opacity-40 mt-1">\${m.time}</div>
            </div>
          </div>\`).join('') + '<div id="bot"></div>';
        const b = document.getElementById('bot'); if(b) b.scrollIntoView({behavior:'smooth'});
      }

      async function send() {
        if(!mIn.value && !fIn.files[0]) return;
        const fd = new FormData(); fd.append('action','chat'); fd.append('to',selU); fd.append('message',mIn.value);
        if(fIn.files[0]) fd.append('file', fIn.files[0]);
        mIn.value=''; fIn.value=''; await fetch('/',{method:'POST', body:fd}); up();
      }

      async function uP(i) {
        const fd = new FormData(); fd.append('action','update_profile'); fd.append('file', i.files[0]);
        await fetch('/',{method:'POST', body:fd}); up();
      }

      async function vS() { chunks=[]; const s=await navigator.mediaDevices.getUserMedia({audio:true}); rec=new MediaRecorder(s); vB.innerText='REC'; rec.ondataavailable=e=>chunks.push(e.data); rec.onstop=async()=>{ vB.innerText='MIC'; const fd=new FormData(); fd.append('action','vn'); fd.append('to',selU); fd.append('file',new Blob(chunks,{type:'audio/ogg'}),'v.ogg'); await fetch('/',{method:'POST', body:fd}); up(); }; rec.start(); }
      function vE(){ if(rec) rec.stop(); }

      setInterval(up, 5000); up();
    </script>
  </body></html>`;
                 }

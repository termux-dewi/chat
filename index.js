const CONFIG = {
  driveFileId: "1y4HcX-otBQeT5-dTgUcleOB1BAtkVXML",
  folderId: "1fz0HedNuB2aLpdmwyIIkrBFdnBn-bok2",
  clientEmail: "dbchat@chat-490410.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDNgJdV7jFyCzHt\nnRLMBKaDNtTXlm9Ab8liUWAf7DFqVOt2bw8+g+ufmLPRrGIpQMlgJmHtE+e9iJJ7\nP0qRHnygmmXjwMK+jVeRk77KJA3aHpM9rGZjltl1TMffGxrWWCcGk+rJ4GWOkvR6\nwnRSmpVjPywRpCcB66LLwTKKSjOySZ6RIOOT4WIWDwM04qk75ueav80WarV+/scx\nh/6GrAJ8HXJijiPhQoFP47nrD8Cb/GQMVoCnIonkDybBATaAemlImSlsfigjMCCO\nj3iU16tMq+AbsFgZ9XefJ0GaIMWjvCnlm4UxZNlTD7qqx9V0vQZzKFnQWXoOsKSD\n48A1QSPvAgMBAAECggEABPRQsbWoY4N5lKzwwxJpoUg1IW1zCS6owEIN+zcKifG6\nK4TJ7Uvo5lQcIbXyN+Rj9nl2auzL7XnZbjc8aPs/LfAK/M6s40MtFUlmlCECZHvQ\nOPBrF4OPgpBzUSGqJ/jAGByA0JUkXaeVVVBS1Zr8dwQS3+oBNr6jkh36RfM8A9RP\neo0cw1P4nv71q1eVp7vfH+6/iN2f7QuyJEdsZhCmjq9+aWxNh/VlVgS0KT+aDDhl\n9MFp/RL+YLstGTeS/NUj2eprjO/+K6SsGlQ7Ln42o3AO3WdmEPuFdub+WcQvbDv9\nfqYDmvJETEMR7A3oeGNxvvS3Q7CGrF7GxsHLB7e7wQKBgQDp+rVMJJqzweC5uDOs\npXH6tJrIK8w3XRIsQCiumad+BgmY0/fDQ0QxmEggxlxJ4XZKSfinssxA+LksdQL5\n1yX4Ug+blTViTDZdol95RQkHvHKrqHJyKM2Ghf17QASn/hrAsZ7SkJDOu6zpZpI+\nk38sC5ZHffZ3SIHCJO4hMzCzJwKBgQDg18hhkieUkndqKtHSklIc4+WXcy4+L5h7\n1ovr4IihFdOCkBeE3lRMklXl83vXUxRUjK0ei9VmxspW6V9rQkLU7HKiCUMVnXts\nPSViB6RUOjy4bQrItze/cyzP80yH3hxFIUWRa2FzLI08/j3uAF1Dp/taMgQBVS25\n8LCiAPfl+QKBgQCIpEo2YnYaHlJgA2viGmia8dgmqDVF68uOHhXkCYXgOiRmpPtf\nhCwSDo2o3k7NMqdDMTnOrcNM+jQh+1+2imf5QestgBDCDCH/wrChAKkKZIpPJztW\n4e9M7Xkf/j354ZK8D77h111J7h5H3AfyFW9CSK4FqFFETgrBV5Hdv6hkJwKBgBS/\n1R4r/rsXSS3jBboJBsrjvSxc1MeoXMoQ4pjB/9ndyccixQjd+6mVV5gBAEy+vgGP\neep3vRne/o1GvCeJ1eEQcQPDFw3HmrxCaFDDo8aiGThr17LuNZbVai1GpqljNfir\nOWBSKIwYcHBQhiaQogq8VdXdB8GXusCOFb7dmAMBAoGBAMi/+6SAbISsMQGjoh1W\nrU0wgC168Ktz0D3E/8JJaVgh9kaFXHhwPz9hb7mzFUtioTaNq/tCFyMcLEEZHnDO\ne9Uym8/pdzzZlrZHj9/RlGe25aMxHOHz/+gNswnruJ0oc9uNQd8wI3c/fuD03umK\n5lykpzsqt9d8bflXTSS5d1CJ\n-----END PRIVATE KEY-----\n"
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const cookieHeader = request.headers.get("Cookie") || "";
    const username = (cookieHeader.match(/(?:^|; )user_session=([^;]*)/) || [])[1];
    const token = await getAccessToken();

    // 1. AUTH HANDLER
    if (request.method === "POST" && (url.pathname === "/login" || url.pathname === "/register")) {
      const fd = await request.formData();
      const user = (fd.get("username") || "").trim().toLowerCase();
      const pass = (fd.get("password") || "").trim();
      let db = await getDB(token);

      if (url.pathname === "/login") {
        if (db.users[user] && db.users[user].password === pass) {
          return new Response("OK", { headers: { "Set-Cookie": `user_session=${user}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax` } });
        }
        return new Response("Login Gagal", { status: 401 });
      }
      if (url.pathname === "/register") {
        if (db.users[user]) return new Response("User Exist", { status: 400 });
        db.users[user] = { name: user, password: pass, lastSeen: Date.now(), bio: "Available", pic: null };
        await saveDB(token, db);
        return new Response("OK", { headers: { "Set-Cookie": `user_session=${user}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax` } });
      }
    }

    // 2. PROTECT API
    if (url.pathname.startsWith("/api/")) {
      if (!username) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    // 3. MAIN PAGE OR LOGIN PAGE
    if (!username) return new Response(renderAuthPage(), { headers: { "Content-Type": "text/html" } });

    // 4. API ROUTES
    if (url.pathname === "/api/data") {
      let db = await getDB(token);
      if (db.users[username]) { db.users[username].lastSeen = Date.now(); await saveDB(token, db); }
      return new Response(JSON.stringify(db), { headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/media") {
      const id = url.searchParams.get("id");
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, { headers: { 'Authorization': `Bearer ${token}` } });
      return new Response(res.body, { headers: { "Content-Type": res.headers.get("Content-Type") || "application/octet-stream" } });
    }

    // 5. POST ACTIONS
    if (request.method === "POST") {
      const fd = await request.formData();
      const action = fd.get("action");
      let db = await getDB(token);

      if (action === "chat" || action === "vn") {
        const file = fd.get("file");
        let mediaId = null;
        if (file && file.size > 0) mediaId = await uploadToDrive(token, file);
        const to = fd.get("to");
        const chatId = [username, to].sort().join("_");
        if (!db.privateChats[chatId]) db.privateChats[chatId] = [];
        db.privateChats[chatId].push({
          id: "m_" + Date.now(), from: username, text: fd.get("message") || "",
          fileId: mediaId, fileType: action === "vn" ? "audio" : (file ? file.type.split('/')[0] : "text"),
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        });
      } else if (action === "delete_msg") {
        const cId = fd.get("chatId"), mId = fd.get("msgId"), mode = fd.get("mode");
        if(db.privateChats[cId]) {
          if(mode === 'everyone') db.privateChats[cId] = db.privateChats[cId].map(m => m.id === mId ? { ...m, text: "🚫 Pesan dihapus", fileId: null, deleted: true } : m);
          else db.privateChats[cId] = db.privateChats[cId].filter(m => m.id !== mId);
        }
      } else if (action === "update_profile") {
        const file = fd.get("file");
        if (file && file.size > 0) db.users[username].pic = await uploadToDrive(token, file);
        db.users[username].name = fd.get("name") || db.users[username].name;
      }
      await saveDB(token, db);
      return new Response("OK");
    }

    if (url.pathname === "/logout") return new Response("OK", { headers: { "Set-Cookie": "user_session=; Path=/; Max-Age=0", "Location": "/" }, status: 302 });

    return new Response(renderMainApp(username), { headers: { "Content-Type": "text/html" } });
  }
};

// --- DATABASE UTILS ---
async function getDB(token) {
  try {
    const r = await fetch(`https://www.googleapis.com/drive/v3/files/${CONFIG.driveFileId}?alt=media`, { headers: { 'Authorization': `Bearer ${token}` } });
    const text = await r.text();
    const data = JSON.parse(text);
    // Pastikan struktur ada
    if (!data.users) data.users = {};
    if (!data.privateChats) data.privateChats = {};
    return data;
  } catch (e) {
    // Jika file kosong atau error, buat baru
    return { users: {}, privateChats: {} };
  }
}
async function saveDB(token, db) {
  await fetch(`https://www.googleapis.com/upload/drive/v3/files/${CONFIG.driveFileId}?uploadType=media`, { 
    method: 'PATCH', 
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, 
    body: JSON.stringify(db) 
  });
}
async function uploadToDrive(token, file) {
  const meta = { name: `${Date.now()}_${file.name}`, parents: [CONFIG.folderId] };
  const fd = new FormData();
  fd.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
  fd.append('file', file);
  const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
  const d = await r.json(); return d.id;
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
  return (await r.json()).access_token;
}

// --- VIEWS ---
function renderAuthPage() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>
  <body class="bg-[#0b141a] text-white flex items-center justify-center min-h-screen">
    <div class="w-full max-w-xs text-center p-8 bg-[#202c33] rounded-3xl shadow-2xl">
      <h1 class="text-3xl font-bold text-emerald-500 mb-8">WhatsApp</h1>
      <div class="space-y-4">
        <input id="u" placeholder="Username" class="w-full p-4 rounded-xl bg-[#111b21] outline-none border border-white/5">
        <input id="p" type="password" placeholder="Password" class="w-full p-4 rounded-xl bg-[#111b21] outline-none border border-white/5">
        <div id="err" class="text-red-400 text-xs hidden"></div>
        <button onclick="auth('/login')" class="w-full bg-emerald-600 p-4 rounded-xl font-bold">LOGIN</button>
        <button onclick="auth('/register')" class="w-full bg-[#2a3942] p-4 rounded-xl font-bold">DAFTAR</button>
      </div>
    </div>
    <script>
      async function auth(path) {
        const fd = new FormData(); fd.append('username', u.value); fd.append('password', p.value);
        const res = await fetch(path, { method: 'POST', body: fd });
        if(res.ok) window.location.reload();
        else { const t = await res.text(); err.innerText = t; err.classList.remove('hidden'); }
      }
    </script>
  </body></html>`;
}

function renderMainApp(user) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><script src="https://cdn.tailwindcss.com"></script>
  <style>body{background:#0b141a;color:#e9edef;font-family:sans-serif;overflow:hidden;} .wa-bg{background-color:#0b141a;background-image:url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');background-blend-mode:overlay;} .avatar{width:45px;height:45px;border-radius:50%;object-fit:cover;background:#374151;flex-shrink:0;}</style></head>
  <body class="h-screen flex flex-col">
    <div class="bg-[#202c33] p-4 flex justify-between items-center text-emerald-500 font-bold text-xl shadow-lg z-10">
      <div>WhatsApp</div>
      <div id="myAv" onclick="pMod.classList.remove('hidden')" class="cursor-pointer"></div>
    </div>
    <div class="flex-1 flex overflow-hidden">
      <div id="side" class="w-full lg:w-96 bg-[#111b21] border-r border-white/5 overflow-y-auto"></div>
      <div id="chat" class="hidden lg:flex flex-1 flex-col wa-bg">
        <div class="p-3 bg-[#202c33] flex items-center gap-3 shadow-md">
          <button onclick="hideChat()" class="lg:hidden text-2xl">←</button>
          <div id="hAv" class="avatar w-10 h-10"></div>
          <div class="flex-1 text-sm"><div id="hName" class="font-bold">Pilih Chat</div><div id="hStat" class="text-[10px] opacity-40"></div></div>
        </div>
        <div id="box" class="flex-1 p-4 overflow-y-auto flex flex-col gap-3"></div>
        <div id="in" class="p-3 bg-[#202c33] flex items-center gap-3 hidden">
          <label class="cursor-pointer text-2xl text-emerald-500"><input type="file" id="fIn" class="hidden" onchange="send()">+</label>
          <input id="mIn" class="flex-1 bg-[#2a3942] p-3 rounded-xl outline-none" placeholder="Ketik pesan..." onkeypress="if(event.key==='Enter')send()">
          <button onmousedown="vS()" onmouseup="vE()" ontouchstart="vS()" ontouchend="vE()" id="vB" class="p-3 text-xl">🎙️</button>
          <button onclick="send()" class="bg-emerald-600 p-3 rounded-full">➡️</button>
        </div>
      </div>
    </div>
    <div id="pMod" class="hidden fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
       <div class="bg-[#202c33] p-8 rounded-3xl text-center w-full max-w-xs border border-white/5">
          <input type="file" id="pIn" class="hidden" onchange="uP(this)">
          <div onclick="pIn.click()" id="pAv" class="w-32 h-32 mx-auto rounded-full overflow-hidden bg-zinc-700 mb-6 cursor-pointer border-4 border-emerald-500/20"></div>
          <button onclick="pMod.classList.add('hidden')" class="w-full bg-emerald-600 p-4 rounded-xl font-bold mb-3">TUTUP</button>
          <a href="/logout" class="block text-red-400 font-bold p-2">LOGOUT</a>
       </div>
    </div>
    <script>
      let db, selU = '', rec, chunks = [];
      const getAv = (id) => id ? \`/api/media?id=\${id}\` : 'https://www.w3schools.com/howto/img_avatar.png';
      
      async function up() {
        try {
          const r = await fetch('/api/data'); 
          if(r.status === 401) { window.location.reload(); return; }
          db = await r.json();
          if(!db || !db.users) return;
          const me = db.users["${user}"];
          myAv.innerHTML = \`<img src="\${getAv(me.pic)}" class="avatar">\`;
          pAv.innerHTML = \`<img src="\${getAv(me.pic)}" class="w-full h-full object-cover">\`;
          rSide(); if(selU) rChat();
        } catch(e){ console.error(e); }
      }

      function rSide() {
        const users = Object.keys(db.users).filter(u=>u!=="${user}");
        if(users.length === 0) {
          side.innerHTML = '<div class="p-10 text-center opacity-30 text-sm italic">Belum ada pengguna lain.<br>Ajak teman daftar!</div>';
          return;
        }
        side.innerHTML = users.map(u => \`
          <div onclick="openChat('\${u}')" class="p-4 flex items-center gap-4 hover:bg-[#202c33] cursor-pointer \${selU===u?'bg-[#2a3942]':''}">
            <img src="\${getAv(db.users[u].pic)}" class="avatar">
            <div class="flex-1 border-b border-white/5 pb-2 truncate text-left">
              <div class="font-bold text-[#e9edef]">\${db.users[u].name || u}</div>
              <div class="text-xs text-[#8696a0]">\${db.users[u].bio || 'Available'}</div>
            </div>
          </div>\`).join('');
      }

      function openChat(u) { 
        selU = u; 
        const chatBox = document.getElementById('chat');
        chatBox.classList.remove('hidden'); 
        chatBox.classList.add('fixed','inset-0','z-40'); 
        document.getElementById('in').classList.remove('hidden'); 
        rChat(); 
      }
      
      function hideChat() { 
        const chatBox = document.getElementById('chat');
        chatBox.classList.add('hidden'); 
        chatBox.classList.remove('fixed','inset-0'); 
        selU = ''; 
      }

      function rChat() {
        const u = db.users[selU]; hName.innerText = u.name || selU;
        hAv.innerHTML = \`<img src="\${getAv(u.pic)}" class="w-full h-full object-cover rounded-full">\`;
        hStat.innerText = (Date.now()-u.lastSeen)<15000 ? 'online' : 'last seen recently';
        const cId = ["${user}", selU].sort().join("_");
        box.innerHTML = (db.privateChats[cId] || []).map(m => \`
          <div class="flex \${m.from==='${user}'?'justify-end':'justify-start'}" oncontextmenu="event.preventDefault(); sO('\${cId}','\${m.id}')">
            <div class="max-w-[85%] p-3 rounded-xl \${m.from==='${user}'?'bg-[#005c4b]':'bg-[#202c33]'} shadow-sm">
              \${m.fileId ? (m.fileType==='image' ? \`<img src="/api/media?id=\${m.fileId}" class="rounded-lg mb-1"> \` : \`<video src="/api/media?id=\${m.fileId}" controls class="rounded-lg mb-1"></video>\`) : ''}
              \${m.fileType==='audio' ? \`<audio src="/api/media?id=\${m.fileId}" controls class="w-48"></audio>\` : ''}
              <div class="text-[14px]">\${m.text}</div>
              <div class="text-[9px] text-right opacity-40 mt-1">\${m.time}</div>
            </div>
          </div>\`).join('') + '<div id="bot"></div>';
        const bot = document.getElementById('bot');
        if(bot) bot.scrollIntoView();
      }

      function sO(cId, mId) {
        if(!confirm('Hapus pesan?')) return;
        const mode = confirm('Hapus untuk semua?') ? 'everyone' : 'me';
        const fd = new FormData(); fd.append('action','delete_msg'); fd.append('chatId',cId); fd.append('msgId',mId); fd.append('mode',mode);
        fetch('/', {method:'POST', body:fd}).then(up);
      }

      async function send() {
        const mInput = document.getElementById('mIn');
        const fInput = document.getElementById('fIn');
        if(!mInput.value && !fInput.files[0]) return;
        const fd = new FormData(); fd.append('action','chat'); fd.append('to',selU); fd.append('message',mInput.value);
        if(fInput.files[0]) fd.append('file', fInput.files[0]);
        mInput.value=''; fInput.value=''; await fetch('/',{method:'POST', body:fd}); up();
      }

      async function vS() {
        chunks=[]; try {
          const s=await navigator.mediaDevices.getUserMedia({audio:true});
          rec=new MediaRecorder(s); vB.innerText='🔴'; rec.ondataavailable=e=>chunks.push(e.data);
          rec.onstop=async()=>{
            vB.innerText='🎙️'; const fd=new FormData(); fd.append('action','vn'); fd.append('to',selU); fd.append('file',new Blob(chunks,{type:'audio/ogg'}),'v.ogg');
            await fetch('/',{method:'POST', body:fd}); up();
          }; rec.start();
        } catch(e){ alert("Izin Mic ditolak"); }
      }
      function vE(){if(rec && rec.state!=='inactive')rec.stop();}
      async function uP(i){
        const fd=new FormData(); fd.append('action','update_profile'); fd.append('file',i.files[0]);
        await fetch('/',{method:'POST',body:fd}); up();
      }
      setInterval(up, 5000); up();
    </script>
  </body></html>`;
        }

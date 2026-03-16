const CONFIG = {
  driveFileId: "1y4HcX-otBQeT5-dTgUcleOB1BAtkVXML",
  mediaFolderId: "1VgxPBzDVJ_GxPbUXAYLnTSeZbitjYOnY", 
  clientEmail: "dbchat@chat-490410.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDNgJdV7jFyCzHt\nnRLMBKaDNtTXlm9Ab8liUWAf7DFqVOt2bw8+g+ufmLPRrGIpQMlgJmHtE+e9iJJ7\nP0qRHnygmmXjwMK+jVeRk77KJA3aHpM9rGZjltl1TMffGxrWWCcGk+rJ4GWOkvR6\nwnRSmpVjPywRpCcB66LLwTKKSjOySZ6RIOOT4WIWDwM04qk75ueav80WarV+/scx\nh/6GrAJ8HXJijiPhQoFP47nrD8Cb/GQMVoCnIonkDybBATaAemlImSlsfigjMCCO\nj3iU16tMq+AbsFgZ9XefJ0GaIMWjvCnlm4UxZNlTD7qqx9V0vQZzKFnQWXoOsKSD\n48A1QSPvAgMBAAECggEABPRQsbWoY4N5lKzwwxJpoUg1IW1zCS6owEIN+zcKifG6\nK4TJ7Uvo5lQcIbXyN+Rj9nl2auzL7XnZbjc8aPs/LfAK/M6s40MtFUlmlCECZHvQ\nOPBrF4OPgpBzUSGqJ/jAGByA0JUkXaeVVVBS1Zr8dwQS3+oBNr6jkh36RfM8A9RP\neo0cw1P4nv71q1eVp7vfH+6/iN2f7QuyJEdsZhCmjq9+aWxNh/VlVgS0KT+aDDhl\n9MFp/RL+YLstGTeS/NUj2eprjO/+K6SsGlQ7Ln42o3AO3WdmEPuFdub+WcQvbDv9\nfqYDmvJETEMR7A3oeGNxvvS3Q7CGrF7GxsHLB7e7wQKBgQDp+rVMJJqzweC5uDOs\npXH6tJrIK8w3XRIsQCiumad+BgmY0/fDQ0QxmEggxlxJ4XZKSfinssxA+LksdQL5\n1yX4Ug+blTViTDZdol95RQkHvHKrqHJyKM2Ghf17QASn/hrAsZ7SkJDOu6zpZpI+\nk38sC5ZHffZ3SIHCJO4hMzCzJwKBgQDg18hhkieUkndqKtHSklIc4+WXcy4+L5h7\n1ovr4IihFdOCkBeE3lRMklXl83vXUxRUjK0ei9VmxspW6V9rQkLU7HKiCUMVnXts\nPSViB6RUOjy4bQrItze/cyzP80yH3hxFIUWRa2FzLI08/j3uAF1Dp/taMgQBVS25\n8LCiAPfl+QKBgQCIpEo2YnYaHlJgA2viGmia8dgmqDVF68uOHhXkCYXgOiRmpPtf\nhCwSDo2o3k7NMqdDMTnOrcNM+jQh+1+2imf5QestgBDCDCH/wrChAKkKZIpPJztW\n4e9M7Xkf/j354ZK8D77h111J7h5H3AfyFW9CSK4FqFFETgrBV5Hdv6hkJwKBgBS/\n1R4r/rsXSS3jBboJBsrjvSxc1MeoXMoQ4pjB/9ndyccixQjd+6mVV5gBAEy+vgGP\neep3vRne/o1GvCeJ1eEQcQPDFw3HmrxCaFDDo8aiGThr17LuNZbVai1GpqljNfir\nOWBSKIwYcHBQhiaQogq8VdXdB8GXusCOFb7dmAMBAoGBAMi/+6SAbISsMQGjoh1W\nrU0wgC168Ktz0D3E/8JJaVgh9kaFXHhwPz9hb7mzFUtioTaNq/tCFyMcLEEZHnDO\ne9Uym8/pdzzZlrZHj9/RlGe25aMxHOHz/+gNswnruJ0oc9uNQd8wI3c/fuD03umK\n5lykpzsqt9d8bflXTSS5d1CJ\n-----END PRIVATE KEY-----\n"
};

export default {
  async fetch(request) {
    try {
      const url = new URL(request.url);
      const cookie = request.headers.get("Cookie") || "";
      const username = (cookie.match(/user_session=([^;]+)/) || [])[1];

      const getSafeDB = async (token) => {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${CONFIG.driveFileId}?alt=media`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return { users: {}, privateChats: {} };
        return await response.json();
      };

      if (url.pathname === "/api/data") {
        const token = await getAccessToken();
        let db = await getSafeDB(token);
        // Update online status jika sedang hit API
        if (username && db.users[username]) {
          db.users[username].lastSeen = Date.now();
          await updateDriveFile(token, JSON.stringify(db));
        }
        return new Response(JSON.stringify(db), { headers: { "Content-Type": "application/json" } });
      }

      if (request.method === "POST") {
        const token = await getAccessToken();
        const formData = await request.formData();
        const action = formData.get("action");
        let db = await getSafeDB(token);

        if (username) {
          const to = formData.get("to");
          const chatId = [username, to].sort().join("_");
          if (!db.privateChats) db.privateChats = {};
          if (!db.privateChats[chatId]) db.privateChats[chatId] = [];

          if (action === "chat") {
            const file = formData.get("file");
            let fileUrl = null;
            if (file && file.size > 0) {
              const upload = await uploadToDrive(token, file);
              fileUrl = `https://www.googleapis.com/drive/v3/files/${upload.id}?alt=media&export=download`;
            }
            db.privateChats[chatId].push({
              id: "m_" + Date.now(), from: username, text: formData.get("message") || "",
              file: fileUrl, fileType: file?.type?.startsWith("video") ? "video" : "image",
              deletedBy: [], time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            });
          } else if (action === "edit") {
            const msg = db.privateChats[chatId].find(m => m.id === formData.get("msgId"));
            if (msg && msg.from === username) { msg.text = formData.get("message"); msg.edited = true; }
          } else if (action === "delete_for_me") {
            const msg = db.privateChats[chatId].find(m => m.id === formData.get("msgId"));
            if (msg) msg.deletedBy.push(username);
          } else if (action === "delete_for_all") {
            const msg = db.privateChats[chatId].find(m => m.id === formData.get("msgId"));
            if (msg && msg.from === username) { msg.text = "🚫 Pesan ini telah dihapus"; msg.file = null; msg.isDeleted = true; }
          } else if (action === "update_profile") {
            db.users[username].name = formData.get("display_name");
            db.users[username].bio = formData.get("bio");
          }
          await updateDriveFile(token, JSON.stringify(db));
          return new Response("OK");
        }

        // Login / Register
        const user = (formData.get("username") || "").trim().toLowerCase();
        const pass = (formData.get("password") || "").trim();
        if (action === "register") {
          if (db.users[user]) return new Response("Exist", { status: 400 });
          db.users[user] = { name: user, password: pass, lastSeen: Date.now(), bio: "Available" };
          await updateDriveFile(token, JSON.stringify(db));
        } else if (!db.users[user] || db.users[user].password !== pass) return new Response("Invalid", { status: 401 });
        
        return new Response("OK", { status: 302, headers: { "Location": "/", "Set-Cookie": `user_session=${user}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400` } });
      }

      if (url.pathname === "/logout") return new Response("OK", { status: 302, headers: { "Location": "/", "Set-Cookie": "user_session=; Path=/; Max-Age=0" } });
      if (!username) return new Response(renderAuthPage(), { headers: { "Content-Type": "text/html" } });
      return new Response(renderMainApp(username), { headers: { "Content-Type": "text/html" } });
    } catch (e) { return new Response(e.message, { status: 500 }); }
  }
};

// --- DRIVE LOGIC ---
async function getAccessToken() {
  const pem = CONFIG.privateKey.trim().replace(/\\n/g, '\n');
  const pemBody = pem.split('-----')[2].replace(/\s/g, '');
  const privateKey = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pemBody), c => c.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '');
  const now = Math.floor(Date.now() / 1000) - 30;
  const payload = btoa(JSON.stringify({ iss: CONFIG.clientEmail, scope: 'https://www.googleapis.com/auth/drive', aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now })).replace(/=/g, '');
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(`${header}.${payload}`));
  const jwt = `${header}.${payload}.${btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '')}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
  });
  return (await res.json()).access_token;
}

async function uploadToDrive(token, file) {
  const meta = { name: `media_${Date.now()}`, parents: [CONFIG.mediaFolderId] };
  const body = new FormData();
  body.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
  body.append('file', file);
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body });
  const data = await res.json();
  await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'reader', type: 'anyone' }) });
  return data;
}

function updateDriveFile(token, content) {
  return fetch(`https://www.googleapis.com/upload/drive/v3/files/${CONFIG.driveFileId}?uploadType=media`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: content });
}

// --- UI COMPONENTS ---
function renderAuthPage() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>
  <body class="bg-[#0b0f1a] flex items-center justify-center min-h-screen text-white p-6 font-sans uppercase font-black italic tracking-tighter text-xs">
    <div class="w-full max-w-sm p-10 bg-zinc-900/50 rounded-[2.5rem] border border-zinc-800 text-center shadow-2xl backdrop-blur-md">
      <h1 class="text-5xl text-blue-500 mb-10">THE HUB</h1>
      <form method="POST">
        <input type="hidden" name="action" id="act" value="login">
        <input name="username" required placeholder="Username" class="w-full p-4 rounded-2xl bg-black mb-4 outline-none border border-zinc-800 focus:border-blue-600 transition-all">
        <input name="password" type="password" required placeholder="Password" class="w-full p-4 rounded-2xl bg-black mb-8 outline-none border border-zinc-800 focus:border-blue-600 transition-all">
        <button id="btn" class="w-full bg-blue-600 py-4 rounded-2xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all">Login</button>
        <div class="flex justify-center gap-6 mt-8 opacity-40">
          <button type="button" onclick="document.getElementById('act').value='login'; document.getElementById('btn').innerText='Login'">Login</button>
          <button type="button" onclick="document.getElementById('act').value='register'; document.getElementById('btn').innerText='Daftar'">Daftar</button>
        </div>
      </form>
    </div>
  </body></html>`;
}

function renderMainApp(user) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><script src="https://cdn.tailwindcss.com"></script>
  <style>
    #sidebar { transition: 0.3s; } .sidebar-closed { transform: translateX(-100%); }
    #chatBox { scrollbar-width: none; } #chatBox::-webkit-scrollbar { display: none; }
    .msg-menu { display: none; } .msg-item:active .msg-menu { display: flex; }
  </style></head>
  <body class="bg-black text-zinc-300 h-screen flex flex-col font-sans overflow-hidden uppercase font-black italic tracking-tighter text-[10px]">
    <div class="flex flex-1 overflow-hidden relative">
      <div id="sidebar" class="fixed lg:static inset-y-0 left-0 w-72 border-r border-zinc-900 bg-[#0b0f1a] z-[60] sidebar-closed lg:transform-none flex flex-col shadow-2xl">
        <div class="p-6 border-b border-zinc-900 flex justify-between items-center bg-[#0b0f1a]">
          <div onclick="editProfile()" class="text-blue-500 truncate cursor-pointer" id="myProfileName">${user}</div>
          <button onclick="toggleSidebar()" class="lg:hidden text-zinc-500">✕</button>
        </div>
        <div id="userList" class="flex-1 overflow-y-auto p-2"></div>
      </div>

      <div class="flex-1 flex flex-col min-w-0 bg-black">
        <div class="p-4 bg-[#0b0f1a] border-b border-zinc-900 flex justify-between items-center z-40 shadow-xl">
          <button onclick="toggleSidebar()" class="lg:hidden text-blue-500 p-2">☰</button>
          <div class="flex flex-col items-center">
             <div id="chatName">THE HUB</div>
             <div id="onlineStatus" class="text-[6px] text-green-500 hidden italic">ONLINE</div>
          </div>
          <a href="/logout" class="opacity-30 hover:opacity-100 p-2">EXIT</a>
        </div>
        
        <div id="chatBox" class="flex-1 p-4 overflow-y-auto flex flex-col gap-4 pb-24"></div>

        <div id="inputBar" class="hidden absolute bottom-0 left-0 right-0 p-4 bg-[#0b0f1a]/95 border-t border-zinc-900 z-50 lg:static">
          <div class="flex items-center gap-2 max-w-5xl mx-auto">
            <label class="bg-zinc-800 h-10 w-10 flex items-center justify-center rounded-xl cursor-pointer shrink-0">
              <input type="file" id="fileInput" class="hidden" onchange="document.getElementById('prev').classList.remove('hidden')">
              <span class="text-xl text-blue-500">+</span>
            </label>
            <input id="msgInput" class="flex-1 bg-black h-10 px-4 rounded-xl outline-none border border-zinc-800 focus:border-blue-600 shadow-inner" placeholder="MESSAGE...">
            <button onclick="sendChat()" id="sendBtn" class="bg-blue-600 h-10 px-5 rounded-xl text-white shadow-lg active:scale-95">SEND</button>
          </div>
          <div id="prev" class="hidden text-blue-500 mt-2 text-[8px] text-center animate-pulse italic">MEDIA READY...</div>
        </div>
      </div>
    </div>

    <script>
      let selectedUser = "";
      function toggleSidebar() { document.getElementById('sidebar').classList.toggle('sidebar-closed'); }

      async function update() {
        const res = await fetch('/api/data');
        if(!res.ok) return;
        const db = await res.json();
        
        // Render My Profile Name
        if(db.users["${user}"].name) document.getElementById('myProfileName').innerText = db.users["${user}"].name;

        // Render User List & Status Online
        const users = Object.keys(db.users || {}).filter(u => u !== "${user}");
        document.getElementById('userList').innerHTML = users.map(u => {
          const isOnline = (Date.now() - db.users[u].lastSeen) < 15000;
          return \`
          <div onclick="selectUser('\${u}')" class="p-4 mb-1 rounded-2xl cursor-pointer \${selectedUser === u ? 'bg-zinc-800 border-l-4 border-blue-500' : 'hover:bg-zinc-900'}">
            <div class="flex justify-between items-center">
               <span class="truncate">\${db.users[u].name || u}</span>
               \${isOnline ? '<span class="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_5px_green]"></span>' : ''}
            </div>
            <div class="text-[6px] opacity-40 lowercase mt-1">\${db.users[u].bio || '...'}</div>
          </div>\`;
        }).join('');

        if(selectedUser) {
          const statusEl = document.getElementById('onlineStatus');
          const isOnline = (Date.now() - db.users[selectedUser].lastSeen) < 15000;
          statusEl.innerText = isOnline ? "ONLINE" : "OFFLINE";
          statusEl.classList.toggle('text-green-500', isOnline);
          statusEl.classList.toggle('text-zinc-600', !isOnline);
          statusEl.classList.remove('hidden');

          const cId = ["${user}", selectedUser].sort().join("_");
          const msgs = (db.privateChats && db.privateChats[cId]) || [];
          document.getElementById('chatBox').innerHTML = msgs.filter(m => !m.deletedBy.includes("${user}")).map(m => \`
            <div class="flex flex-col \${m.from === "${user}" ? 'items-end' : 'items-start'} msg-item relative">
              <div class="max-w-[85%] p-3 rounded-2xl shadow-lg \${m.from === "${user}" ? 'bg-blue-600 rounded-tr-none' : 'bg-zinc-800 rounded-tl-none'}">
                \${m.file ? \`<img src="\${m.file}" class="rounded-lg mb-2 max-w-full block" />\` : ''}
                <div class="text-[11px] text-white not-italic tracking-normal break-words">\${m.text}</div>
                <div class="flex items-center gap-3 mt-2 opacity-40 text-[7px]">
                  <span>\${m.time} \${m.edited ? '(EDITED)' : ''}</span>
                  \${m.from === "${user}" && !m.isDeleted ? \`<button onclick="editMsg('\${m.id}', '\${m.text}')" class="text-yellow-400">EDIT</button>\` : ''}
                  <button onclick="msgMenu('\${m.id}', \${m.from === "${user}"})" class="text-white">...</button>
                </div>
              </div>
            </div>\`).join('');
        }
      }

      function msgMenu(id, isMine) {
        const act = prompt("1: Hapus untuk saya\\n" + (isMine ? "2: Hapus untuk semua" : ""));
        if(act === "1") sendAction('delete_for_me', {msgId: id});
        if(act === "2" && isMine) sendAction('delete_for_all', {msgId: id});
      }

      async function sendAction(action, data) {
        const fd = new FormData(); fd.append('action', action); fd.append('to', selectedUser);
        for(let k in data) fd.append(k, data[k]);
        await fetch('/', { method: 'POST', body: fd }); update();
      }

      function editProfile() {
        const n = prompt("Ganti Nama:", document.getElementById('myProfileName').innerText);
        const b = prompt("Ganti Bio:", "Available");
        if(n) sendAction('update_profile', {display_name: n, bio: b});
      }

      function selectUser(u) { 
        selectedUser = u; 
        document.getElementById('chatName').innerText = u; 
        document.getElementById('inputBar').classList.remove('hidden'); 
        update(); 
        if(window.innerWidth < 1024) toggleSidebar(); 
      }

      async function sendChat() {
        const i = document.getElementById('msgInput'), f = document.getElementById('fileInput'), btn = document.getElementById('sendBtn');
        if(!i.value && !f.files[0]) return;
        btn.disabled = true;
        const fd = new FormData(); fd.append('action', 'chat'); fd.append('to', selectedUser); fd.append('message', i.value);
        if(f.files[0]) fd.append('file', f.files[0]);
        i.value = ""; f.value = ""; document.getElementById('prev').classList.add('hidden');
        await fetch('/', { method: 'POST', body: fd });
        btn.disabled = false; update();
      }

      function editMsg(id, old) {
        const n = prompt("Edit:", old);
        if(n !== null && n !== old) sendAction('edit', {msgId: id, message: n});
      }

      setInterval(update, 5000); 
      update();
    </script>
  </body></html>`;
            }

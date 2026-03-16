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
        return await response.json();
      };

      if (url.pathname === "/api/data") {
        const token = await getAccessToken();
        let db = await getSafeDB(token);
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
          } else if (action === "update_profile") {
            const pFile = formData.get("profile_pic");
            if (pFile && pFile.size > 0) {
              const upload = await uploadToDrive(token, pFile);
              db.users[username].pic = `https://www.googleapis.com/drive/v3/files/${upload.id}?alt=media&export=download`;
            }
            db.users[username].name = formData.get("display_name") || db.users[username].name;
            db.users[username].bio = formData.get("bio") || db.users[username].bio;
          } else if (action === "delete_for_me") {
            const msg = db.privateChats[chatId].find(m => m.id === formData.get("msgId"));
            if (msg) msg.deletedBy.push(username);
          } else if (action === "delete_for_all") {
            const msg = db.privateChats[chatId].find(m => m.id === formData.get("msgId"));
            if (msg && msg.from === username) { msg.text = "🚫 Pesan dihapus"; msg.file = null; msg.isDeleted = true; }
          }
          await updateDriveFile(token, JSON.stringify(db));
          return new Response("OK");
        }

        const user = (formData.get("username") || "").trim().toLowerCase();
        const pass = (formData.get("password") || "").trim();
        if (action === "register") {
          db.users[user] = { name: user, password: pass, lastSeen: Date.now(), bio: "Available", pic: null };
          await updateDriveFile(token, JSON.stringify(db));
        }
        return new Response("OK", { status: 302, headers: { "Location": "/", "Set-Cookie": `user_session=${user}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400` } });
      }

      if (url.pathname === "/logout") return new Response("OK", { status: 302, headers: { "Location": "/", "Set-Cookie": "user_session=; Path=/; Max-Age=0" } });
      if (!username) return new Response(renderAuthPage(), { headers: { "Content-Type": "text/html" } });
      return new Response(renderMainApp(username), { headers: { "Content-Type": "text/html" } });
    } catch (e) { return new Response(e.message, { status: 500 }); }
  }
};

async function getAccessToken() {
  const pem = CONFIG.privateKey.trim().replace(/\\n/g, '\n');
  const pemBody = pem.split('-----')[2].replace(/\s/g, '');
  const privateKey = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pemBody), c => c.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '');
  const now = Math.floor(Date.now() / 1000) - 30;
  const payload = btoa(JSON.stringify({ iss: CONFIG.clientEmail, scope: 'https://www.googleapis.com/auth/drive', aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now })).replace(/=/g, '');
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(`${header}.${payload}`));
  const jwt = `${header}.${payload}.${btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '')}`;
  const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) });
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

function renderAuthPage() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>
  <body class="bg-black flex items-center justify-center min-h-screen text-white p-6 font-sans uppercase font-black italic tracking-tighter">
    <div class="w-full max-w-sm p-10 bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 text-center shadow-2xl">
      <h1 class="text-6xl text-blue-500 mb-10">HUB</h1>
      <form method="POST" class="space-y-4">
        <input type="hidden" name="action" id="act" value="login">
        <input name="username" required placeholder="ID" class="w-full p-5 rounded-3xl bg-black border border-white/5 outline-none transition-all">
        <input name="password" type="password" required placeholder="PASS" class="w-full p-5 rounded-3xl bg-black border border-white/5 outline-none transition-all">
        <button id="btn" class="w-full bg-blue-600 p-5 rounded-3xl active:scale-95 transition-all">ENTER</button>
        <div class="flex justify-center gap-8 pt-4 text-[10px] opacity-30">
          <button type="button" onclick="document.getElementById('act').value='login'; document.getElementById('btn').innerText='ENTER'">LOGIN</button>
          <button type="button" onclick="document.getElementById('act').value='register'; document.getElementById('btn').innerText='JOIN'">REGISTER</button>
        </div>
      </form>
    </div>
  </body></html>`;
}

function renderMainApp(user) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap');
    body { font-family: 'Inter', sans-serif; background: #000; }
    #sidebar { transition: cubic-bezier(0.4, 0, 0.2, 1) 0.4s; } 
    .sidebar-closed { transform: translateX(-105%); }
    .glass { background: rgba(15, 15, 20, 0.85); backdrop-filter: blur(30px); }
    #chatBox::-webkit-scrollbar { width: 0; }
    .msg-anim { animation: slideIn 0.3s ease-out; }
    @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; background: #2563eb; display: flex; items-center: center; justify-content: center; font-size: 14px; color: white; flex-shrink: 0; }
  </style></head>
  <body class="text-zinc-400 h-screen flex flex-col overflow-hidden uppercase font-black italic tracking-tighter text-[11px]">
    <div class="flex flex-1 overflow-hidden relative">
      <div id="sidebar" class="fixed lg:static inset-y-0 left-0 w-80 glass border-r border-white/5 z-[60] sidebar-closed lg:transform-none flex flex-col shadow-2xl">
        <div class="p-8 border-b border-white/5 flex flex-col items-center gap-4">
          <div onclick="document.getElementById('profilePicInput').click()" class="relative group cursor-pointer">
            <div id="myAvatar" class="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-3xl overflow-hidden border-2 border-white/10 group-hover:border-blue-500 transition-all"></div>
            <div class="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px]">EDIT</div>
            <input type="file" id="profilePicInput" class="hidden" onchange="uploadProfilePic(this)">
          </div>
          <div onclick="editProfile()" class="text-blue-500 text-lg cursor-pointer hover:opacity-70" id="myProfileName">${user}</div>
          <button onclick="toggleSidebar()" class="lg:hidden text-zinc-600 text-[8px]">CLOSE SIDEBAR</button>
        </div>
        <div id="userList" class="flex-1 overflow-y-auto p-4 space-y-2"></div>
      </div>

      <div class="flex-1 flex flex-col min-w-0 relative">
        <div class="p-5 glass border-b border-white/5 flex justify-between items-center z-40">
          <button onclick="toggleSidebar()" class="lg:hidden text-blue-500 font-black">MENU</button>
          <div class="flex items-center gap-3">
             <div id="headerAvatar" class="avatar hidden"></div>
             <div class="flex flex-col">
                <div id="chatName" class="text-white tracking-widest text-sm">THE HUB</div>
                <div id="onlineStatus" class="text-[7px] text-green-500 hidden italic">● LIVE</div>
             </div>
          </div>
          <a href="/logout" class="opacity-20 hover:opacity-100">EXIT</a>
        </div>
        
        <div id="chatBox" class="flex-1 p-6 overflow-y-auto flex flex-col gap-6 pb-32"></div>

        <div id="inputBar" class="hidden absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-3xl z-50">
          <div class="glass border border-white/10 p-3 rounded-[2.5rem] flex items-center gap-3 shadow-2xl">
            <label class="bg-white/5 h-12 w-12 flex items-center justify-center rounded-full cursor-pointer hover:bg-white/10 shrink-0 transition-all">
              <input type="file" id="fileInput" class="hidden" onchange="document.getElementById('prev').classList.remove('hidden')">
              <span class="text-2xl text-blue-500">+</span>
            </label>
            <input id="msgInput" class="flex-1 bg-transparent h-12 px-2 outline-none text-white placeholder-zinc-700" placeholder="TYPE MESSAGE...">
            <button onclick="sendChat()" id="sendBtn" class="bg-blue-600 h-12 px-8 rounded-full text-white shadow-xl active:scale-90 transition-all">SEND</button>
          </div>
          <div id="prev" class="hidden text-blue-500 text-center mt-2 text-[8px] animate-pulse">FILE READY</div>
        </div>
      </div>
    </div>

    <script>
      let selectedUser = "";
      function toggleSidebar() { document.getElementById('sidebar').classList.toggle('sidebar-closed'); }
      
      const getAvatar = (userObj, name) => {
        if(userObj.pic) return \`<img src="\${userObj.pic}" class="w-full h-full object-cover" />\`;
        return name.charAt(0).toUpperCase();
      };

      async function update() {
        const res = await fetch('/api/data');
        if(!res.ok) return;
        const db = await res.json();
        const me = db.users["${user}"];
        
        document.getElementById('myAvatar').innerHTML = getAvatar(me, "${user}");
        if(me.name) document.getElementById('myProfileName').innerText = me.name;

        const users = Object.keys(db.users || {}).filter(u => u !== "${user}");
        document.getElementById('userList').innerHTML = users.map(u => {
          const isOnline = (Date.now() - db.users[u].lastSeen) < 15000;
          return \`
          <div onclick="selectUser('\${u}')" class="p-4 rounded-[2rem] cursor-pointer flex items-center gap-4 transition-all \${selectedUser === u ? 'bg-blue-600/10 border border-blue-500/30 text-white' : 'hover:bg-white/5'}">
            <div class="avatar">\${getAvatar(db.users[u], u)}</div>
            <div class="flex-1 min-w-0">
               <div class="flex justify-between items-center">
                  <span class="text-sm truncate">\${db.users[u].name || u}</span>
                  \${isOnline ? '<div class="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_green]"></div>' : ''}
               </div>
               <div class="text-[8px] opacity-30 truncate mt-1">\${db.users[u].bio || '...'}</div>
            </div>
          </div>\`;
        }).join('');

        if(selectedUser) {
          const other = db.users[selectedUser];
          const headerAv = document.getElementById('headerAvatar');
          headerAv.innerHTML = getAvatar(other, selectedUser);
          headerAv.classList.remove('hidden');

          const isOnline = (Date.now() - other.lastSeen) < 15000;
          const statusEl = document.getElementById('onlineStatus');
          statusEl.innerText = isOnline ? "● LIVE" : "○ OFFLINE";
          statusEl.className = \`text-[7px] \${isOnline ? 'text-green-500 animate-pulse' : 'text-zinc-600'} italic\`;
          statusEl.classList.remove('hidden');

          const cId = ["${user}", selectedUser].sort().join("_");
          const msgs = (db.privateChats && db.privateChats[cId]) || [];
          document.getElementById('chatBox').innerHTML = msgs.filter(m => !m.deletedBy.includes("${user}")).map(m => \`
            <div class="flex items-end gap-3 \${m.from === "${user}" ? 'flex-row-reverse' : ''} msg-anim">
              <div class="avatar w-6 h-6 text-[8px]">\${getAvatar(db.users[m.from], m.from)}</div>
              <div class="max-w-[75%] p-4 rounded-[1.8rem] shadow-xl \${m.from === "${user}" ? 'bg-blue-600 text-white rounded-br-none shadow-blue-900/20' : 'bg-zinc-900 text-zinc-300 rounded-bl-none'}">
                \${m.file ? \`<img src="\${m.file}" class="rounded-2xl mb-3 max-w-full" />\` : ''}
                <div class="text-[12px] leading-relaxed font-medium not-italic tracking-normal break-words">\${m.text}</div>
                <div class="flex items-center gap-4 mt-3 opacity-30 text-[7px] font-bold">
                  <span>\${m.time}</span>
                  <div class="flex gap-2">
                    \${m.from === "${user}" && !m.isDeleted ? \`<button onclick="editMsg('\${m.id}', '\${m.text}')">EDIT</button>\` : ''}
                    <button onclick="msgMenu('\${m.id}', \${m.from === "${user}"})">VOID</button>
                  </div>
                </div>
              </div>
            </div>\`).join('');
        }
      }

      async function uploadProfilePic(input) {
        if(!input.files[0]) return;
        const fd = new FormData(); fd.append('action', 'update_profile'); fd.append('profile_pic', input.files[0]);
        await fetch('/', { method: 'POST', body: fd }); update();
      }

      function msgMenu(id, isMine) {
        const act = prompt("1: FOR ME\\n" + (isMine ? "2: FOR ALL" : ""));
        if(act === "1") sendAction('delete_for_me', {msgId: id});
        if(act === "2" && isMine) sendAction('delete_for_all', {msgId: id});
      }

      async function sendAction(action, data) {
        const fd = new FormData(); fd.append('action', action); fd.append('to', selectedUser);
        for(let k in data) fd.append(k, data[k]);
        await fetch('/', { method: 'POST', body: fd }); update();
      }

      function editProfile() {
        const n = prompt("NAME:", document.getElementById('myProfileName').innerText);
        const b = prompt("BIO:", "READY");
        if(n) sendAction('update_profile', {display_name: n, bio: b});
      }

      function selectUser(u) { 
        selectedUser = u; document.getElementById('chatName').innerText = u; 
        document.getElementById('inputBar').classList.remove('hidden'); 
        update(); if(window.innerWidth < 1024) toggleSidebar(); 
        setTimeout(() => { const b = document.getElementById('chatBox'); b.scrollTop = b.scrollHeight; }, 300);
      }

      async function sendChat() {
        const i = document.getElementById('msgInput'), f = document.getElementById('fileInput'), btn = document.getElementById('sendBtn');
        if(!i.value && !f.files[0]) return;
        const fd = new FormData(); fd.append('action', 'chat'); fd.append('to', selectedUser); fd.append('message', i.value);
        if(f.files[0]) fd.append('file', f.files[0]);
        i.value = ""; f.value = ""; document.getElementById('prev').classList.add('hidden');
        await fetch('/', { method: 'POST', body: fd }); update();
        setTimeout(() => { const b = document.getElementById('chatBox'); b.scrollTop = b.scrollHeight; }, 300);
      }

      function editMsg(id, old) {
        const n = prompt("NEW TEXT:", old);
        if(n !== null && n !== old) sendAction('edit', {msgId: id, message: n});
      }

      setInterval(update, 5000); update();
    </script>
  </body></html>`;
}

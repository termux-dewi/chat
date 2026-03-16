const CONFIG = {
  driveFileId: "1y4HcX-otBQeT5-dTgUcleOB1BAtkVXML",
  mediaFolderId: "1VgxPBzDVJ_GxPbUXAYLnTSeZbitjYOnY", 
  clientEmail: "dbchat@chat-490410.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDNgJdV7jFyCzHt\nnRLMBKaDNtTXlm9Ab8liUWAf7DFqVOt2bw8+g+ufmLPRrGIpQMlgJmHtE+e9iJJ7\nP0qRHnygmmXjwMK+jVeRk77KJA3aHpM9rGZjltl1TMffGxrWWCcGk+rJ4GWOkvR6\nwnRSmpVjPywRpCcB66LLwTKKSjOySZ6RIOOT4WIWDwM04qk75ueav80WarV+/scx\nh/6GrAJ8HXJijiPhQoFP47nrD8Cb/GQMVoCnIonkDybBATaAemlImSlsfigjMCCO\nj3iU16tMq+AbsFgZ9XefJ0GaIMWjvCnlm4UxZNlTD7qqx9V0vQZzKFnQWXoOsKSD\n48A1QSPvAgMBAAECggEABPRQsbWoY4N5lKzwwxJpoUg1IW1zCS6owEIN+zcKifG6\nK4TJ7Uvo5lQcIbXyN+Rj9nl2auzL7XnZbjc8aPs/LfAK/M6s40MtFUlmlCECZHvQ\nOPBrF4OPgpBzUSGqJ/jAGByA0JUkXaeVVVBS1Zr8dwQS3+oBNr6jkh36RfM8A9RP\neo0cw1P4nv71q1eVp7vfH+6/iN2f7QuyJEdsZhCmjq9+aWxNh/VlVgS0KT+aDDhl\n9MFp/RL+YLstGTeS/NUj2eprjO/+K6SsGlQ7Ln42o3AO3WdmEPuFdub+WcQvbDv9\nfqYDmvJETEMR7A3oeGNxvvS3Q7CGrF7GxsHLB7e7wQKBgQDp+rVMJJqzweC5uDOs\npXH6tJrIK8w3XRIsQCiumad+BgmY0/fDQ0QxmEggxlxJ4XZKSfinssxA+LksdQL5\n1yX4Ug+blTViTDZdol95RQkHvHKrqHJyKM2Ghf17QASn/hrAsZ7SkJDOu6zpZpI+\nk38sC5ZHffZ3SIHCJO4hMzCzJwKBgQDg18hhkieUkndqKtHSklIc4+WXcy4+L5h7\n1ovr4IihFdOCkBeE3lRMklXl83vXUxRUjK0ei9VmxspW6V9rQkLU7HKiCUMVnXts\nPSViB6RUOjy4bQrItze/cyzP80yH3hxFIUWRa2FzLI08/j3uAF1Dp/taMgQBVS25\n8LCiAPfl+QKBgQCIpEo2YnYaHlJgA2viGmia8dgmqDVF68uOHhXkCYXgOiRmpPtf\nhCwSDo2o3k7NMqdDMTnOrcNM+jQh+1+2imf5QestgBDCDCH/wrChAKkKZIpPJztW\n4e9M7Xkf/j354ZK8D77h111J7h5H3AfyFW9CSK4FqFFETgrBV5Hdv6hkJwKBgBS/\n1R4r/rsXSS3jBboJBsrjvSxc1MeoXMoQ4pjB/9ndyccixQjd+6mVV5gBAEy+vgGP\neep3vRne/o1GvCeJ1eEQcQPDFw3HmrxCaFDDo8aiGThr17LuNZbVai1GpqljNfir\nOWBSKIwYcHBQhiaQogq8VdXdB8GXusCOFb7dmAMBAoGBAMi/+6SAbISsMQGjoh1W\nrU0wgC168Ktz0D3E/8JJaVgh9kaFXHhwPz9hb7mzFUtioTaNq/tCFyMcLEEZHnDO\ne9Uym8/pdzzZlrZHj9/RlGe25aMxHOHz/+gNswnruJ0oc9uNQd8wI3c/fuD03umK\n5lykpzsqt9d8bflXTSS5d1CJ\n-----END PRIVATE KEY-----\n"
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const cookie = request.headers.get("Cookie") || "";
    const username = (cookie.match(/user_session=([^;]+)/) || [])[1];

    const getSafeDB = async (token) => {
      try {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${CONFIG.driveFileId}?alt=media`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : { users: {}, privateChats: {} };
      } catch { return { users: {}, privateChats: {} }; }
    };

    if (url.pathname === "/api/data") {
      const token = await getAccessToken();
      const db = await getSafeDB(token);
      return new Response(JSON.stringify(db), { headers: { "Content-Type": "application/json; charset=utf-8" } });
    }

    if (request.method === "POST") {
      const token = await getAccessToken();
      const formData = await request.formData();
      const action = formData.get("action");
      let db = await getSafeDB(token);

      if (action === "register" || action === "login") {
        const user = (formData.get("username") || "").trim().toLowerCase();
        const pass = (formData.get("password") || "").trim();
        if (action === "register") {
          if (db.users[user]) return new Response("User exists", { status: 400 });
          db.users[user] = { name: user, password: pass, lastSeen: Date.now() };
          await updateDriveFile(token, JSON.stringify(db));
        } else if (!db.users[user] || db.users[user].password !== pass) return new Response("Invalid", { status: 401 });
        return new Response("OK", { status: 302, headers: { "Location": "/", "Set-Cookie": `user_session=${user}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400` } });
      }

      if (username) {
        const to = formData.get("to");
        const chatId = [username, to].sort().join("_");
        if (!db.privateChats) db.privateChats = {};
        if (!db.privateChats[chatId]) db.privateChats[chatId] = [];

        if (action === "chat") {
          const msgText = formData.get("message");
          const file = formData.get("file");
          let fileUrl = null, fileType = null;

          if (file && file.size > 0) {
            const upload = await uploadToDrive(token, file);
            fileUrl = `https://lh3.googleusercontent.com/u/0/d/${upload.id}`;
            fileType = file.type.startsWith("video") ? "video" : "image";
          }

          db.privateChats[chatId].push({
            id: "msg_" + Date.now(),
            from: username,
            text: msgText,
            file: fileUrl,
            fileType: fileType,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            deletedBy: [],
            edited: false
          });
        } 
        else if (action === "edit") {
          const msgId = formData.get("msgId");
          const newText = formData.get("message");
          const msg = db.privateChats[chatId].find(m => m.id === msgId);
          if (msg && msg.from === username) {
            msg.text = newText;
            msg.edited = true;
          }
        }
        else if (action === "delete_me") {
          const msgId = formData.get("msgId");
          const msg = db.privateChats[chatId].find(m => m.id === msgId);
          if (msg && !msg.deletedBy.includes(username)) msg.deletedBy.push(username);
        } 
        else if (action === "delete_all") {
          const msgId = formData.get("msgId");
          db.privateChats[chatId] = db.privateChats[chatId].filter(m => m.id !== msgId);
        }

        await updateDriveFile(token, JSON.stringify(db));
        return new Response("OK");
      }
    }

    if (url.pathname === "/logout") return new Response("OK", { status: 302, headers: { "Location": "/", "Set-Cookie": "user_session=; Path=/; Max-Age=0" } });
    if (!username) return new Response(renderAuthPage(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    return new Response(renderMainApp(username), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
};

// --- DRIVE LOGIC ---
async function getAccessToken() {
  const pem = CONFIG.privateKey.replace(/\\n/g, '\n');
  const pemBody = pem.split('-----')[2].replace(/\s/g, '');
  const privateKey = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pemBody), c => c.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000) - 30;
  const payload = btoa(JSON.stringify({ iss: CONFIG.clientEmail, scope: 'https://www.googleapis.com/auth/drive', aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now }));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(`${header}.${payload}`));
  const jwt = `${header}.${payload}.${btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '')}`;
  const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}` });
  return (await res.json()).access_token;
}

async function uploadToDrive(token, file) {
  const meta = { name: `media_${Date.now()}`, parents: [CONFIG.mediaFolderId] };
  const body = new FormData();
  body.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
  body.append('file', file);
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body
  });
  const data = await res.json();
  await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' })
  });
  return data;
}

function updateDriveFile(token, content) {
  return fetch(`https://www.googleapis.com/upload/drive/v3/files/${CONFIG.driveFileId}?uploadType=media`, {
    method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: content
  });
}

// --- HTML COMPONENTS ---
function renderAuthPage() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><script src="https://cdn.tailwindcss.com"></script></head>
  <body class="bg-[#0b0f1a] flex items-center justify-center min-h-screen text-white font-sans p-6">
    <div class="w-full max-w-sm p-10 bg-zinc-900/50 rounded-[2.5rem] border border-zinc-800 text-center shadow-2xl">
      <h1 class="text-5xl font-black text-blue-500 italic mb-10 tracking-tighter">THE HUB</h1>
      <form method="POST">
        <input type="hidden" name="action" id="act" value="login">
        <input name="username" required placeholder="Username" class="w-full p-4 rounded-2xl bg-black mb-4 outline-none border border-zinc-800 focus:border-blue-600 transition-all text-sm">
        <input name="password" type="password" required placeholder="Password" class="w-full p-4 rounded-2xl bg-black mb-8 outline-none border border-zinc-800 focus:border-blue-600 transition-all text-sm">
        <button id="btn" class="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-900/20">Login</button>
        <div class="flex justify-center gap-6 mt-8">
          <button type="button" onclick="document.getElementById('act').value='login'; document.getElementById('btn').innerText='Login'" class="text-[10px] opacity-40 font-black hover:opacity-100 uppercase">Login</button>
          <button type="button" onclick="document.getElementById('act').value='register'; document.getElementById('btn').innerText='Daftar'" class="text-[10px] opacity-40 font-black hover:opacity-100 uppercase">Daftar</button>
        </div>
      </form>
    </div>
  </body></html>`;
}

function renderMainApp(user) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script>
  <style>#sidebar { transition: 0.3s; } .sidebar-closed { transform: translateX(-100%); }</style></head>
  <body class="bg-black text-zinc-300 h-screen flex flex-col font-sans overflow-hidden">
    <div class="flex flex-1 overflow-hidden">
      <div id="sidebar" class="fixed lg:static inset-0 w-80 border-r border-zinc-900 bg-[#0b0f1a] z-50 sidebar-closed lg:transform-none flex flex-col">
        <div class="p-6 border-b border-zinc-900 flex justify-between items-center bg-[#0b0f1a]">
          <div class="text-sm font-black text-blue-500 uppercase italic tracking-widest">${user}</div>
          <button onclick="toggleSidebar()" class="lg:hidden">✕</button>
        </div>
        <div id="userList" class="flex-1 overflow-y-auto p-2"></div>
      </div>
      <div class="flex-1 flex flex-col">
        <div class="p-4 bg-[#0b0f1a] border-b border-zinc-900 flex justify-between items-center">
          <button onclick="toggleSidebar()" class="lg:hidden text-blue-500">☰</button>
          <div id="chatName" class="font-black text-white italic uppercase tracking-tighter">THE HUB</div>
          <a href="/logout" class="text-[10px] font-black opacity-30 hover:opacity-100 hover:text-red-500 transition-all">EXIT</a>
        </div>
        <div id="chatBox" class="flex-1 p-6 overflow-y-auto flex flex-col gap-4"></div>
        <div id="inputBar" class="hidden p-4 bg-zinc-900/50 border-t border-zinc-800">
          <div class="flex items-center gap-2">
            <label class="bg-zinc-800 h-12 w-12 flex items-center justify-center rounded-xl cursor-pointer hover:bg-zinc-700 shrink-0">
              <input type="file" id="fileInput" class="hidden" onchange="previewFile()">
              <span class="text-xl font-bold text-blue-500">+</span>
            </label>
            <input id="msgInput" class="flex-1 bg-black h-12 px-4 rounded-xl outline-none text-sm border border-zinc-800 focus:border-blue-600 transition-all" placeholder="Ketik pesan...">
            <button onclick="sendChat()" class="bg-blue-600 h-12 px-6 rounded-xl font-black text-[10px] text-white uppercase tracking-widest">SEND</button>
          </div>
          <div id="prev" class="text-[10px] text-blue-500 hidden font-bold italic mt-2 ml-14">Media Terpilih...</div>
        </div>
      </div>
    </div>
    <script>
      let selectedUser = "";
      function toggleSidebar() { document.getElementById('sidebar').classList.toggle('sidebar-closed'); }
      function previewFile() { document.getElementById('prev').classList.toggle('hidden', !document.getElementById('fileInput').files.length); }

      async function update() {
        const res = await fetch('/api/data');
        const db = await res.json();
        const users = Object.keys(db.users || {}).filter(u => u !== "${user}");
        document.getElementById('userList').innerHTML = users.map(u => \`
          <div onclick="selectUser('\${u}')" class="p-4 mb-1 rounded-2xl cursor-pointer transition-all \${selectedUser === u ? 'bg-zinc-800 border-l-4 border-blue-500 text-white shadow-xl' : 'hover:bg-zinc-900'}">
            <div class="text-sm font-black uppercase tracking-tighter">\${u}</div>
          </div>\`).join('');

        if(selectedUser) {
          const cId = ["${user}", selectedUser].sort().join("_");
          const msgs = (db.privateChats && db.privateChats[cId]) || [];
          document.getElementById('chatBox').innerHTML = msgs.filter(m => !m.deletedBy.includes("${user}")).map(m => \`
            <div class="flex flex-col \${m.from === "${user}" ? 'items-end' : 'items-start'} group">
              <div class="max-w-[85%] p-4 rounded-2xl shadow-lg \${m.from === "${user}" ? 'bg-blue-600 rounded-tr-none' : 'bg-zinc-800 rounded-tl-none'}">
                \${m.file ? (m.fileType === 'video' ? \`<video src="\${m.file}" controls class="rounded-lg mb-2 max-w-full"></video>\` : \`<img src="\${m.file}" class="rounded-lg mb-2 max-w-full" />\`) : ''}
                <div class="text-sm text-white leading-relaxed">\${m.text}</div>
                <div class="flex items-center gap-3 mt-2">
                  <span class="text-[8px] opacity-40 font-black uppercase">\${m.time} \${m.edited ? '(Edited)' : ''}</span>
                  <div class="hidden group-hover:flex gap-3">
                    <button onclick="delMsg('\${m.id}', 'delete_me')" class="text-[8px] text-zinc-400 uppercase font-black">Me</button>
                    \${m.from === "${user}" ? \`
                      <button onclick="editMsg('\${m.id}', '\${m.text}')" class="text-[8px] text-yellow-400 uppercase font-black">Edit</button>
                      <button onclick="delMsg('\${m.id}', 'delete_all')" class="text-[8px] text-red-500 uppercase font-black">All</button>
                    \` : ''}
                  </div>
                </div>
              </div>
            </div>\`).join('');
        }
      }

      function selectUser(u) { selectedUser = u; document.getElementById('chatName').innerText = u; document.getElementById('inputBar').classList.remove('hidden'); update(); if(window.innerWidth < 1024) toggleSidebar(); }
      
      async function sendChat() {
        const i = document.getElementById('msgInput');
        const f = document.getElementById('fileInput');
        if(!i.value && !f.files[0]) return;
        const fd = new FormData();
        fd.append('action', 'chat'); fd.append('to', selectedUser); fd.append('message', i.value);
        if(f.files[0]) fd.append('file', f.files[0]);
        i.value = ""; f.value = ""; document.getElementById('prev').classList.add('hidden');
        await fetch('/', { method: 'POST', body: fd }); update();
      }

      function editMsg(id, old) {
        const n = prompt("Edit Pesan:", old);
        if(n && n !== old) {
          const fd = new FormData(); fd.append('action', 'edit'); fd.append('to', selectedUser); fd.append('msgId', id); fd.append('message', n);
          fetch('/', { method: 'POST', body: fd }).then(update);
        }
      }

      async function delMsg(id, action) {
        const fd = new FormData(); fd.append('action', action); fd.append('to', selectedUser); fd.append('msgId', id);
        await fetch('/', { method: 'POST', body: fd }); update();
      }
      setInterval(update, 5000); update();
    </script>
  </body></html>`;
}

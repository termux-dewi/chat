const CONFIG = {
  driveFileId: "15T5_dnXWiUF8ldp7F7RaWdHjwpFbrfn7",
  mediaFolderId: "1-9-5J1lLmgNIwVUAKg_FBejE6oikRDyz", 
  clientEmail: "dbchat@chat-490410.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDNgJdV7jFyCzHt\nnRLMBKaDNtTXlm9Ab8liUWAf7DFqVOt2bw8+g+ufmLPRrGIpQMlgJmHtE+e9iJJ7\nP0qRHnygmmXjwMK+jVeRk77KJA3aHpM9rGZjltl1TMffGxrWWCcGk+rJ4GWOkvR6\nwnRSmpVjPywRpCcB66LLwTKKSjOySZ6RIOOT4WIWDwM04qk75ueav80WarV+/scx\nh/6GrAJ8HXJijiPhQoFP47nrD8Cb/GQMVoCnIonkDybBATaAemlImSlsfigjMCCO\nj3iU16tMq+AbsFgZ9XefJ0GaIMWjvCnlm4UxZNlTD7qqx9V0vQZzKFnQWXoOsKSD\n48A1QSPvAgMBAAECggEABPRQsbWoY4N5lKzwwxJpoUg1IW1zCS6owEIN+zcKifG6\nK4TJ7Uvo5lQcIbXyN+Rj9nl2auzL7XnZbjc8aPs/LfAK/M6s40MtFUlmlCECZHvQ\nOPBrF4OPgpBzUSGqJ/jAGByA0JUkXaeVVVBS1Zr8dwQS3+oBNr6jkh36RfM8A9RP\neo0cw1P4nv71q1eVp7vfH+6/iN2f7QuyJEdsZhCmjq9+aWxNh/VlVgS0KT+aDDhl\n9MFp/RL+YLstGTeS/NUj2eprjO/+K6SsGlQ7Ln42o3AO3WdmEPuFdub+WcQvbDv9\nfqYDmvJETEMR7A3oeGNxvvS3Q7CGrF7GxsHLB7e7wQKBgQDp+rVMJJqzweC5uDOs\npXH6tJrIK8w3XRIsQCiumad+BgmY0/fDQ0QxmEggxlxJ4XZKSfinssxA+LksdQL5\n1yX4Ug+blTViTDZdol95RQkHvHKrqHJyKM2Ghf17QASn/hrAsZ7SkJDOu6zpZpI+\nk38sC5ZHffZ3SIHCJO4hMzCzJwKBgQDg18hhkieUkndqKtHSklIc4+WXcy4+L5h7\n1ovr4IihFdOCkBeE3lRMklXl83vXUxRUjK0ei9VmxspW6V9rQkLU7HKiCUMVnXts\nPSViB6RUOjy4bQrItze/cyzP80yH3hxFIUWRa2FzLI08/j3uAF1Dp/taMgQBVS25\n8LCiAPfl+QKBgQCIpEo2YnYaHlJgA2viGmia8dgmqDVF68uOHhXkCYXgOiRmpPtf\nhCwSDo2o3k7NMqdDMTnOrcNM+jQh+1+2imf5QestgBDCDCH/wrChAKkKZIpPJztW\n4e9M7Xkf/j354ZK8D77h111J7h5H3AfyFW9CSK4FqFFETgrBV5Hdv6hkJwKBgBS/\n1R4r/rsXSS3jBboJBsrjvSxc1MeoXMoQ4pjB/9ndyccixQjd+6mVV5gBAEy+vgGP\neep3vRne/o1GvCeJ1eEQcQPDFw3HmrxCaFDDo8aiGThr17LuNZbVai1GpqljNfir\nOWBSKIwYcHBQhiaQogq8VdXdB8GXusCOFb7dmAMBAoGBAMi/+6SAbISsMQGjoh1W\nrU0wgC168Ktz0D3E/8JJaVgh9kaFXHhwPz9hb7mzFUtioTaNq/tCFyMcLEEZHnDO\ne9Uym8/pdzzZlrZHj9/RlGe25aMxHOHz/+gNswnruJ0oc9uNQd8wI3c/fuD03umK\n5lykpzsqt9d8bflXTSS5d1CJ\n-----END PRIVATE KEY-----\n"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cookie = request.headers.get("Cookie") || "";
    const username = (cookie.match(/user_session=([^;]+)/) || [])[1];

    const getSafeDB = async (token) => {
      try {
        const raw = await getDriveFile(token);
        const parsed = JSON.parse(raw || '{"users":{}, "privateChats":{}}');
        if (!parsed.users) parsed.users = {};
        return parsed;
      } catch (e) {
        return { users: {}, privateChats: {} };
      }
    };

    // API: Ambil Data Realtime
    if (url.pathname === "/api/data") {
      const token = await getAccessToken();
      const db = await getSafeDB(token);
      if (username && db.users[username]) {
        db.users[username].lastSeen = Date.now();
        await updateDriveFile(token, JSON.stringify(db));
      }
      return new Response(JSON.stringify(db), { 
        headers: { "Content-Type": "application/json; charset=utf-8" } 
      });
    }

    // Handle POST Actions
    if (request.method === "POST") {
      const token = await getAccessToken();
      const formData = await request.formData();
      const action = formData.get("action");
      let db = await getSafeDB(token);

      // REGISTER & LOGIN
      if (action === "register" || action === "login") {
        const user = (formData.get("username") || "").trim();
        const pass = (formData.get("password") || "").trim();

        if (!user || !pass) return new Response("Input tidak valid", { status: 400 });

        if (action === "register") {
          if (db.users[user]) return new Response("Username sudah dipakai", { status: 400 });
          db.users[user] = { name: user, password: pass, bio: "Available", avatar: "", lastSeen: Date.now() };
          const save = await updateDriveFile(token, JSON.stringify(db));
          if (!save.ok) return new Response("Gagal simpan ke Drive. Pastikan Service Account baru sudah jadi EDITOR file JSON.", { status: 500 });
        } else {
          if (!db.users[user] || db.users[user].password !== pass) {
            return new Response("Username atau Password salah", { status: 401 });
          }
        }
        
        return new Response("OK", { 
          status: 302, 
          headers: { 
            "Location": "/", 
            "Set-Cookie": `user_session=${user}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400` 
          } 
        });
      }

      // CHAT
      if (action === "chat" && username) {
        const to = formData.get("to");
        const msg = formData.get("message");
        if (!to || !msg) return new Response("Pesan kosong", { status: 400 });
        
        const chatId = [username, to].sort().join("_");
        if (!db.privateChats) db.privateChats = {};
        if (!db.privateChats[chatId]) db.privateChats[chatId] = [];
        
        db.privateChats[chatId].push({
          id: Date.now().toString(),
          from: username,
          text: msg,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        });
        
        await updateDriveFile(token, JSON.stringify(db));
        return new Response("OK");
      }
    }

    if (url.pathname === "/logout") {
      return new Response("OK", { status: 302, headers: { "Location": "/", "Set-Cookie": "user_session=; Path=/; Max-Age=0" } });
    }

    // Render Pages
    if (!username) return new Response(renderAuthPage(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    const token = await getAccessToken();
    const db = await getSafeDB(token);
    return new Response(renderMainApp(username, db), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
};

// --- Google Drive Helpers ---
async function getAccessToken() {
  const pem = CONFIG.privateKey.replace(/\\n/g, '\n');
  const privateKey = await crypto.subtle.importKey('pkcs8', str2ab(atob(pem.split('-----')[2].replace(/\s/g, ''))), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(JSON.stringify({ iss: CONFIG.clientEmail, scope: 'https://www.googleapis.com/auth/drive', aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now }));
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(`${header}.${payload}`));
  const jwt = `${header}.${payload}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '')}`;
  const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}` });
  const data = await res.json(); return data.access_token;
}
async function getDriveFile(token) { const res = await fetch(`https://www.googleapis.com/drive/v3/files/${CONFIG.driveFileId}?alt=media`, { headers: { 'Authorization': `Bearer ${token}` } }); return await res.text(); }
async function updateDriveFile(token, content) { return fetch(`https://www.googleapis.com/upload/drive/v3/files/${CONFIG.driveFileId}?uploadType=media`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: content }); }
function str2ab(str) { const buf = new ArrayBuffer(str.length); const bufView = new Uint8Array(buf); for (let i = 0; i < str.length; i++) { bufView[i] = str.charCodeAt(i); } return buf; }

// --- UI Components ---
function renderAuthPage() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>
  <body class="bg-[#0b0f1a] flex items-center justify-center min-h-screen text-white p-6">
    <div class="w-full max-w-sm">
      <div class="text-center mb-10"><h1 class="text-5xl font-black text-blue-500 italic italic">THE HUB</h1></div>
      <div class="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl backdrop-blur-md">
        <div class="flex gap-4 mb-8">
          <button id="tabL" onclick="setTab('login')" class="flex-1 py-2 border-b-2 border-blue-500 font-black text-xs uppercase">Login</button>
          <button id="tabR" onclick="setTab('register')" class="flex-1 py-2 border-b-2 border-transparent text-zinc-600 font-black text-xs uppercase">Daftar</button>
        </div>
        <form method="POST">
          <input type="hidden" name="action" id="act" value="login">
          <input name="username" required placeholder="Username" class="w-full p-4 rounded-2xl bg-zinc-800 border border-zinc-700 mb-4 outline-none text-sm text-white focus:border-blue-600">
          <input name="password" type="password" required placeholder="Password" class="w-full p-4 rounded-2xl bg-zinc-800 border border-zinc-700 mb-6 outline-none text-sm text-white focus:border-blue-600">
          <button id="btn" class="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 active:scale-95 transition-all">Masuk</button>
        </form>
      </div>
    </div>
    <script>
      function setTab(t) {
        document.getElementById('act').value = t;
        document.getElementById('btn').innerText = t === 'login' ? 'Masuk' : 'Buat Akun';
        document.getElementById('tabL').className = t === 'login' ? 'flex-1 py-2 border-b-2 border-blue-500 font-black text-xs uppercase' : 'flex-1 py-2 border-b-2 border-transparent text-zinc-600 font-black text-xs uppercase';
        document.getElementById('tabR').className = t === 'register' ? 'flex-1 py-2 border-b-2 border-blue-500 font-black text-xs uppercase' : 'flex-1 py-2 border-b-2 border-transparent text-zinc-600 font-black text-xs uppercase';
      }
    </script>
  </body></html>`;
}

function renderMainApp(currentUser, db) {
  const myData = db.users[currentUser] || { name: currentUser, bio: "", avatar: "" };
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"><script src="https://cdn.tailwindcss.com"></script>
  <style>
    #sidebar { transition: transform 0.3s ease; }
    .sidebar-closed { transform: translateX(-100%); }
    @media (min-width: 1024px) { .sidebar-closed { transform: translateX(0); } }
  </style></head>
  <body class="bg-black text-zinc-300 h-screen flex flex-col overflow-hidden font-sans">
    <div class="flex flex-1 overflow-hidden">
      <div id="sidebar" class="fixed lg:static inset-0 w-full lg:w-96 border-r border-zinc-900 bg-[#0b0f1a] z-50 sidebar-closed">
        <div class="p-6 border-b border-zinc-900 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <img src="${myData.avatar || 'https://ui-avatars.com/api/?name='+currentUser}" class="w-10 h-10 rounded-full border-2 border-blue-600 object-cover">
            <div><div class="text-sm font-black text-white leading-none">${currentUser}</div></div>
          </div>
          <button onclick="toggleSidebar()" class="lg:hidden text-zinc-500 text-2xl">✕</button>
        </div>
        <div id="userList" class="p-2 space-y-1 overflow-y-auto h-full pb-32"></div>
      </div>

      <div class="flex-1 flex flex-col bg-black relative">
        <div class="p-4 bg-[#0b0f1a] border-b border-zinc-900 flex items-center gap-4">
          <button onclick="toggleSidebar()" class="text-blue-500"><svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"/></svg></button>
          <div id="activeChatName" class="font-black text-white italic text-xs uppercase tracking-widest">THE HUB</div>
          <div class="ml-auto"><a href="/logout" class="text-[10px] font-black opacity-30 hover:opacity-100">EXIT</a></div>
        </div>
        <div id="chatBox" class="flex-1 p-6 overflow-y-auto flex flex-col gap-4 text-sm"></div>
        <div id="inputBar" class="hidden p-4 bg-[#0b0f1a] border-t border-zinc-900">
          <div class="flex items-center gap-3 bg-zinc-900 p-2 rounded-3xl border border-zinc-800">
            <input id="msgInput" autocomplete="off" placeholder="Ketik..." class="flex-1 bg-transparent p-2 outline-none text-white text-sm">
            <button onclick="sendChat()" class="bg-blue-600 text-white px-6 py-2 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-600/20 active:scale-95 transition-all">Send</button>
          </div>
        </div>
      </div>
    </div>

    <script>
      let selectedUser = "", isFirst = true;
      const currentUser = "${currentUser}";

      function toggleSidebar() { document.getElementById('sidebar').classList.toggle('sidebar-closed'); }

      async function update() {
        const res = await fetch('/api/data');
        const db = await res.json();
        const now = Date.now();
        const users = Object.keys(db.users || {}).filter(u => u !== currentUser);
        
        document.getElementById('userList').innerHTML = users.map(u => {
          const uInfo = db.users[u];
          const isOnline = uInfo.lastSeen && (now - uInfo.lastSeen < 12000);
          return \`
            <div onclick="selectUser('\${u}')" class="p-4 flex items-center gap-4 hover:bg-zinc-900 rounded-3xl cursor-pointer \${selectedUser === u ? 'bg-zinc-800' : ''}">
              <div class="relative">
                <img src="\${uInfo.avatar || 'https://ui-avatars.com/api/?name='+u}" class="w-10 h-10 rounded-full border-2 \${isOnline ? 'border-green-500' : 'border-zinc-800'} object-cover">
              </div>
              <div class="text-sm font-bold \${isOnline ? 'text-white' : 'text-zinc-500'}">\${u}</div>
            </div>\`;
        }).join('');

        if (selectedUser) {
          const chatId = [currentUser, selectedUser].sort().join("_");
          const msgs = (db.privateChats && db.privateChats[chatId]) || [];
          const box = document.getElementById('chatBox');
          box.innerHTML = msgs.map(m => \`
            <div class="flex flex-col \${m.from === currentUser ? 'items-end' : 'items-start'}">
              <div class="max-w-[85%] p-4 rounded-2xl \${m.from === currentUser ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-zinc-800'}">
                <div class="text-sm">\${m.text}</div>
                <div class="text-[8px] opacity-40 mt-1 font-black uppercase text-right">\${m.time}</div>
              </div>
            </div>\`).join('');
          if(isFirst) { box.scrollTop = box.scrollHeight; isFirst = false; }
        }
      }

      async function sendChat() {
        const i = document.getElementById('msgInput'); if(!i.value.trim()) return;
        const fd = new FormData(); fd.append('action', 'chat'); fd.append('to', selectedUser); fd.append('message', i.value);
        i.value = ""; await fetch('/', { method: 'POST', body: fd }); update();
      }

      function selectUser(u) { 
        selectedUser = u; 
        document.getElementById('activeChatName').innerText = u; 
        document.getElementById('inputBar').classList.remove('hidden'); 
        if(window.innerWidth < 1024) toggleSidebar(); 
        isFirst = true; 
        update(); 
      }

      setInterval(update, 4000); update();
    </script>
  </body></html>`;
      }

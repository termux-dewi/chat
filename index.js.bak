const CONFIG = {
  driveFileId: "1y4HcX-otBQeT5-dTgUcleOB1BAtkVXML",
  mediaFolderId: "1VgxPBzDVJ_GxPbUXAYLnTSeZbitjYOnY", 
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
        const response = await getDriveFile(token);
        if (!response.ok) return { users: {}, privateChats: {} };
        const raw = await response.text();
        return JSON.parse(raw || '{"users":{}, "privateChats":{}}');
      } catch (e) {
        return { users: {}, privateChats: {} };
      }
    };

    // EndPoint API Data
    if (url.pathname === "/api/data") {
      const token = await getAccessToken();
      const db = await getSafeDB(token);
      if (username && db.users && db.users[username]) {
        db.users[username].lastSeen = Date.now();
        await updateDriveFile(token, JSON.stringify(db));
      }
      return new Response(JSON.stringify(db), { headers: { "Content-Type": "application/json; charset=utf-8" } });
    }

    // Handle POST (Register, Login, Chat)
    if (request.method === "POST") {
      const token = await getAccessToken();
      const formData = await request.formData();
      const action = formData.get("action");
      let db = await getSafeDB(token);

      if (action === "register" || action === "login") {
        const user = (formData.get("username") || "").trim().toLowerCase();
        const pass = (formData.get("password") || "").trim();

        if (action === "register") {
          if (db.users[user]) return new Response("Username sudah terdaftar", { status: 400 });
          db.users[user] = { name: user, password: pass, bio: "Available", avatar: "", lastSeen: Date.now() };
          
          const saveRes = await updateDriveFile(token, JSON.stringify(db));
          if (!saveRes.ok) {
            const err = await saveRes.text();
            return new Response("GAGAL SIMPAN: " + err, { status: 500 });
          }
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

      if (action === "chat" && username) {
        const to = formData.get("to");
        const msg = formData.get("message");
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

    if (!username) return new Response(renderAuthPage(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    const token = await getAccessToken();
    const db = await getSafeDB(token);
    return new Response(renderMainApp(username, db), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
};

// --- Google Auth & Drive Engine ---
async function getAccessToken() {
  const pem = CONFIG.privateKey.replace(/\\n/g, '\n');
  const privateKey = await crypto.subtle.importKey('pkcs8', str2ab(atob(pem.split('-----')[2].replace(/\s/g, ''))), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(JSON.stringify({ iss: CONFIG.clientEmail, scope: 'https://www.googleapis.com/auth/drive', aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now }));
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(`${header}.${payload}`));
  const jwt = `${header}.${payload}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '')}`;
  const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}` });
  const data = await res.json(); 
  return data.access_token;
}

function getDriveFile(token) {
  return fetch(`https://www.googleapis.com/drive/v3/files/${CONFIG.driveFileId}?alt=media`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
}

function updateDriveFile(token, content) {
  // Gunakan uploadType=media dengan metode PATCH untuk efisiensi JSON
  return fetch(`https://www.googleapis.com/upload/drive/v3/files/${CONFIG.driveFileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: content
  });
}

function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) { bufView[i] = str.charCodeAt(i); }
  return buf;
}

// --- UI COMPONENTS ---
function renderAuthPage() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>
  <body class="bg-[#0b0f1a] flex items-center justify-center min-h-screen text-white p-6 font-sans">
    <div class="w-full max-w-sm">
      <div class="text-center mb-10"><h1 class="text-5xl font-black text-blue-500 italic tracking-tighter mb-2">THE HUB</h1></div>
      <div class="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl backdrop-blur-md">
        <div class="flex gap-4 mb-8">
          <button id="tabL" onclick="setTab('login')" class="flex-1 py-2 border-b-2 border-blue-500 font-black text-xs uppercase">Login</button>
          <button id="tabR" onclick="setTab('register')" class="flex-1 py-2 border-b-2 border-transparent text-zinc-600 font-black text-xs uppercase">Daftar</button>
        </div>
        <form method="POST" onsubmit="handleSubmit(event)">
          <input type="hidden" name="action" id="act" value="login">
          <input name="username" required placeholder="Username" class="w-full p-4 rounded-2xl bg-zinc-800 border border-zinc-700 mb-4 outline-none focus:border-blue-600 text-sm">
          <input name="password" type="password" required placeholder="Password" class="w-full p-4 rounded-2xl bg-zinc-800 border border-zinc-700 mb-6 outline-none focus:border-blue-600 text-sm">
          <div id="errorMsg" class="text-red-500 text-[10px] mb-4 hidden"></div>
          <button id="btn" class="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-xs hover:bg-blue-700 transition-all">Masuk</button>
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
      async function handleSubmit(e) {
        e.preventDefault();
        const btn = document.getElementById('btn');
        const err = document.getElementById('errorMsg');
        btn.disabled = true; btn.innerText = 'WAIT...';
        const res = await fetch('/', { method: 'POST', body: new FormData(e.target) });
        if(res.ok) { window.location.reload(); }
        else { err.innerText = await res.text(); err.classList.remove('hidden'); btn.disabled = false; btn.innerText = 'ULANGI'; }
      }
    </script>
  </body></html>`;
}

function renderMainApp(currentUser, db) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script>
  <style>#sidebar { transition: transform 0.3s; } .sidebar-closed { transform: translateX(-100%); }</style></head>
  <body class="bg-black text-zinc-300 h-screen flex flex-col overflow-hidden font-sans">
    <div class="flex flex-1 overflow-hidden">
      <div id="sidebar" class="fixed lg:static inset-0 w-full lg:w-80 border-r border-zinc-900 bg-[#0b0f1a] z-50 sidebar-closed lg:transform-none">
        <div class="p-6 border-b border-zinc-900 flex justify-between items-center">
          <div class="text-sm font-black text-white uppercase tracking-widest">${currentUser}</div>
          <button onclick="toggleSidebar()" class="lg:hidden">✕</button>
        </div>
        <div id="userList" class="p-2 space-y-1 overflow-y-auto h-full"></div>
      </div>
      <div class="flex-1 flex flex-col bg-black">
        <div class="p-4 bg-[#0b0f1a] border-b border-zinc-900 flex items-center gap-4">
          <button onclick="toggleSidebar()" class="lg:hidden text-blue-500">☰</button>
          <div id="chatName" class="font-black text-white italic">THE HUB</div>
          <a href="/logout" class="ml-auto text-[10px] opacity-30">LOGOUT</a>
        </div>
        <div id="chatBox" class="flex-1 p-6 overflow-y-auto flex flex-col gap-4"></div>
        <div id="inputBar" class="hidden p-4 bg-zinc-900/50 border-t border-zinc-800">
          <div class="flex gap-2">
            <input id="msgInput" placeholder="Ketik..." class="flex-1 bg-black p-3 rounded-xl outline-none text-sm">
            <button onclick="sendChat()" class="bg-blue-600 px-6 rounded-xl font-bold text-xs">SEND</button>
          </div>
        </div>
      </div>
    </div>
    <script>
      let selectedUser = "";
      function toggleSidebar() { document.getElementById('sidebar').classList.toggle('sidebar-closed'); }
      async function update() {
        const res = await fetch('/api/data');
        const db = await res.json();
        const users = Object.keys(db.users || {}).filter(u => u !== "${currentUser}");
        document.getElementById('userList').innerHTML = users.map(u => \`
          <div onclick="selectUser('\${u}')" class="p-4 rounded-2xl cursor-pointer \${selectedUser === u ? 'bg-zinc-800' : 'hover:bg-zinc-900'}">
            <div class="text-sm font-bold">\${u}</div>
          </div>\`).join('');
        if(selectedUser) {
          const cId = ["${currentUser}", selectedUser].sort().join("_");
          const msgs = (db.privateChats && db.privateChats[cId]) || [];
          document.getElementById('chatBox').innerHTML = msgs.map(m => \`
            <div class="flex flex-col \${m.from === "${currentUser}" ? 'items-end' : 'items-start'}">
              <div class="max-w-[80%] p-3 rounded-2xl \${m.from === "${currentUser}" ? 'bg-blue-600 text-white' : 'bg-zinc-800'}">
                <div class="text-sm">\${m.text}</div>
              </div>
            </div>\`).join('');
        }
      }
      function selectUser(u) { selectedUser = u; document.getElementById('chatName').innerText = u; document.getElementById('inputBar').classList.remove('hidden'); if(window.innerWidth < 1024) toggleSidebar(); update(); }
      async function sendChat() {
        const i = document.getElementById('msgInput'); if(!i.value) return;
        const fd = new FormData(); fd.append('action', 'chat'); fd.append('to', selectedUser); fd.append('message', i.value);
        i.value = ""; await fetch('/', { method: 'POST', body: fd }); update();
      }
      setInterval(update, 5000); update();
    </script>
  </body></html>`;
        }

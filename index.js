const CONFIG = {
  driveFileId: "15T5_dnXWiUF8ldp7F7RaWdHjwpFbrfn7",
  mediaFolderId: "1-9-5J1lLmgNIwVUAKg_FBejE6oikRDyz", 
  clientEmail: "datasabe@database-490402.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDUmMjmsxTWcmyC\nALQtKLjF2KBN1A3wbx6PwxwhGS9Lo9VmfUy+Py7xhbWwxItcSUt/HJg/UGXvHe7L\nuhwUEXvCOXJCTfGDUEm7AEtrJn2UYbo70gjkymrSkotTbANuL0rzTAJzjFq3IEST\nq2cQ6I40DQSUSKwLEhIW2y9IR+9+EQ9/3YUyNFINFx1femQNxE+vRFzxLr0oiN/p\nicP4mcpOfwVLqnn4q3ArsMKcSKtkgNjhzUYNUIKdx/JoBgx9iCC4t4FhKvUQ6Smj\nwQnJiixb39Ga8ATTqiUhQotuugO/tjNhb4+ILWZvjGkLKlP/x8AGrBsacCTU1S87\nH26Jeq+tAgMBAAECggEARjW093eB9LZyPlbUKivOJcy+WCWletd/vNOfORETrQPM\nyJ2t2BCOxMW3NMscCRzNmYuMfjBjkZ4NjGuItVn2yLRnFx2dmpPL3b2hqp/aDkRe\nGD5roH922tb5u1GrKlrlAkeCcb2TAfJeo3QSRCPBPtBjyELdyoQrxC+bxF+5aKTI\nfj9g/2PN1tDWB6i+TAS/g/TWqxAiKB0keAt3hnZ2C3cam6W4sLCRp4drSVSLrvax\n7WrR3iRAvQd0Vn2VZB/y15TnB3UKOPGDBBNKJ8yP09YogxXTpefEsNmFaG/rbOEf\nmLbCmTffVcB5iOmI9C0dOg0g1XW1JJSQPWD0wPkEgwKBgQDz/q7r4URRAIm2OHD2\nqUHhNBzyqEkTYH/bTuIUTwdjyoaLfs8swv7mHFg/cV6xLYOZp1DXayYJUDCxmYVo\nlNFvWyI2yrTFvK5Lk+rLUWSlR/jxqVsiTZgikubWNpe15r0zRXbroVaZA550VWDx\n5zh7dOHU3B3NU0u7G5cms6nUIwKBgQDfDp4CmCOBrW3jk9h3N/bv8T8rmOwJMfgu\B5L/hSpU2GW39yNRiKsQCO8gdbLdUZ2WzUflA8f+vNlTe9feE6tF9HDfHS6fh6lP\n6VtQA+FhAqsoJqNcD1Xs50prDVYYQdJYwaFkmrDH1NWm3YEdkVc9VzIetQuGs826\nJVNlWliB7wKBgQDewzV8kexHcBBK13j7GkjVjTioqtAc6suQtJJgLE744ty32wzX\ Nyh1eodvVNg5Nu6hiEqcgmz1r8rlOt68PrJ/0lqIX8VvivYudlu1SRh0diNor1BP\nHzy4xBoQlUMphgJTHyaVtnVTuiQe3hxmfs3omSvdpSFoZpYLvALiCMIStQKBgQCb\nMNNU4L8LcTucc/fOcpyXMlUOIzZN63tNoy1uJBtgrrKOvR7QknLaFC0ze1A31Zn8\nGtUjjG7wWDoocGivdSXb5QdG5EnU6pEtLSG/2QNM+ItWwxMzcOQKkJ1hQAUfmWQd\nJpMAqPPIBNelYkV76ew1nF4dqT7cuGqxUVjlkmcz9wKBgFNoTVJd0q74F1UDWe9c\n4xSA+9HVaNkZmv083rT7Eo541Zi59YlULWc/TxIRtU4vZk/cNpuCLMvhreQLZrXb\n98NFWbbO7TVIEonjuJdYLyd3l+6l6NzNHznOH8oMQqSVJDukp6dWRZm57sj/BMac\nRdT/4DRIXtKqHIEK4awVztJz\n-----END PRIVATE KEY-----\n"
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

    if (url.pathname === "/api/data") {
      const token = await getAccessToken();
      const db = await getSafeDB(token);
      if (username && db.users[username]) {
        db.users[username].lastSeen = Date.now();
        await updateDriveFile(token, JSON.stringify(db, null, 2));
      }
      return new Response(JSON.stringify(db), { headers: { "Content-Type": "application/json; charset=utf-8" } });
    }

    if (request.method === "POST") {
      const token = await getAccessToken();
      const formData = await request.formData();
      const action = formData.get("action");
      let db = await getSafeDB(token);

      if (action === "register" || action === "login") {
        const user = (formData.get("username") || "").trim();
        const pass = (formData.get("password") || "").trim();

        if (!user || !pass) return new Response("Username & Password wajib diisi", { status: 400 });

        if (action === "register") {
          if (db.users[user]) return new Response("User sudah terdaftar", { status: 400 });
          
          db.users[user] = { 
            name: user, 
            password: pass, // Simpan password
            bio: "Available", 
            avatar: "", 
            lastSeen: Date.now() 
          };
          
          const saveStatus = await updateDriveFile(token, JSON.stringify(db, null, 2));
          if (!saveStatus.ok) return new Response("Gagal simpan ke database Drive", { status: 500 });
        } else {
          // Logika Login dengan Password
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

      // Logika chat (tetap sama)
      if (action === "chat" && username) {
        const to = formData.get("to");
        const cId = [username, to].sort().join("_");
        if (!db.privateChats) db.privateChats = {};
        if (!db.privateChats[cId]) db.privateChats[cId] = [];
        db.privateChats[cId].push({
          id: Date.now().toString(), from: username, text: formData.get("message") || "",
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        });
        await updateDriveFile(token, JSON.stringify(db, null, 2));
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
        <form method="POST"><input type="hidden" name="action" id="act" value="login">
          <input name="username" required placeholder="Username" class="w-full p-4 rounded-2xl bg-zinc-800 border border-zinc-700 mb-4 outline-none focus:border-blue-600 text-sm">
          <input name="password" type="password" required placeholder="Password" class="w-full p-4 rounded-2xl bg-zinc-800 border border-zinc-700 mb-6 outline-none focus:border-blue-600 text-sm">
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
    </script>
  </body></html>`;
}

function renderMainApp(currentUser, db) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>
  <body class="bg-black text-zinc-300 h-screen flex flex-col font-sans">
    <div class="p-4 bg-[#0b0f1a] border-b border-zinc-900 flex justify-between items-center">
      <div class="font-black text-white italic">THE HUB</div>
      <div class="flex items-center gap-4">
        <span class="text-xs font-bold text-blue-500">${currentUser}</span>
        <a href="/logout" class="text-[10px] font-black opacity-30">LOGOUT</a>
      </div>
    </div>
    <div class="flex-1 flex overflow-hidden">
      <div class="w-1/3 border-r border-zinc-900 overflow-y-auto p-2" id="userList"></div>
      <div class="flex-1 flex flex-col">
        <div id="chatBox" class="flex-1 p-4 overflow-y-auto flex flex-col gap-3"></div>
        <div id="inputArea" class="hidden p-4 bg-zinc-900 border-t border-zinc-800">
           <div class="flex gap-2">
             <input id="msgInput" class="flex-1 bg-black p-3 rounded-xl outline-none text-sm" placeholder="Ketik pesan...">
             <button onclick="sendChat()" class="bg-blue-600 px-6 rounded-xl font-bold text-xs">KIRIM</button>
           </div>
        </div>
      </div>
    </div>
    <script>
      let selectedUser = "";
      async function update() {
        const res = await fetch('/api/data');
        const db = await res.json();
        const users = Object.keys(db.users).filter(u => u !== "${currentUser}");
        document.getElementById('userList').innerHTML = users.map(u => \`
          <div onclick="selectUser('\${u}')" class="p-3 mb-1 rounded-xl cursor-pointer \${selectedUser === u ? 'bg-zinc-800' : 'hover:bg-zinc-900'}">
            <div class="text-sm font-bold">\${u}</div>
          </div>\`).join('');
        
        if(selectedUser) {
          const cId = ["${currentUser}", selectedUser].sort().join("_");
          const msgs = db.privateChats[cId] || [];
          document.getElementById('chatBox').innerHTML = msgs.map(m => \`
            <div class="flex flex-col \${m.from === "${currentUser}" ? 'items-end' : 'items-start'}">
              <div class="max-w-[80%] p-2 rounded-lg \${m.from === "${currentUser}" ? 'bg-blue-600' : 'bg-zinc-800'}">
                <div class="text-sm">\${m.text}</div>
              </div>
            </div>\`).join('');
        }
      }
      function selectUser(u) { selectedUser = u; document.getElementById('inputArea').classList.remove('hidden'); update(); }
      async function sendChat() {
        const i = document.getElementById('msgInput'); if(!i.value) return;
        const fd = new FormData(); fd.append('action', 'chat'); fd.append('to', selectedUser); fd.append('message', i.value);
        i.value = ""; await fetch('/', { method: 'POST', body: fd }); update();
      }
      setInterval(update, 5000); update();
    </script>
  </body></html>`;
                            }

const CONFIG = {
  driveFileId: "1y4HcX-otBQeT5-dTgUcleOB1BAtkVXML",
  clientEmail: "dbchat@chat-490410.iam.gserviceaccount.com",
  // Gunakan template literal agar private key tidak rusak formatnya
  privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDNgJdV7jFyCzHt
nRLMBKaDNtTXlm9Ab8liUWAf7DFqVOt2bw8+g+ufmLPRrGIpQMlgJmHtE+e9iJJ7
P0qRHnygmmXjwMK+jVeRk77KJA3aHpM9rGZjltl1TMffGxrWWCcGk+rJ4GWOkvR6
wnRSmpVjPywRpCcB66LLwTKKSjOySZ6RIOOT4WIWDwM04qk75ueav80WarV+/scx
h/6GrAJ8HXJijiPhQoFP47nrD8Cb/GQMVoCnIonkDybBATaAemlImSlsfigjMCCO
j3iU16tMq+AbsFgZ9XefJ0GaIMWjvCnlm4UxZNlTD7qqx9V0vQZzKFnQWXoOsKSD
48A1QSPvAgMBAAECggEABPRQsbWoY4N5lKzwwxJpoUg1IW1zCS6owEIN+zcKifG6
K4TJ7Uvo5lQcIbXyN+Rj9nl2auzL7XnZbjc8aPs/LfAK/M6s40MtFUlmlCECZHvQ
OPBrF4OPgpBzUSGqJ/jAGByA0JUkXaeVVVBS1Zr8dwQS3+oBNr6jkh36RfM8A9RP
neo0cw1P4nv71q1eVp7vfH+6/iN2f7QuyJEdsZhCmjq9+aWxNh/VlVgS0KT+aDDhl
9MFp/RL+YLstGTeS/NUj2eprjO/+K6SsGlQ7Ln42o3AO3WdmEPuFdub+WcQvbDv9
fqYDmvJETEMR7A3oeGNxvvS3Q7CGrF7GxsHLB7e7wQKBgQDp+rVMJJqzweC5uDOs
pxH6tJrIK8w3XRIsQCiumad+BgmY0/fDQ0QxmEggxlxJ4XZKSfinssxA+LksdQL5
1yX4Ug+blTViTDZdol95RQkHvHKrqHJyKM2Ghf17QASn/hrAsZ7SkJDOu6zpZpI+
k38sC5ZHffZ3SIHCJO4hMzCzJwKBgQDg18hhkieUkndqKtHSklIc4+WXcy4+L5h7
1ovr4IihFdOCkBeE3lRMklXl83vXUxRUjK0ei9VmxspW6V9rQkLU7HKiCUMVnXts
PSViB6RUOjy4bQrItze/cyzP80yH3hxFIUWRa2FzLI08/j3uAF1Dp/taMgQBVS25
8LCiAPfl+QKBgQCIpEo2YnYaHlJgA2viGmia8dgmqDVF68uOHhXkCYXgOiRmpPtf
hCwSDo2o3k7NMqdDMTnOrcNM+jQh+1+2imf5QestgBDCDCH/wrChAKkKZIpPJztW
4e9M7Xkf/j354ZK8D77h111J7h5H3AfyFW9CSK4FqFFETgrBV5Hdv6hkJwKBgBS/
1R4r/rsXSS3jBboJBsrjvSxc1MeoXMoQ4pjB/9ndyccixQjd+6mVV5gBAEy+vgGP
eep3vRne/o1GvCeJ1eEQcQPDFw3HmrxCaFDDo8aiGThr17LuNZbVai1GpqljNfir
OWBSKIwYcHBQhiaQogq8VdXdB8GXusCOFb7dmAMBAoGBAMi/+6SAbISsMQGjoh1W
nrU0wgC168Ktz0D3E/8JJaVgh9kaFXHhwPz9hb7mzFUtioTaNq/tCFyMcLEEZHnDO
ne9Uym8/pdzzZlrZHj9/RlGe25aMxHOHz/+gNswnruJ0oc9uNQd8wI3c/fuD03umK
5lykpzsqt9d8bflXTSS5d1CJ
-----END PRIVATE KEY-----`
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const cookie = request.headers.get("Cookie") || "";
    const username = (cookie.match(/user_session=([^;]+)/) || [])[1];

    // Fungsi pembantu untuk ambil database
    const getSafeDB = async (token) => {
      try {
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${CONFIG.driveFileId}?alt=media`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return { users: {}, privateChats: {} };
        return await res.json();
      } catch (e) {
        return { users: {}, privateChats: {} };
      }
    };

    // API untuk data realtime
    if (url.pathname === "/api/data") {
      const token = await getAccessToken();
      const db = await getSafeDB(token);
      return new Response(JSON.stringify(db), { headers: { "Content-Type": "application/json; charset=utf-8" } });
    }

    // Proses Form (Login, Register, Chat)
    if (request.method === "POST") {
      try {
        const token = await getAccessToken();
        const formData = await request.formData();
        const action = formData.get("action");
        let db = await getSafeDB(token);

        if (action === "register" || action === "login") {
          const user = (formData.get("username") || "").trim().toLowerCase();
          const pass = (formData.get("password") || "").trim();

          if (action === "register") {
            if (db.users[user]) return new Response("Username sudah ada", { status: 400 });
            db.users[user] = { name: user, password: pass, lastSeen: Date.now() };
            
            const saveRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${CONFIG.driveFileId}?uploadType=media`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(db)
            });
            if (!saveRes.ok) return new Response("Gagal simpan ke Drive: " + await saveRes.text(), { status: 500 });
          } else {
            if (!db.users[user] || db.users[user].password !== pass) return new Response("Salah Password", { status: 401 });
          }

          return new Response("OK", { 
            status: 302, 
            headers: { "Location": "/", "Set-Cookie": `user_session=${user}; Path=/; HttpOnly; Max-Age=86400` } 
          });
        }

        if (action === "chat" && username) {
          const to = formData.get("to");
          const msg = formData.get("message");
          const chatId = [username, to].sort().join("_");
          if (!db.privateChats) db.privateChats = {};
          if (!db.privateChats[chatId]) db.privateChats[chatId] = [];
          db.privateChats[chatId].push({ from: username, text: msg, time: new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) });
          
          await fetch(`https://www.googleapis.com/upload/drive/v3/files/${CONFIG.driveFileId}?uploadType=media`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(db)
          });
          return new Response("OK");
        }
      } catch (e) {
        return new Response("Auth Error: " + e.message, { status: 500 });
      }
    }

    if (url.pathname === "/logout") {
      return new Response("OK", { status: 302, headers: { "Location": "/", "Set-Cookie": "user_session=; Path=/; Max-Age=0" } });
    }

    if (!username) return new Response(renderAuthPage(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    return new Response(renderMainApp(username), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
};

// --- AUTH ENGINE FIXED (Mencegah Error 401) ---
async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000) - 30; 
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" })).replace(/=/g, "");
  const payload = btoa(JSON.stringify({
    iss: CONFIG.clientEmail,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  })).replace(/=/g, "");

  const msg = new TextEncoder().encode(`${header}.${payload}`);
  const pem = CONFIG.privateKey.split("-----BEGIN PRIVATE KEY-----")[1].split("-----END PRIVATE KEY-----")[0].replace(/\s/g, "");
  const keyBuffer = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  
  const privateKey = await crypto.subtle.importKey("pkcs8", keyBuffer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, msg);
  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${header}.${payload}.${sigBase64}`
  });

  const data = await res.json();
  if (!data.access_token) throw new Error(JSON.stringify(data));
  return data.access_token;
}

// --- UI COMPONENTS ---
function renderAuthPage() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>
  <body class="bg-[#0b0f1a] flex items-center justify-center min-h-screen text-white font-sans p-6">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8"><h1 class="text-4xl font-black text-blue-500 italic">THE HUB</h1></div>
      <div class="bg-zinc-900/50 p-8 rounded-[2rem] border border-zinc-800 backdrop-blur-md">
        <form method="POST" id="authForm">
          <input type="hidden" name="action" id="act" value="login">
          <input name="username" required placeholder="Username" class="w-full p-4 rounded-xl bg-black border border-zinc-800 mb-4 outline-none focus:border-blue-600 text-sm">
          <input name="password" type="password" required placeholder="Password" class="w-full p-4 rounded-xl bg-black border border-zinc-800 mb-6 outline-none focus:border-blue-600 text-sm">
          <button id="btn" class="w-full bg-blue-600 py-4 rounded-xl font-bold uppercase text-xs tracking-widest">Login</button>
          <div class="flex justify-between mt-6 px-2">
             <button type="button" onclick="setMode('login')" id="mL" class="text-[10px] font-bold text-blue-500 border-b border-blue-500">MASUK</button>
             <button type="button" onclick="setMode('register')" id="mR" class="text-[10px] font-bold text-zinc-600">DAFTAR AKUN</button>
          </div>
        </form>
      </div>
    </div>
    <script>
      function setMode(m) {
        document.getElementById('act').value = m;
        document.getElementById('btn').innerText = m === 'login' ? 'LOGIN' : 'BUAT AKUN';
        document.getElementById('mL').className = m === 'login' ? 'text-[10px] font-bold text-blue-500 border-b border-blue-500' : 'text-[10px] font-bold text-zinc-600';
        document.getElementById('mR').className = m === 'register' ? 'text-[10px] font-bold text-blue-500 border-b border-blue-500' : 'text-[10px] font-bold text-zinc-600';
      }
    </script>
  </body></html>`;
}

function renderMainApp(user) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>
  <body class="bg-black text-zinc-300 h-screen flex flex-col font-sans">
    <div class="p-4 bg-[#0b0f1a] border-b border-zinc-900 flex justify-between items-center">
      <div class="font-black text-white italic">THE HUB</div>
      <div class="flex items-center gap-4">
        <span class="text-xs font-bold text-blue-500 underline uppercase tracking-widest">${user}</span>
        <a href="/logout" class="text-[10px] font-black opacity-30 hover:opacity-100 transition-all">EXIT</a>
      </div>
    </div>
    <div class="flex-1 flex overflow-hidden">
      <div class="w-1/3 border-r border-zinc-900 overflow-y-auto p-2" id="userList"></div>
      <div class="flex-1 flex flex-col">
        <div id="chatBox" class="flex-1 p-6 overflow-y-auto flex flex-col gap-4"></div>
        <div id="inputBar" class="hidden p-4 bg-zinc-900/30 border-t border-zinc-800">
           <div class="flex gap-2">
             <input id="msgInput" class="flex-1 bg-black p-3 rounded-xl outline-none text-sm border border-zinc-800 focus:border-blue-600" placeholder="Ketik pesan...">
             <button onclick="sendChat()" class="bg-blue-600 px-6 rounded-xl font-bold text-[10px]">SEND</button>
           </div>
        </div>
      </div>
    </div>
    <script>
      let selectedUser = "";
      async function update() {
        const res = await fetch('/api/data');
        const db = await res.json();
        const users = Object.keys(db.users || {}).filter(u => u !== "${user}");
        document.getElementById('userList').innerHTML = users.map(u => \`
          <div onclick="selectUser('\${u}')" class="p-3 mb-1 rounded-xl cursor-pointer \${selectedUser === u ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-900'}">
            <div class="text-sm font-bold uppercase tracking-tighter">\${u}</div>
          </div>\`).join('');
        
        if(selectedUser) {
          const cId = ["${user}", selectedUser].sort().join("_");
          const msgs = (db.privateChats && db.privateChats[cId]) || [];
          document.getElementById('chatBox').innerHTML = msgs.map(m => \`
            <div class="flex flex-col \${m.from === "${user}" ? 'items-end' : 'items-start'}">
              <div class="max-w-[85%] p-3 rounded-2xl \${m.from === "${user}" ? 'bg-blue-600 text-white' : 'bg-zinc-800'}">
                <div class="text-sm">\${m.text}</div>
                <div class="text-[8px] opacity-40 mt-1 uppercase text-right">\${m.time}</div>
              </div>
            </div>\`).join('');
        }
      }
      function selectUser(u) { selectedUser = u; document.getElementById('inputBar').classList.remove('hidden'); update(); }
      async function sendChat() {
        const i = document.getElementById('msgInput'); if(!i.value.trim()) return;
        const fd = new FormData(); fd.append('action', 'chat'); fd.append('to', selectedUser); fd.append('message', i.value);
        i.value = ""; await fetch('/', { method: 'POST', body: fd }); update();
      }
      setInterval(update, 5000); update();
    </script>
  </body></html>`;
}

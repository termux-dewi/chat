const CONFIG = {
  // Menggunakan ID file dan folder terbaru yang kamu berikan
  driveFileId: "1y4HcX-otBQeT5-dTgUcleOB1BAtkVXML",
  mediaFolderId: "1VgxPBzDVJ_GxPbUXAYLnTSeZbitjYOnY", 
  clientEmail: "dbchat@chat-490410.iam.gserviceaccount.com",
  // Gunakan format string mentah dari JSON (dengan \n)
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDNgJdV7jFyCzHt\nnRLMBKaDNtTXlm9Ab8liUWAf7DFqVOt2bw8+g+ufmLPRrGIpQMlgJmHtE+e9iJJ7\nP0qRHnygmmXjwMK+jVeRk77KJA3aHpM9rGZjltl1TMffGxrWWCcGk+rJ4GWOkvR6\nwnRSmpVjPywRpCcB66LLwTKKSjOySZ6RIOOT4WIWDwM04qk75ueav80WarV+/scx\nh/6GrAJ8HXJijiPhQoFP47nrD8Cb/GQMVoCnIonkDybBATaAemlImSlsfigjMCCO\nj3iU16tMq+AbsFgZ9XefJ0GaIMWjvCnlm4UxZNlTD7qqx9V0vQZzKFnQWXoOsKSD\n48A1QSPvAgMBAAECggEABPRQsbWoY4N5lKzwwxJpoUg1IW1zCS6owEIN+zcKifG6\nK4TJ7Uvo5lQcIbXyN+Rj9nl2auzL7XnZbjc8aPs/LfAK/M6s40MtFUlmlCECZHvQ\nOPBrF4OPgpBzUSGqJ/jAGByA0JUkXaeVVVBS1Zr8dwQS3+oBNr6jkh36RfM8A9RP\neo0cw1P4nv71q1eVp7vfH+6/iN2f7QuyJEdsZhCmjq9+aWxNh/VlVgS0KT+aDDhl\n9MFp/RL+YLstGTeS/NUj2eprjO/+K6SsGlQ7Ln42o3AO3WdmEPuFdub+WcQvbDv9\nfqYDmvJETEMR7A3oeGNxvvS3Q7CGrF7GxsHLB7e7wQKBgQDp+rVMJJqzweC5uDOs\npXH6tJrIK8w3XRIsQCiumad+BgmY0/fDQ0QxmEggxlxJ4XZKSfinssxA+LksdQL5\n1yX4Ug+blTViTDZdol95RQkHvHKrqHJyKM2Ghf17QASn/hrAsZ7SkJDOu6zpZpI+\nk38sC5ZHffZ3SIHCJO4hMzCzJwKBgQDg18hhkieUkndqKtHSklIc4+WXcy4+L5h7\n1ovr4IihFdOCkBeE3lRMklXl83vXUxRUjK0ei9VmxspW6V9rQkLU7HKiCUMVnXts\nPSViB6RUOjy4bQrItze/cyzP80yH3hxFIUWRa2FzLI08/j3uAF1Dp/taMgQBVS25\n8LCiAPfl+QKBgQCIpEo2YnYaHlJgA2viGmia8dgmqDVF68uOHhXkCYXgOiRmpPtf\nhCwSDo2o3k7NMqdDMTnOrcNM+jQh+1+2imf5QestgBDCDCH/wrChAKkKZIpPJztW\n4e9M7Xkf/j354ZK8D77h111J7h5H3AfyFW9CSK4FqFFETgrBV5Hdv6hkJwKBgBS/\n1R4r/rsXSS3jBboJBsrjvSxc1MeoXMoQ4pjB/9ndyccixQjd+6mVV5gBAEy+vgGP\neep3vRne/o1GvCeJ1eEQcQPDFw3HmrxCaFDDo8aiGThr17LuNZbVai1GpqljNfir\nOWBSKIwYcHBQhiaQogq8VdXdB8GXusCOFb7dmAMBAoGBAMi/+6SAbISsMQGjoh1W\nrU0wgC168Ktz0D3E/8JJaVgh9kaFXHhwPz9hb7mzFUtioTaNq/tCFyMcLEEZHnDO\ne9Uym8/pdzzZlrZHj9/RlGe25aMxHOHz/+gNswnruJ0oc9uNQd8wI3c/fuD03umK\n5lykpzsqt9d8bflXTSS5d1CJ\n-----END PRIVATE KEY-----\n"
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const cookie = request.headers.get("Cookie") || "";
    const username = (cookie.match(/user_session=([^;]+)/) || [])[1];

    const getSafeDB = async (token) => {
      try {
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${CONFIG.driveFileId}?alt=media`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.ok ? await res.json() : { users: {}, privateChats: {} };
      } catch { return { users: {}, privateChats: {} }; }
    };

    // EndPoint API Data
    if (url.pathname === "/api/data") {
      try {
        const token = await getAccessToken();
        const db = await getSafeDB(token);
        return new Response(JSON.stringify(db), { headers: { "Content-Type": "application/json; charset=utf-8" } });
      } catch (e) { return new Response(e.message, { status: 500 }); }
    }

    // Auth & Chat Actions
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
            db.users[user] = { name: user, password: pass, lastSeen: Date.now(), bio: "Available" };
            await updateDrive(token, db);
          } else {
            if (!db.users[user] || db.users[user].password !== pass) return new Response("Gagal Login", { status: 401 });
          }
          return new Response("OK", { status: 302, headers: { "Location": "/", "Set-Cookie": `user_session=${user}; Path=/; HttpOnly; Max-Age=86400` } });
        }
      } catch (e) { return new Response(e.message, { status: 500 }); }
    }

    if (url.pathname === "/logout") return new Response("OK", { status: 302, headers: { "Location": "/", "Set-Cookie": "user_session=; Path=/; Max-Age=0" } });

    return new Response(username ? renderMainApp(username) : renderAuthPage(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
};

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000) - 30;
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" })).replace(/=/g, "");
  const payload = btoa(JSON.stringify({
    iss: CONFIG.clientEmail,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600, iat: now
  })).replace(/=/g, "");

  // Pembersihan Key agar tidak "Invalid PKCS8"
  const pem = CONFIG.privateKey.replace(/\\n/g, '\n') // Ubah \n string ke newline asli
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const keyBuffer = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey("pkcs8", keyBuffer.buffer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, new TextEncoder().encode(`${header}.${payload}`));
  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${header}.${payload}.${sigBase64}`
  });
  const data = await res.json();
  return data.access_token;
}

async function updateDrive(token, db) {
  return fetch(`https://www.googleapis.com/upload/drive/v3/files/${CONFIG.driveFileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(db)
  });
}

function renderAuthPage() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>
  <body class="bg-[#0b0f1a] flex items-center justify-center min-h-screen text-white p-6">
    <div class="w-full max-w-sm">
      <div class="text-center mb-10"><h1 class="text-5xl font-black text-blue-500 italic tracking-tighter">THE HUB</h1></div>
      <form method="POST" class="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800 backdrop-blur-md shadow-2xl">
        <input type="hidden" name="action" id="act" value="login">
        <input name="username" required placeholder="Username" class="w-full p-4 rounded-2xl bg-black border border-zinc-800 mb-4 outline-none focus:border-blue-600 text-sm">
        <input name="password" type="password" required placeholder="Password" class="w-full p-4 rounded-2xl bg-black border border-zinc-800 mb-6 outline-none focus:border-blue-600 text-sm">
        <button id="btn" class="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all hover:bg-blue-700">Masuk</button>
        <div class="flex justify-center gap-6 mt-8">
          <button type="button" onclick="setTab('login')" id="tL" class="text-[10px] font-bold text-blue-500 border-b border-blue-500">LOGIN</button>
          <button type="button" onclick="setTab('register')" id="tR" class="text-[10px] font-bold text-zinc-600">DAFTAR</button>
        </div>
      </form>
    </div>
    <script>
      function setTab(t) {
        document.getElementById('act').value = t;
        document.getElementById('btn').innerText = t === 'login' ? 'Masuk' : 'Buat Akun';
        document.getElementById('tL').className = t === 'login' ? 'text-[10px] font-bold text-blue-500 border-b border-blue-500' : 'text-[10px] font-bold text-zinc-600';
        document.getElementById('tR').className = t === 'register' ? 'text-[10px] font-bold text-blue-500 border-b border-blue-500' : 'text-[10px] font-bold text-zinc-600';
      }
    </script>
  </body></html>`;
}

function renderMainApp(user) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>
  <body class="bg-black text-zinc-300 h-screen flex flex-col font-sans">
    <div class="p-5 bg-[#0b0f1a] border-b border-zinc-900 flex justify-between items-center shadow-lg">
      <div class="font-black text-white italic tracking-tighter text-xl">THE HUB</div>
      <div class="flex items-center gap-4">
        <div class="px-4 py-1 bg-zinc-800 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-widest">${user}</div>
        <a href="/logout" class="text-[10px] font-black opacity-30 hover:opacity-100 hover:text-red-500 transition-all">EXIT</a>
      </div>
    </div>
    <div class="flex-1 flex overflow-hidden">
      <div class="w-1/3 border-r border-zinc-900 bg-[#0b0f1a]/50 p-4" id="uL"></div>
      <div class="flex-1 flex flex-col items-center justify-center p-10 text-center">
        <div class="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-4xl font-black text-white mb-6 shadow-2xl shadow-blue-900/20">${user.charAt(0).toUpperCase()}</div>
        <h2 class="text-2xl font-black text-white uppercase tracking-tighter">Selamat Datang, ${user}!</h2>
        <p class="text-zinc-500 text-xs mt-2 uppercase tracking-[0.3em]">Database Connection: Online</p>
      </div>
    </div>
    <script>
      async function update() {
        const res = await fetch('/api/data');
        const db = await res.json();
        const users = Object.keys(db.users || {}).filter(u => u !== "${user}");
        document.getElementById('uL').innerHTML = \`<div class="text-[9px] font-black text-zinc-600 mb-4 tracking-[0.2em] uppercase">Kontak Tersedia</div>\` + 
          users.map(u => \`
            <div class="p-4 mb-2 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-blue-500 transition-all cursor-pointer">
              <div class="text-sm font-bold text-white uppercase tracking-tighter">\${u}</div>
              <div class="text-[8px] text-zinc-500 font-bold uppercase mt-1">\${db.users[u].bio || 'No Bio'}</div>
            </div>\`).join('');
      }
      setInterval(update, 10000); update();
    </script>
  </body></html>`;
      }

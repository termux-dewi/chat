const CONFIG = {
  driveFileId: "1y4HcX-otBQeT5-dTgUcleOB1BAtkVXML", 
  clientEmail: "dbchat@chat-490410.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDNgJdV7jFyCzHt\nnRLMBKaDNtTXlm9Ab8liUWAf7DFqVOt2bw8+g+ufmLPRrGIpQMlgJmHtE+e9iJJ7\nP0qRHnygmmXjwMK+jVeRk77KJA3aHpM9rGZjltl1TMffGxrWWCcGk+rJ4GWOkvR6\nwnRSmpVjPywRpCcB66LLwTKKSjOySZ6RIOOT4WIWDwM04qk75ueav80WarV+/scx\nh/6GrAJ8HXJijiPhQoFP47nrD8Cb/GQMVoCnIonkDybBATaAemlImSlsfigjMCCO\nj3iU16tMq+AbsFgZ9XefJ0GaIMWjvCnlm4UxZNlTD7qqx9V0vQZzKFnQWXoOsKSD\n48A1QSPvAgMBAAECggEABPRQsbWoY4N5lKzwwxJpoUg1IW1zCS6owEIN+zcKifG6\nK4TJ7Uvo5lQcIbXyN+Rj9nl2auzL7XnZbjc8aPs/LfAK/M6s40MtFUlmlCECZHvQ\nOPBrF4OPgpBzUSGqJ/jAGByA0JUkXaeVVVBS1Zr8dwQS3+oBNr6jkh36RfM8A9RP\neo0cw1P4nv71q1eVp7vfH+6/iN2f7QuyJEdsZhCmjq9+aWxNh/VlVgS0KT+aDDhl\n9MFp/RL+YLstGTeS/NUj2eprjO/+K6SsGlQ7Ln42o3AO3WdmEPuFdub+WcQvbDv9\nfqYDmvJETEMR7A3oeGNxvvS3Q7CGrF7GxsHLB7e7wQKBgQDp+rVMJJqzweC5uDOs\npXH6tJrIK8w3XRIsQCiumad+BgmY0/fDQ0QxmEggxlxJ4XZKSfinssxA+LksdQL5\n1yX4Ug+blTViTDZdol95RQkHvHKrqHJyKM2Ghf17QASn/hrAsZ7SkJDOu6zpZpI+\nk38sC5ZHffZ3SIHCJO4hMzCzJwKBgQDg18hhkieUkndqKtHSklIc4+WXcy4+L5h7\n1ovr4IihFdOCkBeE3lRMklXl83vXUxRUjK0ei9VmxspW6V9rQkLU7HKiCUMVnXts\nPSViB6RUOjy4bQrItze/cyzP80yH3hxFIUWRa2FzLI08/j3uAF1Dp/taMgQBVS25\n8LCiAPfl+QKBgQCIpEo2YnYaHlJgA2viGmia8dgmqDVF68uOHhXkCYXgOiRmpPtf\nhCwSDo2o3k7NMqdDMTnOrcNM+jQh+1+2imf5QestgBDCDCH/wrChAKkKZIpPJztW\n4e9M7Xkf/j354ZK8D77h111J7h5H3AfyFW9CSK4FqFFETgrBV5Hdv6hkJwKBgBS/\n1R4r/rsXSS3jBboJBsrjvSxc1MeoXMoQ4pjB/9ndyccixQjd+6mVV5gBAEy+vgGP\neep3vRne/o1GvCeJ1eEQcQPDFw3HmrxCaFDDo8aiGThr17LuNZbVai1GpqljNfir\nOWBSKIwYcHBQhiaQogq8VdXdB8GXusCOFb7dmAMBAoGBAMi/+6SAbISsMQGjoh1W\nrU0wgC168Ktz0D3E/8JJaVgh9kaFXHhwPz9hb7mzFUtioTaNq/tCFyMcLEEZHnDO\ne9Uym8/pdzzZlrZHj9/RlGe25aMxHOHz/+gNswnruJ0oc9uNQd8wI3c/fuD03umK\n5lykpzsqt9d8bflXTSS5d1CJ\n-----END PRIVATE KEY-----\n"
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const cookie = request.headers.get("Cookie") || "";
    const username = (cookie.match(/user_session=([^;]+)/) || [])[1];

    const getDB = async (token) => {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${CONFIG.driveFileId}?alt=media`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let data = await res.json();
      if (!data.users) data.users = {};
      if (!data.privateChats) data.privateChats = {};
      if (!data.status) data.status = [];
      return data;
    };

    if (url.pathname === "/api/data") {
      const token = await getAccessToken();
      let db = await getDB(token);
      if (username && db.users[username]) {
        db.users[username].lastSeen = Date.now();
        await saveDB(token, db);
      }
      return new Response(JSON.stringify(db), { headers: { "Content-Type": "application/json" } });
    }

    if (request.method === "POST") {
      const token = await getAccessToken();
      const formData = await request.formData();
      const action = formData.get("action");
      let db = await getDB(token);

      if (action === "login" || action === "register") {
        const user = (formData.get("username") || "").trim().toLowerCase();
        const pass = (formData.get("password") || "").trim();
        if (action === "register") {
          db.users[user] = { name: user, password: pass, lastSeen: Date.now(), bio: "Available", pic: null };
          await saveDB(token, db);
        }
        return new Response("OK", { status: 302, headers: { "Location": "/", "Set-Cookie": `user_session=${user}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400` } });
      }

      if (username) {
        if (action === "chat") {
          const to = formData.get("to");
          const chatId = [username, to].sort().join("_");
          if (!db.privateChats[chatId]) db.privateChats[chatId] = [];
          
          const file = formData.get("file");
          let base64Data = null, fType = "text";
          
          if (file && file.size > 0) {
            const buffer = await file.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
            base64Data = `data:${file.type};base64,${base64}`;
            fType = file.type.startsWith("video") ? "video" : "image";
          }

          db.privateChats[chatId].push({
            id: "m_" + Date.now(), from: username, text: formData.get("message") || "",
            file: base64Data, fileType: fType,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          });
        } 
        else if (action === "update_profile") {
          const pPic = formData.get("profile_pic");
          if (pPic && pPic.size > 0) {
            const buffer = await pPic.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
            db.users[username].pic = `data:${pPic.type};base64,${base64}`;
          }
          db.users[username].name = formData.get("display_name") || db.users[username].name;
          db.users[username].bio = formData.get("bio") || db.users[username].bio;
        }
        else if (action === "post_status") {
           const file = formData.get("file");
           if (file && file.size > 0) {
              const buffer = await file.arrayBuffer();
              const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
              db.status.unshift({
                 user: username,
                 media: `data:${file.type};base64,${base64}`,
                 type: file.type.startsWith("video") ? "video" : "image",
                 time: Date.now()
              });
              // Simpan maksimal 20 status terbaru
              if(db.status.length > 20) db.status.pop();
           }
        }
        
        await saveDB(token, db);
        return new Response("OK");
      }
    }

    if (url.pathname === "/logout") return new Response("Bye", { status: 302, headers: { "Location": "/", "Set-Cookie": "user_session=; Path=/; Max-Age=0" } });
    if (!username) return new Response(renderAuthPage(), { headers: { "Content-Type": "text/html" } });
    return new Response(renderMainApp(username), { headers: { "Content-Type": "text/html" } });
  }
};

// --- DATABASE HANDLER ---
async function saveDB(token, dbContent) {
  return fetch(`https://www.googleapis.com/upload/drive/v3/files/${CONFIG.driveFileId}?uploadType=media`, { 
    method: 'PATCH', 
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, 
    body: JSON.stringify(dbContent) 
  });
}

async function getAccessToken() {
  const pem = CONFIG.privateKey.trim().replace(/\\n/g, '\n');
  const pemBody = pem.split('-----')[2].replace(/\s/g, '');
  const privateKey = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pemBody), c => c.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '');
  const payload = btoa(JSON.stringify({ iss: CONFIG.clientEmail, scope: 'https://www.googleapis.com/auth/drive', aud: 'https://oauth2.googleapis.com/token', exp: Math.floor(Date.now()/1000)+3600, iat: Math.floor(Date.now()/1000)-30 })).replace(/=/g, '');
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(`${header}.${payload}`));
  const jwt = `${header}.${payload}.${btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '')}`;
  const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) });
  return (await res.json()).access_token;
}

// --- UI COMPONENTS ---
function renderAuthPage() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>
  <body class="bg-[#0b141a] flex items-center justify-center min-h-screen text-white font-sans">
    <div class="w-full max-w-sm p-8 text-center">
      <div class="mb-10 text-emerald-500 flex justify-center">
        <svg class="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793 0-.852.448-1.271.607-1.445.159-.173.346-.217.462-.217h.332c.107 0 .252-.041.391.294l.541 1.309c.041.107.087.217.014.346l-.289.477c-.073.116-.144.246-.058.405.087.159.389.643.837 1.041.579.515 1.066.674 1.226.753.159.079.252.066.346-.041.093-.107.405-.477.513-.637.107-.159.217-.13.361-.079l1.373.68c.144.072.24.107.289.187.049.08.049.462-.095.867zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.438 5.168L2 22l4.957-1.3c1.465.803 3.153 1.3 5.043 1.3 5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
      </div>
      <form method="POST" class="space-y-4">
        <input type="hidden" name="action" id="act" value="login">
        <input name="username" required placeholder="ID / Phone" class="w-full p-4 rounded-xl bg-[#202c33] outline-none text-sm">
        <input name="password" type="password" required placeholder="Password" class="w-full p-4 rounded-xl bg-[#202c33] outline-none text-sm">
        <button id="btn" class="w-full bg-emerald-600 p-4 rounded-xl font-bold uppercase">Log In</button>
        <div class="flex justify-center gap-6 pt-4 text-[10px] text-zinc-500 uppercase font-black">
          <button type="button" onclick="document.getElementById('act').value='login'; document.getElementById('btn').innerText='LOG IN'">Login</button>
          <button type="button" onclick="document.getElementById('act').value='register'; document.getElementById('btn').innerText='SIGN UP'">Sign Up</button>
        </div>
      </form>
    </div>
  </body></html>`;
}

function renderMainApp(user) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background: #0b141a; color: #e9edef; font-family: sans-serif; overflow: hidden; }
    .wa-bg { background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png'); background-blend-mode: overlay; background-color: #0b141a; }
    .avatar { width: 45px; height: 45px; border-radius: 50%; object-fit: cover; background: #374151; flex-shrink: 0; }
    .tab-btn.active { border-bottom: 3px solid #10b981; color: #10b981; }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-thumb { background: #374151; }
  </style></head>
  <body class="h-screen flex flex-col">
    
    <div class="bg-[#202c33] p-4 flex justify-between items-center text-zinc-400">
      <div class="text-xl font-semibold text-emerald-500">WhatsApp</div>
      <div class="flex gap-4">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <div onclick="showProfile()" class="cursor-pointer" id="myAvatarSmall"></div>
      </div>
    </div>

    <div class="bg-[#202c33] flex text-zinc-400 font-bold text-xs uppercase tracking-widest border-b border-white/5">
      <button onclick="switchTab('chats')" id="tab-chats" class="tab-btn active flex-1 py-4">Chats</button>
      <button onclick="switchTab('status')" id="tab-status" class="tab-btn flex-1 py-4">Status</button>
      <button onclick="switchTab('calls')" id="tab-calls" class="tab-btn flex-1 py-4">Calls</button>
    </div>

    <div class="flex-1 overflow-hidden flex relative">
      <div id="main-sidebar" class="w-full lg:w-[450px] flex flex-col bg-[#111b21] border-r border-zinc-800 z-30 transition-transform duration-300">
        <div id="content-area" class="flex-1 overflow-y-auto">
          </div>
      </div>

      <div id="chat-screen" class="fixed lg:static inset-0 flex-1 flex flex-col wa-bg z-40 translate-x-full lg:translate-x-0 transition-transform duration-300">
        <div class="p-3 bg-[#202c33] flex items-center gap-3">
          <button onclick="closeChat()" class="lg:hidden text-emerald-500">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div id="headerAvatar" class="avatar w-10 h-10"></div>
          <div class="flex-1">
            <div id="chatName" class="font-bold text-sm">Select a chat</div>
            <div id="onlineStatus" class="text-[10px] text-zinc-400 italic"></div>
          </div>
        </div>

        <div id="chatBox" class="flex-1 p-4 overflow-y-auto flex flex-col gap-3"></div>

        <div id="mediaPreview" class="hidden absolute bottom-20 left-4 right-4 bg-[#202c33] p-4 rounded-2xl shadow-2xl">
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs font-bold text-emerald-500">Preview</span>
            <button onclick="clearMedia()" class="text-red-500">✕</button>
          </div>
          <div id="previewContainer" class="flex justify-center max-h-40 overflow-hidden rounded-lg"></div>
        </div>

        <div id="inputBar" class="p-3 bg-[#202c33] flex items-center gap-3 hidden">
          <label class="cursor-pointer text-zinc-400">
            <input type="file" id="fileInput" class="hidden" onchange="handleFile(this)" accept="image/*,video/*">
            <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          </label>
          <input id="msgInput" class="flex-1 bg-[#2a3942] p-3 rounded-xl outline-none text-sm" placeholder="Type a message">
          <button onclick="sendChat()" id="sendBtn" class="text-emerald-500">
            <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
    </div>

    <div id="profileModal" class="hidden fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 backdrop-blur">
      <div class="w-full max-w-sm bg-[#202c33] p-8 rounded-3xl text-center">
        <h2 class="text-emerald-500 font-bold mb-6">PROFILE</h2>
        <div onclick="document.getElementById('pInput').click()" class="avatar w-32 h-32 mx-auto mb-6 cursor-pointer border-4 border-emerald-500/20" id="modalAvatar"></div>
        <input type="file" id="pInput" class="hidden" onchange="saveProfile()" accept="image/*">
        <input id="pName" class="w-full bg-[#111b21] p-4 rounded-xl mb-4 outline-none text-sm" placeholder="Name">
        <input id="pBio" class="w-full bg-[#111b21] p-4 rounded-xl mb-4 outline-none text-sm" placeholder="About">
        <div class="flex gap-2">
          <button onclick="saveProfile()" class="flex-1 bg-emerald-600 p-4 rounded-xl font-bold">SAVE</button>
          <button onclick="hideProfile()" class="flex-1 bg-zinc-800 p-4 rounded-xl font-bold">CANCEL</button>
        </div>
        <a href="/logout" class="block mt-6 text-red-500 text-xs font-bold uppercase">Logout</a>
      </div>
    </div>

    <script>
      let currentTab = 'chats';
      let selectedUser = "";
      let tempFile = null;
      let db = null;

      const switchTab = (tab) => {
        currentTab = tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('tab-'+tab).classList.add('active');
        renderSidebar();
      };

      const showProfile = () => document.getElementById('profileModal').classList.remove('hidden');
      const hideProfile = () => document.getElementById('profileModal').classList.add('hidden');
      const closeChat = () => document.getElementById('chat-screen').classList.add('translate-x-full');

      function handleFile(input) {
        if (!input.files[0]) return;
        tempFile = input.files[0];
        const container = document.getElementById('previewContainer');
        const box = document.getElementById('mediaPreview');
        const url = URL.createObjectURL(tempFile);
        container.innerHTML = tempFile.type.startsWith('video') 
          ? \`<video src="\${url}" class="h-40" muted autoplay loop></video>\`
          : \`<img src="\${url}" class="h-40" />\`;
        box.classList.remove('hidden');
      }

      function clearMedia() {
        tempFile = null;
        document.getElementById('fileInput').value = "";
        document.getElementById('mediaPreview').classList.add('hidden');
      }

      const getAv = (u, n) => (u && u.pic) ? \`<img src="\${u.pic}" class="avatar" />\` : \`<div class="avatar flex items-center justify-center bg-zinc-700 font-bold">\${n[0].toUpperCase()}</div>\`;

      async function update() {
        const res = await fetch('/api/data');
        db = await res.json();
        const me = db.users["${user}"];
        document.getElementById('myAvatarSmall').innerHTML = getAv(me, "${user}");
        document.getElementById('modalAvatar').innerHTML = getAv(me, "${user}");
        if(!document.getElementById('pName').value) {
           document.getElementById('pName').value = me.name || "${user}";
           document.getElementById('pBio').value = me.bio || "";
        }
        renderSidebar();
        if(selectedUser) renderChat();
      }

      function renderSidebar() {
        const area = document.getElementById('content-area');
        if(currentTab === 'chats') {
          const users = Object.keys(db.users).filter(u => u !== "${user}");
          area.innerHTML = users.map(u => {
            const isLive = (Date.now() - db.users[u].lastSeen) < 15000;
            const cId = ["${user}", u].sort().join("_");
            const lastMsg = (db.privateChats[cId] || []).slice(-1)[0];
            return \`
            <div onclick="openChat('\${u}')" class="p-4 flex items-center gap-4 hover:bg-[#202c33] cursor-pointer \${selectedUser === u ? 'bg-[#2a3942]' : ''}">
              <div class="relative">
                \${getAv(db.users[u], u)}
                \${isLive ? '<div class="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#111b21]"></div>' : ''}
              </div>
              <div class="flex-1 min-w-0 border-b border-white/5 pb-2">
                <div class="flex justify-between"><span class="font-bold text-zinc-100">\${db.users[u].name || u}</span><span class="text-[10px] opacity-40">\${lastMsg ? lastMsg.time : ''}</span></div>
                <div class="text-xs opacity-50 truncate">\${lastMsg ? (lastMsg.file ? '📷 Media' : lastMsg.text) : db.users[u].bio}</div>
              </div>
            </div>\`;
          }).join('');
        } else if(currentTab === 'status') {
          area.innerHTML = \`
            <div class="p-4 flex flex-col gap-6">
              <div onclick="document.getElementById('fileInput').click()" class="flex items-center gap-4 cursor-pointer">
                <div class="avatar bg-emerald-600 flex items-center justify-center text-white">+</div>
                <div><div class="font-bold">My Status</div><div class="text-xs opacity-50">Tap to add status update</div></div>
              </div>
              <div class="text-xs font-bold text-emerald-500 px-2">RECENT UPDATES</div>
              \${db.status.map(s => \`
                <div class="flex items-center gap-4">
                  <div class="avatar border-2 border-emerald-500 p-0.5">\${getAv(db.users[s.user], s.user)}</div>
                  <div><div class="font-bold">\${db.users[s.user].name || s.user}</div><div class="text-[10px] opacity-40">\${new Date(s.time).toLocaleTimeString()}</div></div>
                </div>
              \`).join('')}
            </div>\`;
        } else {
          area.innerHTML = '<div class="h-full flex items-center justify-center opacity-20 font-bold italic uppercase">No recent calls</div>';
        }
      }

      function openChat(u) {
        selectedUser = u;
        document.getElementById('chat-screen').classList.remove('translate-x-full');
        document.getElementById('inputBar').classList.remove('hidden');
        renderChat();
      }

      function renderChat() {
        const target = db.users[selectedUser];
        const isLive = (Date.now() - target.lastSeen) < 15000;
        document.getElementById('headerAvatar').innerHTML = getAv(target, selectedUser);
        document.getElementById('chatName').innerText = target.name || selectedUser;
        document.getElementById('onlineStatus').innerText = isLive ? 'online' : 'last seen recently';
        
        const cId = ["${user}", selectedUser].sort().join("_");
        const msgs = db.privateChats[cId] || [];
        document.getElementById('chatBox').innerHTML = msgs.map(m => \`
          <div class="flex \${m.from === "${user}" ? 'justify-end' : 'justify-start'}">
            <div class="max-w-[80%] p-3 rounded-xl shadow-lg \${m.from === "${user}" ? 'bg-[#005c4b] text-white rounded-tr-none' : 'bg-[#202c33] text-zinc-100 rounded-tl-none'}">
              \${m.file ? (m.fileType==='video' ? \`<video src="\${m.file}" controls class="max-w-full rounded-lg mb-2"></video>\` : \`<img src="\${m.file}" class="max-w-full rounded-lg mb-2" />\`) : ''}
              <div class="text-sm">\${m.text}</div>
              <div class="text-[8px] text-right mt-1 opacity-40 font-bold">\${m.time}</div>
            </div>
          </div>\`).join('') + '<div id="scroll-bottom"></div>';
        document.getElementById('scroll-bottom').scrollIntoView();
      }

      async function sendChat() {
        const i = document.getElementById('msgInput');
        if(!i.value && !tempFile) return;
        const fd = new FormData();
        fd.append('action', currentTab === 'status' ? 'post_status' : 'chat');
        fd.append('to', selectedUser);
        fd.append('message', i.value);
        if(tempFile) fd.append('file', tempFile);
        
        i.value = ""; clearMedia();
        await fetch('/', { method: 'POST', body: fd });
        update();
      }

      async function saveProfile() {
        const fd = new FormData();
        fd.append('action', 'update_profile');
        fd.append('display_name', document.getElementById('pName').value);
        fd.append('bio', document.getElementById('pBio').value);
        if(document.getElementById('pInput').files[0]) fd.append('profile_pic', document.getElementById('pInput').files[0]);
        await fetch('/', { method: 'POST', body: fd });
        hideProfile(); update();
      }

      setInterval(update, 5000); update();
    </script>
  </body></html>`;
      }

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
          db.users[user] = { name: user, password: pass, lastSeen: Date.now(), bio: "Hey there! I am using THE HUB.", pic: null };
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
        
        await saveDB(token, db);
        return new Response("OK");
      }
    }

    if (url.pathname === "/logout") return new Response("Bye", { status: 302, headers: { "Location": "/", "Set-Cookie": "user_session=; Path=/; Max-Age=0" } });
    if (!username) return new Response(renderAuthPage(), { headers: { "Content-Type": "text/html" } });
    return new Response(renderMainApp(username), { headers: { "Content-Type": "text/html" } });
  }
};

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

function renderAuthPage() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>
  <body class="bg-[#0b141a] flex items-center justify-center min-h-screen text-white font-sans">
    <div class="w-full max-w-sm p-8 text-center">
      <div class="mb-10 text-emerald-500">
        <svg class="w-20 h-20 mx-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793 0-.852.448-1.271.607-1.445.159-.173.346-.217.462-.217h.332c.107 0 .252-.041.391.294l.541 1.309c.041.107.087.217.014.346l-.289.477c-.073.116-.144.246-.058.405.087.159.389.643.837 1.041.579.515 1.066.674 1.226.753.159.079.252.066.346-.041.093-.107.405-.477.513-.637.107-.159.217-.13.361-.079l1.373.68c.144.072.24.107.289.187.049.08.049.462-.095.867zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.438 5.168L2 22l4.957-1.3c1.465.803 3.153 1.3 5.043 1.3 5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
      </div>
      <form method="POST" class="space-y-4">
        <input type="hidden" name="action" id="act" value="login">
        <input name="username" required placeholder="Phone number or ID" class="w-full p-4 rounded-xl bg-[#202c33] border-none outline-none focus:ring-1 ring-emerald-500 text-sm">
        <input name="password" type="password" required placeholder="Password" class="w-full p-4 rounded-xl bg-[#202c33] border-none outline-none focus:ring-1 ring-emerald-500 text-sm">
        <button id="btn" class="w-full bg-emerald-600 p-4 rounded-xl font-bold active:scale-95 transition-all">LOG IN</button>
        <div class="flex justify-center gap-6 pt-4 text-xs text-zinc-500 uppercase tracking-widest">
          <button type="button" onclick="document.getElementById('act').value='login'; document.getElementById('btn').innerText='LOG IN'" class="hover:text-emerald-500">Login</button>
          <button type="button" onclick="document.getElementById('act').value='register'; document.getElementById('btn').innerText='SIGN UP'" class="hover:text-emerald-500">Sign Up</button>
        </div>
      </form>
    </div>
  </body></html>`;
}

function renderMainApp(user) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background: #0b141a; color: #e9edef; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .wa-bg { background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png'); background-blend-mode: overlay; background-color: #0b141a; }
    .avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; background: #374151; }
    .sidebar-active { transform: translateX(0); }
    .sidebar-hidden { transform: translateX(-100%); }
    #chat-screen { transition: transform 0.3s ease; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
  </style></head>
  <body class="h-screen flex overflow-hidden">
    
    <div id="sidebar" class="w-full lg:w-[400px] flex-shrink-0 border-r border-zinc-800 flex flex-col bg-[#111b21] z-50 fixed lg:static inset-0 transition-transform duration-300">
      <div class="p-3 bg-[#202c33] flex justify-between items-center">
        <div onclick="showProfile()" class="cursor-pointer" id="myAvatarContainer"></div>
        <div class="flex gap-5 text-zinc-400">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 7a2 2 0 100-4 2 2 0 000 4zm0 2a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4z"/></svg>
        </div>
      </div>
      
      <div class="p-2">
        <div class="bg-[#202c33] rounded-lg flex items-center px-4 py-1.5">
          <svg class="w-4 h-4 text-zinc-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input oninput="filterUsers(this.value)" placeholder="Search or start new chat" class="bg-transparent border-none outline-none text-sm w-full placeholder-zinc-500">
        </div>
      </div>

      <div class="flex border-b border-zinc-800 text-zinc-400 font-bold text-xs uppercase tracking-wider">
        <div class="flex-1 py-3 text-center border-b-2 border-emerald-500 text-emerald-500">Chats</div>
        <div class="flex-1 py-3 text-center">Status</div>
        <div class="flex-1 py-3 text-center">Calls</div>
      </div>

      <div id="userList" class="flex-1 overflow-y-auto"></div>
    </div>

    <div id="chat-screen" class="flex-1 flex flex-col bg-[#0b141a] relative wa-bg translate-x-full lg:translate-x-0">
      
      <div id="chatHeader" class="p-3 bg-[#202c33] flex items-center gap-3 z-40">
        <button onclick="backToSidebar()" class="lg:hidden text-emerald-500 pr-2">
           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div id="headerAvatar" class="avatar w-10 h-10"></div>
        <div class="flex-1">
          <div id="chatName" class="font-semibold text-zinc-100">THE HUB</div>
          <div id="onlineStatus" class="text-[11px] text-zinc-400 italic"></div>
        </div>
        <a href="/logout" class="text-zinc-400 hover:text-red-400 text-xs font-bold">LOGOUT</a>
      </div>

      <div id="chatBox" class="flex-1 p-4 lg:p-10 overflow-y-auto flex flex-col gap-2">
         <div class="m-auto text-center opacity-20">
            <svg class="w-24 h-24 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2v-2zm0-10h2v8h-2V6z"/></svg>
            <p class="font-bold tracking-widest uppercase">End-to-end encrypted</p>
         </div>
      </div>

      <div id="mediaPreview" class="hidden absolute bottom-24 left-4 right-4 bg-[#202c33] p-3 rounded-xl border border-white/5 shadow-2xl z-50">
           <div class="flex justify-between items-center mb-2">
             <span class="text-[10px] text-zinc-400 uppercase font-bold">Media Preview</span>
             <button onclick="clearMedia()" class="text-red-400 font-bold text-xs">REMOVE</button>
           </div>
           <div id="previewContainer" class="max-h-48 overflow-hidden rounded-lg flex justify-center bg-black"></div>
      </div>

      <div id="inputBar" class="p-3 bg-[#202c33] flex items-center gap-3 hidden">
        <label class="p-2 text-zinc-400 hover:text-emerald-500 cursor-pointer">
          <input type="file" id="fileInput" class="hidden" onchange="handleFile(this)" accept="image/*,video/*">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </label>
        <input id="msgInput" onkeypress="if(event.key==='Enter') sendChat()" class="flex-1 bg-[#2a3942] p-3 rounded-xl outline-none text-sm placeholder-zinc-500" placeholder="Type a message">
        <button onclick="sendChat()" id="sendBtn" class="p-3 text-emerald-500 bg-[#2a3942] rounded-full hover:bg-emerald-600 hover:text-white transition-all">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>

    <div id="profileModal" class="hidden fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6">
       <div class="w-full max-w-sm bg-[#202c33] p-6 rounded-3xl border border-white/5 text-center shadow-2xl">
          <div class="flex justify-between items-center mb-8">
            <h2 class="text-emerald-500 font-bold uppercase tracking-widest">Profile</h2>
            <button onclick="hideProfile()" class="text-zinc-500">✕</button>
          </div>
          <div onclick="document.getElementById('pInput').click()" class="w-32 h-32 mx-auto rounded-full overflow-hidden bg-zinc-800 border-4 border-emerald-500/20 mb-6 cursor-pointer relative group">
             <div id="modalAvatar" class="w-full h-full"></div>
             <div class="absolute inset-0 bg-black/40 items-center justify-center hidden group-hover:flex text-[10px] font-bold">CHANGE</div>
          </div>
          <input type="file" id="pInput" class="hidden" onchange="saveProfile()" accept="image/*">
          <div class="text-left space-y-4">
            <div><label class="text-[10px] text-emerald-500 font-bold ml-1 uppercase">Your Name</label><input id="pName" class="w-full bg-[#111b21] border-none rounded-xl p-4 mt-1 text-sm outline-none ring-1 ring-white/5 focus:ring-emerald-500"></div>
            <div><label class="text-[10px] text-emerald-500 font-bold ml-1 uppercase">About</label><input id="pBio" class="w-full bg-[#111b21] border-none rounded-xl p-4 mt-1 text-sm outline-none ring-1 ring-white/5 focus:ring-emerald-500"></div>
          </div>
          <button onclick="saveProfile()" id="saveBtn" class="w-full bg-emerald-600 p-4 rounded-xl font-bold mt-8 active:scale-95 transition-all">SAVE CHANGES</button>
       </div>
    </div>

    <script>
      let selectedUser = "";
      let tempFile = null;
      let cachedDB = null;

      const showProfile = () => document.getElementById('profileModal').classList.remove('hidden');
      const hideProfile = () => document.getElementById('profileModal').classList.add('hidden');
      const backToSidebar = () => document.getElementById('chat-screen').classList.add('translate-x-full');

      function handleFile(input) {
        if (!input.files[0]) return;
        tempFile = input.files[0];
        const container = document.getElementById('previewContainer');
        const box = document.getElementById('mediaPreview');
        const url = URL.createObjectURL(tempFile);
        container.innerHTML = tempFile.type.startsWith('video') 
          ? \`<video src="\${url}" class="max-h-48" muted autoplay loop></video>\`
          : \`<img src="\${url}" class="max-h-48" />\`;
        box.classList.remove('hidden');
      }

      function clearMedia() {
        tempFile = null;
        document.getElementById('fileInput').value = "";
        document.getElementById('mediaPreview').classList.add('hidden');
      }

      const getAv = (u, name) => (u && u.pic) ? \`<img src="\${u.pic}" class="avatar" />\` : \`<div class="avatar flex items-center justify-center font-bold text-lg">\${name[0]}</div>\`;

      async function update() {
        try {
          const res = await fetch('/api/data');
          cachedDB = await res.json();
          const me = cachedDB.users["${user}"];
          
          document.getElementById('myAvatarContainer').innerHTML = getAv(me, "${user}");
          document.getElementById('modalAvatar').innerHTML = getAv(me, "${user}");
          if(!document.getElementById('pName').value) {
            document.getElementById('pName').value = me.name || "${user}";
            document.getElementById('pBio').value = me.bio || "";
          }

          renderUserList();
          if(selectedUser) renderChat();
        } catch(e) {}
      }

      function renderUserList(filter = "") {
        const users = Object.keys(cachedDB.users).filter(u => u !== "${user}" && u.toLowerCase().includes(filter.toLowerCase()));
        document.getElementById('userList').innerHTML = users.map(u => {
          const isLive = (Date.now() - cachedDB.users[u].lastSeen) < 15000;
          const cId = ["${user}", u].sort().join("_");
          const msgs = cachedDB.privateChats[cId] || [];
          const lastMsg = msgs[msgs.length - 1];
          const lastText = lastMsg ? (lastMsg.file ? (lastMsg.fileType === 'video' ? '📹 Video' : '📷 Photo') : lastMsg.text) : 'Tap to start chatting';

          return \`
          <div onclick="selectUser('\${u}')" class="p-3 flex items-center gap-4 cursor-pointer hover:bg-[#202c33] transition-colors \${selectedUser === u ? 'bg-[#2a3942]' : ''}">
            <div class="relative">
               \${getAv(cachedDB.users[u], u)}
               \${isLive ? '<div class="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#111b21] rounded-full"></div>' : ''}
            </div>
            <div class="flex-1 min-w-0 border-b border-zinc-800/50 pb-3">
               <div class="flex justify-between items-center mb-1">
                  <span class="font-semibold truncate text-zinc-100">\${cachedDB.users[u].name || u}</span>
                  <span class="text-[10px] text-zinc-500 font-bold italic uppercase">\${lastMsg ? lastMsg.time : ''}</span>
               </div>
               <div class="text-xs text-zinc-400 truncate">\${lastText}</div>
            </div>
          </div>\`;
        }).join('');
      }

      function renderChat() {
        const target = cachedDB.users[selectedUser];
        const isLive = (Date.now() - target.lastSeen) < 15000;
        document.getElementById('headerAvatar').innerHTML = getAv(target, selectedUser);
        document.getElementById('chatName').innerText = target.name || selectedUser;
        document.getElementById('onlineStatus').innerText = isLive ? "online" : "last seen recently";
        document.getElementById('onlineStatus').classList.toggle('text-emerald-400', isLive);

        const cId = ["${user}", selectedUser].sort().join("_");
        const msgs = cachedDB.privateChats[cId] || [];
        document.getElementById('chatBox').innerHTML = msgs.map(m => \`
          <div class="flex \${m.from === "${user}" ? 'justify-end' : 'justify-start'}">
            <div class="max-w-[85%] lg:max-w-[65%] rounded-lg p-2.5 shadow-md \${m.from === "${user}" ? 'bg-[#005c4b] text-white rounded-tr-none' : 'bg-[#202c33] text-zinc-200 rounded-tl-none'}">
               \${m.file ? (m.fileType === 'video' ? \`<video src="\${m.file}" controls class="rounded-lg mb-2 max-w-full"></video>\` : \`<img src="\${m.file}" class="rounded-lg mb-2 max-w-full" />\`) : ''}
               <div class="text-[13px] leading-relaxed">\${m.text}</div>
               <div class="text-[9px] text-right mt-1 opacity-50 font-bold">\${m.time}</div>
            </div>
          </div>\`).join('') + '<div id="scrollAnchor"></div>';
        
        const anchor = document.getElementById('scrollAnchor');
        if(anchor) anchor.scrollIntoView({ behavior: 'smooth' });
      }

      function filterUsers(val) { renderUserList(val); }

      async function saveProfile() {
        const btn = document.getElementById('saveBtn'); btn.innerText = "SAVING...";
        const fd = new FormData(); fd.append('action', 'update_profile');
        fd.append('display_name', document.getElementById('pName').value);
        fd.append('bio', document.getElementById('pBio').value);
        if(document.getElementById('pInput').files[0]) fd.append('profile_pic', document.getElementById('pInput').files[0]);
        await fetch('/', { method: 'POST', body: fd }); 
        btn.innerText = "SAVE CHANGES"; 
        hideProfile();
        setTimeout(update, 500); // Tunggu sebentar agar Drive selesai proses update
      }

      function selectUser(u) { 
        selectedUser = u; 
        document.getElementById('chat-screen').classList.remove('translate-x-full');
        document.getElementById('inputBar').classList.remove('hidden'); 
        renderChat();
      }

      async function sendChat() {
        const i = document.getElementById('msgInput'), b = document.getElementById('sendBtn');
        if(!i.value && !tempFile) return;
        b.innerHTML = '<svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-width="4" opacity="0.2"></circle><path d="M4 12a8 8 0 018-8" stroke-width="4"></path></svg>';
        const fd = new FormData(); fd.append('action', 'chat'); fd.append('to', selectedUser); fd.append('message', i.value);
        if(tempFile) fd.append('file', tempFile);
        
        i.value = ""; clearMedia();
        await fetch('/', { method: 'POST', body: fd });
        b.innerHTML = '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
        update();
      }

      setInterval(update, 5000); update();
    </script>
  </body></html>`;
            }

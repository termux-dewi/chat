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

      if (action === "login" || action === "register") {
        const user = (formData.get("username") || "").trim().toLowerCase();
        const pass = (formData.get("password") || "").trim();
        if (action === "register") {
          db.users[user] = { name: user, password: pass, lastSeen: Date.now(), bio: "Available", pic: null };
          await updateDriveFile(token, JSON.stringify(db));
        }
        return new Response("OK", { status: 302, headers: { "Location": "/", "Set-Cookie": `user_session=${user}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400` } });
      }

      if (username) {
        if (action === "chat") {
          const to = formData.get("to");
          const chatId = [username, to].sort().join("_");
          if (!db.privateChats[chatId]) db.privateChats[chatId] = [];
          
          const file = formData.get("file");
          let fileUrl = null, fType = "text";
          
          if (file && file.size > 0) {
            const uploadedId = await uploadToDrive(token, file);
            if (uploadedId) {
              fileUrl = `https://www.googleapis.com/drive/v3/files/${uploadedId}?alt=media`;
              fType = file.type.startsWith("video") ? "video" : "image";
            }
          }

          db.privateChats[chatId].push({
            id: "m_" + Date.now(), from: username, text: formData.get("message") || "",
            file: fileUrl, fileType: fType,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          });
        } 
        else if (action === "update_profile") {
          const pPic = formData.get("profile_pic");
          if (pPic && pPic.size > 0) {
            const uploadedId = await uploadToDrive(token, pPic);
            if (uploadedId) db.users[username].pic = `https://www.googleapis.com/drive/v3/files/${uploadedId}?alt=media`;
          }
          db.users[username].name = formData.get("display_name") || db.users[username].name;
          db.users[username].bio = formData.get("bio") || db.users[username].bio;
        }
        
        await updateDriveFile(token, JSON.stringify(db));
        return new Response("OK");
      }
    }

    if (url.pathname === "/logout") return new Response("Bye", { status: 302, headers: { "Location": "/", "Set-Cookie": "user_session=; Path=/; Max-Age=0" } });
    if (!username) return new Response(renderAuthPage(), { headers: { "Content-Type": "text/html" } });
    return new Response(renderMainApp(username), { headers: { "Content-Type": "text/html" } });
  }
};

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

async function uploadToDrive(token, file) {
  try {
    const meta = { name: `media_${Date.now()}`, parents: [CONFIG.mediaFolderId] };
    const body = new FormData();
    body.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
    body.append('file', file);
    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body });
    const data = await res.json();
    if (data.id) {
      await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'reader', type: 'anyone' }) });
      return data.id;
    }
  } catch(e) {} return null;
}

function updateDriveFile(token, content) {
  return fetch(`https://www.googleapis.com/upload/drive/v3/files/${CONFIG.driveFileId}?uploadType=media`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: content });
}

function renderAuthPage() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>
  <body class="bg-black flex items-center justify-center min-h-screen text-white font-black italic tracking-tighter uppercase">
    <div class="w-full max-w-sm p-10 bg-zinc-900/50 backdrop-blur-xl rounded-[3rem] border border-white/5 text-center shadow-2xl">
      <h1 class="text-6xl text-blue-500 mb-10">THE HUB</h1>
      <form method="POST" class="space-y-4">
        <input type="hidden" name="action" id="act" value="login">
        <input name="username" required placeholder="ID" class="w-full p-5 rounded-3xl bg-black border border-white/5 outline-none focus:border-blue-500">
        <input name="password" type="password" required placeholder="PASS" class="w-full p-5 rounded-3xl bg-black border border-white/5 outline-none focus:border-blue-500">
        <button id="btn" class="w-full bg-blue-600 p-5 rounded-3xl active:scale-95 shadow-lg">ENTER</button>
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
    body { font-family: 'Inter', sans-serif; background: #000; color: #71717a; }
    .glass { background: rgba(10, 10, 12, 0.9); backdrop-filter: blur(20px); }
    .avatar-circle { width: 45px; height: 45px; border-radius: 50%; background: #18181b; display: flex; align-items: center; justify-content: center; font-size: 16px; color: white; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; }
    .avatar-circle img { width: 100%; height: 100%; object-fit: cover; }
    #sidebar { transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    .sidebar-closed { transform: translateX(-105%); }
    ::-webkit-scrollbar { width: 0; }
  </style></head>
  <body class="h-screen flex flex-col overflow-hidden uppercase font-black italic tracking-tighter text-[11px]">
    <div class="flex flex-1 overflow-hidden relative">
      <div id="sidebar" class="fixed lg:static inset-y-0 left-0 w-80 glass border-r border-white/5 z-[60] sidebar-closed lg:transform-none flex flex-col shadow-2xl">
        <div class="p-8 border-b border-white/5 flex flex-col items-center gap-4">
          <div onclick="showProfile()" class="avatar-circle w-24 h-24 text-4xl cursor-pointer hover:scale-105 border-4 border-blue-600/10" id="myAvatar"></div>
          <div class="text-blue-500 text-lg" id="myProfileName">${user}</div>
          <button onclick="toggleSidebar()" class="lg:hidden text-zinc-600 text-[8px]">CLOSE SIDEBAR</button>
        </div>
        <div id="userList" class="flex-1 overflow-y-auto p-4 space-y-2"></div>
      </div>

      <div class="flex-1 flex flex-col min-w-0 bg-black relative">
        <div class="p-5 glass border-b border-white/5 flex justify-between items-center z-40">
          <button onclick="toggleSidebar()" class="lg:hidden text-blue-500">MENU</button>
          <div id="chatHeaderInfo" class="flex items-center gap-3 invisible">
             <div id="headerAvatar" class="avatar-circle w-8 h-8"></div>
             <div class="flex flex-col">
                <div id="chatName" class="text-white tracking-widest text-sm leading-none">THE HUB</div>
                <div id="onlineStatus" class="text-[7px] italic"></div>
             </div>
          </div>
          <a href="/logout" class="opacity-20 hover:opacity-100">EXIT</a>
        </div>
        
        <div id="chatBox" class="flex-1 p-6 overflow-y-auto flex flex-col gap-6 pb-32">
           <div class="h-full flex items-center justify-center opacity-10 italic">TAP A USER TO START</div>
        </div>

        <div id="mediaPreview" class="hidden absolute bottom-28 left-1/2 -translate-x-1/2 w-64 glass border border-white/10 p-2 rounded-3xl shadow-2xl z-50">
           <button onclick="clearMedia()" class="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full text-[10px] shadow-lg">✕</button>
           <div id="previewContainer" class="rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center border border-white/5"></div>
        </div>

        <div id="inputBar" class="hidden absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-3xl z-50">
          <div class="glass border border-white/10 p-3 rounded-[2.5rem] flex items-center gap-3 shadow-2xl">
            <label class="bg-white/5 h-12 w-12 flex items-center justify-center rounded-full cursor-pointer hover:bg-white/10 shrink-0">
              <input type="file" id="fileInput" class="hidden" onchange="handleFile(this)" accept="image/*,video/*">
              <span class="text-2xl text-blue-500 font-normal">+</span>
            </label>
            <input id="msgInput" class="flex-1 bg-transparent h-12 px-2 outline-none text-white placeholder-zinc-800" placeholder="TYPE MESSAGE...">
            <button onclick="sendChat()" id="sendBtn" class="bg-blue-600 h-12 px-8 rounded-full text-white shadow-xl active:scale-90 transition-all">SEND</button>
          </div>
        </div>
      </div>
    </div>

    <div id="profileModal" class="hidden fixed inset-0 z-[100] glass flex flex-col items-center justify-center p-6">
       <div class="w-full max-w-sm bg-zinc-900 p-8 rounded-[3rem] border border-white/10 text-center relative shadow-2xl">
          <button onclick="hideProfile()" class="absolute top-6 right-6 text-zinc-500">✕</button>
          <h2 class="text-blue-500 mb-8 tracking-widest">PROFILE SETTINGS</h2>
          <div onclick="document.getElementById('pInput').click()" class="avatar-circle w-32 h-32 mx-auto text-5xl cursor-pointer border-4 border-blue-500/20 mb-6" id="modalAvatar"></div>
          <input type="file" id="pInput" class="hidden" onchange="saveProfile()" accept="image/*">
          <div class="space-y-4 text-left">
            <div><label class="text-[8px] opacity-30 ml-4">NAME</label><input id="pName" class="w-full bg-black border border-white/5 rounded-2xl p-4 text-white outline-none"></div>
            <div><label class="text-[8px] opacity-30 ml-4">BIO</label><input id="pBio" class="w-full bg-black border border-white/5 rounded-2xl p-4 text-white outline-none"></div>
          </div>
          <button onclick="saveProfile()" id="saveBtn" class="w-full bg-blue-600 p-5 rounded-3xl text-white mt-8 font-black shadow-lg">SAVE CHANGES</button>
       </div>
    </div>

    <script>
      let selectedUser = "";
      let tempFile = null;

      const toggleSidebar = () => document.getElementById('sidebar').classList.toggle('sidebar-closed');
      const showProfile = () => document.getElementById('profileModal').classList.remove('hidden');
      const hideProfile = () => document.getElementById('profileModal').classList.add('hidden');

      function handleFile(input) {
        if (!input.files[0]) return;
        tempFile = input.files[0];
        const container = document.getElementById('previewContainer');
        const box = document.getElementById('mediaPreview');
        const url = URL.createObjectURL(tempFile);
        
        container.innerHTML = tempFile.type.startsWith('video') 
          ? \`<video src="\${url}" class="h-full w-full object-cover" muted autoplay loop></video>\`
          : \`<img src="\${url}" class="h-full w-full object-cover" />\`;
        
        box.classList.remove('hidden');
      }

      function clearMedia() {
        tempFile = null;
        document.getElementById('fileInput').value = "";
        document.getElementById('mediaPreview').classList.add('hidden');
      }

      const getAv = (u, name) => (u && u.pic && !u.pic.includes('undefined')) ? \`<img src="\${u.pic}" />\` : \`<span>\${name[0]}</span>\`;

      async function update() {
        try {
          const res = await fetch('/api/data');
          const db = await res.json();
          const me = db.users["${user}"];
          
          document.getElementById('myAvatar').innerHTML = getAv(me, "${user}");
          document.getElementById('modalAvatar').innerHTML = getAv(me, "${user}");
          
          const users = Object.keys(db.users).filter(u => u !== "${user}");
          document.getElementById('userList').innerHTML = users.map(u => {
            const isLive = (Date.now() - db.users[u].lastSeen) < 15000;
            return \`
            <div onclick="selectUser('\${u}')" class="p-4 rounded-[2.5rem] flex items-center gap-4 transition-all \${selectedUser === u ? 'bg-blue-600/10 border border-blue-500/30 text-white' : 'hover:bg-white/5'}">
              <div class="avatar-circle">\${getAv(db.users[u], u)}</div>
              <div class="flex-1 min-w-0">
                 <div class="flex justify-between items-center font-black"><span class="truncate">\${db.users[u].name || u}</span>\${isLive ? '<div class="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_green]"></div>' : ''}</div>
                 <div class="text-[7px] opacity-20 truncate italic">\${db.users[u].bio || '...'}</div>
              </div>
            </div>\`;
          }).join('');

          if(selectedUser) {
            const target = db.users[selectedUser];
            document.getElementById('chatHeaderInfo').classList.remove('invisible');
            document.getElementById('headerAvatar').innerHTML = getAv(target, selectedUser);
            const isLive = (Date.now() - target.lastSeen) < 15000;
            document.getElementById('onlineStatus').className = \`text-[7px] \${isLive ? 'text-green-500 animate-pulse font-black' : 'text-zinc-700'} italic\`;
            document.getElementById('onlineStatus').innerText = isLive ? "● LIVE" : "○ OFFLINE";

            const cId = ["${user}", selectedUser].sort().join("_");
            const msgs = db.privateChats[cId] || [];
            document.getElementById('chatBox').innerHTML = msgs.map(m => \`
              <div class="flex items-start gap-3 \${m.from === "${user}" ? 'flex-row-reverse' : ''}">
                <div class="avatar-circle w-7 h-7 text-[8px]">\${getAv(db.users[m.from], m.from)}</div>
                <div class="max-w-[80%] flex flex-col \${m.from === "${user}" ? 'items-end' : 'items-start'}">
                   <div class="p-4 rounded-[1.8rem] shadow-xl \${m.from === "${user}" ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-zinc-900 text-zinc-300 rounded-tl-none'}">
                      \${(m.file && !m.file.includes('undefined')) ? (m.fileType === 'video' ? \`<video src="\${m.file}" controls class="rounded-2xl max-w-full mb-3"></video>\` : \`<img src="\${m.file}" class="rounded-2xl max-w-full mb-3" />\`) : ''}
                      <div class="text-[12px] font-medium break-words tracking-normal not-italic uppercase">\${m.text}</div>
                   </div>
                   <div class="mt-1 px-2 opacity-20 text-[6px] font-bold italic">\${m.time}</div>
                </div>
              </div>\`).join('');
          }
        } catch(e) {}
      }

      async function saveProfile() {
        const btn = document.getElementById('saveBtn'); btn.innerText = "...";
        const fd = new FormData(); fd.append('action', 'update_profile');
        fd.append('display_name', document.getElementById('pName').value);
        fd.append('bio', document.getElementById('pBio').value);
        if(document.getElementById('pInput').files[0]) fd.append('profile_pic', document.getElementById('pInput').files[0]);
        await fetch('/', { method: 'POST', body: fd }); 
        btn.innerText = "SAVE CHANGES"; hideProfile(); update();
      }

      function selectUser(u) { 
        selectedUser = u; document.getElementById('chatName').innerText = u; 
        document.getElementById('inputBar').classList.remove('hidden'); 
        update(); if(window.innerWidth < 1024) toggleSidebar(); 
        const box = document.getElementById('chatBox');
        setTimeout(() => box.scrollTop = box.scrollHeight, 300);
      }

      async function sendChat() {
        const i = document.getElementById('msgInput'), b = document.getElementById('sendBtn');
        if(!i.value && !tempFile) return;
        b.disabled = true; b.innerText = "...";
        const fd = new FormData(); fd.append('action', 'chat'); fd.append('to', selectedUser); fd.append('message', i.value);
        if(tempFile) fd.append('file', tempFile);
        
        i.value = ""; 
        clearMedia(); // Langsung hapus preview setelah klik kirim

        await fetch('/', { method: 'POST', body: fd });
        b.disabled = false; b.innerText = "SEND"; update();
        const box = document.getElementById('chatBox');
        setTimeout(() => box.scrollTop = box.scrollHeight, 300);
      }

      setInterval(update, 5000); update();
    </script>
  </body></html>`;
      }

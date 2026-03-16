const CONFIG = {
  driveFileId: "17ECgOYPEQ1bNdW8Gh_2D7rwSyHtrTpwg",
  mediaFolderId: "1hdon9vKWqoeQUZL5K2t9gFfxNUJAjNER", 
  clientEmail: "datasabe@database-490402.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDUmMjmsxTWcmyC\nALQtKLjF2KBN1A3wbx6PwxwhGS9Lo9VmfUy+Py7xhbWwxItcSUt/HJg/UGXvHe7L\nuhwUEXvCOXJCTfGDUEm7AEtrJn2UYbo70gjkymrSkotTbANuL0rzTAJzjFq3IEST\nq2cQ6I40DQSUSKwLEhIW2y9IR+9+EQ9/3YUyNFINFx1femQNxE+vRFzxLr0oiN/p\nicP4mcpOfwVLqnn4q3ArsMKcSKtkgNjhzUYNUIKdx/JoBgx9iCC4t4FhKvUQ6Smj\nwQnJiixb39Ga8ATTqiUhQotuugO/tjNhb4+ILWZvjGkLKlP/x8AGrBsacCTU1S87\nH26Jeq+tAgMBAAECggEARjW093eB9LZyPlbUKivOJcy+WCWletd/vNOfORETrQPM\nyJ2t2BCOxMW3NMscCRzNmYuMfjBjkZ4NjGuItVn2yLRnFx2dmpPL3b2hqp/aDkRe\nGD5roH922tb5u1GrKlrlAkeCcb2TAfJeo3QSRCPBPtBjyELdyoQrxC+bxF+5aKTI\nfj9g/2PN1tDWB6i+TAS/g/TWqxAiKB0keAt3hnZ2C3cam6W4sLCRp4drSVSLrvax\n7WrR3iRAvQd0Vn2VZB/y15TnB3UKOPGDBBNKJ8yP09YogxXTpefEsNmFaG/rbOEf\nmLbCmTffVcB5iOmI9C0dOg0g1XW1JJSQPWD0wPkEgwKBgQDz/q7r4URRAIm2OHD2\nqUHhNBzyqEkTYH/bTuIUTwdjyoaLfs8swv7mHFg/cV6xLYOZp1DXayYJUDCxmYVo\nlNFvWyI2yrTFvK5Lk+rLUWSlR/jxqVsiTZgikubWNpe15r0zRXbroVaZA550VWDx\n5zh7dOHU3B3NU0u7G5cms6nUIwKBgQDfDp4CmCOBrW3jk9h3N/bv8T8rmOwJMfgu\B5L/hSpU2GW39yNRiKsQCO8gdbLdUZ2WzUflA8f+vNlTe9feE6tF9HDfHS6fh6lP\n6VtQA+FhAqsoJqNcD1Xs50prDVYYQdJYwaFkmrDH1NWm3YEdkVc9VzIetQuGs826\nJVNlWliB7wKBgQDewzV8kexHcBBK13j7GkjVjTioqtAc6suQtJJgLE744ty32wzX\ Nyh1eodvVNg5Nu6hiEqcgmz1r8rlOt68PrJ/0lqIX8VvivYudlu1SRh0diNor1BP\nHzy4xBoQlUMphgJTHyaVtnVTuiQe3hxmfs3omSvdpSFoZpYLvALiCMIStQKBgQCb\nMNNU4L8LcTucc/fOcpyXMlUOIzZN63tNoy1uJBtgrrKOvR7QknLaFC0ze1A31Zn8\nGtUjjG7wWDoocGivdSXb5QdG5EnU6pEtLSG/2QNM+ItWwxMzcOQKkJ1hQAUfmWQd\nJpMAqPPIBNelYkV76ew1nF4dqT7cuGqxUVjlkmcz9wKBgFNoTVJd0q74F1UDWe9c\n4xSA+9HVaNkZmv083rT7Eo541Zi59YlULWc/TxIRtU4vZk/cNpuCLMvhreQLZrXb\n98NFWbbO7TVIEonjuJdYLyd3l+6l6NzNHznOH8oMQqSVJDukp6dWRZm57sj/BMac\nRdT/4DRIXtKqHIEK4awVztJz\n-----END PRIVATE KEY-----\n"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cookie = request.headers.get("Cookie") || "";
    const username = (cookie.match(/user_session=([^;]+)/) || [])[1];

    if (url.pathname === "/api/data") {
      const token = await getAccessToken();
      return new Response(await getDriveFile(token), { headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/logout") {
      return new Response("OK", { status: 302, headers: { "Location": "/", "Set-Cookie": "user_session=; Path=/; Max-Age=0" } });
    }

    if (request.method === "POST") {
      const token = await getAccessToken();
      const formData = await request.formData();
      const action = formData.get("action");
      let db = JSON.parse(await getDriveFile(token));

      if (action === "register" || action === "login") {
        const user = formData.get("username").trim();
        if (!db.users) db.users = {};
        
        if (action === "register") {
          if (db.users[user]) return new Response("User sudah ada", { status: 400 });
          db.users[user] = { name: user, bio: "Hey there!", avatar: "" };
        } else {
          if (!db.users[user]) return new Response("User tidak ditemukan", { status: 400 });
        }
        
        await updateDriveFile(token, JSON.stringify(db, null, 2));
        return new Response("OK", { status: 302, headers: { "Location": "/", "Set-Cookie": `user_session=${user}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400` } });
      }

      if (action === "updateProfile") {
        const bio = formData.get("bio");
        const avatar = formData.get("avatar");
        if (db.users[username]) {
          db.users[username].bio = bio;
          db.users[username].avatar = avatar;
          await updateDriveFile(token, JSON.stringify(db, null, 2));
          return new Response(JSON.stringify({ status: "success" }));
        }
      }

      if (action === "uploadMedia") {
        const file = formData.get("file");
        const driveRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=media', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': file.type },
          body: await file.arrayBuffer()
        });
        const fileData = await driveRes.json();
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'reader', type: 'anyone' })
        });
        return new Response(JSON.stringify({ url: `https://lh3.googleusercontent.com/u/0/d/${fileData.id}` }));
      }

      if (action === "chat") {
        const to = formData.get("to");
        const cId = [username, to].sort().join("_");
        if (!db.privateChats) db.privateChats = {};
        if (!db.privateChats[cId]) db.privateChats[cId] = [];
        db.privateChats[cId].push({
          id: Date.now().toString(), from: username, text: formData.get("message") || "",
          type: formData.get("type") || "text", mediaUrl: formData.get("mediaUrl") || null,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          deletedFor: []
        });
        await updateDriveFile(token, JSON.stringify(db, null, 2));
        return new Response(JSON.stringify({ status: "success" }));
      }
    }

    if (!username) return new Response(renderAuthPage(), { headers: { "Content-Type": "text/html" } });
    const token = await getAccessToken();
    const db = JSON.parse(await getDriveFile(token));
    return new Response(renderMainApp(username, db), { headers: { "Content-Type": "text/html" } });
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
  return (await res.json()).access_token;
}
async function getDriveFile(token) { const res = await fetch(`https://www.googleapis.com/drive/v3/files/${CONFIG.driveFileId}?alt=media`, { headers: { 'Authorization': `Bearer ${token}` } }); return await res.text(); }
async function updateDriveFile(token, content) { await fetch(`https://www.googleapis.com/upload/drive/v3/files/${CONFIG.driveFileId}?uploadType=media`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: content }); }
function str2ab(str) { const buf = new ArrayBuffer(str.length); const bufView = new Uint8Array(buf); for (let i = 0; i < str.length; i++) { bufView[i] = str.charCodeAt(i); } return buf; }

function renderAuthPage() {
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>
  <body class="bg-[#0b0f1a] flex items-center justify-center min-h-screen text-white p-6 font-sans">
    <div class="w-full max-w-sm">
      <div class="text-center mb-10">
        <h1 class="text-5xl font-black text-blue-500 italic tracking-tighter mb-2">THE HUB</h1>
        <p class="text-xs text-zinc-500 uppercase tracking-widest font-bold">Secure Private Space</p>
      </div>
      <div class="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl backdrop-blur-md">
        <div class="flex gap-4 mb-8">
          <button id="tabLogin" onclick="setTab('login')" class="flex-1 py-2 border-b-2 border-blue-500 font-black text-xs uppercase">Login</button>
          <button id="tabReg" onclick="setTab('register')" class="flex-1 py-2 border-b-2 border-transparent text-zinc-600 font-black text-xs uppercase">Daftar</button>
        </div>
        <form method="POST" id="authForm">
          <input type="hidden" name="action" id="authAction" value="login">
          <input name="username" required placeholder="Username..." class="w-full p-4 rounded-2xl bg-zinc-800 border border-zinc-700 mb-6 outline-none focus:border-blue-600 transition-all text-sm">
          <button id="submitBtn" class="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">Masuk</button>
        </form>
      </div>
    </div>
    <script>
      function setTab(t) {
        document.getElementById('authAction').value = t;
        document.getElementById('submitBtn').innerText = t === 'login' ? 'Masuk' : 'Buat Akun';
        document.getElementById('tabLogin').className = t === 'login' ? 'flex-1 py-2 border-b-2 border-blue-500 font-black text-xs uppercase' : 'flex-1 py-2 border-b-2 border-transparent text-zinc-600 font-black text-xs uppercase';
        document.getElementById('tabReg').className = t === 'register' ? 'flex-1 py-2 border-b-2 border-blue-500 font-black text-xs uppercase' : 'flex-1 py-2 border-b-2 border-transparent text-zinc-600 font-black text-xs uppercase';
      }
    </script>
  </body></html>`;
}

function renderMainApp(currentUser, db) {
  const myData = db.users[currentUser] || { name: currentUser, bio: "", avatar: "" };
  return `<!DOCTYPE html><html><head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .safe-bottom { padding-bottom: calc(1rem + env(safe-area-inset-bottom)); }
    #sidebar.hidden-mobile { transform: translateX(-100%); }
    .avatar-ring { border: 2px solid #2563eb; }
  </style></head>
  <body class="bg-black text-zinc-300 h-screen flex flex-col overflow-hidden font-sans">
    <div class="flex flex-1 overflow-hidden">
      
      <div id="sidebar" class="fixed lg:static inset-0 w-full lg:w-96 border-r border-zinc-900 bg-[#0b0f1a] z-50 transition-transform duration-300">
        <div class="p-6 border-b border-zinc-900 flex justify-between items-center">
          <div class="flex items-center gap-3 cursor-pointer" onclick="openProfile()">
            <img src="${myData.avatar || 'https://ui-avatars.com/api/?name='+currentUser}" class="w-10 h-10 rounded-full border-2 border-blue-600 bg-zinc-800">
            <div>
              <div class="text-sm font-black text-white leading-none">${currentUser}</div>
              <div class="text-[8px] font-bold text-zinc-500 uppercase mt-1">Lihat Profil</div>
            </div>
          </div>
          <a href="/logout" class="text-[9px] font-black opacity-30">EXIT</a>
        </div>
        <div id="userList" class="p-2 space-y-1 overflow-y-auto h-full pb-32"></div>
      </div>

      <div class="flex-1 flex flex-col bg-black relative">
        <div id="chatHeader" class="p-4 bg-[#0b0f1a] border-b border-zinc-900 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button onclick="document.getElementById('sidebar').classList.remove('hidden-mobile')" class="lg:hidden text-blue-500 text-xl font-bold">☰</button>
            <div id="headerInfo" class="flex items-center gap-3">
               <div id="activeChatName" class="font-black text-white uppercase text-xs tracking-widest">The Hub</div>
            </div>
          </div>
        </div>
        
        <div id="chatBox" class="flex-1 p-6 overflow-y-auto flex flex-col gap-4"></div>

        <div id="inputBar" class="hidden p-4 bg-[#0b0f1a] safe-bottom border-t border-zinc-900">
          <div class="flex items-center gap-3 bg-zinc-900 p-2 rounded-3xl border border-zinc-800">
            <label class="w-10 h-10 flex items-center justify-center text-blue-500 text-2xl cursor-pointer hover:bg-zinc-800 rounded-full">+</label>
            <input type="file" class="hidden" id="fileInp" onchange="handleFile(this)">
            <input id="msgInput" placeholder="Ketik..." class="flex-1 bg-transparent p-2 outline-none text-sm text-white">
            <button onclick="sendChat()" class="bg-blue-600 text-white px-6 py-2 rounded-2xl font-black text-[10px] uppercase">Send</button>
          </div>
        </div>
      </div>
    </div>

    <div id="profileModal" class="hidden fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-6 backdrop-blur-xl">
      <div class="bg-zinc-900 p-8 rounded-[3rem] w-full max-w-xs text-center border border-zinc-800">
        <div class="relative w-24 h-24 mx-auto mb-6">
          <img id="myAvatar" src="${myData.avatar || 'https://ui-avatars.com/api/?name='+currentUser}" class="w-24 h-24 rounded-full border-4 border-blue-600 bg-zinc-800 object-cover">
          <label class="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer shadow-lg">
            <input type="file" class="hidden" onchange="updateAvatar(this)">📸
          </label>
        </div>
        <div class="font-black text-white uppercase text-xl mb-1">${currentUser}</div>
        <textarea id="myBio" placeholder="Ceritakan tentangmu..." class="w-full bg-zinc-800 p-4 rounded-2xl text-xs text-zinc-400 mb-6 outline-none border border-zinc-700 h-24 resize-none">${myData.bio}</textarea>
        <button onclick="saveProfile()" class="w-full bg-blue-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest mb-3">Simpan Perubahan</button>
        <button onclick="closeProfile()" class="text-zinc-500 text-[10px] font-black uppercase">Tutup</button>
      </div>
    </div>

    <audio id="notifSound" src="https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3"></audio>

    <script>
      let selectedUser = "", lastCount = {}, isFirst = true;
      const currentUser = "${currentUser}";

      async function update() {
        const res = await fetch('/api/data');
        const db = await res.json();
        const userMap = db.users || {};
        
        // Render Users
        const users = Object.keys(userMap).filter(u => u !== currentUser);
        document.getElementById('userList').innerHTML = users.map(u => {
          const uInfo = userMap[u];
          const chatId = [currentUser, u].sort().join("_");
          const msgs = (db.privateChats && db.privateChats[chatId]) || [];
          const hasNew = !isFirst && lastCount[chatId] !== undefined && msgs.length > lastCount[chatId] && msgs[msgs.length-1].from !== currentUser;
          lastCount[chatId] = msgs.length;
          if (hasNew && selectedUser !== u) document.getElementById('notifSound').play().catch(()=>{});

          return \`
            <div onclick="selectUser('\${u}')" class="p-4 flex items-center gap-4 hover:bg-zinc-900 rounded-[2rem] cursor-pointer transition-all \${selectedUser === u ? 'bg-zinc-900 border border-zinc-800' : ''}">
              <div class="relative">
                <img src="\${uInfo.avatar || 'https://ui-avatars.com/api/?name='+u}" class="w-12 h-12 rounded-full border-2 \${hasNew ? 'border-red-600' : 'border-zinc-800'}">
                \${hasNew ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-black animate-pulse"></div>' : ''}
              </div>
              <div class="flex-1 overflow-hidden">
                <div class="font-black text-zinc-200 uppercase text-xs truncate">\${u}</div>
                <div class="text-[9px] font-bold text-zinc-600 uppercase truncate">\${uInfo.bio || 'Available'}</div>
              </div>
            </div>\`;
        }).join('');

        if (selectedUser) {
          const chatId = [currentUser, selectedUser].sort().join("_");
          const msgs = (db.privateChats && db.privateChats[chatId]) || [];
          document.getElementById('chatBox').innerHTML = msgs.map(m => {
            const isMe = m.from === currentUser;
            let body = m.text;
            if(m.type === 'image') body = \`<img src="\${m.mediaUrl}" class="rounded-2xl max-h-64 mb-2"><p>\${m.text}</p>\`;
            return \`
              <div class="flex flex-col \${isMe ? 'items-end' : 'items-start'}">
                <div class="max-w-[85%] p-4 rounded-3xl \${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-zinc-900 border border-zinc-800 rounded-tl-none'} shadow-xl">
                  <div class="text-sm">\${body}</div>
                  <div class="text-[8px] opacity-40 mt-1 font-black uppercase">\${m.time}</div>
                </div>
              </div>\`;
          }).join('');
          if(isFirst) { const b = document.getElementById('chatBox'); b.scrollTop = b.scrollHeight; }
        }
        isFirst = false;
      }

      function selectUser(u) {
        selectedUser = u; 
        document.getElementById('activeChatName').innerText = u;
        document.getElementById('inputBar').classList.remove('hidden');
        document.getElementById('sidebar').classList.add('hidden-mobile');
        isFirst = true; update();
      }

      function openProfile() { document.getElementById('profileModal').classList.remove('hidden'); }
      function closeProfile() { document.getElementById('profileModal').classList.add('hidden'); }

      async function updateAvatar(inp) {
        if(!inp.files[0]) return;
        const fd = new FormData(); fd.append('action', 'uploadMedia'); fd.append('file', inp.files[0]);
        const res = await fetch('/', { method: 'POST', body: fd });
        const data = await res.json();
        document.getElementById('myAvatar').src = data.url;
      }

      async function saveProfile() {
        const bio = document.getElementById('myBio').value;
        const avatar = document.getElementById('myAvatar').src;
        const fd = new FormData(); fd.append('action', 'updateProfile'); fd.append('bio', bio); fd.append('avatar', avatar);
        await fetch('/', { method: 'POST', body: fd });
        closeProfile(); update();
      }

      async function sendChat() {
        const i = document.getElementById('msgInput'); if(!i.value.trim()) return;
        const txt = i.value; i.value = "";
        const fd = new FormData(); fd.append('action', 'chat'); fd.append('to', selectedUser); fd.append('message', txt);
        await fetch('/', { method: 'POST', body: fd }); update();
      }

      async function handleFile(inp) {
        if(!inp.files[0]) return;
        const fd = new FormData(); fd.append('action', 'uploadMedia'); fd.append('file', inp.files[0]);
        const res = await fetch('/', { method: 'POST', body: fd });
        const data = await res.json();
        const msgFd = new FormData(); msgFd.append('action', 'chat'); msgFd.append('to', selectedUser); msgFd.append('type', 'image'); msgFd.append('mediaUrl', data.url);
        await fetch('/', { method: 'POST', body: msgFd }); update();
      }

      setInterval(update, 3000); update();
    </script>
  </body></html>`;
            }

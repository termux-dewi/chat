const CONFIG = {
  driveFileId: "17ECgOYPEQ1bNdW8Gh_2D7rwSyHtrTpwg",
  // Gunakan folder ID khusus untuk menyimpan media agar tidak berantakan dengan file database
  mediaFolderId: "1hdon9vKWqoeQUZL5K2t9gFfxNUJAjNER", 
  clientEmail: "datasabe@database-490402.iam.gserviceaccount.com",
  adminUser: "admin_dewi",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDUmMjmsxTWcmyC\nALQtKLjF2KBN1A3wbx6PwxwhGS9Lo9VmfUy+Py7xhbWwxItcSUt/HJg/UGXvHe7L\nuhwUEXvCOXJCTfGDUEm7AEtrJn2UYbo70gjkymrSkotTbANuL0rzTAJzjFq3IEST\nq2cQ6I40DQSUSKwLEhIW2y9IR+9+EQ9/3YUyNFINFx1femQNxE+vRFzxLr0oiN/p\nicP4mcpOfwVLqnn4q3ArsMKcSKtkgNjhzUYNUIKdx/JoBgx9iCC4t4FhKvUQ6Smj\nwQnJiixb39Ga8ATTqiUhQotuugO/tjNhb4+ILWZvjGkLKlP/x8AGrBsacCTU1S87\nH26Jeq+tAgMBAAECggEARjW093eB9LZyPlbUKivOJcy+WCWletd/vNOfORETrQPM\nyJ2t2BCOxMW3NMscCRzNmYuMfjBjkZ4NjGuItVn2yLRnFx2dmpPL3b2hqp/aDkRe\nGD5roH922tb5u1GrKlrlAkeCcb2TAfJeo3QSRCPBPtBjyELdyoQrxC+bxF+5aKTI\nfj9g/2PN1tDWB6i+TAS/g/TWqxAiKB0keAt3hnZ2C3cam6W4sLCRp4drSVSLrvax\n7WrR3iRAvQd0Vn2VZB/y15TnB3UKOPGDBBNKJ8yP09YogxXTpefEsNmFaG/rbOEf\nmLbCmTffVcB5iOmI9C0dOg0g1XW1JJSQPWD0wPkEgwKBgQDz/q7r4URRAIm2OHD2\nqUHhNBzyqEkTYH/bTuIUTwdjyoaLfs8swv7mHFg/cV6xLYOZp1DXayYJUDCxmYVo\nlNFvWyI2yrTFvK5Lk+rLUWSlR/jxqVsiTZgikubWNpe15r0zRXbroVaZA550VWDx\n5zh7dOHU3B3NU0u7G5cms6nUIwKBgQDfDp4CmCOBrW3jk9h3N/bv8T8rmOwJMfgu\nB5L/hSpU2GW39yNRiKsQCO8gdbLdUZ2WzUflA8f+vNlTe9feE6tF9HDfHS6fh6lP\n6VtQA+FhAqsoJqNcD1Xs50prDVYYQdJYwaFkmrDH1NWm3YEdkVc9VzIetQuGs826\nJVNlWliB7wKBgQDewzV8kexHcBBK13j7GkjVjTioqtAc6suQtJJgLE744ty32wzX\ Nyh1eodvVNg5Nu6hiEqcgmz1r8rlOt68PrJ/0lqIX8VvivYudlu1SRh0diNor1BP\nHzy4xBoQlUMphgJTHyaVtnVTuiQe3hxmfs3omSvdpSFoZpYLvALiCMIStQKBgQCb\nMNNU4L8LcTucc/fOcpyXMlUOIzZN63tNoy1uJBtgrrKOvR7QknLaFC0ze1A31Zn8\nGtUjjG7wWDoocGivdSXb5QdG5EnU6pEtLSG/2QNM+ItWwxMzcOQKkJ1hQAUfmWQd\nJpMAqPPIBNelYkV76ew1nF4dqT7cuGqxUVjlkmcz9wKBgFNoTVJd0q74F1UDWe9c\n4xSA+9HVaNkZmv083rT7Eo541Zi59YlULWc/TxIRtU4vZk/cNpuCLMvhreQLZrXb\n98NFWbbO7TVIEonjuJdYLyd3l+6l6NzNHznOH8oMQqSVJDukp6dWRZm57sj/BMac\nRdT/4DRIXtKqHIEK4awVztJz\n-----END PRIVATE KEY-----\n"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cookie = request.headers.get("Cookie") || "";
    const username = (cookie.match(/user_session=([^;]+)/) || [])[1];

    if (url.pathname === "/api/data") {
      const token = await getAccessToken();
      const data = await getDriveFile(token);
      return new Response(data, { headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/logout") {
      return new Response("OK", { status: 302, headers: { "Location": "/", "Set-Cookie": "user_session=; Path=/; Max-Age=0" } });
    }

    if (request.method === "POST" && url.searchParams.has("login")) {
      const formData = await request.formData();
      const user = formData.get("username") || "Guest";
      return new Response("OK", { status: 302, headers: { "Location": "/", "Set-Cookie": `user_session=${user}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400` } });
    }

    if (!username) return new Response(renderLogin(), { headers: { "Content-Type": "text/html" } });

    if (request.method === "POST") {
      const token = await getAccessToken();
      const formData = await request.formData();
      const action = formData.get("action");
      let db = JSON.parse(await getDriveFile(token));

      if (action === "uploadMedia") {
        const file = formData.get("file");
        const fileName = `${Date.now()}_${file.name}`;
        // Upload ke Drive
        const driveRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=media', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': file.type },
          body: await file.arrayBuffer()
        });
        const fileData = await driveRes.json();
        
        // Buat file publik agar bisa dilihat link-nya
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'reader', type: 'anyone' })
        });

        // Link thumbnail/media Drive
        const mediaUrl = `https://lh3.googleusercontent.com/u/0/d/${fileData.id}`;
        return new Response(JSON.stringify({ url: mediaUrl }));
      }

      if (action === "chat") {
        const to = formData.get("to");
        const cId = [username, to].sort().join("_");
        if (!db.privateChats) db.privateChats = {};
        if (!db.privateChats[cId]) db.privateChats[cId] = [];
        db.privateChats[cId].push({
          id: Date.now().toString(),
          from: username,
          text: formData.get("message") || "",
          type: formData.get("type") || "text",
          mediaUrl: formData.get("mediaUrl") || null,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          edited: false,
          deletedFor: []
        });
      } else if (action === "editChat") {
        const msg = db.privateChats[formData.get("chatId")].find(m => m.id === formData.get("msgId"));
        if (msg && msg.from === username) { msg.text = formData.get("newMessage"); msg.edited = true; }
      } else if (action === "deleteForAll") {
        const msg = db.privateChats[formData.get("chatId")].find(m => m.id === formData.get("msgId"));
        if (msg && msg.from === username) { msg.text = "Pesan dihapus"; msg.type = "deleted"; msg.mediaUrl = null; }
      }

      await updateDriveFile(token, JSON.stringify(db, null, 2));
      return new Response(JSON.stringify({ status: "success" }));
    }

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
  const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}` });
  const data = await res.json(); return data.access_token;
}
async function getDriveFile(token) { const res = await fetch(`https://www.googleapis.com/drive/v3/files/${CONFIG.driveFileId}?alt=media`, { headers: { 'Authorization': `Bearer ${token}` } }); return await res.text(); }
async function updateDriveFile(token, content) { await fetch(`https://www.googleapis.com/upload/drive/v3/files/${CONFIG.driveFileId}?uploadType=media`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: content }); }
function str2ab(str) { const buf = new ArrayBuffer(str.length); const bufView = new Uint8Array(buf); for (let i = 0; i < str.length; i++) { bufView[i] = str.charCodeAt(i); } return buf; }

function renderLogin() {
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>
  <body class="bg-black flex items-center justify-center min-h-screen text-white"><form method="POST" action="?login" class="w-full max-w-xs text-center">
    <h1 class="text-4xl font-black text-blue-500 italic mb-8">THE HUB</h1>
    <input name="username" placeholder="Nickname..." class="w-full p-4 rounded-2xl bg-zinc-900 border border-zinc-800 mb-4 outline-none focus:border-blue-600">
    <button class="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-xs">Connect</button>
  </form></body></html>`;
}

function renderMainApp(currentUser, db) {
  return `<!DOCTYPE html><html><head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .safe-bottom { padding-bottom: calc(1rem + env(safe-area-inset-bottom)); }
    #sidebar.hidden-mobile { transform: translateX(-100%); }
  </style></head>
  <body class="bg-black text-zinc-300 h-screen flex flex-col overflow-hidden">
    <div class="flex flex-1 overflow-hidden">
      <div id="sidebar" class="fixed lg:static inset-0 w-full lg:w-96 border-r border-zinc-900 bg-[#0b0f1a] z-50 transition-transform">
        <div class="p-6 border-b border-zinc-900 flex justify-between items-center">
          <h1 class="text-xl font-black text-blue-500 italic">THE HUB</h1>
          <a href="/logout" class="text-[9px] font-black opacity-50">LOGOUT</a>
        </div>
        <div id="userList" class="p-2 space-y-1 overflow-y-auto h-full"></div>
      </div>

      <div class="flex-1 flex flex-col bg-black">
        <div class="p-4 bg-[#0b0f1a] border-b border-zinc-900 flex items-center gap-4">
          <button onclick="document.getElementById('sidebar').classList.remove('hidden-mobile')" class="lg:hidden text-blue-500">☰</button>
          <div id="activeChatName" class="font-black text-white uppercase text-sm tracking-widest">Pilih Kontak</div>
        </div>
        <div id="chatBox" class="flex-1 p-6 overflow-y-auto flex flex-col gap-4"></div>

        <div id="inputBar" class="hidden p-4 bg-[#0b0f1a] safe-bottom">
          <div class="flex items-center gap-3 bg-zinc-900 p-2 rounded-3xl border border-zinc-800">
            <label class="w-10 h-10 flex items-center justify-center text-blue-500 text-2xl cursor-pointer">
              + <input type="file" class="hidden" id="fileInp" onchange="handleFile(this)">
            </label>
            <input id="msgInput" placeholder="Ketik pesan..." class="flex-1 bg-transparent p-2 outline-none text-sm text-white">
            <button id="sendBtn" onclick="sendChat()" class="bg-blue-600 text-white px-6 py-2 rounded-2xl font-black text-[10px] uppercase">Send</button>
          </div>
        </div>
      </div>
    </div>

    <div id="actionModal" class="hidden fixed inset-0 bg-black/90 flex items-center justify-center z-[100] backdrop-blur-sm p-6">
      <div class="bg-zinc-900 p-6 rounded-[2.5rem] w-full max-w-xs space-y-3">
        <button id="editBtn" onclick="editMsg()" class="w-full py-4 bg-zinc-800 rounded-2xl text-white font-black text-[10px] uppercase">Edit</button>
        <button id="delBtn" onclick="delMsg()" class="w-full py-4 bg-red-600/20 text-red-500 rounded-2xl font-black text-[10px] uppercase">Hapus Semua</button>
        <button onclick="closeModal()" class="w-full py-2 text-zinc-500 text-[10px] font-black uppercase">Batal</button>
      </div>
    </div>

    <script>
      let selectedUser = "", activeMsgId = "", activeChatId = "", activeText = "";
      const currentUser = "${currentUser}";

      async function update() {
        const res = await fetch('/api/data');
        const db = await res.json();
        const users = (db.users || []).filter(u => u !== currentUser);
        document.getElementById('userList').innerHTML = users.map(u => \`
          <div onclick="selectUser('\${u}')" class="p-4 flex items-center gap-4 hover:bg-zinc-900 rounded-2xl cursor-pointer">
            <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-black text-white">\${u[0].toUpperCase()}</div>
            <div class="font-black text-zinc-200 uppercase text-xs">\${u}</div>
          </div>\`).join('');

        if (selectedUser) {
          const chatId = [currentUser, selectedUser].sort().join("_");
          const msgs = (db.privateChats && db.privateChats[chatId]) || [];
          document.getElementById('chatBox').innerHTML = msgs.map(m => {
            const isMe = m.from === currentUser;
            let body = m.text;
            if(m.type === 'image') body = \`<img src="\${m.mediaUrl}" class="rounded-xl mb-2"><p>\${m.text}</p>\`;
            if(m.type === 'video') body = \`<video src="\${m.mediaUrl}" controls class="rounded-xl mb-2"></video><p>\${m.text}</p>\`;
            return \`
              <div class="flex flex-col \${isMe ? 'items-end' : 'items-start'}">
                <div onclick="openActions('\${m.id}','\${chatId}',\${isMe},'\${m.text}')" class="max-w-[85%] p-4 rounded-2xl \${isMe ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-zinc-800'}">
                  \${body}
                  <div class="text-[8px] opacity-40 mt-1 uppercase font-black">\${m.edited?'EDITED • ':''}\${m.time}</div>
                </div>
              </div>\`;
          }).join('');
        }
      }

      function selectUser(u) {
        selectedUser = u; 
        document.getElementById('activeChatName').innerText = u;
        document.getElementById('inputBar').classList.remove('hidden');
        document.getElementById('sidebar').classList.add('hidden-mobile');
        update();
      }

      async function handleFile(inp) {
        if(!inp.files[0]) return;
        document.getElementById('sendBtn').innerText = "...";
        const fd = new FormData(); fd.append('action', 'uploadMedia'); fd.append('file', inp.files[0]);
        const res = await fetch('/', { method: 'POST', body: fd });
        const data = await res.json();
        
        const type = inp.files[0].type.startsWith('image') ? 'image' : 'video';
        const msgFd = new FormData();
        msgFd.append('action', 'chat'); msgFd.append('to', selectedUser); 
        msgFd.append('type', type); msgFd.append('mediaUrl', data.url);
        await fetch('/', { method: 'POST', body: msgFd });
        document.getElementById('sendBtn').innerText = "SEND";
        update();
      }

      async function sendChat() {
        const i = document.getElementById('msgInput'); if(!i.value.trim()) return;
        const fd = new FormData(); fd.append('action', 'chat'); fd.append('to', selectedUser); fd.append('message', i.value);
        await fetch('/', { method: 'POST', body: fd }); i.value = ""; update();
      }

      function openActions(mId, cId, isMe, txt) {
        if(!isMe) return; activeMsgId=mId; activeChatId=cId; activeText=txt;
        document.getElementById('actionModal').classList.remove('hidden');
      }
      function closeModal() { document.getElementById('actionModal').classList.add('hidden'); }
      
      async function editMsg() {
        const n = prompt("Edit:", activeText);
        if(n) {
          const fd = new FormData(); fd.append('action', 'editChat'); fd.append('chatId', activeChatId); fd.append('msgId', activeMsgId); fd.append('newMessage', n);
          await fetch('/', { method: 'POST', body: fd });
        }
        closeModal(); update();
      }

      async function delMsg() {
        if(confirm('Hapus untuk semua?')) {
          const fd = new FormData(); fd.append('action', 'deleteForAll'); fd.append('chatId', activeChatId); fd.append('msgId', activeMsgId);
          await fetch('/', { method: 'POST', body: fd });
        }
        closeModal(); update();
      }

      setInterval(update, 5000); update();
    </script>
  </body></html>`;
}

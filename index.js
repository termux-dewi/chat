const BACKEND = "https://api.darkdocker.qzz.io";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const cookie = request.headers.get("Cookie") || "";
    const user = (cookie.match(/(?:^|; )user_session=([^;]*)/) || [])[1];

    if (request.method === "POST" || url.pathname.startsWith("/api/")) {
      return fetch(BACKEND + url.pathname + url.search, { method: request.method, headers: request.headers, body: request.body });
    }
    if (url.pathname === "/logout") return new Response("OK", { headers: { "Set-Cookie": "user_session=; Path=/; Max-Age=0", "Location": "/" }, status: 302 });
    if (!user) return new Response(renderAuth(), { headers: { "Content-Type": "text/html" } });
    return new Response(renderMain(user), { headers: { "Content-Type": "text/html" } });
  }
};

function renderAuth() {
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#111b21] flex items-center justify-center h-screen text-white p-6"><div class="w-full max-w-sm text-center"><h1 class="text-emerald-500 text-5xl font-bold mb-10 italic">WhatsApp</h1><div class="space-y-4"><input id="u" placeholder="Username" class="w-full bg-[#2a3942] p-4 rounded-xl outline-none focus:ring-2 ring-emerald-500"><input id="p" type="password" placeholder="Password" class="w-full bg-[#2a3942] p-4 rounded-xl outline-none focus:ring-2 ring-emerald-500"><button onclick="auth('/login')" class="w-full bg-emerald-600 p-4 rounded-xl font-bold uppercase tracking-wider">Masuk</button><button onclick="auth('/register')" class="w-full border border-emerald-600 p-4 rounded-xl text-emerald-500 font-bold uppercase tracking-wider">Daftar</button></div></div><script>async function auth(p){const fd=new FormData();fd.append('username',u.value);fd.append('password',p.value);const r=await fetch(p,{method:'POST',body:fd});if(r.ok)location.reload();else alert('Gagal');}</script></body></html>`;
}

function renderMain(user) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"><script src="https://cdn.tailwindcss.com"></script><style>
    body { background-color: #0b141a; color: #e9edef; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; overflow: hidden; }
    .wa-bg { background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png'); background-blend-mode: overlay; background-color: #0b141a; background-size: contain; }
    .chat-bubble-me { background-color: #005c4b; border-radius: 10px 0px 10px 10px; position: relative; }
    .chat-bubble-you { background-color: #202c33; border-radius: 0px 10px 10px 10px; position: relative; }
    audio::-webkit-media-controls-panel { background-color: #2a3942; }
    audio { height: 35px; width: 220px; }
  </style></head>
  <body class="h-screen flex flex-col">
    <div id="app" class="flex flex-1 overflow-hidden">
      <div id="side" class="w-full md:w-[400px] flex flex-col bg-[#111b21] border-r border-white/5 z-20">
        <header class="p-3 bg-[#202c33] flex justify-between items-center shadow-md">
          <div id="myAv" onclick="toggleP()" class="w-10 h-10 rounded-full bg-gray-600 overflow-hidden cursor-pointer"></div>
          <div class="flex gap-5 text-[#aebac1] text-xl"><span>⭕</span><span>💬</span><span onclick="location.href='/logout'">🚪</span></div>
        </header>
        <div id="contactList" class="flex-1 overflow-y-auto"></div>
      </div>

      <div id="main" class="hidden md:flex flex-1 flex-col wa-bg relative z-10">
        <header class="p-2 bg-[#202c33] flex justify-between items-center shadow-sm z-30">
          <div class="flex items-center gap-3">
            <button onclick="back()" class="md:hidden text-2xl px-2">←</button>
            <div id="hAv" class="w-10 h-10 rounded-full bg-gray-600 overflow-hidden"></div>
            <div><div id="hName" class="font-bold text-[15px]">Pilih Chat</div><div id="hStat" class="text-[11px] text-emerald-500 uppercase font-bold tracking-tighter"></div></div>
          </div>
          <div class="flex gap-6 text-[#aebac1] text-xl px-2"><button onclick="call('voice')">📞</button><button onclick="call('video')">📹</button></div>
        </header>

        <div id="box" class="flex-1 overflow-y-auto p-3 space-y-2 flex flex-col"></div>

        <footer id="foot" class="hidden p-2 bg-[#202c33] flex items-center gap-2 z-30">
          <label class="cursor-pointer text-2xl p-2">📎<input type="file" id="fIn" class="hidden" onchange="previewMedia(this)"></label>
          <input id="mIn" class="flex-1 bg-[#2a3942] p-3 rounded-xl outline-none text-sm placeholder:text-gray-500" placeholder="Ketik pesan..." onkeypress="if(event.key==='Enter')sendText()">
          <button id="vnBtn" onclick="toggleVN()" class="p-2 text-2xl transition-all">🎙️</button>
          <button onclick="sendText()" class="p-2 text-3xl text-emerald-500">➤</button>
        </footer>
      </div>

      <div id="pvWrap" class="hidden fixed inset-0 z-[100] bg-[#0b141a] flex flex-col">
        <header class="p-4 flex items-center gap-4 bg-[#202c33]">
          <button onclick="closePreview()" class="text-2xl">✕</button><span class="font-bold">Pratinjau</span>
        </header>
        <div id="pvContent" class="flex-1 flex items-center justify-center p-4"></div>
        <div class="p-3 bg-[#202c33] flex items-center gap-2">
          <input id="pvCap" class="flex-1 bg-[#2a3942] p-4 rounded-xl outline-none" placeholder="Tambahkan keterangan...">
          <button onclick="sendMedia()" class="bg-emerald-600 p-4 rounded-full">➤</button>
        </div>
      </div>

      <div id="pMod" class="hidden fixed inset-0 z-[110] bg-black/90 flex justify-center items-center p-6">
        <div class="bg-[#202c33] p-8 rounded-3xl w-full max-w-xs text-center border border-white/5">
          <div id="pAv" class="w-32 h-32 mx-auto rounded-full overflow-hidden mb-6 border-4 border-emerald-500"></div>
          <input type="file" id="pPicIn" class="hidden" onchange="upP(this)">
          <button onclick="pPicIn.click()" class="text-emerald-500 text-sm font-bold mb-4">GANTI FOTO</button>
          <input id="pName" placeholder="Nama" class="w-full bg-[#111b21] p-3 rounded-lg mb-2 outline-none">
          <input id="pBio" placeholder="Bio" class="w-full bg-[#111b21] p-3 rounded-lg mb-4 outline-none">
          <button onclick="upP()" class="w-full bg-emerald-600 p-3 rounded-xl font-bold">SIMPAN</button>
          <button onclick="toggleP()" class="text-gray-400 mt-4 block mx-auto">Tutup</button>
        </div>
      </div>
    </div>

    <script>
      let db, selU='', me='${user}', rec, chunks=[], pendingFile=null;
      const api = (id) => id ? \`/api/media?id=\${id}\` : 'https://www.w3schools.com/howto/img_avatar.png';

      async function sync() {
        try {
          const r = await fetch('/api/data'); db = await r.json();
          const m = db.users[me]; 
          myAv.innerHTML = pAv.innerHTML = \`<img src="\${api(m.pic)}" class="w-full h-full object-cover">\`;
          renderS(); if(selU) renderC();
        } catch(e){}
      }

      function renderS() {
        const users = Object.keys(db.users).filter(u=>u!==me);
        contactList.innerHTML = users.map(u => \`
          <div onclick="openC('\${u}')" class="p-4 flex items-center gap-4 hover:bg-[#202c33] cursor-pointer \${selU===u?'bg-[#2a3942]':''}">
            <img src="\${api(db.users[u].pic)}" class="w-12 h-12 rounded-full object-cover">
            <div class="flex-1 border-b border-white/5 pb-2 truncate">
              <div class="font-bold text-white">\${db.users[u].name || u}</div>
              <div class="text-xs text-gray-400 truncate">\${db.users[u].bio}</div>
            </div>
          </div>\`).join('');
      }

      function openC(u) { selU=u; side.classList.add('hidden'); main.classList.remove('hidden'); main.classList.add('flex'); foot.classList.remove('hidden'); sync(); }
      function back() { side.classList.remove('hidden'); main.classList.add('hidden'); main.classList.remove('flex'); selU=''; }

      function renderC() {
        const u = db.users[selU]; hName.innerText = u.name || selU; hAv.innerHTML = \`<img src="\${api(u.pic)}" class="w-full h-full object-cover">\`;
        hStat.innerText = (Date.now()-u.lastSeen < 15000) ? 'online' : '';
        const k = [me, selU].sort().join("_");
        box.innerHTML = (db.privateChats[k] || []).map(m => \`
          <div class="flex \${m.from===me?'justify-end':'justify-start'}">
            <div class="max-w-[85%] p-2 \${m.from===me?'chat-bubble-me text-white':'chat-bubble-you text-white'} shadow-md">
              \${m.fileId ? renderMedia(m) : ''}
              <div class="text-[14px] leading-tight mt-1">\${m.text}</div>
              <div class="text-[9px] text-right opacity-50 mt-1">\${m.time}</div>
            </div>
          </div>\`).join('') + '<div id="bot"></div>';
        document.getElementById('bot').scrollIntoView();
      }

      function renderMedia(m) {
        if(m.fileType==='image') return \`<img src="/api/media?id=\${m.fileId}" class="rounded-lg mb-1 max-h-60 w-full object-cover">\`;
        if(m.fileType==='video') return \`<video src="/api/media?id=\${m.fileId}" controls class="rounded-lg mb-1 max-h-60 w-full"></video>\`;
        if(m.fileType==='audio' || m.fileType==='vn') return \`<audio src="/api/media?id=\${m.fileId}" controls></audio>\`;
        return \`<a href="/api/media?id=\${m.fileId}" target="_blank" class="block bg-black/20 p-2 rounded text-[11px] font-bold">📄 \${m.fileName}</a>\`;
      }

      function previewMedia(input) {
        if(!input.files[0]) return;
        pendingFile = input.files[0];
        pvWrap.classList.remove('hidden');
        const url = URL.createObjectURL(pendingFile);
        if(pendingFile.type.startsWith('image')) pvContent.innerHTML = \`<img src="\${url}" class="max-w-full max-h-full rounded-lg shadow-2xl">\`;
        else if(pendingFile.type.startsWith('video')) pvContent.innerHTML = \`<video src="\${url}" controls class="max-w-full max-h-full rounded-lg shadow-2xl"></video>\`;
        else pvContent.innerHTML = \`<div class="text-center text-4xl">📄<br><span class="text-sm">\${pendingFile.name}</span></div>\`;
      }

      function closePreview() { pvWrap.classList.add('hidden'); pendingFile = null; pvCap.value = ''; fIn.value = ''; }

      async function sendMedia() {
        const fd = new FormData(); fd.append('action','chat'); fd.append('to',selU); fd.append('message', pvCap.value);
        fd.append('file', pendingFile);
        let t = pendingFile.type.split('/')[0];
        if(t!=='image' && t!=='video' && t!=='audio') t='document';
        fd.append('fileType', t);
        closePreview(); await fetch('/api/post',{method:'POST',body:fd}); sync();
      }

      async function sendText() {
        if(!mIn.value) return;
        const fd = new FormData(); fd.append('action','chat'); fd.append('to',selU); fd.append('message', mIn.value); fd.append('fileType','text');
        mIn.value=''; await fetch('/api/post',{method:'POST',body:fd}); sync();
      }

      let isRec = false;
      async function toggleVN() {
        if(!isRec) {
          const s = await navigator.mediaDevices.getUserMedia({audio:true});
          rec = new MediaRecorder(s); chunks = [];
          rec.ondataavailable = e => chunks.push(e.data);
          rec.onstop = async () => {
            const fd = new FormData(); fd.append('action','vn'); fd.append('to',selU); fd.append('fileType','vn');
            fd.append('file', new Blob(chunks,{type:'audio/ogg'}), 'vn.ogg');
            await fetch('/api/post',{method:'POST',body:fd}); sync();
          };
          rec.start(); isRec = true; vnBtn.innerText = '🔴';
        } else {
          rec.stop(); isRec = false; vnBtn.innerText = '🎙️';
        }
      }

      async function upP(i) {
        const fd = new FormData(); fd.append('action','update_profile');
        fd.append('name', pName.value); fd.append('bio', pBio.value);
        if(i && i.files[0]) fd.append('file', i.files[0]);
        await fetch('/api/post',{method:'POST',body:fd}); if(!i) toggleP(); sync();
      }
      function toggleP() { pMod.classList.toggle('hidden'); }

      setInterval(sync, 4000); sync();
    </script>
  </body></html>`;
    }

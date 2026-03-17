const BACKEND = "https://api.darkdocker.qzz.io";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const cookie = request.headers.get("Cookie") || "";
    const user = (cookie.match(/(?:^|; )user_session=([^;]*)/) || [])[1];

    if (request.method === "POST" || url.pathname.startsWith("/api/")) {
      return fetch(BACKEND + url.pathname + url.search, { method: request.method, headers: request.headers, body: request.body });
    }
    if (!user) return new Response(renderAuth(), { headers: { "Content-Type": "text/html" } });
    return new Response(renderMain(user), { headers: { "Content-Type": "text/html" } });
  }
};

function renderAuth() { /* Kode Auth Sama Seperti Sebelumnya */ }

function renderMain(user) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"><script src="https://cdn.tailwindcss.com"></script><style>body{background:#0b141a;color:#e9edef;font-family:Segoe UI,sans-serif;} .wa-bg{background-image:url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');background-blend-mode:overlay;background-color:#0b141a;}</style></head>
  <body class="h-screen flex flex-col overflow-hidden">
    <div class="flex flex-1 overflow-hidden">
      <div id="side" class="w-full md:w-[400px] border-r border-[#374045] flex flex-col bg-[#111b21]">
        <header class="p-3 bg-[#202c33] flex justify-between items-center shadow-md">
            <div id="myAv" onclick="toggleP()" class="w-10 h-10 rounded-full bg-gray-600 overflow-hidden cursor-pointer border border-white/10"></div>
            <div class="flex gap-6 text-[#aebac1] text-xl px-2"><span>⭕</span><span>💬</span><span onclick="location.href='/logout'">🚪</span></div>
        </header>
        <div id="contactList" class="flex-1 overflow-y-auto"></div>
      </div>

      <div id="main" class="hidden md:flex flex-1 flex-col wa-bg relative">
        <header class="p-3 bg-[#202c33] flex justify-between items-center shadow-sm z-30">
            <div class="flex items-center gap-3">
                <button onclick="back()" class="md:hidden text-2xl">←</button>
                <div id="hAv" class="w-10 h-10 rounded-full bg-gray-600 overflow-hidden"></div>
                <div><div id="hName" class="font-bold text-white"></div><div id="hStat" class="text-[11px] text-emerald-500"></div></div>
            </div>
            <div class="flex gap-6 text-[#aebac1] text-xl px-4"><button onclick="call('voice')">📞</button><button onclick="call('video')">📹</button></div>
        </header>

        <div id="box" class="flex-1 overflow-y-auto p-4 md:px-10 flex flex-col gap-2"></div>

        <footer id="footer" class="hidden p-2 bg-[#202c33] flex items-center gap-2 z-30">
            <label class="cursor-pointer text-2xl p-2 hover:bg-white/10 rounded-full">📎<input type="file" id="fIn" class="hidden" onchange="previewMedia(this)"></label>
            <input id="mIn" class="flex-1 bg-[#2a3942] p-3 rounded-xl outline-none text-sm" placeholder="Ketik pesan..." onkeypress="if(event.key==='Enter')sendText()">
            <button id="vnBtn" onclick="toggleVN()" class="p-2 text-2xl transition-colors">🎙️</button>
            <button onclick="sendText()" class="p-2 text-3xl text-emerald-500">➤</button>
        </footer>
      </div>
    </div>

    <div id="pvWrap" class="hidden fixed inset-0 z-[150] bg-[#0b141a] flex flex-col">
        <header class="p-4 flex items-center gap-4">
            <button onclick="closePreview()" class="text-2xl text-white">✕</button>
            <span class="font-bold">Pratinjau Media</span>
        </header>
        <div id="pvContent" class="flex-1 flex items-center justify-center p-4"></div>
        <div class="p-4 bg-[#202c33] flex items-center gap-4">
            <input id="pvCap" class="flex-1 bg-[#2a3942] p-4 rounded-xl outline-none border-none" placeholder="Tambahkan keterangan...">
            <button onclick="sendMedia()" class="bg-emerald-600 p-4 rounded-full text-2xl shadow-lg">➤</button>
        </div>
    </div>

    <div id="pMod" class="hidden fixed inset-0 z-[100] bg-black/80 flex justify-center items-center">
        <div class="bg-[#202c33] p-8 rounded-3xl w-80 text-center">
            <div id="pAv" class="w-32 h-32 mx-auto rounded-full overflow-hidden mb-4 border-4 border-emerald-500"></div>
            <input id="pName" placeholder="Nama" class="w-full bg-[#111b21] p-3 rounded-lg mb-2 outline-none">
            <input id="pBio" placeholder="Bio" class="w-full bg-[#111b21] p-3 rounded-lg mb-4 outline-none">
            <button onclick="upP()" class="w-full bg-emerald-600 p-3 rounded-xl font-bold">SIMPAN</button>
            <button onclick="toggleP()" class="text-gray-400 mt-4 block mx-auto">Tutup</button>
        </div>
    </div>

    <script>
        let db, selU='', me='${user}', pc, stream, rec, chunks=[], pendingFile=null;
        const api = (id) => id ? \`/api/media?id=\${id}\` : 'https://www.w3schools.com/howto/img_avatar.png';

        async function sync() {
            try {
                const r = await fetch('/api/data'); db = await r.json();
                const m = db.users[me]; 
                myAv.innerHTML = pAv.innerHTML = \`<img src="\${api(m.pic)}" class="w-full h-full object-cover">\`;
                renderS(); if(selU) renderC(); checkC();
            } catch(e){}
        }

        function renderS() {
            const users = Object.keys(db.users).filter(u=>u!==me);
            contactList.innerHTML = users.map(u => \`
                <div onclick="openC('\${u}')" class="p-4 flex items-center gap-4 hover:bg-[#202c33] cursor-pointer \${selU===u?'bg-[#2a3942]':''}">
                    <img src="\${api(db.users[u].pic)}" class="w-12 h-12 rounded-full object-cover">
                    <div class="flex-1 border-b border-white/5 pb-2">
                        <div class="font-bold">\${db.users[u].name || u}</div>
                        <div class="text-xs opacity-40">\${db.users[u].bio}</div>
                    </div>
                </div>\`).join('');
        }

        function openC(u) { selU=u; main.classList.remove('hidden'); main.classList.add('fixed','inset-0','z-50','md:static'); footer.classList.remove('hidden'); sync(); }
        function back() { main.classList.add('hidden'); selU=''; }

        function renderC() {
            const u = db.users[selU]; hName.innerText = u.name || selU; hAv.innerHTML = \`<img src="\${api(u.pic)}" class="w-full h-full object-cover">\`;
            const k = [me, selU].sort().join("_");
            box.innerHTML = (db.privateChats[k] || []).map(m => \`
                <div class="flex \${m.from===me?'justify-end':'justify-start'}">
                    <div class="max-w-[85%] p-2 rounded-xl \${m.from===me?'bg-[#005c4b]':'bg-[#202c33]'} text-sm shadow">
                        \${m.fileId ? renderMedia(m) : ''}
                        <div>\${m.text}</div>
                        <div class="text-[9px] text-right opacity-40 mt-1">\${m.time}</div>
                    </div>
                </div>\`).join('') + '<div id="bot"></div>';
            document.getElementById('bot').scrollIntoView();
        }

        function renderMedia(m) {
            if(m.fileType==='image') return \`<img src="/api/media?id=\${m.fileId}" class="rounded-lg mb-1 max-h-60"> \`;
            if(m.fileType==='video') return \`<video src="/api/media?id=\${m.fileId}" controls class="rounded-lg mb-1 max-h-60"></video>\`;
            if(m.fileType==='audio' || m.fileType==='vn') return \`<audio src="/api/media?id=\${m.fileId}" controls class="w-48"></audio>\`;
            return \`<a href="/api/media?id=\${m.fileId}" class="block bg-black/20 p-2 rounded text-xs">📄 \${m.fileName}</a>\`;
        }

        // PREVIEW LOGIC
        function previewMedia(input) {
            if(!input.files[0]) return;
            pendingFile = input.files[0];
            pvWrap.classList.remove('hidden');
            const url = URL.createObjectURL(pendingFile);
            const type = pendingFile.type;
            if(type.startsWith('image')) pvContent.innerHTML = \`<img src="\${url}" class="max-w-full max-h-full rounded-lg">\`;
            else if(type.startsWith('video')) pvContent.innerHTML = \`<video src="\${url}" controls class="max-w-full max-h-full rounded-lg"></video>\`;
            else pvContent.innerHTML = \`<div class="text-center"><span class="text-6xl">📄</span><div class="mt-4">\${pendingFile.name}</div></div>\`;
        }

        function closePreview() { pvWrap.classList.add('hidden'); pendingFile = null; pvCap.value = ''; fIn.value = ''; }

        async function sendMedia() {
            const fd = new FormData();
            fd.append('action','chat'); fd.append('to',selU); fd.append('message', pvCap.value);
            fd.append('file', pendingFile);
            let t = pendingFile.type.split('/')[0];
            if(t!=='image' && t!=='video' && t!=='audio') t='document';
            fd.append('fileType', t);
            closePreview();
            await fetch('/api/post',{method:'POST',body:fd});
            sync();
        }

        async function sendText() {
            if(!mIn.value) return;
            const fd = new FormData(); fd.append('action','chat'); fd.append('to',selU); fd.append('message', mIn.value); fd.append('fileType','text');
            mIn.value=''; await fetch('/api/post',{method:'POST',body:fd}); sync();
        }

        // VN TOGGLE LOGIC (TEKAN SEKALI MULAI, TEKAN LAGI KIRIM)
        let isRecording = false;
        async function toggleVN() {
            if(!isRecording) {
                const s = await navigator.mediaDevices.getUserMedia({audio:true});
                rec = new MediaRecorder(s); chunks = [];
                rec.ondataavailable = e => chunks.push(e.data);
                rec.onstop = async () => {
                    const fd = new FormData(); fd.append('action','vn'); fd.append('to',selU); fd.append('fileType','vn');
                    fd.append('file', new Blob(chunks,{type:'audio/ogg'}), 'vn.ogg');
                    await fetch('/api/post',{method:'POST',body:fd}); sync();
                };
                rec.start();
                isRecording = true;
                vnBtn.innerText = '🔴'; vnBtn.classList.add('text-red-500');
            } else {
                rec.stop();
                isRecording = false;
                vnBtn.innerText = '🎙️'; vnBtn.classList.remove('text-red-500');
            }
        }

        async function upP(i) {
            const fd = new FormData(); fd.append('action','update_profile');
            fd.append('name', pName.value); fd.append('bio', pBio.value);
            await fetch('/api/post',{method:'POST',body:fd}); toggleP(); sync();
        }
        function toggleP() { pMod.classList.toggle('hidden'); }

        // WEBRTC LOGIC (DITERUSKAN DARI SEBELUMNYA)
        // ... (Fungsi call, acceptC, checkC sama seperti kode sebelumnya) ...

        setInterval(sync, 5000); sync();
    </script>
  </body></html>`;
          }

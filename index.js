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
  return `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#111b21] flex items-center justify-center h-screen text-white"><div class="bg-[#202c33] p-10 rounded-3xl shadow-2xl w-full max-w-sm text-center"><h1 class="text-emerald-500 text-5xl font-bold mb-10 italic">WhatsApp</h1><div class="space-y-4"><input id="u" placeholder="Username" class="w-full bg-[#2a3942] p-4 rounded-xl outline-none"><input id="p" type="password" placeholder="Password" class="w-full bg-[#2a3942] p-4 rounded-xl outline-none"><button onclick="auth('/login')" class="w-full bg-emerald-600 p-4 rounded-xl font-bold">MASUK</button><button onclick="auth('/register')" class="w-full border border-emerald-600 p-4 rounded-xl text-emerald-500 font-bold">DAFTAR</button></div></div><script>async function auth(p){const fd=new FormData();fd.append('username',u.value);fd.append('password',p.value);const r=await fetch(p,{method:'POST',body:fd});if(r.ok)location.reload();else alert('Gagal');}</script></body></html>`;
}

function renderMain(user) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"><script src="https://cdn.tailwindcss.com"></script><style>body{background:#0b141a;color:#e9edef;font-family:Segoe UI,sans-serif;} .wa-bg{background-image:url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');background-blend-mode:overlay;background-color:#0b141a;}</style></head>
  <body class="h-screen flex flex-col overflow-hidden">
    <div class="flex flex-1 overflow-hidden relative">
      <div id="side" class="w-full md:w-[400px] border-r border-[#374045] flex flex-col bg-[#111b21] z-20">
        <header class="p-3 bg-[#202c33] flex justify-between items-center shadow-md">
            <div id="myAv" onclick="toggleP()" class="w-10 h-10 rounded-full bg-gray-600 overflow-hidden cursor-pointer border border-white/10 hover:opacity-80 transition-opacity"></div>
            <div class="flex gap-6 text-[#aebac1] text-xl px-2"><span>⭕</span><span>💬</span><span class="cursor-pointer" onclick="location.href='/logout'">🚪</span></div>
        </header>
        <div id="contactList" class="flex-1 overflow-y-auto"></div>
      </div>

      <div id="main" class="hidden md:flex flex-1 flex-col wa-bg relative z-10">
        <header id="h" class="p-3 bg-[#202c33] flex justify-between items-center shadow-sm z-30">
            <div class="flex items-center gap-3">
                <button onclick="back()" class="md:hidden text-2xl">←</button>
                <div id="hAv" class="w-10 h-10 rounded-full bg-gray-600 overflow-hidden"></div>
                <div><div id="hName" class="font-bold text-white">Pilih Chat</div><div id="hStat" class="text-[11px] text-emerald-500"></div></div>
            </div>
            <div class="flex gap-6 text-[#aebac1] text-xl px-4"><button onclick="call('voice')">📞</button><button onclick="call('video')">📹</button></div>
        </header>
        <div id="box" class="flex-1 overflow-y-auto p-4 md:px-10 flex flex-col gap-2 z-10"></div>
        <footer id="f" class="hidden p-2 bg-[#202c33] flex items-center gap-2 z-30">
            <label class="cursor-pointer text-2xl p-2 hover:bg-white/10 rounded-full">📎<input type="file" id="fIn" class="hidden" onchange="previewMedia(this)"></label>
            <input id="mIn" class="flex-1 bg-[#2a3942] p-3 rounded-xl outline-none text-sm" placeholder="Ketik pesan..." onkeypress="if(event.key==='Enter')sendText()">
            <button id="vnBtn" onclick="toggleVN()" class="p-2 text-2xl transition-all">🎙️</button>
            <button onclick="sendText()" class="p-2 text-3xl text-emerald-500">➤</button>
        </footer>
      </div>

      <div id="pvWrap" class="hidden fixed inset-0 z-[100] bg-[#0b141a] flex flex-col">
          <header class="p-4 flex items-center gap-4 bg-[#202c33]">
              <button onclick="closePreview()" class="text-2xl text-white">✕</button>
              <span class="font-bold">Kirim Media</span>
          </header>
          <div id="pvContent" class="flex-1 flex items-center justify-center p-4 bg-[#0b141a]"></div>
          <div class="p-4 bg-[#202c33] flex items-center gap-4">
              <input id="pvCap" class="flex-1 bg-[#2a3942] p-4 rounded-xl outline-none border-none text-white" placeholder="Tambahkan keterangan...">
              <button onclick="sendMedia()" class="bg-emerald-600 p-4 rounded-full text-2xl shadow-lg">➤</button>
          </div>
      </div>
    </div>

    <div id="pMod" class="hidden fixed inset-0 z-[110] bg-black/90 flex justify-center items-center">
        <div class="bg-[#202c33] p-8 rounded-3xl w-80 text-center shadow-2xl border border-white/10">
            <div id="pAv" class="w-32 h-32 mx-auto rounded-full overflow-hidden mb-4 border-4 border-emerald-500 shadow-xl"></div>
            <input type="file" id="pPicIn" class="hidden" onchange="updateProfileWithPic(this)">
            <button onclick="pPicIn.click()" class="text-emerald-500 font-bold text-sm mb-4 block mx-auto">GANTI FOTO</button>
            <div class="space-y-4 mb-6">
                <input id="pName" placeholder="Nama" class="w-full bg-[#111b21] p-3 rounded-xl outline-none">
                <input id="pBio" placeholder="Bio" class="w-full bg-[#111b21] p-3 rounded-xl outline-none">
            </div>
            <button onclick="updateProfileData()" class="w-full bg-emerald-600 p-3 rounded-xl font-bold mb-2 shadow-lg">SIMPAN</button>
            <button onclick="toggleP()" class="text-gray-400 text-sm">Kembali</button>
        </div>
    </div>

    <div id="cUI" class="hidden fixed inset-0 z-[200] bg-zinc-950 flex flex-col items-center justify-center">
        <video id="rv" autoplay playsinline class="w-full h-full object-cover opacity-70"></video>
        <video id="lv" autoplay playsinline muted class="absolute bottom-10 right-10 w-32 rounded-lg border-2 border-emerald-500 shadow-2xl"></video>
        <div class="absolute top-20 text-center"><div id="cN" class="text-3xl font-bold mb-2 italic">WhatsApp Call</div></div>
        <button onclick="eC()" class="absolute bottom-10 bg-red-600 p-6 rounded-full text-3xl shadow-2xl">🚫</button>
    </div>

    <script>
        let db, selU='', me='${user}', pc, stream, rec, chunks=[], pendingFile=null;
        const api = (id) => id ? \`/api/media?id=\${id}\` : 'https://www.w3schools.com/howto/img_avatar.png';

        async function sync() {
            try {
                const r = await fetch('/api/data'); db = await r.json();
                const m = db.users[me]; 
                myAv.innerHTML = pAv.innerHTML = \`<img src="\${api(m.pic)}" class="w-full h-full object-cover">\`;
                if(!pName.value) { pName.value = m.Name || me; pBio.value = m.Bio || 'Available'; }
                renderS(); if(selU) renderC(); checkC();
            } catch(e){}
        }

        function renderS() {
            const users = Object.keys(db.users).filter(u=>u!==me);
            contactList.innerHTML = users.map(u => \`
                <div onclick="openC('\${u}')" class="p-4 flex items-center gap-4 hover:bg-[#202c33] cursor-pointer \${selU===u?'bg-[#2a3942]':''}">
                    <img src="\${api(db.users[u].pic)}" class="w-14 h-14 rounded-full object-cover">
                    <div class="flex-1 border-b border-white/5 pb-4">
                        <div class="font-bold text-white">\${db.users[u].name || u}</div>
                        <div class="text-xs text-gray-400 italic mt-1 truncate">\${db.users[u].bio}</div>
                    </div>
                </div>\`).join('');
        }

        function openC(u) { selU=u; main.classList.remove('hidden'); main.classList.add('fixed','inset-0','z-50','md:static'); f.classList.remove('hidden'); sync(); }
        function back() { main.classList.add('hidden'); main.classList.remove('fixed','inset-0'); selU=''; }

        function renderC() {
            const u = db.users[selU]; hName.innerText = u.name || selU; hAv.innerHTML = \`<img src="\${api(u.pic)}" class="w-full h-full object-cover">\`;
            hStat.innerText = (Date.now()-u.lastSeen < 15000) ? 'online' : 'last seen recently';
            const k = [me, selU].sort().join("_");
            box.innerHTML = (db.privateChats[k] || []).map(m => \`
                <div class="flex \${m.from===me?'justify-end':'justify-start'}">
                    <div class="max-w-[85%] p-2 px-3 rounded-xl shadow-lg relative \${m.from===me?'bg-[#005c4b] rounded-tr-none':'bg-[#202c33] rounded-tl-none'} text-sm">
                        \${m.fileId ? renderMedia(m) : ''}
                        <div class="mt-1">\${m.text}</div>
                        <div class="text-[9px] text-right opacity-40 mt-1 uppercase font-bold">\${m.time}</div>
                    </div>
                </div>\`).join('') + '<div id="bot"></div>';
            document.getElementById('bot').scrollIntoView();
        }

        function renderMedia(m) {
            if(m.fileType==='image') return \`<img src="/api/media?id=\${m.fileId}" class="rounded-lg mb-1 max-h-72 w-full object-cover shadow-sm">\`;
            if(m.fileType==='video') return \`<video src="/api/media?id=\${m.fileId}" controls class="rounded-lg mb-1 max-h-72 w-full shadow-sm"></video>\`;
            if(m.fileType==='audio' || m.fileType==='vn') return \`<div class="bg-black/20 p-2 rounded-lg mb-1"><audio src="/api/media?id=\${m.fileId}" controls class="w-full h-10"></audio></div>\`;
            return \`<a href="/api/media?id=\${m.fileId}" target="_blank" class="block bg-black/30 p-3 rounded-lg flex items-center gap-3 border border-white/10 hover:bg-black/50 transition-colors">📄 <div class="truncate text-xs text-emerald-500 font-bold font-mono">\${m.fileName}</div></a>\`;
        }

        // PREVIEW LOGIC
        function previewMedia(input) {
            if(!input.files[0]) return;
            pendingFile = input.files[0];
            pvWrap.classList.remove('hidden');
            const url = URL.createObjectURL(pendingFile);
            const type = pendingFile.type;
            if(type.startsWith('image')) pvContent.innerHTML = \`<img src="\${url}" class="max-w-full max-h-full rounded-2xl shadow-2xl"> \`;
            else if(type.startsWith('video')) pvContent.innerHTML = \`<video src="\${url}" controls class="max-w-full max-h-full rounded-2xl shadow-2xl"></video>\`;
            else pvContent.innerHTML = \`<div class="text-center"><span class="text-7xl">📄</span><div class="mt-4 font-bold text-xl">\${pendingFile.name}</div></div>\`;
        }

        function closePreview() { pvWrap.classList.add('hidden'); pendingFile = null; pvCap.value = ''; fIn.value = ''; }

        async function sendMedia() {
            const fd = new FormData(); fd.append('action','chat'); fd.append('to',selU); fd.append('message', pvCap.value);
            fd.append('file', pendingFile);
            let t = pendingFile.type.split('/')[0];
            if(t!=='image' && t!=='video' && t!=='audio') t='document';
            fd.append('fileType', t);
            closePreview();
            await fetch('/api/post',{method:'POST',body:fd}); sync();
        }

        async function sendText() {
            if(!mIn.value) return;
            const fd = new FormData(); fd.append('action','chat'); fd.append('to',selU); fd.append('message', mIn.value); fd.append('fileType','text');
            mIn.value=''; await fetch('/api/post',{method:'POST',body:fd}); sync();
        }

        // TOGGLE VN (SATU KALI TEKAN REKAM, SATU KALI TEKAN KIRIM)
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
                rec.start(); isRec = true;
                vnBtn.innerText = '🔴'; vnBtn.classList.add('scale-150', 'text-red-500');
            } else {
                rec.stop(); isRec = false;
                vnBtn.innerText = '🎙️'; vnBtn.classList.remove('scale-150', 'text-red-500');
            }
        }

        // PROFILE LOGIC
        async function updateProfileWithPic(i) {
            const fd = new FormData(); fd.append('action','update_profile');
            if(i.files[0]) fd.append('file', i.files[0]);
            await fetch('/api/post',{method:'POST',body:fd}); sync();
        }
        async function updateProfileData() {
            const fd = new FormData(); fd.append('action','update_profile');
            fd.append('name', pName.value); fd.append('bio', pBio.value);
            await fetch('/api/post',{method:'POST',body:fd}); toggleP(); sync();
        }
        function toggleP() { pMod.classList.toggle('hidden'); }

        // WEBRTC CALLING (REUSABLE)
        async function checkC() {
            const sig = await (await fetch(\`/api/call?action=get&me=\${me}\`)).text();
            if(sig && !pc) {
                const [act, data, from] = sig.split('|');
                if(act==='offer' && confirm(\`Terima panggilan dari \${from}?\`)) { selU=from; cUI.classList.remove('hidden'); acceptC(JSON.parse(data)); }
            }
        }
        async function call(t) {
            cUI.classList.remove('hidden');
            stream = await navigator.mediaDevices.getUserMedia({video: t==='video', audio:true});
            lv.srcObject = stream; pc = new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
            stream.getTracks().forEach(tr => pc.addTrack(tr, stream));
            pc.onicecandidate = e => { if(e.candidate) sendSig('candidate', JSON.stringify(e.candidate)); };
            pc.ontrack = e => { rv.srcObject = e.streams[0]; };
            const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
            sendSig('offer', JSON.stringify(offer));
        }
        async function acceptC(o) {
            stream = await navigator.mediaDevices.getUserMedia({video:true, audio:true});
            lv.srcObject = stream; pc = new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
            stream.getTracks().forEach(tr => pc.addTrack(tr, stream));
            pc.ontrack = e => { rv.srcObject = e.streams[0]; };
            await pc.setRemoteDescription(new RTCSessionDescription(o));
            const a = await pc.createAnswer(); await pc.setLocalDescription(a);
            sendSig('answer', JSON.stringify(a));
        }
        async function sendSig(a, d) { const fd=new FormData(); fd.append('data',d); await fetch(\`/api/call?to=\${selU}&from=\${me}&action=\${a}\`,{method:'POST',body:fd}); }
        function eC() { if(pc) pc.close(); if(stream) stream.getTracks().forEach(t=>t.stop()); pc=null; cUI.classList.add('hidden'); fetch(\`/api/call?action=clear&me=\${me}\`); }

        setInterval(sync, 4000); sync();
    </script>
  </body></html>`;
  }

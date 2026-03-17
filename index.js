const TUNNEL_URL = "https://api.darkdocker.qzz.io";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "POST" || url.pathname.startsWith("/api/")) {
      return fetch(TUNNEL_URL + url.pathname + url.search, { method: request.method, headers: request.headers, body: request.body });
    }
    const cookie = request.headers.get("Cookie") || "";
    const user = (cookie.match(/(?:^|; )user_session=([^;]*)/) || [])[1];
    if (url.pathname === "/login" || url.pathname === "/register") return fetch(TUNNEL_URL + url.pathname + url.search, { method: "POST", body: await request.formData() });
    if (!user) return new Response(renderAuth(), { headers: { "Content-Type": "text/html" } });
    return new Response(renderMain(user), { headers: { "Content-Type": "text/html" } });
  }
};

function renderAuth() {
  return `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#111b21] flex items-center justify-center h-screen text-white"><div class="bg-[#202c33] p-10 rounded-lg shadow-xl w-80 text-center"><h1 class="text-emerald-500 text-4xl font-bold mb-8">WhatsApp</h1><input id="u" placeholder="Username" class="w-full bg-[#2a3942] p-3 rounded mb-4 outline-none"><input id="p" type="password" placeholder="Password" class="w-full bg-[#2a3942] p-3 rounded mb-6 outline-none"><button onclick="auth('/login')" class="w-full bg-emerald-600 p-3 rounded font-bold mb-2">LOGIN</button><button onclick="auth('/register')" class="w-full border border-emerald-600 p-3 rounded text-emerald-500 font-bold">DAFTAR</button></div><script>async function auth(p){const fd=new FormData();fd.append('username',u.value);fd.append('password',p.value);const r=await fetch(p,{method:'POST',body:fd});if(r.ok)location.reload();else alert('Gagal');}</script></body></html>`;
}

function renderMain(user) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"><script src="https://cdn.tailwindcss.com"></script><style>body{background:#0b141a;color:#e9edef;font-family:Segoe UI,Helvetica Neue,Helvetica,Lucida Grande,Arial,Ubuntu,Cantarell,Fira Sans,sans-serif;} .wa-bg{background-color:#0b141a;background-image:url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');background-blend-mode:overlay;} ::-webkit-scrollbar{width:6px;} ::-webkit-scrollbar-thumb{background:#374045;}</style></head>
  <body class="h-screen flex flex-col overflow-hidden">
    <div id="app" class="flex flex-1 overflow-hidden">
      <div id="side" class="w-full md:w-[400px] border-r border-[#374045] flex flex-col bg-[#111b21]">
        <div class="p-3 bg-[#202c33] flex justify-between items-center">
            <div id="myAv" class="w-10 h-10 rounded-full bg-gray-600 overflow-hidden cursor-pointer"></div>
            <div class="flex gap-5 text-[#aebac1] text-xl"><span>⭕</span><span>💬</span><span>⋮</span></div>
        </div>
        <div class="p-2 bg-[#111b21]"><input placeholder="Cari atau mulai chat baru" class="w-full bg-[#202c33] text-sm p-2 rounded-lg outline-none px-10"></div>
        <div id="contactList" class="flex-1 overflow-y-auto"></div>
      </div>

      <div id="main" class="hidden md:flex flex-1 flex-col wa-bg relative">
        <div id="header" class="p-3 bg-[#202c33] flex justify-between items-center shadow-md">
            <div class="flex items-center gap-3">
                <button onclick="backToSide()" class="md:hidden text-2xl">←</button>
                <div id="hAv" class="w-10 h-10 rounded-full bg-gray-600 overflow-hidden"></div>
                <div><div id="hName" class="font-bold">Pilih Chat</div><div id="hStat" class="text-xs text-gray-400"></div></div>
            </div>
            <div class="flex gap-6 text-[#aebac1] text-xl px-4">
                <button onclick="makeCall('voice')">📞</button>
                <button onclick="makeCall('video')">📹</button>
                <span>🔍</span><span>⋮</span>
            </div>
        </div>
        <div id="box" class="flex-1 overflow-y-auto p-5 flex flex-col gap-2"></div>
        <div id="footer" class="p-3 bg-[#202c33] flex items-center gap-3 hidden">
            <span class="text-2xl cursor-pointer">😊</span>
            <label class="cursor-pointer text-2xl"><input type="file" id="fIn" class="hidden" onchange="sendMsg()">📎</label>
            <input id="mIn" class="flex-1 bg-[#2a3942] p-3 rounded-xl outline-none" placeholder="Ketik pesan" onkeypress="if(event.key==='Enter')sendMsg()">
            <button onmousedown="vS()" onmouseup="vE()" class="text-2xl">🎙️</button>
            <button onclick="sendMsg()" class="text-2xl text-emerald-500">➤</button>
        </div>
      </div>
    </div>

    <div id="callUI" class="hidden fixed inset-0 bg-[#0b141a] z-[100] flex flex-col items-center justify-center">
        <video id="remVid" autoplay playsinline class="w-full h-full object-cover"></video>
        <video id="locVid" autoplay playsinline muted class="absolute bottom-10 right-10 w-32 border-2 border-emerald-500 rounded-lg"></video>
        <div id="callInfo" class="absolute top-20 text-center">
            <div id="callName" class="text-3xl font-bold">Calling...</div>
            <div id="callTimer">00:00</div>
        </div>
        <button onclick="endCall()" class="absolute bottom-10 bg-red-600 p-5 rounded-full text-3xl">🚫</button>
    </div>

    <script>
        let db, selU = '', me = "${user}", pc, locStream;
        const apiMedia = (id) => id ? \`/api/media?id=\${id}\` : 'https://www.w3schools.com/howto/img_avatar.png';

        async function refresh() {
            const r = await fetch('/api/data'); db = await r.json();
            const my = db.users[me]; myAv.innerHTML = \`<img src="\${apiMedia(my.pic)}" class="w-full h-full object-cover">\`;
            renderContacts(); if(selU) renderChat(); checkCall();
        }

        function renderContacts() {
            const users = Object.keys(db.users).filter(u=>u!==me);
            contactList.innerHTML = users.map(u => \`
                <div onclick="openChat('\${u}')" class="p-4 flex items-center gap-4 hover:bg-[#202c33] cursor-pointer border-b border-[#202c33]">
                    <img src="\${apiMedia(db.users[u].pic)}" class="w-12 h-12 rounded-full object-cover">
                    <div class="flex-1 truncate">
                        <div class="font-semibold text-white">\${u}</div>
                        <div class="text-sm text-gray-400">\${db.users[u].bio}</div>
                    </div>
                </div>\`).join('');
        }

        function openChat(u) {
            selU = u; main.classList.remove('hidden'); main.classList.add('fixed','inset-0','z-50','md:static');
            document.getElementById('footer').classList.remove('hidden'); refresh();
        }
        function backToSide() { main.classList.add('hidden'); selU=''; }

        function renderChat() {
            const u = db.users[selU]; hName.innerText = u.Name || selU; hAv.innerHTML = \`<img src="\${apiMedia(u.pic)}" class="w-full h-full object-cover">\`;
            hStat.innerText = (Date.now()-u.lastSeen < 15000) ? 'online' : 'last seen recently';
            const key = [me, selU].sort().join("_");
            box.innerHTML = (db.privateChats[key] || []).map(m => \`
                <div class="flex \${m.from===me?'justify-end':'justify-start'}">
                    <div class="max-w-[80%] p-2 px-3 rounded-lg \${m.from===me?'bg-[#005c4b]':'bg-[#202c33]'} text-sm shadow relative">
                        \${m.fileId ? (m.fileType==='image' ? \`<img src="/api/media?id=\${m.fileId}" class="rounded mb-1 max-h-64">\` : \`<video src="/api/media?id=\${m.fileId}" controls class="rounded mb-1 max-h-64"></video>\`) : ''}
                        \${m.fileType==='audio' ? \`<audio src="/api/media?id=\${m.fileId}" controls class="w-48 h-10"></audio>\` : ''}
                        <div>\${m.text}</div><div class="text-[9px] text-right opacity-50 mt-1">\${m.time}</div>
                    </div>
                </div>\`).join('') + '<div id="bot"></div>';
            document.getElementById('bot').scrollIntoView();
        }

        async function sendMsg() {
            const m = mIn.value, f = fIn.files[0]; if(!m && !f) return;
            const fd = new FormData(); fd.append('action','chat'); fd.append('to',selU); fd.append('message',m);
            if(f) { fd.append('file',f); fd.append('fileType', f.type.startsWith('image')?'image':(f.type.startsWith('video')?'video':'file')); }
            mIn.value=''; fIn.value=''; await fetch('/api/post',{method:'POST',body:fd}); refresh();
        }

        // WEBRTC LOGIC
        async function checkCall() {
            const r = await fetch(\`/api/call?action=get&me=\${me}\`); const sig = await r.text();
            if(sig && !pc) {
                const [act, data, from] = sig.split('|');
                if(act === 'offer' && confirm(\`Panggilan dari \${from}. Terima?\`)) {
                    selU = from; callUI.classList.remove('hidden'); acceptCall(JSON.parse(data));
                }
            }
        }

        async function makeCall(type) {
            callUI.classList.remove('hidden'); callName.innerText = "Calling " + selU + "...";
            locStream = await navigator.mediaDevices.getUserMedia({video: type==='video', audio:true});
            locVid.srcObject = locStream;
            pc = new RTCPeerConnection({ iceServers:[{urls:'stun:stun.l.google.com:19302'}] });
            locStream.getTracks().forEach(t => pc.addTrack(t, locStream));
            pc.onicecandidate = e => { if(e.candidate) sendSig('candidate', JSON.stringify(e.candidate)); };
            pc.ontrack = e => { remVid.srcObject = e.streams[0]; };
            const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
            sendSig('offer', JSON.stringify(offer));
        }

        async function acceptCall(offer) {
            locStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true});
            locVid.srcObject = locStream;
            pc = new RTCPeerConnection({ iceServers:[{urls:'stun:stun.l.google.com:19302'}] });
            locStream.getTracks().forEach(t => pc.addTrack(t, locStream));
            pc.onicecandidate = e => { if(e.candidate) sendSig('candidate', JSON.stringify(e.candidate)); };
            pc.ontrack = e => { remVid.srcObject = e.streams[0]; };
            await pc.setRemoteDescription(new RTCSessionData(offer));
            const ans = await pc.createAnswer(); await pc.setLocalDescription(ans);
            sendSig('answer', JSON.stringify(ans));
        }

        async function sendSig(act, data) {
            const fd = new FormData(); fd.append('data', data);
            await fetch(\`/api/call?to=\${selU}&from=\${me}&action=\${act}\`,{method:'POST', body:fd});
        }

        function endCall() { 
            if(pc) pc.close(); if(locStream) locStream.getTracks().forEach(t=>t.stop());
            pc = null; callUI.classList.add('hidden'); fetch(\`/api/call?action=clear&me=\${me}\`);
        }

        setInterval(refresh, 5000); refresh();
    </script></body></html>`;
}

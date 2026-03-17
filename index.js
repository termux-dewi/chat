const BACKEND = "https://api.darkdocker.qzz.io"; // Ganti URL ini

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const user = (request.headers.get("Cookie") || "").match(/user_session=([^;]+)/)?.[1];
    if (url.pathname.startsWith("/api/") || request.method === "POST") return fetch(BACKEND + url.pathname + url.search, { method: request.method, headers: request.headers, body: request.body });
    if (!user) return new Response(renderAuth(), { headers: { "Content-Type": "text/html" } });
    return new Response(renderApp(user), { headers: { "Content-Type": "text/html" } });
  }
};

function renderAuth() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#0b141a] flex items-center justify-center h-screen text-white px-6 text-center"><div><h1 class="text-emerald-500 text-5xl font-bold mb-10 italic">WhatsApp</h1><input id="u" placeholder="Username" class="w-full bg-[#202c33] p-4 rounded-xl mb-3 outline-none"><input id="p" type="password" placeholder="Password" class="w-full bg-[#202c33] p-4 rounded-xl mb-6 outline-none"><button onclick="auth('/login')" class="w-full bg-emerald-600 p-4 rounded-full font-bold mb-3 uppercase">Masuk</button><button onclick="auth('/register')" class="w-full border border-emerald-600 text-emerald-500 p-4 rounded-full font-bold uppercase">Daftar</button></div><script>async function auth(path){const fd=new FormData();fd.append('u',u.value);fd.append('p',p.value);const r=await fetch(path,{method:'POST',body:fd});if(r.ok)location.reload();else alert('Gagal')}</script></body></html>`;
}

function renderApp(me) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"><script src="https://cdn.tailwindcss.com"></script><style>body{background:#0b141a;color:#e9edef;font-family:sans-serif;} .wa-bg{background-color:#0b141a;background-image:url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');background-blend-mode:overlay;} .nav-active{background:#103629;color:#dcf8c6;border-radius:20px;}</style></head>
  <body class="h-screen flex flex-col overflow-hidden">
    <div id="main" class="flex flex-col h-full">
      <header class="p-4 flex justify-between items-center"><h1 class="text-2xl font-semibold text-gray-400">WhatsApp</h1><div class="flex gap-5 text-xl text-gray-400"><span>📷</span><span>🔍</span><span onclick="location.href='/logout'">⋮</span></div></header>
      <div class="px-4 pb-3"><div class="bg-[#202c33] p-3 rounded-full flex gap-3 text-gray-500 text-sm"><span>🔍</span><input class="bg-transparent outline-none w-full" placeholder="Tanya Meta AI atau cari"></div></div>
      <div id="content" class="flex-1 overflow-y-auto"></div>
      <nav class="border-t border-white/5 flex justify-around py-3 bg-[#0b141a]">
        <div onclick="tab('chat')" class="flex flex-col items-center gap-1"><span id="t-chat" class="px-5 py-1">💬</span><span class="text-[10px]">Chat</span></div>
        <div onclick="tab('status')" class="flex flex-col items-center gap-1"><span id="t-status" class="px-5 py-1">⭕</span><span class="text-[10px]">Pembaruan</span></div>
        <div onclick="tab('comm')" class="flex flex-col items-center gap-1"><span id="t-comm" class="px-5 py-1">👥</span><span class="text-[10px]">Komunitas</span></div>
        <div onclick="tab('call')" class="flex flex-col items-center gap-1"><span id="t-call" class="px-5 py-1">📞</span><span class="text-[10px]">Panggilan</span></div>
      </nav>
    </div>

    <div id="win" class="hidden fixed inset-0 z-50 flex flex-col wa-bg">
      <header class="bg-[#202c33] p-2 flex items-center gap-2">
        <button onclick="win.classList.add('hidden')" class="text-2xl px-2">←</button>
        <div id="hAv" class="w-10 h-10 rounded-full bg-gray-700 overflow-hidden"></div>
        <div class="flex-1 font-bold text-sm" id="hName"></div>
        <div class="flex gap-5 px-4"><span onclick="startCall('video')">📹</span><span onclick="startCall('voice')">📞</span><span>⋮</span></div>
      </header>
      <div id="box" class="flex-1 overflow-y-auto p-4 flex flex-col gap-2"></div>
      <div id="repBox" class="hidden bg-[#202c33] p-2 mx-2 rounded-t-lg border-l-4 border-emerald-500 text-xs"></div>
      <footer class="p-2 flex items-center gap-2">
        <div class="flex-1 bg-[#2a3942] rounded-full flex items-center px-4 py-2 gap-3">
          <span>😊</span><input id="mIn" class="bg-transparent flex-1 outline-none text-sm" placeholder="Ketik pesan..." onkeypress="if(event.key==='Enter')send()">
          <label class="cursor-pointer">📎<input type="file" id="fIn" class="hidden" onchange="send()"></label><span>📷</span>
        </div>
        <button onclick="send()" class="bg-[#00a884] w-12 h-12 rounded-full flex items-center justify-center">➤</button>
      </footer>
    </div>

    <div id="callUI" class="hidden fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6">
        <video id="rv" autoplay class="w-full h-full object-cover rounded-3xl"></video>
        <video id="lv" autoplay muted class="absolute bottom-10 right-10 w-32 rounded-xl border-2 border-emerald-500"></video>
        <button onclick="endCall()" class="absolute bottom-10 bg-red-600 p-6 rounded-full text-3xl">🚫</button>
    </div>

    <script>
      let db, selU, curTab='chat', repM, pc, stream;
      const api = (id) => id ? \`/api/media?id=\${id}\` : 'https://www.w3schools.com/howto/img_avatar.png';

      async function sync() {
        const r = await fetch('/api/data'); db = await r.json(); renderTab(); checkCall();
        if(selU) renderChat();
      }

      function tab(t) { curTab=t; renderTab(); }
      function renderTab() {
        ['chat','status','comm','call'].forEach(i => document.getElementById('t-'+i).className = (i===curTab)?'px-5 py-1 nav-active':'px-5 py-1');
        const c = document.getElementById('content');
        if(curTab==='chat') {
          c.innerHTML = Object.keys(db.users).filter(u=>u!=='${me}').map(u => \`
            <div onclick="openChat('\${u}')" class="p-4 flex items-center gap-4 active:bg-[#202c33]">
              <img src="\${api(db.users[u].pic)}" class="w-14 h-14 rounded-full object-cover">
              <div class="flex-1 border-b border-white/5 pb-4"><div class="flex justify-between"><span class="font-bold">\${u}</span><span class="text-[10px] text-gray-500">16:00</span></div><div class="text-sm text-gray-500 truncate">\${db.users[u].bio}</div></div>
            </div>\`).join('');
        } else { c.innerHTML = '<div class="p-20 text-center opacity-30 italic">Fitur \'+curTab+\' segera hadir</div>'; }
      }

      function openChat(u) { selU=u; hName.innerText=u; hAv.innerHTML=\`<img src="\${api(db.users[u].pic)}" class="w-full h-full object-cover">\`; win.classList.remove('hidden'); renderChat(); }
      
      function renderChat() {
        const k = ['${me}', selU].sort().join("_");
        box.innerHTML = (db.chats[k]||[]).map(m => \`
          <div class="flex \${m.from==='${me}'?'justify-end':'justify-start'}">
            <div class="max-w-[80%] p-2 rounded-xl \${m.from==='${me}'?'bg-[#005c4b]':'bg-[#202c33]'} text-sm shadow relative group" onclick="msgMenu('\${k}','\${m.id}','\${m.text}')">
              \${m.reply ? \`<div class="bg-black/20 p-1 mb-1 rounded border-l-2 border-emerald-500 text-[10px] opacity-60">\${m.reply}</div>\`:''}
              <div>\${m.text.startsWith('FILE:') ? \`<img src="/api/media?id=\${m.text.split(':')[1]}" class="rounded-lg max-h-60">\` : m.text}</div>
              <div class="text-[9px] text-right opacity-40 mt-1">\${m.time}</div>
              \${m.react ? \`<div class="absolute -bottom-2 -right-1 bg-[#202c33] rounded-full px-1 text-[10px] border border-white/10">\${m.react}</div>\`:''}
            </div>
          </div>\`).join('') + '<div id="bot"></div>';
        document.getElementById('bot').scrollIntoView();
      }

      async function send() {
        const m = mIn.value, f = fIn.files[0]; if(!m && !f) return;
        const fd = new FormData(); fd.append('action','chat'); fd.append('to',selU); fd.append('text',m); fd.append('reply',repM||'');
        if(f) fd.append('file',f);
        mIn.value=''; fIn.value=''; repM=''; repBox.classList.add('hidden');
        await fetch('/api/post',{method:'POST',body:fd}); sync();
      }

      function msgMenu(k, mid, txt) {
        const a = prompt("r: reply, e: emoji, d: delete");
        if(a==='r') { repM=txt; repBox.innerText="Membalas: "+txt; repBox.classList.remove('hidden'); }
        else if(a==='e') { const v=prompt("Emoji?"); postAct('react',k,mid,v); }
        else if(a==='d') { postAct('delete',k,mid); }
      }
      async function postAct(t,k,mid,v='') { const fd=new FormData(); fd.append('action',t); fd.append('key',k); fd.append('mid',mid); fd.append('val',v); await fetch('/api/post',{method:'POST',body:fd}); sync(); }

      // WebRTC Calls
      async function startCall(t) {
        callUI.classList.remove('hidden'); stream = await navigator.mediaDevices.getUserMedia({video:t==='video', audio:true});
        lv.srcObject = stream; pc = new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
        stream.getTracks().forEach(tr => pc.addTrack(tr, stream));
        pc.onicecandidate = e => e.candidate && sendSig('cand', JSON.stringify(e.candidate));
        pc.ontrack = e => rv.srcObject = e.streams[0];
        const offer = await pc.createOffer(); await pc.setLocalDescription(offer); sendSig('off', JSON.stringify(offer));
      }
      async function checkCall() {
        const r = await fetch(\`/api/call?action=get&me=${me}\`); const sig = await r.text();
        if(sig && !pc) {
          const [a, d, f] = sig.split('|'); if(a==='off' && confirm("Call from "+f+"?")) { selU=f; callUI.classList.remove('hidden'); acceptCall(JSON.parse(d)); }
        }
      }
      async function acceptCall(off) {
        stream = await navigator.mediaDevices.getUserMedia({video:true, audio:true}); lv.srcObject = stream;
        pc = new RTCPeerConnection(); stream.getTracks().forEach(tr => pc.addTrack(tr, stream));
        pc.onicecandidate = e => e.candidate && sendSig('cand', JSON.stringify(e.candidate));
        pc.ontrack = e => rv.srcObject = e.streams[0];
        await pc.setRemoteDescription(new RTCSessionDescription(off));
        const ans = await pc.createAnswer(); await pc.setLocalDescription(ans); sendSig('ans', JSON.stringify(ans));
      }
      async function sendSig(a, d) { const fd=new FormData(); fd.append('data',d); await fetch(\`/api/call?to=\${selU}&from=${me}&action=\${a}\`,{method:'POST',body:fd}); }
      function endCall() { pc?.close(); stream?.getTracks().forEach(t=>t.stop()); pc=null; callUI.classList.add('hidden'); fetch(\`/api/call?action=clear&me=${me}\`); }

      setInterval(sync, 4000); sync();
    </script>
  </body></html>`;
}

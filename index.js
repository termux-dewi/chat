const BACKEND = "https://api.darkdocker.qzz.io"; // GANTI DENGAN URL TUNNEL KAMU

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const cookie = request.headers.get("Cookie") || "";
    const user = (cookie.match(/(?:^|; )user_session=([^;]*)/) || [])[1];

    if (url.pathname.startsWith("/api/") || request.method === "POST") {
      return fetch(BACKEND + url.pathname + url.search, { method: request.method, headers: request.headers, body: request.body });
    }
    if (!user) return new Response(renderAuth(), { headers: { "Content-Type": "text/html" } });
    return new Response(renderMain(user), { headers: { "Content-Type": "text/html" } });
  }
};

function renderAuth() {
    return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#0b141a] text-white flex items-center justify-center h-screen"><div class="w-full max-w-xs text-center"><h1 class="text-[#00a884] text-4xl font-bold mb-8">WhatsApp</h1><input id="u" placeholder="Username" class="w-full bg-[#202c33] p-4 rounded-xl mb-3 outline-none"><input id="p" type="password" placeholder="Password" class="w-full bg-[#202c33] p-4 rounded-xl mb-6 outline-none"><button onclick="auth('/login')" class="w-full bg-[#00a884] p-4 rounded-xl font-bold uppercase">Masuk</button></div><script>async function auth(path){const fd=new FormData();fd.append('u',u.value);fd.append('p',p.value);const r=await fetch(path,{method:'POST',body:fd});if(r.ok)location.reload();else alert('Gagal');}</script></body></html>`;
}

function renderMain(user) {
  return `<!DOCTYPE html><html><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0b141a; color: #e9edef; font-family: 'Segoe UI', sans-serif; }
    .nav-active { color: #dcf8c6 !important; background-color: #103629; border-radius: 20px; }
    .wa-bg { background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png'); background-blend-mode: overlay; background-color: #0b141a; background-attachment: fixed; }
    .chat-bubble-me { background-color: #005c4b; border-radius: 10px 0px 10px 10px; position: relative; }
    .chat-bubble-you { background-color: #202c33; border-radius: 0px 10px 10px 10px; }
    .hide-scroll::-webkit-scrollbar { display: none; }
  </style></head>
  <body class="h-screen flex flex-col overflow-hidden">
    
    <div id="homePage" class="flex flex-col h-full">
        <header class="p-4 flex justify-between items-center bg-[#0b141a]">
        <h1 class="text-2xl font-semibold text-[#8696a0]">WhatsApp</h1>
        <div class="flex gap-5 text-xl text-[#8696a0]">
            <span>📷</span><span>🔍</span><span>⋮</span>
        </div>
        </header>

        <div class="px-4 pb-4">
        <div class="bg-[#202c33] flex items-center p-3 rounded-full gap-3 text-[#8696a0]">
            <span>🔍</span>
            <input class="bg-transparent outline-none w-full text-sm" placeholder="Tanya Meta AI atau cari">
        </div>
        </div>

        <main class="flex-1 overflow-y-auto hide-scroll px-1" id="chatList"></main>

        <div class="fixed bottom-24 right-4 bg-[#00a884] w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl text-2xl text-black font-bold">+</div>

        <nav class="bg-[#0b141a] border-t border-white/5 flex justify-around py-2">
        <div class="flex flex-col items-center gap-1">
            <div class="px-5 py-1 nav-active text-lg">💬</div>
            <span class="text-[11px] font-bold">Chat</span>
        </div>
        <div class="flex flex-col items-center gap-1 opacity-50">
            <div class="px-5 py-1 text-lg">⭕</div>
            <span class="text-[11px]">Pembaruan</span>
        </div>
        <div class="flex flex-col items-center gap-1 opacity-50">
            <div class="px-5 py-1 text-lg">👥</div>
            <span class="text-[11px]">Komunitas</span>
        </div>
        <div class="flex flex-col items-center gap-1 opacity-50">
            <div class="px-5 py-1 text-lg">📞</div>
            <span class="text-[11px]">Panggilan</span>
        </div>
        </nav>
    </div>

    <div id="chatWindow" class="hidden fixed inset-0 z-50 flex flex-col wa-bg">
      <header class="bg-[#202c33] p-2 flex items-center gap-2">
        <button onclick="closeChat()" class="text-2xl px-2">←</button>
        <div id="cAv" class="w-10 h-10 rounded-full bg-gray-600 overflow-hidden"></div>
        <div class="flex-1"><div id="cName" class="font-bold"></div><div class="text-[10px] text-emerald-500">online</div></div>
        <div class="flex gap-5 px-3 text-xl">📹 📞 ⋮</div>
      </header>
      <div id="msgBox" class="flex-1 overflow-y-auto p-4 flex flex-col gap-3"></div>
      <footer class="p-2 flex items-center gap-2">
        <div class="flex-1 bg-[#2a3942] rounded-full flex items-center px-4 py-3 gap-3">
          <span class="opacity-50">😊</span>
          <input id="mIn" class="bg-transparent flex-1 outline-none text-sm text-white" placeholder="Ketik pesan..." onkeypress="if(event.key==='Enter')send()">
          <span class="opacity-50">📎</span><span class="opacity-50">📷</span>
        </div>
        <button onclick="send()" class="bg-[#00a884] w-12 h-12 rounded-full flex items-center justify-center text-white">➤</button>
      </footer>
    </div>

    <script>
      let db, selU='', me='${user}';
      const avatar = (id) => id ? \`/api/media?id=\${id}\` : 'https://www.w3schools.com/howto/img_avatar.png';

      async function sync() {
        const r = await fetch('/api/data'); db = await r.json();
        renderList(); if(selU) renderMsgs();
      }

      function renderList() {
        const users = Object.keys(db.users).filter(u=>u!==me);
        chatList.innerHTML = users.map(u => \`
          <div onclick="openChat('\${u}')" class="p-4 flex items-center gap-4 active:bg-[#202c33]">
            <img src="\${avatar(db.users[u].pic)}" class="w-14 h-14 rounded-full object-cover">
            <div class="flex-1 border-b border-white/5 pb-4 truncate">
              <div class="flex justify-between items-center mb-1">
                <span class="font-semibold text-white">\${db.users[u].name || u}</span>
                <span class="text-[10px] text-[#8696a0]">15:04</span>
              </div>
              <div class="text-sm text-[#8696a0] truncate">\${db.users[u].bio}</div>
            </div>
          </div>\`).join('');
      }

      function openChat(u) {
        selU=u; chatWindow.classList.remove('hidden');
        cName.innerText = db.users[u].name || u;
        cAv.innerHTML = \`<img src="\${avatar(db.users[u].pic)}" class="w-full h-full object-cover">\`;
        renderMsgs();
      }
      function closeChat() { chatWindow.classList.add('hidden'); selU=''; }

      function renderMsgs() {
        const k = [me, selU].sort().join("_");
        msgBox.innerHTML = (db.chats[k] || []).map(m => \`
          <div class="flex \${m.From===me?'justify-end':'justify-start'}">
            <div class="\${m.From===me?'chat-bubble-me':'chat-bubble-you'} p-2 px-3 shadow-sm max-w-[85%]">
              <div class="text-[15px] text-white">\${m.Text}</div>
              <div class="text-[9px] text-right opacity-60 mt-1 flex items-center justify-end gap-1">
                \${m.Time} \${m.From===me?'<span class="text-blue-400">✓✓</span>':''}
              </div>
            </div>
          </div>\`).join('') + '<div id="bot"></div>';
        document.getElementById('bot').scrollIntoView();
      }

      async function send() {
        if(!mIn.value) return;
        const fd = new FormData(); fd.append('to',selU); fd.append('m', mIn.value);
        mIn.value=''; await fetch('/api/post',{method:'POST',body:fd}); sync();
      }

      setInterval(sync, 3000); sync();
    </script>
  </body></html>`;
  }

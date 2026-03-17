const BACKEND = "https://api.darkdocker.qzz.io"; // GANTI DENGAN URL TUNNEL KAMU

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const cookie = request.headers.get("Cookie") || "";
    const user = (cookie.match(/(?:^|; )user_session=([^;]*)/) || [])[1];

    // Jalur API dan Auth
    if (url.pathname.startsWith("/api/") || request.method === "POST") {
      return fetch(BACKEND + url.pathname + url.search, { 
        method: request.method, 
        headers: request.headers, 
        body: request.body 
      });
    }

    // Logout
    if (url.pathname === "/logout") {
      return new Response("OK", { 
        headers: { "Set-Cookie": "user_session=; Path=/; Max-Age=0", "Location": "/" }, 
        status: 302 
      });
    }

    // Tampilkan Login/Register jika belum ada user
    if (!user) return new Response(renderAuth(), { headers: { "Content-Type": "text/html" } });

    // Tampilkan Main UI jika sudah login
    return new Response(renderMain(user), { headers: { "Content-Type": "text/html" } });
  }
};

function renderAuth() {
  return `<!DOCTYPE html><html><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { background-color: #0b141a; color: #e9edef; font-family: sans-serif; }
      .btn-wa { background-color: #00a884; color: #0b141a; font-weight: bold; }
    </style></head>
    <body class="flex items-center justify-center h-screen px-6">
      <div id="authBox" class="w-full max-w-sm text-center">
        <h1 class="text-[#00a884] text-5xl font-bold mb-10 italic">WhatsApp</h1>
        
        <div id="formArea" class="space-y-4">
          <input id="u" placeholder="Username" class="w-full bg-[#202c33] p-4 rounded-xl outline-none border border-white/5 focus:ring-1 ring-[#00a884]">
          <input id="p" type="password" placeholder="Password" class="w-full bg-[#202c33] p-4 rounded-xl outline-none border border-white/5 focus:ring-1 ring-[#00a884]">
          
          <div id="actionBtns" class="flex flex-col gap-3 pt-4">
            <button onclick="sendAuth('/login')" class="w-full btn-wa p-4 rounded-full uppercase tracking-widest active:scale-95 transition-all">Masuk</button>
            <p class="text-xs text-gray-500">Atau</p>
            <button onclick="toggleMode(true)" class="w-full border border-[#00a884] text-[#00a884] p-4 rounded-full font-bold uppercase tracking-widest active:scale-95 transition-all">Buat Akun Baru</button>
          </div>
        </div>
        
        <p id="modeText" class="mt-8 text-sm text-gray-500">Belum punya akun? <span class="text-[#00a884] cursor-pointer" onclick="toggleMode(true)">Daftar sekarang</span></p>
      </div>

      <script>
        let isRegister = false;
        function toggleMode(reg) {
          isRegister = reg;
          const btns = document.getElementById('actionBtns');
          const modeText = document.getElementById('modeText');
          if(isRegister) {
            btns.innerHTML = '<button onclick="sendAuth(\\'/register\\')" class="w-full btn-wa p-4 rounded-full uppercase tracking-widest active:scale-95 transition-all">Daftar Akun</button><button onclick="toggleMode(false)" class="text-sm text-gray-400 mt-2">Kembali ke Login</button>';
            modeText.innerHTML = 'Sudah punya akun? <span class="text-[#00a884] cursor-pointer" onclick="toggleMode(false)">Masuk</span>';
          } else {
            location.reload();
          }
        }

        async function sendAuth(path) {
          const u = document.getElementById('u').value;
          const p = document.getElementById('p').value;
          if(!u || !p) return alert('Lengkapi data!');
          const fd = new FormData(); fd.append('u', u); fd.append('p', p);
          const r = await fetch(path, { method: 'POST', body: fd });
          if(r.ok) location.reload(); else alert('Gagal! Username mungkin sudah ada atau password salah.');
        }
      </script>
    </body></html>`;
}

function renderMain(user) {
  return `<!DOCTYPE html><html><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { background-color: #0b141a; color: #e9edef; font-family: sans-serif; overflow: hidden; }
      .nav-active { color: #dcf8c6 !important; background-color: #103629; border-radius: 20px; }
      .wa-bg { background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png'); background-blend-mode: overlay; background-color: #0b141a; }
      .chat-bubble-me { background-color: #005c4b; border-radius: 12px 0px 12px 12px; }
      .chat-bubble-you { background-color: #202c33; border-radius: 0px 12px 12px 12px; }
      .hide-scroll::-webkit-scrollbar { display: none; }
    </style></head>
    <body class="h-screen flex flex-col">
      
      <div id="homePage" class="flex flex-col h-full">
        <header class="p-4 flex justify-between items-center">
          <h1 class="text-2xl font-semibold text-[#8696a0]">WhatsApp</h1>
          <div class="flex gap-5 text-xl text-[#8696a0]">
            <span>📷</span><span>🔍</span><span onclick="location.href='/logout'">🚪</span>
          </div>
        </header>

        <div class="px-4 pb-4">
          <div class="bg-[#202c33] flex items-center p-3 rounded-full gap-3 text-[#8696a0]">
            <span class="text-xs">🔍</span>
            <input class="bg-transparent outline-none w-full text-sm" placeholder="Tanya Meta AI atau cari">
          </div>
        </div>

        <main class="flex-1 overflow-y-auto hide-scroll px-1" id="chatList"></main>

        <nav class="bg-[#0b141a] border-t border-white/5 flex justify-around py-3">
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
          <div class="flex-1 font-bold text-sm" id="cName"></div>
          <div class="flex gap-5 px-3">📹 📞 ⋮</div>
        </header>
        <div id="msgBox" class="flex-1 overflow-y-auto p-4 flex flex-col gap-3"></div>
        <footer class="p-2 flex items-center gap-2">
          <div class="flex-1 bg-[#2a3942] rounded-full flex items-center px-4 py-2 gap-3">
            <span>😊</span>
            <input id="mIn" class="bg-transparent flex-1 outline-none text-sm" placeholder="Ketik pesan..." onkeypress="if(event.key==='Enter')send()">
            <span>📎</span><span>📷</span>
          </div>
          <button onclick="send()" class="bg-[#00a884] w-12 h-12 rounded-full flex items-center justify-center">➤</button>
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
          document.getElementById('chatList').innerHTML = users.map(u => \`
            <div onclick="openChat('\${u}')" class="p-4 flex items-center gap-4 active:bg-[#202c33]">
              <img src="\${avatar(db.users[u].pic)}" class="w-14 h-14 rounded-full object-cover border border-white/5">
              <div class="flex-1 border-b border-white/5 pb-4">
                <div class="flex justify-between items-center mb-1">
                  <span class="font-semibold text-white">\${db.users[u].name || u}</span>
                  <span class="text-[10px] text-[#8696a0]">16:00</span>
                </div>
                <div class="text-sm text-[#8696a0] truncate">\${db.users[u].bio}</div>
              </div>
            </div>\`).join('');
        }

        function openChat(u) {
          selU = u; document.getElementById('chatWindow').classList.remove('hidden');
          document.getElementById('cName').innerText = db.users[u].name || u;
          document.getElementById('cAv').innerHTML = \`<img src="\${avatar(db.users[u].pic)}" class="w-full h-full object-cover">\`;
          renderMsgs();
        }
        function closeChat() { document.getElementById('chatWindow').classList.add('hidden'); selU=''; }

        function renderMsgs() {
          const k = [me, selU].sort().join("_");
          document.getElementById('msgBox').innerHTML = (db.chats[k] || []).map(m => \`
            <div class="flex \${m.from===me?'justify-end':'justify-start'}">
              <div class="\${m.from===me?'chat-bubble-me':'chat-bubble-you'} p-2 px-3 shadow-md max-w-[85%]">
                <div class="text-[14px] text-white">\${m.text}</div>
                <div class="text-[9px] text-right opacity-50 mt-1 flex items-center justify-end gap-1">
                  \${m.time} \${m.from===me?'<span class="text-[#53bdeb]">✓✓</span>':''}
                </div>
              </div>
            </div>\`).join('') + '<div id="bot"></div>';
          document.getElementById('bot').scrollIntoView();
        }

        async function send() {
          const m = document.getElementById('mIn'); if(!m.value) return;
          const fd = new FormData(); fd.append('to', selU); fd.append('m', m.value);
          m.value=''; await fetch('/api/post', {method:'POST', body:fd}); sync();
        }

        setInterval(sync, 3000); sync();
      </script>
    </body></html>`;
                                   }

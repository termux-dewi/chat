const CONFIG = {
  driveFileId: "1y4HcX-otBQeT5-dTgUcleOB1BAtkVXML", // ID file media.json
  folderId: "1fz0HedNuB2aLpdmwyIIkrBFdnBn-bok2", // BUAT FOLDER DI DRIVE, MASUKKAN ID-NYA DISINI UNTUK SIMPAN MEDIA >10MB
  clientEmail: "dbchat@chat-490410.iam.gserviceaccount.com",
  privateKey: `-----BEGIN PRIVATE KEY-----\n... (Gunakan Private Key Anda) ...\n-----END PRIVATE KEY-----`
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const cookie = request.headers.get("Cookie") || "";
    const username = (cookie.match(/user_session=([^;]+)/) || [])[1];

    const getDB = async (token) => {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${CONFIG.driveFileId}?alt=media`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await res.json();
    };

    // --- AUTH LOGIC ---
    if (request.method === "POST" && (url.pathname === "/login" || url.pathname === "/register")) {
      const token = await getAccessToken();
      const formData = await request.formData();
      const user = (formData.get("username") || "").trim().toLowerCase();
      const pass = (formData.get("password") || "").trim();
      let db = await getDB(token);

      if (url.pathname === "/login") {
        if (db.users[user] && db.users[user].password === pass) {
          return new Response("OK", { status: 302, headers: { "Location": "/", "Set-Cookie": `user_session=${user}; Path=/; HttpOnly; Max-Age=86400` } });
        }
        return new Response("Salah Password/User", { status: 401 });
      }
      if (url.pathname === "/register") {
        db.users[user] = { name: user, password: pass, lastSeen: Date.now(), bio: "Available", pic: null };
        await saveDB(token, db);
        return new Response("OK", { status: 302, headers: { "Location": "/", "Set-Cookie": `user_session=${user}; Path=/; HttpOnly; Max-Age=86400` } });
      }
    }

    // --- API & ACTION HANDLER ---
    if (username) {
      const token = await getAccessToken();

      // Proxy untuk melihat media (Karena Drive butuh Auth)
      if (url.pathname === "/api/media") {
        const fileId = url.searchParams.get("id");
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return new Response(res.body, { headers: { "Content-Type": res.headers.get("Content-Type") } });
      }

      if (url.pathname === "/api/data") {
        let db = await getDB(token);
        return new Response(JSON.stringify(db), { headers: { "Content-Type": "application/json" } });
      }

      if (request.method === "POST") {
        const formData = await request.formData();
        const action = formData.get("action");
        let db = await getDB(token);

        if (action === "chat" || action === "post_status" || action === "vn") {
          const file = formData.get("file");
          let mediaId = null;
          let fileType = action === "vn" ? "audio" : "text";

          if (file && file.size > 0) {
            mediaId = await uploadMedia(token, file); // Upload file > 10MB ke Drive
            fileType = file.type.split('/')[0];
          }

          if (action === "chat") {
            const to = formData.get("to");
            const chatId = [username, to].sort().join("_");
            if (!db.privateChats[chatId]) db.privateChats[chatId] = [];
            db.privateChats[chatId].push({
              id: "m_" + Date.now(), from: username, text: formData.get("message") || "",
              fileId: mediaId, fileType: fileType,
              time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            });
          } else if (action === "post_status") {
            db.status.unshift({ user: username, fileId: mediaId, type: fileType, time: Date.now() });
          }
        } 
        
        else if (action === "delete_msg") {
          const chatId = formData.get("chatId");
          const msgId = formData.get("msgId");
          const mode = formData.get("mode"); // "me" or "everyone"
          
          db.privateChats[chatId] = db.privateChats[chatId].map(m => {
            if (m.id === msgId) {
              if (mode === "everyone") return { ...m, text: "🚫 Pesan ini telah dihapus", fileId: null, deleted: true };
              if (mode === "me" && m.from === username) return null;
            }
            return m;
          }).filter(m => m !== null);
        }

        await saveDB(token, db);
        return new Response("OK");
      }
    }

    if (!username) return new Response(renderAuthPage(), { headers: { "Content-Type": "text/html" } });
    return new Response(renderMainApp(username), { headers: { "Content-Type": "text/html" } });
  }
};

// --- DRIVE UPLOAD UTILS ---
async function uploadMedia(token, file) {
  const metadata = { name: `${Date.now()}_${file.name}`, parents: [CONFIG.folderId] };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: form
  });
  const data = await res.json();
  return data.id;
}

async function saveDB(token, db) {
  return fetch(`https://www.googleapis.com/upload/drive/v3/files/${CONFIG.driveFileId}?uploadType=media`, { 
    method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(db) 
  });
}

async function getAccessToken() {
  // ... (Sama seperti kode sebelumnya untuk JWT Google Auth) ...
}

// --- UI (HIGHLIGHT FITUR BARU) ---
function renderMainApp(user) {
  return `<!DOCTYPE html><html>...
  <script>
    // Fitur VN menggunakan MediaRecorder API
    let recorder, chunks = [];
    async function startVN() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
        const fd = new FormData();
        fd.append('action', 'vn');
        fd.append('file', blob, 'vn.ogg');
        fd.append('to', selU);
        await fetch('/', { method: 'POST', body: fd });
        chunks = []; update();
      };
      recorder.start();
    }

    function stopVN() { recorder.stop(); }

    // Fitur Hapus Pesan
    function deleteMsg(chatId, msgId) {
      const mode = confirm("Hapus untuk semua orang?") ? "everyone" : "me";
      const fd = new FormData();
      fd.append('action', 'delete_msg');
      fd.append('chatId', chatId);
      fd.append('msgId', msgId);
      fd.append('mode', mode);
      fetch('/', { method: 'POST', body: fd }).then(update);
    }

    // Penanganan Media Besar (Lazy Load via API Proxy)
    const renderMedia = (m) => {
      if (!m.fileId) return '';
      const url = '/api/media?id=' + m.fileId;
      if (m.fileType === 'image') return \`<img src="\${url}" class="max-w-full rounded" loading="lazy" />\`;
      if (m.fileType === 'video') return \`<video src="\${url}" controls class="max-w-full rounded"></video>\`;
      if (m.fileType === 'audio') return \`<audio src="\${url}" controls class="w-full"></audio>\`;
      return '';
    }
  </script>
  ...</html>`;
              }

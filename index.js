
const CONFIG = {
driveFileId:"1y4HcX-otBQeT5-dTgUcleOB1BAtkVXML",
mediaFolderId:"1VgxPBzDVJ_GxPbUXAYLnTSeZbitjYOnY",
clientEmail:"dbchat@chat-490410.iam.gserviceaccount.com",
privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDNgJdV7jFyCzHt\nnRLMBKaDNtTXlm9Ab8liUWAf7DFqVOt2bw8+g+ufmLPRrGIpQMlgJmHtE+e9iJJ7\nP0qRHnygmmXjwMK+jVeRk77KJA3aHpM9rGZjltl1TMffGxrWWCcGk+rJ4GWOkvR6\nwnRSmpVjPywRpCcB66LLwTKKSjOySZ6RIOOT4WIWDwM04qk75ueav80WarV+/scx\nh/6GrAJ8HXJijiPhQoFP47nrD8Cb/GQMVoCnIonkDybBATaAemlImSlsfigjMCCO\nj3iU16tMq+AbsFgZ9XefJ0GaIMWjvCnlm4UxZNlTD7qqx9V0vQZzKFnQWXoOsKSD\n48A1QSPvAgMBAAECggEABPRQsbWoY4N5lKzwwxJpoUg1IW1zCS6owEIN+zcKifG6\nK4TJ7Uvo5lQcIbXyN+Rj9nl2auzL7XnZbjc8aPs/LfAK/M6s40MtFUlmlCECZHvQ\nOPBrF4OPgpBzUSGqJ/jAGByA0JUkXaeVVVBS1Zr8dwQS3+oBNr6jkh36RfM8A9RP\neo0cw1P4nv71q1eVp7vfH+6/iN2f7QuyJEdsZhCmjq9+aWxNh/VlVgS0KT+aDDhl\n9MFp/RL+YLstGTeS/NUj2eprjO/+K6SsGlQ7Ln42o3AO3WdmEPuFdub+WcQvbDv9\nfqYDmvJETEMR7A3oeGNxvvS3Q7CGrF7GxsHLB7e7wQKBgQDp+rVMJJqzweC5uDOs\npXH6tJrIK8w3XRIsQCiumad+BgmY0/fDQ0QxmEggxlxJ4XZKSfinssxA+LksdQL5\n1yX4Ug+blTViTDZdol95RQkHvHKrqHJyKM2Ghf17QASn/hrAsZ7SkJDOu6zpZpI+\nk38sC5ZHffZ3SIHCJO4hMzCzJwKBgQDg18hhkieUkndqKtHSklIc4+WXcy4+L5h7\n1ovr4IihFdOCkBeE3lRMklXl83vXUxRUjK0ei9VmxspW6V9rQkLU7HKiCUMVnXts\nPSViB6RUOjy4bQrItze/cyzP80yH3hxFIUWRa2FzLI08/j3uAF1Dp/taMgQBVS25\n8LCiAPfl+QKBgQCIpEo2YnYaHlJgA2viGmia8dgmqDVF68uOHhXkCYXgOiRmpPtf\nhCwSDo2o3k7NMqdDMTnOrcNM+jQh+1+2imf5QestgBDCDCH/wrChAKkKZIpPJztW\n4e9M7Xkf/j354ZK8D77h111J7h5H3AfyFW9CSK4FqFFETgrBV5Hdv6hkJwKBgBS/\n1R4r/rsXSS3jBboJBsrjvSxc1MeoXMoQ4pjB/9ndyccixQjd+6mVV5gBAEy+vgGP\neep3vRne/o1GvCeJ1eEQcQPDFw3HmrxCaFDDo8aiGThr17LuNZbVai1GpqljNfir\nOWBSKIwYcHBQhiaQogq8VdXdB8GXusCOFb7dmAMBAoGBAMi/+6SAbISsMQGjoh1W\nrU0wgC168Ktz0D3E/8JJaVgh9kaFXHhwPz9hb7mzFUtioTaNq/tCFyMcLEEZHnDO\ne9Uym8/pdzzZlrZHj9/RlGe25aMxHOHz/+gNswnruJ0oc9uNQd8wI3c/fuD03umK\n5lykpzsqt9d8bflXTSS5d1CJ\n-----END PRIVATE KEY-----\n"
}

export default {

async fetch(request){

const url=new URL(request.url)
const cookie=request.headers.get("Cookie")||""
const username=(cookie.match(/user_session=([^;]+)/)||[])[1]

const token=await getAccessToken()

if(url.pathname==="/api/data"){
let db=await getDB(token)

if(username && db.users[username]){
db.users[username].lastSeen=Date.now()
await saveDB(token,db)
}

return new Response(JSON.stringify(db),{
headers:{"Content-Type":"application/json"}
})
}

if(request.method==="POST"){

const formData=await request.formData()
const action=formData.get("action")
let db=await getDB(token)

if(action==="register"){

const user=formData.get("username").trim().toLowerCase()
const pass=await hash(formData.get("password"))

if(!db.users[user]){
db.users[user]={
name:user,
password:pass,
bio:"Available",
pic:null,
lastSeen:Date.now()
}

await saveDB(token,db)
}

return redirect(user)

}

if(action==="login"){

const user=formData.get("username").trim().toLowerCase()
const pass=await hash(formData.get("password"))

if(db.users[user] && db.users[user].password===pass){
return redirect(user)
}

return new Response("login failed")
}

if(username){

if(action==="chat"){

const to=formData.get("to")
const msg=formData.get("message")||""
const file=formData.get("file")

const chatId=[username,to].sort().join("_")

if(!db.privateChats[chatId])
db.privateChats[chatId]=[]

let fileUrl=null
let type=null

if(file && file.size>0){

const id=await uploadFile(token,file)

if(id){
fileUrl=`https://www.googleapis.com/drive/v3/files/${id}?alt=media`
type=file.type.startsWith("video")?"video":
file.type.startsWith("audio")?"audio":"image"
}
}

db.privateChats[chatId].push({
id:"m_"+Date.now(),
from:username,
text:msg,
file:fileUrl,
fileType:type,
edited:false,
readBy:[],
deletedBy:[],
time:Date.now()
})

await saveDB(token,db)

return new Response("OK")
}

if(action==="edit"){

const chatId=formData.get("chat")
const mid=formData.get("mid")
const text=formData.get("text")

let msgs=db.privateChats[chatId]||[]

for(let m of msgs){

if(m.id===mid && m.from===username){
m.text=text
m.edited=true
}
}

await saveDB(token,db)

return new Response("OK")
}

if(action==="delete"){

const chatId=formData.get("chat")
const mid=formData.get("mid")

let msgs=db.privateChats[chatId]||[]

for(let m of msgs){

if(m.id===mid){

if(!m.deletedBy)
m.deletedBy=[]

m.deletedBy.push(username)

if(m.deletedBy.length>=2){
m.text="message deleted"
m.file=null
}
}
}

await saveDB(token,db)

return new Response("OK")
}

if(action==="profile"){

const file=formData.get("pic")

if(file && file.size>0){

const id=await uploadFile(token,file)

if(id){
db.users[username].pic=
`https://www.googleapis.com/drive/v3/files/${id}?alt=media`
}
}

db.users[username].bio=formData.get("bio")

await saveDB(token,db)

return new Response("OK")
}

}

}

if(url.pathname==="/logout"){
return new Response("",{
status:302,
headers:{
Location:"/",
"Set-Cookie":"user_session=; Path=/; Max-Age=0"
}
})
}

if(!username)
return new Response(loginPage(),{
headers:{"Content-Type":"text/html"}
})

return new Response(appPage(username),{
headers:{"Content-Type":"text/html"}
})

}

}

async function hash(str){

const buf=await crypto.subtle.digest(
"SHA-256",
new TextEncoder().encode(str)
)

return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

async function getDB(token){

const res=await fetch(
`https://www.googleapis.com/drive/v3/files/${CONFIG.driveFileId}?alt=media`,
{headers:{Authorization:`Bearer ${token}`}}
)

let db=await res.json()

if(!db.users)db.users={}
if(!db.privateChats)db.privateChats={}

return db
}

function saveDB(token,db){

return fetch(
`https://www.googleapis.com/upload/drive/v3/files/${CONFIG.driveFileId}?uploadType=media`,
{
method:"PATCH",
headers:{
Authorization:`Bearer ${token}`,
"Content-Type":"application/json"
},
body:JSON.stringify(db)
})
}

async function uploadFile(token,file){

try{

const res=await fetch(
"https://www.googleapis.com/upload/drive/v3/files?uploadType=media",
{
method:"POST",
headers:{
Authorization:`Bearer ${token}`,
"Content-Type":file.type
},
body:file
})

const data=await res.json()

if(!data.id) return null

await fetch(
`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`,
{
method:"POST",
headers:{
Authorization:`Bearer ${token}`,
"Content-Type":"application/json"
},
body:JSON.stringify({
role:"reader",
type:"anyone"
})
})

return data.id

}catch(e){

return null

}

}

async function getAccessToken(){

const pem=CONFIG.privateKey.replace(/\\n/g,"\n")
const body=pem.split("-----")[2].replace(/\s/g,"")

const key=await crypto.subtle.importKey(
"pkcs8",
Uint8Array.from(atob(body),c=>c.charCodeAt(0)),
{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},
false,
["sign"]
)

const header=btoa(JSON.stringify({alg:"RS256",typ:"JWT"})).replace(/=/g,"")

const payload=btoa(JSON.stringify({
iss:CONFIG.clientEmail,
scope:"https://www.googleapis.com/auth/drive",
aud:"https://oauth2.googleapis.com/token",
exp:Math.floor(Date.now()/1000)+3600,
iat:Math.floor(Date.now()/1000)
})).replace(/=/g,"")

const sig=await crypto.subtle.sign(
"RSASSA-PKCS1-v1_5",
key,
new TextEncoder().encode(`${header}.${payload}`)
)

const jwt=`${header}.${payload}.${btoa(String.fromCharCode(...new Uint8Array(sig)))
.replace(/\+/g,"-")
.replace(/\//g,"_")
.replace(/=/g,"")}`

const res=await fetch(
"https://oauth2.googleapis.com/token",
{
method:"POST",
body:new URLSearchParams({
grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",
assertion:jwt
})
})

return (await res.json()).access_token

}

function redirect(user){

return new Response("",{
status:302,
headers:{
Location:"/",
"Set-Cookie":`user_session=${user}; Path=/; HttpOnly`
}
})

}

function loginPage(){

return `<!DOCTYPE html>
<html>
<body style="background:black;color:white;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif">
<form method="POST">
<h2>CHAT LOGIN</h2>
<input name="username" placeholder="username"><br><br>
<input name="password" type="password"><br><br>
<button name="action" value="login">LOGIN</button>
<button name="action" value="register">REGISTER</button>
</form>
</body>
</html>`
}

function appPage(user){

return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;background:black;color:white;font-family:sans-serif}
#chat{height:80vh;overflow:auto;padding:20px}
.msg{margin:10px}
.me{text-align:right}
img,video{max-width:200px;border-radius:10px}
</style>
</head>
<body>

<div id="chat"></div>

<input id="msg">
<input type="file" id="file">
<button onclick="send()">SEND</button>

<script>

let to=""
let db={}

async function load(){

const r=await fetch("/api/data")
db=await r.json()

}

async function send(){

const fd=new FormData()

fd.append("action","chat")
fd.append("to",to)
fd.append("message",msg.value)

if(file.files[0])
fd.append("file",file.files[0])

await fetch("/",{method:"POST",body:fd})

msg.value=""
file.value=""

}

setInterval(load,3000)
load()

</script>

</body>
</html>`

}


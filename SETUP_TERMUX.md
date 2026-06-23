# Setup untuk Termux

## 1. Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## 2. Install PostgreSQL
```bash
pkg install postgresql
initdb ~/.postgresql
postgres -D ~/.postgresql
```

## 3. Setup Backend
```bash
cd backend
cp .env.example .env
cargo build --release
cargo run --release
```

## 4. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

## 5. Create Database
```bash
psql
CREATE DATABASE mesh_network_db;
\q
psql mesh_network_db < ../database/schema.sql
```

## Testing

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

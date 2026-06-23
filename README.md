# 🚀 Mesh Network Full Stack System

Complete full-stack mesh network system with Rust backend, React frontend, and PostgreSQL database.

## ✅ Features

### Backend (Rust + Actix-web)
- User authentication (Register/Login/JWT)
- Role-based access control (Admin/User)
- Complete CRUD for Users, Devices, Networks
- Network topology management
- Admin panel with statistics
- Activity logging

### Frontend (React + TypeScript)
- Login/Register pages
- User Dashboard
- Device management
- Network management  
- Network status viewer
- Admin dashboard

### Database (PostgreSQL)
- Complete ERD with relationships
- Users, Devices, Networks tables
- Network topology & members
- Activity logs
- Optimized indexes

## 📋 API Endpoints

### Auth
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login user

### Users (Protected)
- `GET /api/v1/users` - List users
- `GET /api/v1/users/{id}` - Get user
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Devices (Protected)
- `GET /api/v1/devices` - List devices
- `POST /api/v1/devices` - Create device
- `PUT /api/v1/devices/{id}` - Update device
- `DELETE /api/v1/devices/{id}` - Delete device

### Networks (Protected)
- `GET /api/v1/networks` - List networks
- `POST /api/v1/networks` - Create network
- `GET /api/v1/networks/{id}/stats` - Get stats
- `GET /api/v1/networks/{id}/topology` - Get topology

## 🚀 Quick Start

### Backend
```bash
cd backend
cp .env.example .env
cargo build --release
cargo run --release
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database
```bash
psql mesh_network_db < database/schema.sql
```

## 📚 Documentation

- API docs: `docs/API.md`
- Setup guide: `SETUP_TERMUX.md`
- Architecture: `docs/ARCHITECTURE.md`

## 🔐 Security

- JWT authentication
- Bcrypt password hashing
- Role-based access control
- SQL injection prevention
- CORS enabled

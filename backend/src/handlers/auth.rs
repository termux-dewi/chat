use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use serde::{Deserialize, Serialize};
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::Utc;
use std::env;
use crate::models::{User, UserResponse, CreateUserRequest};
use crate::utils::jwt::generate_jwt;

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub user: UserResponse,
}

pub async fn register(
    pool: web::Data<PgPool>,
    req: web::Json<CreateUserRequest>,
) -> HttpResponse {
    if req.username.len() < 3 {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Username must be at least 3 characters"
        }));
    }

    let password_hash = match hash(&req.password, DEFAULT_COST) {
        Ok(h) => h,
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({
            "error": "Failed to hash password"
        })),
    };
    
    let result = sqlx::query_as::<_, User>(
        "INSERT INTO users (username, email, password_hash, role, full_name) 
         VALUES ($1, $2, $3, 'user', $4)
         RETURNING id, username, email, password_hash, role, full_name, avatar_url, is_active, created_at, updated_at"
    )
    .bind(&req.username)
    .bind(&req.email)
    .bind(&password_hash)
    .bind(&req.full_name)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(user) => {
            let token = generate_jwt(user.id, &user.email, &user.role);
            HttpResponse::Created().json(AuthResponse {
                access_token: token,
                user: UserResponse::from(user),
            })
        }
        Err(_) => {
            HttpResponse::BadRequest().json(serde_json::json!({
                "error": "Email or username already exists"
            }))
        }
    }
}

pub async fn login(
    pool: web::Data<PgPool>,
    req: web::Json<LoginRequest>,
) -> HttpResponse {
    let user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE email = $1"
    )
    .bind(&req.email)
    .fetch_optional(pool.get_ref())
    .await;

    match user {
        Ok(Some(user)) => {
            if verify(&req.password, &user.password_hash).unwrap_or(false) {
                let token = generate_jwt(user.id, &user.email, &user.role);
                HttpResponse::Ok().json(AuthResponse {
                    access_token: token,
                    user: UserResponse::from(user),
                })
            } else {
                HttpResponse::Unauthorized().json(serde_json::json!({
                    "error": "Invalid credentials"
                }))
            }
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({
            "error": "User not found"
        })),
        Err(_) => {
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Internal server error"
            }))
        }
    }
}

pub async fn refresh_token() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "message": "Token refreshed"
    }))
}
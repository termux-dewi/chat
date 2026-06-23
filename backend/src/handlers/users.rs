use actix_web::{web, HttpRequest, HttpResponse};
use sqlx::PgPool;
use crate::models::{User, UserResponse, UpdateUserRequest};
use crate::utils::jwt::verify_jwt;

pub async fn list_users(
    pool: web::Data<PgPool>,
    req: HttpRequest,
) -> HttpResponse {
    let auth_header = match req.headers().get("Authorization") {
        Some(h) => h.to_str().unwrap_or(""),
        None => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Missing auth"})),
    };

    let token = auth_header.strip_prefix("Bearer ").unwrap_or("");
    match verify_jwt(token) {
        Ok(_) => {},
        Err(_) => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Invalid token"})),
    }

    match sqlx::query_as::<_, User>("SELECT * FROM users LIMIT 100")
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(users) => {
            let responses: Vec<UserResponse> = users.into_iter().map(UserResponse::from).collect();
            HttpResponse::Ok().json(responses)
        }
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Server error"})),
    }
}

pub async fn get_user(
    pool: web::Data<PgPool>,
    user_id: web::Path<i32>,
) -> HttpResponse {
    match sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(user_id.into_inner())
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(user)) => HttpResponse::Ok().json(UserResponse::from(user)),
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "User not found"})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Server error"})),
    }
}

pub async fn create_user() -> HttpResponse {
    HttpResponse::Created().json(serde_json::json!({"message": "User created"}))
}

pub async fn update_user(
    pool: web::Data<PgPool>,
    user_id: web::Path<i32>,
    body: web::Json<UpdateUserRequest>,
) -> HttpResponse {
    match sqlx::query(
        "UPDATE users SET full_name = COALESCE($1, full_name), avatar_url = COALESCE($2, avatar_url), is_active = COALESCE($3, is_active), updated_at = CURRENT_TIMESTAMP WHERE id = $4"
    )
    .bind(&body.full_name)
    .bind(&body.avatar_url)
    .bind(body.is_active)
    .bind(user_id.into_inner())
    .execute(pool.get_ref())
    .await
    {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"message": "Updated"})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Error"})),
    }
}

pub async fn delete_user(
    pool: web::Data<PgPool>,
    user_id: web::Path<i32>,
) -> HttpResponse {
    match sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(user_id.into_inner())
        .execute(pool.get_ref())
        .await
    {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"message": "Deleted"})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Error"})),
    }
}
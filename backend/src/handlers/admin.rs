use actix_web::{web, HttpResponse};
use sqlx::PgPool;

pub async fn get_all_users(pool: web::Data<PgPool>) -> HttpResponse {
    match sqlx::query("SELECT COUNT(*) as total_users FROM users")
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"message": "Admin access granted"})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Error"})),
    }
}

pub async fn get_all_networks(pool: web::Data<PgPool>) -> HttpResponse {
    match sqlx::query("SELECT COUNT(*) as total_networks FROM networks")
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"message": "Admin access granted"})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Error"})),
    }
}

pub async fn get_system_stats(pool: web::Data<PgPool>) -> HttpResponse {
    let users_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(pool.get_ref())
        .await
        .unwrap_or((0,));

    let networks_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM networks")
        .fetch_one(pool.get_ref())
        .await
        .unwrap_or((0,));

    let devices_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM devices")
        .fetch_one(pool.get_ref())
        .await
        .unwrap_or((0,));

    let online_devices: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM devices WHERE is_online = true")
        .fetch_one(pool.get_ref())
        .await
        .unwrap_or((0,));

    HttpResponse::Ok().json(serde_json::json!({
        "total_users": users_count.0,
        "total_networks": networks_count.0,
        "total_devices": devices_count.0,
        "online_devices": online_devices.0,
    }))
}

pub async fn get_activity_logs(pool: web::Data<PgPool>) -> HttpResponse {
    match sqlx::query("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100")
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(logs) => HttpResponse::Ok().json(logs),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Error"})),
    }
}
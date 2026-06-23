use actix_web::{web, HttpRequest, HttpResponse};
use sqlx::PgPool;
use crate::models::{Device, CreateDeviceRequest, UpdateDeviceRequest, DeviceResponse, DeviceStatusResponse};
use crate::utils::jwt::verify_jwt;

pub async fn list_devices(
    pool: web::Data<PgPool>,
    req: HttpRequest,
) -> HttpResponse {
    let auth_header = match req.headers().get("Authorization") {
        Some(h) => h.to_str().unwrap_or(""),
        None => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Missing auth"})),
    };

    let token = auth_header.strip_prefix("Bearer ").unwrap_or("");
    let claims = match verify_jwt(token) {
        Ok(c) => c,
        Err(_) => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Invalid"})),
    };

    match sqlx::query_as::<_, Device>("SELECT * FROM devices WHERE user_id = $1 ORDER BY created_at DESC")
        .bind(claims.sub)
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(devices) => {
            let responses: Vec<DeviceResponse> = devices.into_iter().map(|d| DeviceResponse {
                id: d.id,
                device_name: d.device_name,
                device_type: d.device_type,
                ip_address: d.ip_address,
                mac_address: d.mac_address,
                signal_strength: d.signal_strength,
                battery_level: d.battery_level,
                is_online: d.is_online,
                location_lat: d.location_lat,
                location_lng: d.location_lng,
                last_seen: d.last_seen,
                created_at: d.created_at,
            }).collect();
            HttpResponse::Ok().json(responses)
        }
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Error"})),
    }
}

pub async fn get_device(
    pool: web::Data<PgPool>,
    device_id: web::Path<i32>,
    req: HttpRequest,
) -> HttpResponse {
    let auth_header = match req.headers().get("Authorization") {
        Some(h) => h.to_str().unwrap_or(""),
        None => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Missing"})),
    };

    let token = auth_header.strip_prefix("Bearer ").unwrap_or("");
    let claims = match verify_jwt(token) {
        Ok(c) => c,
        Err(_) => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Invalid"})),
    };

    match sqlx::query_as::<_, Device>("SELECT * FROM devices WHERE id = $1 AND user_id = $2")
        .bind(device_id.into_inner())
        .bind(claims.sub)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(device)) => {
            let response = DeviceResponse {
                id: device.id,
                device_name: device.device_name,
                device_type: device.device_type,
                ip_address: device.ip_address,
                mac_address: device.mac_address,
                signal_strength: device.signal_strength,
                battery_level: device.battery_level,
                is_online: device.is_online,
                location_lat: device.location_lat,
                location_lng: device.location_lng,
                last_seen: device.last_seen,
                created_at: device.created_at,
            };
            HttpResponse::Ok().json(response)
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Not found"})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Error"})),
    }
}

pub async fn create_device(
    pool: web::Data<PgPool>,
    body: web::Json<CreateDeviceRequest>,
    req: HttpRequest,
) -> HttpResponse {
    let auth_header = match req.headers().get("Authorization") {
        Some(h) => h.to_str().unwrap_or(""),
        None => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Missing"})),
    };

    let token = auth_header.strip_prefix("Bearer ").unwrap_or("");
    let claims = match verify_jwt(token) {
        Ok(c) => c,
        Err(_) => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Invalid"})),
    };

    match sqlx::query_as::<_, Device>(
        "INSERT INTO devices (user_id, device_name, device_type, mac_address, location_lat, location_lng) 
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, user_id, device_name, device_type, ip_address, mac_address, signal_strength, battery_level, is_online, location_lat, location_lng, last_seen, created_at, updated_at"
    )
    .bind(claims.sub)
    .bind(&body.device_name)
    .bind(&body.device_type)
    .bind(&body.mac_address)
    .bind(body.location_lat)
    .bind(body.location_lng)
    .fetch_one(pool.get_ref())
    .await
    {
        Ok(device) => {
            let response = DeviceResponse {
                id: device.id,
                device_name: device.device_name,
                device_type: device.device_type,
                ip_address: device.ip_address,
                mac_address: device.mac_address,
                signal_strength: device.signal_strength,
                battery_level: device.battery_level,
                is_online: device.is_online,
                location_lat: device.location_lat,
                location_lng: device.location_lng,
                last_seen: device.last_seen,
                created_at: device.created_at,
            };
            HttpResponse::Created().json(response)
        }
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Failed"})),
    }
}

pub async fn update_device(
    pool: web::Data<PgPool>,
    device_id: web::Path<i32>,
    body: web::Json<UpdateDeviceRequest>,
    req: HttpRequest,
) -> HttpResponse {
    let auth_header = match req.headers().get("Authorization") {
        Some(h) => h.to_str().unwrap_or(""),
        None => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Missing"})),
    };

    let token = auth_header.strip_prefix("Bearer ").unwrap_or("");
    let claims = match verify_jwt(token) {
        Ok(c) => c,
        Err(_) => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Invalid"})),
    };

    match sqlx::query(
        "UPDATE devices SET device_name = COALESCE($1, device_name), device_type = COALESCE($2, device_type), signal_strength = COALESCE($3, signal_strength), battery_level = COALESCE($4, battery_level), is_online = COALESCE($5, is_online), location_lat = COALESCE($6, location_lat), location_lng = COALESCE($7, location_lng), updated_at = CURRENT_TIMESTAMP WHERE id = $8 AND user_id = $9"
    )
    .bind(&body.device_name)
    .bind(&body.device_type)
    .bind(body.signal_strength)
    .bind(body.battery_level)
    .bind(body.is_online)
    .bind(body.location_lat)
    .bind(body.location_lng)
    .bind(device_id.into_inner())
    .bind(claims.sub)
    .execute(pool.get_ref())
    .await
    {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"message": "Updated"})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Error"})),
    }
}

pub async fn delete_device(
    pool: web::Data<PgPool>,
    device_id: web::Path<i32>,
    req: HttpRequest,
) -> HttpResponse {
    let auth_header = match req.headers().get("Authorization") {
        Some(h) => h.to_str().unwrap_or(""),
        None => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Missing"})),
    };

    let token = auth_header.strip_prefix("Bearer ").unwrap_or("");
    let claims = match verify_jwt(token) {
        Ok(c) => c,
        Err(_) => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Invalid"})),
    };

    match sqlx::query("DELETE FROM devices WHERE id = $1 AND user_id = $2")
        .bind(device_id.into_inner())
        .bind(claims.sub)
        .execute(pool.get_ref())
        .await
    {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"message": "Deleted"})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Error"})),
    }
}

pub async fn get_device_status(
    pool: web::Data<PgPool>,
    device_id: web::Path<i32>,
    req: HttpRequest,
) -> HttpResponse {
    let auth_header = match req.headers().get("Authorization") {
        Some(h) => h.to_str().unwrap_or(""),
        None => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Missing"})),
    };

    let token = auth_header.strip_prefix("Bearer ").unwrap_or("");
    let claims = match verify_jwt(token) {
        Ok(c) => c,
        Err(_) => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Invalid"})),
    };

    match sqlx::query_as::<_, Device>("SELECT * FROM devices WHERE id = $1 AND user_id = $2")
        .bind(device_id.into_inner())
        .bind(claims.sub)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(device)) => {
            let response = DeviceStatusResponse {
                id: device.id,
                device_name: device.device_name,
                is_online: device.is_online,
                signal_strength: device.signal_strength,
                battery_level: device.battery_level,
                last_seen: device.last_seen,
            };
            HttpResponse::Ok().json(response)
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Not found"})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Error"})),
    }
}
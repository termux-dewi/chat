use actix_web::{web, HttpRequest, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;
use crate::models::{Network, CreateNetworkRequest, UpdateNetworkRequest, NetworkResponse, NetworkTopology, NetworkStatsResponse};
use crate::utils::jwt::verify_jwt;

pub async fn list_networks(
    pool: web::Data<PgPool>,
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

    match sqlx::query_as::<_, Network>("SELECT * FROM networks WHERE owner_id = $1 ORDER BY created_at DESC")
        .bind(claims.sub)
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(networks) => {
            let mut responses = Vec::new();
            for network in networks {
                let device_count: (i64,) = sqlx::query_as(
                    "SELECT COUNT(*) FROM network_members WHERE network_id = $1"
                )
                .bind(network.id)
                .fetch_one(pool.get_ref())
                .await
                .unwrap_or((0,));

                responses.push(NetworkResponse {
                    id: network.id,
                    network_name: network.network_name,
                    description: network.description,
                    is_public: network.is_public,
                    max_devices: network.max_devices,
                    device_count: device_count.0 as i32,
                    created_at: network.created_at,
                });
            }
            HttpResponse::Ok().json(responses)
        }
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Error"})),
    }
}

pub async fn get_network(
    pool: web::Data<PgPool>,
    network_id: web::Path<i32>,
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

    match sqlx::query_as::<_, Network>("SELECT * FROM networks WHERE id = $1 AND owner_id = $2")
        .bind(network_id.into_inner())
        .bind(claims.sub)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(network)) => {
            let device_count: (i64,) = sqlx::query_as(
                "SELECT COUNT(*) FROM network_members WHERE network_id = $1"
            )
            .bind(network.id)
            .fetch_one(pool.get_ref())
            .await
            .unwrap_or((0,));

            let response = NetworkResponse {
                id: network.id,
                network_name: network.network_name,
                description: network.description,
                is_public: network.is_public,
                max_devices: network.max_devices,
                device_count: device_count.0 as i32,
                created_at: network.created_at,
            };
            HttpResponse::Ok().json(response)
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Not found"})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Error"})),
    }
}

pub async fn create_network(
    pool: web::Data<PgPool>,
    body: web::Json<CreateNetworkRequest>,
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

    let network_key = Uuid::new_v4().to_string();

    match sqlx::query_as::<_, Network>(
        "INSERT INTO networks (network_name, owner_id, network_key, description, is_public, max_devices) 
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, network_name, owner_id, network_key, description, is_public, max_devices, created_at, updated_at"
    )
    .bind(&body.network_name)
    .bind(claims.sub)
    .bind(&network_key)
    .bind(&body.description)
    .bind(body.is_public.unwrap_or(false))
    .bind(body.max_devices.unwrap_or(100))
    .fetch_one(pool.get_ref())
    .await
    {
        Ok(network) => {
            let response = NetworkResponse {
                id: network.id,
                network_name: network.network_name,
                description: network.description,
                is_public: network.is_public,
                max_devices: network.max_devices,
                device_count: 0,
                created_at: network.created_at,
            };
            HttpResponse::Created().json(response)
        }
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Failed"})),
    }
}

pub async fn update_network(
    pool: web::Data<PgPool>,
    network_id: web::Path<i32>,
    body: web::Json<UpdateNetworkRequest>,
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
        "UPDATE networks SET network_name = COALESCE($1, network_name), description = COALESCE($2, description), is_public = COALESCE($3, is_public), max_devices = COALESCE($4, max_devices), updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND owner_id = $6"
    )
    .bind(&body.network_name)
    .bind(&body.description)
    .bind(body.is_public)
    .bind(body.max_devices)
    .bind(network_id.into_inner())
    .bind(claims.sub)
    .execute(pool.get_ref())
    .await
    {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"message": "Updated"})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Error"})),
    }
}

pub async fn delete_network(
    pool: web::Data<PgPool>,
    network_id: web::Path<i32>,
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

    match sqlx::query("DELETE FROM networks WHERE id = $1 AND owner_id = $2")
        .bind(network_id.into_inner())
        .bind(claims.sub)
        .execute(pool.get_ref())
        .await
    {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"message": "Deleted"})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Error"})),
    }
}

pub async fn get_topology(
    pool: web::Data<PgPool>,
    network_id: web::Path<i32>,
    req: HttpRequest,
) -> HttpResponse {
    let auth_header = match req.headers().get("Authorization") {
        Some(h) => h.to_str().unwrap_or(""),
        None => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Missing"})),
    };

    let token = auth_header.strip_prefix("Bearer ").unwrap_or("");
    match verify_jwt(token) {
        Ok(_) => {},
        Err(_) => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Invalid"})),
    };

    match sqlx::query_as::<_, NetworkTopology>("SELECT * FROM network_topology WHERE network_id = $1")
        .bind(network_id.into_inner())
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(topologies) => HttpResponse::Ok().json(topologies),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Error"})),
    }
}

pub async fn get_network_stats(
    pool: web::Data<PgPool>,
    network_id: web::Path<i32>,
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

    let network_id = network_id.into_inner();

    match sqlx::query_as::<_, Network>("SELECT * FROM networks WHERE id = $1 AND owner_id = $2")
        .bind(network_id)
        .bind(claims.sub)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(network)) => {
            let total_devices: (i64,) = sqlx::query_as(
                "SELECT COUNT(DISTINCT d.id) FROM devices d JOIN network_members nm ON d.id = nm.device_id WHERE nm.network_id = $1"
            )
            .bind(network_id)
            .fetch_one(pool.get_ref())
            .await
            .unwrap_or((0,));

            let online_devices: (i64,) = sqlx::query_as(
                "SELECT COUNT(DISTINCT d.id) FROM devices d JOIN network_members nm ON d.id = nm.device_id WHERE nm.network_id = $1 AND d.is_online = true"
            )
            .bind(network_id)
            .fetch_one(pool.get_ref())
            .await
            .unwrap_or((0,));

            let avg_signal: (Option<f64>,) = sqlx::query_as(
                "SELECT AVG(d.signal_strength) FROM devices d JOIN network_members nm ON d.id = nm.device_id WHERE nm.network_id = $1"
            )
            .bind(network_id)
            .fetch_one(pool.get_ref())
            .await
            .unwrap_or((None,));

            let topology_links: (i64,) = sqlx::query_as(
                "SELECT COUNT(*) FROM network_topology WHERE network_id = $1"
            )
            .bind(network_id)
            .fetch_one(pool.get_ref())
            .await
            .unwrap_or((0,));

            let response = NetworkStatsResponse {
                network_id: network.id,
                network_name: network.network_name,
                total_devices: total_devices.0 as i32,
                online_devices: online_devices.0 as i32,
                avg_signal_strength: avg_signal.0,
                topology_links: topology_links.0 as i32,
                created_at: network.created_at,
            };
            HttpResponse::Ok().json(response)
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Not found"})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Error"})),
    }
}
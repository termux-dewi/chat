use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Network {
    pub id: i32,
    pub network_name: String,
    pub owner_id: i32,
    pub network_key: String,
    pub description: Option<String>,
    pub is_public: bool,
    pub max_devices: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct NetworkTopology {
    pub id: i32,
    pub network_id: i32,
    pub source_device_id: i32,
    pub target_device_id: i32,
    pub signal_quality: Option<i32>,
    pub latency_ms: Option<i32>,
    pub bandwidth_kbps: Option<i32>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateNetworkRequest {
    pub network_name: String,
    pub description: Option<String>,
    pub is_public: Option<bool>,
    pub max_devices: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateNetworkRequest {
    pub network_name: Option<String>,
    pub description: Option<String>,
    pub is_public: Option<bool>,
    pub max_devices: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NetworkResponse {
    pub id: i32,
    pub network_name: String,
    pub description: Option<String>,
    pub is_public: bool,
    pub max_devices: Option<i32>,
    pub device_count: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NetworkStatsResponse {
    pub network_id: i32,
    pub network_name: String,
    pub total_devices: i32,
    pub online_devices: i32,
    pub avg_signal_strength: Option<f64>,
    pub topology_links: i32,
    pub created_at: DateTime<Utc>,
}
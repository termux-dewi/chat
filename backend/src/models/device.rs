use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Device {
    pub id: i32,
    pub user_id: i32,
    pub device_name: String,
    pub device_type: Option<String>,
    pub ip_address: Option<String>,
    pub mac_address: Option<String>,
    pub signal_strength: Option<i32>,
    pub battery_level: Option<i32>,
    pub is_online: bool,
    pub location_lat: Option<f64>,
    pub location_lng: Option<f64>,
    pub last_seen: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateDeviceRequest {
    pub device_name: String,
    pub device_type: String,
    pub mac_address: Option<String>,
    pub location_lat: Option<f64>,
    pub location_lng: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateDeviceRequest {
    pub device_name: Option<String>,
    pub device_type: Option<String>,
    pub signal_strength: Option<i32>,
    pub battery_level: Option<i32>,
    pub is_online: Option<bool>,
    pub location_lat: Option<f64>,
    pub location_lng: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceResponse {
    pub id: i32,
    pub device_name: String,
    pub device_type: Option<String>,
    pub ip_address: Option<String>,
    pub mac_address: Option<String>,
    pub signal_strength: Option<i32>,
    pub battery_level: Option<i32>,
    pub is_online: bool,
    pub location_lat: Option<f64>,
    pub location_lng: Option<f64>,
    pub last_seen: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceStatusResponse {
    pub id: i32,
    pub device_name: String,
    pub is_online: bool,
    pub signal_strength: Option<i32>,
    pub battery_level: Option<i32>,
    pub last_seen: Option<DateTime<Utc>>,
}
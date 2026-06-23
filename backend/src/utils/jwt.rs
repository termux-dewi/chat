use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use serde::{Deserialize, Serialize};
use chrono::Utc;
use std::env;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: i32,
    pub email: String,
    pub role: String,
    pub exp: i64,
}

pub fn generate_jwt(id: i32, email: &str, role: &str) -> String {
    let expiration = Utc::now().timestamp() + 86400;
    let claims = Claims {
        sub: id,
        email: email.to_string(),
        role: role.to_string(),
        exp: expiration,
    };

    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "your-secret-key-change-this".to_string());
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_ref()),
    )
    .unwrap_or_default()
}

pub fn verify_jwt(token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "your-secret-key-change-this".to_string());
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &Validation::default(),
    )
    .map(|data| data.claims)
}
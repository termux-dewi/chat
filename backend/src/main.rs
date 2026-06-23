use actix_web::{web, App, HttpServer, middleware::Logger};
use sqlx::postgres::PgPoolOptions;
use std::env;

mod models;
mod handlers;
mod middleware;
mod utils;
mod db;

use handlers::{auth, users, devices, networks};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    dotenv::dotenv().ok();

    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    log::info!("Starting Mesh Network Backend Server...");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .wrap(Logger::default())
            .wrap(actix_cors::Cors::permissive())
            .service(
                web::scope("/api/v1")
                    .service(
                        web::scope("/auth")
                            .route("/register", web::post().to(auth::register))
                            .route("/login", web::post().to(auth::login))
                            .route("/refresh", web::post().to(auth::refresh_token))
                    )
                    .service(
                        web::scope("/users")
                            .wrap(middleware::auth::JwtMiddleware)
                            .route("", web::get().to(users::list_users))
                            .route("/{id}", web::get().to(users::get_user))
                            .route("", web::post().to(users::create_user))
                            .route("/{id}", web::put().to(users::update_user))
                            .route("/{id}", web::delete().to(users::delete_user))
                    )
                    .service(
                        web::scope("/devices")
                            .wrap(middleware::auth::JwtMiddleware)
                            .route("", web::get().to(devices::list_devices))
                            .route("/{id}", web::get().to(devices::get_device))
                            .route("", web::post().to(devices::create_device))
                            .route("/{id}", web::put().to(devices::update_device))
                            .route("/{id}", web::delete().to(devices::delete_device))
                            .route("/{id}/status", web::get().to(devices::get_device_status))
                    )
                    .service(
                        web::scope("/networks")
                            .wrap(middleware::auth::JwtMiddleware)
                            .route("", web::get().to(networks::list_networks))
                            .route("/{id}", web::get().to(networks::get_network))
                            .route("", web::post().to(networks::create_network))
                            .route("/{id}", web::put().to(networks::update_network))
                            .route("/{id}", web::delete().to(networks::delete_network))
                            .route("/{id}/topology", web::get().to(networks::get_topology))
                            .route("/{id}/stats", web::get().to(networks::get_network_stats))
                    )
                    .service(
                        web::scope("/admin")
                            .wrap(middleware::auth::AdminMiddleware)
                            .route("/users", web::get().to(handlers::admin::get_all_users))
                            .route("/networks", web::get().to(handlers::admin::get_all_networks))
                            .route("/stats", web::get().to(handlers::admin::get_system_stats))
                            .route("/logs", web::get().to(handlers::admin::get_activity_logs))
                    )
            )
    })
    .bind("0.0.0.0:8000")?
    .run()
    .await
}
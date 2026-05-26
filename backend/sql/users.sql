CREATE TABLE IF NOT EXISTS "users" (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(20) UNIQUE NOT NULL,
    email           VARCHAR(120) UNIQUE NOT NULL,
    hashed_password TEXT,
    github_id       TEXT UNIQUE,
    apikey          TEXT UNIQUE,
    avatar_filename TEXT,
    vim_bindings    BOOLEAN NOT NULL DEFAULT false
);

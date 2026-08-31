import "reflect-metadata";

process.env.NODE_ENV = "test";
process.env.PORT = "3000";
process.env.DB_HOST = "127.0.0.1";
process.env.DB_PORT = "3306";
process.env.DB_USERNAME = "test_user";
process.env.DB_PASSWORD = "test_password";
process.env.DB_DATABASE = "query_back_test";
process.env.DB_LOGGING = "false";
process.env.ADMIN_USERNAME = "admin";
process.env.ADMIN_PASSWORD_HASH = "$2a$04$G.RKJIpOp5KAo.KpU/21I.wqodgsYSGDpRFYY7K5KqHNhl1VxoYeG";
process.env.ADMIN_JWT_SECRET = "test-secret-with-at-least-32-characters";
process.env.ADMIN_TOKEN_TTL_SECONDS = "28800";
process.env.ADMIN_ALLOWED_ORIGIN = "http://localhost:5173";

const defaultTestDatabaseUrl =
  "postgresql://postgres:postgres@localhost:5432/support_tickets_test?schema=public";

process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ?? defaultTestDatabaseUrl;
process.env.NODE_ENV = "test";

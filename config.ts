import dotenv from "dotenv";
dotenv.config();

export const PG_HOST = process.env.PG_HOST || "";
export const PG_PORT = +(process.env.PG_PORT || 5432);
export const PG_USER = process.env.PG_USER || "postgres";
export const PG_PASS = process.env.PG_PASS || "";
export const PG_DB = process.env.PG_DB || "postgres";

export const NODE_ENV = process.env.NODE_ENV || "development";
export const PORT = +(process.env.PORT || 3000);

export default {
  PG_HOST,
  PG_PORT,
  PG_USER,
  PG_PASS,
  PG_DB,
  NODE_ENV,
  PORT,
};

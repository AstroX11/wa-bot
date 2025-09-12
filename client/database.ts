import { Sequelize } from "sequelize";

let sequelize: Sequelize;

if (process.env.PG_HOST) {
  sequelize = new Sequelize(
    process.env.PG_DB || "postgres",
    process.env.PG_USER || "postgres",
    process.env.PG_PASS || "",
    {
      host: process.env.PG_HOST,
      port: +(process.env.PG_PORT || 5432),
      dialect: "postgres",
      dialectOptions: {
        ssl: {
          require: false,
          rejectUnauthorized: false,
        },
      },
      logging: false,
      pool: {
        max: 20,
        min: 5,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
} else {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "database.db",
    logging: false,
    dialectOptions: {
      foreignKeys: true,
      timeout: 30000,
    },
    pool: {
      max: 10,
      min: 1,
      acquire: 60000,
      idle: 30000,
    },
    define: {
      freezeTableName: true,
    },
    retry: {
      match: [
        /SQLITE_BUSY/,
        /database is locked/,
        /cannot start a transaction within a transaction/,
      ],
      max: 3,
      backoffBase: 100,
      backoffExponent: 1.5,
    },
  });

  await sequelize.query(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA cache_size = -64000;
  PRAGMA temp_store = MEMORY;
  PRAGMA mmap_size = 536870912;
  PRAGMA page_size = 4096;
  PRAGMA wal_autocheckpoint = 1000;
  PRAGMA busy_timeout = 30000;
  PRAGMA optimize;
`);
}

export default sequelize;

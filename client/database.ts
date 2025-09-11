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
       timeout: 30000 
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

  await sequelize.query("PRAGMA journal_mode = WAL;");
  await sequelize.query("PRAGMA synchronous = NORMAL;");
  await sequelize.query("PRAGMA cache_size = -64000;");
  await sequelize.query("PRAGMA temp_store = MEMORY;");
  await sequelize.query("PRAGMA mmap_size = 536870912;");
  await sequelize.query("PRAGMA page_size = 4096;");
  await sequelize.query("PRAGMA wal_autocheckpoint = 1000;");
  await sequelize.query("PRAGMA busy_timeout = 30000;");
  await sequelize.query("PRAGMA optimize;");
}

export default sequelize;

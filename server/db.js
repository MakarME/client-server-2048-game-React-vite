const sql = require('mssql')

const config = {
    server: "localhost",
    database: "2048",
    user: "sa",
    password: "pass",
    options: {
        encrypt: false
    },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("Connected to MSSQL!");
    return pool;
  })
  .catch((err) => {
    console.error("Error connecting to MSSQL:", err);
  });

module.exports = {
  sql,
  poolPromise,
};

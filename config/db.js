const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "emerald_trade"
});

db.connect((err) => {

  if (err) {
    console.log("Error conectando a MySQL");
  } else {
    console.log("MySQL conectado");
  }

});

module.exports = db;
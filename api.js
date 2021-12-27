var express = require('express');
const mysql = require('mysql');
var app = express();


app.use(express.json());
const port = process.env.port || 8080;
app.listen(port, () => {
    console.log(`Rest API listening on port ${port}`);
});

app.get("/", async (req, res) => {
    res.json({ status: "Ready to roll!" });
});


app.get("/:breed",async (req, res) => {
    const query = "select * from breeds WHERE name = ?";
    mysql.createPool.query(query, [req.params.breed], (err, results) =>{
        if(!results[0]){
            res.json({status : "Not found!"});
        } else{
            res.json(results[0]);
        }
    });
});

const pool = mysql.createPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database : process.env.DB_NAME,
    socketPath:
})
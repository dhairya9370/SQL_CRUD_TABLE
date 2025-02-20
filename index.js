const express = require("express");
const app = express();
let port = 3000;
app.use(express.urlencoded({ extended: true }));
const path = require("path");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

const { faker } = require('@faker-js/faker');
const mysql = require('mysql2');// Get the client
// Create the connection to database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'instausers',
  password: 'Dhairya9370'
});
let getRandomUser = () => {
  return [
    faker.string.uuid(),
    faker.internet.username(),
    faker.internet.email(),
    faker.internet.password()
  ];
}
let pushusers = (count) => {
  let q2 = "INSERT INTO users (id,username,email,password) VALUES ?";
  let bigdata = [];
  for (let i = 0; i < count; i++) { bigdata.push(getRandomUser()); }
  try {
    // A simple SELECT query
    connection.query(q2, [bigdata], (err, result) => {
      console.log(result, bigdata);

    });
  }
  catch (err) { console.log("ERROR: ", err); }
}
// pushusers(10);
let data = [];
connection.query("SELECT*FROM users ORDER BY id ASC;", (err, result) => {
  data = result;
  //console.log(data);
});


let check = (entered, id) => {
  return new Promise((resolve, reject) => {
    connection.query("SELECT password FROM users WHERE id=?", id, (err, result) => {
      //console.log(entered,result[0]["password"]);
      if (result[0]["password"] == entered) {
        console.log("Verified User!"); return resolve(1);
      }
      else {
        console.log("correct Password : ", result[0]["password"]);
        return reject(0);
      }
    });
  })
}
//verify password
let verify = {};
let verifyid;
app.post("/insta/verify/:id", (req, res) => {
  let verifyid = req.params;
  //console.log(req.body["opt"]);
  connection.query("SELECT *FROM users WHERE id=?", verifyid["id"], function (err, result) {
    verify = result;
    res.render("verify.ejs", { id: verifyid["id"], status: 1, opt: req.body["opt"] });
  });
});


//home page
app.get("/insta", (req, res) => {
  try {
    let count = 0;
    new Promise((resolve, reject) => {
      connection.query("select count(id) from users ;", (err, result) => {
        count = result[0]["count(id)"];
        resolve(count);
      });
    })
      .then((rss) => { 
    connection.query("SELECT * FROM users ORDER BY id DESC;", (err, result) => {
      res.render("page.ejs", { result, count });
    });});
  }
  catch (err) { console.log("ERROR: ", err); }
})

//deleting
app.delete("/insta/DELETEuser/:id", (req, res) => {
  let { id } = req.params;
  let enteredpass = { password: req.body["password"] };
  check(enteredpass["password"], id)
    .then((rss) => {
      if (rss == 1) {
        connection.query("DELETE FROM users WHERE id=?", id, (err, result) => {
          res.redirect("/insta");
          console.log("User Deleted");
        });
      }
    })
    .catch((err) => {
      if (err == 0) {
        res.render("verify.ejs", { id: req.params["id"], status: 0 });
      }
    });
});

// creating new user profile
app.get("/insta/new", (req, res) => {
  res.render("newform.ejs");
});
app.post("/insta", (req, res) => {
  connection.query("INSERT INTO users (id,username,email,password) VALUES (?,?,?,?);", [faker.string.uuid(), req.body["username"], req.body["email"], req.body["pass"]],
    (err, result) => { res.redirect("/insta"); });
});

//editing
app.patch("/insta/PATCHuser/:id", (req, res) => {
  let { id } = req.params;
  let editeduser = {};
  let enteredpass = { password: req.body["password"] };
  check(enteredpass["password"], id)
    .then((rss) => {
      if (rss == 1) {
        connection.query("SELECT *FROM users WHERE id=?", id, (err, result) => {
          editeduser = result;
          res.render("editform.ejs", { id, editeduser });
        });
      }
    })
    .catch((err) => { console.log("Incorrect Password!"); res.render("verify.ejs",{status:0}); })
})
app.patch("/insta/update/:id", (req, res) => {
  let { id } = req.params;
  connection.query("UPDATE users SET username=?,password=? WHERE id=?", [req.body["newusername"], req.body["newpass"], id], (err, result) => {
    res.redirect("/insta");
  })
})

//listening
app.listen(port, () => { console.log("listening on Port ", port); });

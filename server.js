const express = require("express");
const bcrypt = require("bcryptjs"); // hashing credentials
const cors = require("cors"); // enable CORS to allow calls between FE and BE of app
const knex = require('knex'); // connect db using knex

// controllers
const register = require("./controllers/register");
const signin = require("./controllers/signin");
const profile = require("./controllers/profile");

const db = knex({ // config for database
  client: "pg",
  connection: {
    host : "127.0.0.1", // localhost
    user : "postgres",
    password : "nahmed",
    database : "facial-recog"
  }
});

const app = express();
app.use(express.json()); // parse JSON so that server can read as obj
app.use(cors());

app.get("/", (req, res) => {
	res.send(db.users);
})

///////////////// - ROUTES
//	1. SIGNIN
app.post("/signin", (req, res)=> {
	signin.handleSignIn(req,res,db,bcrypt);
});

////////////////
// 2. REGISTER
app.post("/register", (req,res) => {
	// dependeny injection, pass our db and hash dependency to register
	// another way compared to using "require" in register.js
	register.handleRegister(req,res,db,bcrypt);
});

////////////////
// 3. PROFILE
app.get("/profile/:id", (req, res) => { // can grab this id and use it
	profile.handleProfile(req.params,res, db, "GET");
}) 

////////////////
// 4. IMAGE
app.put("/image", (req, res) => {
	profile.handleProfile(req.body,res, db, "PUT");
})

app.listen(3001, ()=> {
	console.log("app is running on 3001 ..");
});




/* Routes, our server API. TEST /W POSTMAN

1. / --> response = "working"
2. /signin --> POST = success/fail
(use POST, not GET since password involved)
3. /register --> POST = send to DB new user
4. /profile/:userId --> GET, display user name
5. /image --> PUT --> update user score to rankings

*/

// NOTE express comes with .json() method
// similar to .send()
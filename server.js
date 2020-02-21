const express = require("express");
const bcrypt = require("bcryptjs"); // hashing credentials
const cors = require("cors"); // disable CORS for dev purposes
const knex = require('knex'); // connect db using knex

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

////////////////
// functions
 function hashPassword(plaintext_password) { // async hashing password
 	const salt = bcrypt.genSaltSync(10);
 	const hashed = bcrypt.hashSync(plaintext_password, salt);
	return hashed;
}

function getData(db_name, express_req, express_resp, http_method) { // used by IMAGE + PROFILE
	const { id } = express_req;
	if(http_method === "GET") {
		// grab users where id matches express param /profile/:id
		db.select("*").from("users").where({id})
		  .then(user => {
			if(user.length) {
				express_resp.status(200).json(user[0]);
			} else {
				throw new Error("Could not find user");
			}
		 })
		  .catch(error => {
			express_resp.status(400).json(error.message);
		 });
	} else {
		// increment entries by 1 on corresponding id then return the column
		db.select("*").from("users").where("id", "=", id)
		  .increment("entries", 1)
		  .returning("entries")
		  .then(entries => {
		  	if(entries.length) {
		  		express_resp.json(entries[0]);
		  	} else {
		  		throw new Error("Entries not found"); // error message we throw from catch
		  	}
		  }).catch(error => express_resp.status(400).json(error.message));
	}
}

app.get("/", (req, res) => {
	res.send(db.users);
})

///////////////// - ROUTES
//	1. SIGNIN
app.post("/signin", (req, res)=> {
	const {email, password} = req.body;

	// get email from login (signin page) then compare against users table and check hash with bcrypt
	db.select("email", "hash").from("login")
	  .where("email", "=", email)
	  .then(data => {
  		const isValid = bcrypt.compareSync(password, data[0].hash);
  		if(isValid) {
			return db.select("*").from("users") // check signin email against the registered email (users table)
  			  .where("email", "=", email)
  			  .then(user => {
  			  		console.log(user);
					res.json(user[0]); // we don't want to respond the hash!
  			  })
			  .catch(err => res.status(400).json("unable to get user"));
  		} else {
  			throw new Error("error logging in");
  		}
	  })
	  .catch(err => res.status(400).json(err.message));

});

////////////////
// 2. REGISTER
app.post("/register", (req, res) => {
	const {name, email, password} = req.body;
	const hash = hashPassword(password);

	// Add to users table if details aren't EMPTY
	if(name !== "" && email !== "" && password !== "") {
		/*
			transaction - if user or login fail -> rollback, keep consistent data
			insert hash, email to
		*/
		db.transaction((trx) => {
			 trx.insert({
			 	hash,
			 	email // ES6 email: email, ...
			 	
			 })
			 .into('login')
			 .returning("email")
			 .then(loginEmail => {
				return trx.select("*").from('users') // email from table login, then loginEmail to users table and return all columns
					.returning('*')
					.insert({
				 		email:loginEmail[0],
						name: name,
						joined: new Date()
					})
					.then(user => {
						if(user.length) {
							res.json(user[0]); // only provide the returned user, not an array
						} else {
							throw new Error("Unable to register");
						}
					})
					.then(trx.commit) // insert data else rollback
					.catch(trx.rollback)
			 	})
			 .catch(error => res.status(400).json(error.message));
		});
	} else {
		// for Front-end 
		res.status(400).json("Error, registration failed");	
	}
	
})

////////////////
// 3. PROFILE
app.get("/profile/:id", (req, res) => { // can grab this id and use it
	getData(db, req.params, res, "GET");
}) 

////////////////
// 4. IMAGE
app.put("/image", (req, res) => {
	getData(db, req.body, res, "PUT");
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
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

// db.select("*").from("users")
// .then(data => console.log(data)); // query

const app = express();
app.use(express.json()); // parse JSON so that server can read as obj
app.use(cors());
/////////////////
//	BcryptJS


// bcrypt.compare("apples", "$2a$10$FF5CxvnYmeM84IhDmh14QeZTSHjR9XsTpxHZo7dEmBVlUi8HjhqDW", function(err, res) {
//     // res === false
// });

// bcrypt.compare("apples", "$2a$10$FF5CxvnYmeM84IhDmh14QeZTSHjR9XsTpxHZo7dEmBVlUi8HjhqDW", 
	// 	function(err, res) {
 //    	// res === false
 //    	console.log("first guess", res);
	// });
	// bcrypt.compare("veggies", "$2a$10$FF5CxvnYmeM84IhDmh14QeZTSHjR9XsTpxHZo7dEmBVlUi8HjhqDW", 
	// 	function(err, res) {
 //    	// res === false
 //    	console.log("second guess", res);
	// });
// bcrypt.genSalt(10, (err, salt) => { // hash password
	// 	bcrypt.hash(password, salt, (err, hash) => {
	// 		console.log(hash);
	// 	})
	// });

const db2 = { // database/variable for users, temp database
	users: [
		{ 
			id:"123",
			name:"John",
			email:"john@gmail.com",
			password:"pass123",
			entries: 0, // image submissions
			joined: new Date()
		},
		{
			id:"124",
			name:"Holly",
			email:"holly@hotmail.com",
			password:"holly124",
			entries:0,
			joined: new Date()
		}
	],
	login: [
		{
			id:"987",
			hash:"",
			"email":"john@gmail.com"
		}
	]
}

app.get("/", (req, res) => {
	res.send(db.users);
})

/////////////////
//	1. SIGNIN
app.post("/signin", (req, res)=> {
	
	// request we make from the signin form and compare against our database
	if(req.body.email === db.users[0].email && 
		req.body.password === db.users[0].password) {
		// res.json("Success");
		res.json(db.users[0]);
	} else {
		res.status(400).json("error logging in");
	}
});
////////////////
// 2. REGISTER
app.post("/register", (req, res) => {
	const {name, email, password} = req.body;
	// Add to users table if details aren't EMPTY
	if(name !== "" && email !== "" && password !== "") {
		db('users') // insert user to table and return all columns
			.returning('*')
			.insert({
		 		email:email,
				name: name,
				joined: new Date()
			})
			.then(user => {
				// res.json(db2.users[database.users.length -1]);
				if(user.length) {
					res.json(user[0]); // only provide the returned user, not an array
				} else {
					throw new Error("Unable to register");
				}
			})
			.catch(error => res.status(400).json(error.message));
	} else {
		// for Front-end 
		res.status(400).json("Error, registration failed");	
	}
	
})

////////////////
// 3. PROFILE
function getData(db_name, express_req, express_resp, http_method) {
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
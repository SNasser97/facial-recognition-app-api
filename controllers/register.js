const handleHash = (plaintext_password, bcrypt) => { // async hashing password
 	const salt = bcrypt.genSaltSync(10);
 	const hashed = bcrypt.hashSync(plaintext_password, salt);
	return hashed;
}

const handleRegister = (req,res, db, bcrypt) => {
	const {name, email, password} = req.body;
	const hash = handleHash(password, bcrypt);
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
	
}

module.exports = {
	handleRegister,
	handleHash
};
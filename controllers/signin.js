const handleSignIn = (req,res,db,bcrypt) => {
	const {email, password} = req.body;

	// get email from login (signin page) then compare against users table and check hash with bcrypt
	db.select("email", "hash").from("login")
	  .where("email", "=", email)
	  .then(data => {
  		const isValid = bcrypt.compareSync(password, data[0].hash);
  		if(data[0].email === email && isValid) {
			return db.select("*").from("users") // check signin email against the registered email (users table)
  			  .where("email", "=", email)
  			  .then(user => {
					res.json(user[0]); // we don't want to respond the hash!
  			  })
			  .catch(err => res.status(400).json("unable to get user"));
  		} else {
  			throw new Error("error logging in");
  		}
	  })
	  .catch(err => res.status(400).json(err.message));

};

module.exports = {
	handleSignIn
}
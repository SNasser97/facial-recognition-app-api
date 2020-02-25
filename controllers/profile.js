
const handleProfile = (req, res, db, http_method) => { // used by IMAGE + PROFILE
	const { id } = req;
	if(http_method === "GET") {
		// grab users where id matches express param /profile/:id
		db.select("*").from("users").where({id})
		  .then(user => {
			if(user.length) {
				res.status(200).json(user[0]);
			} else {
				throw new Error("Could not find user");
			}
		 })
		  .catch(error => {
			res.status(400).json(error.message);
		 });
	} else {
		// increment entries by 1 on corresponding id then return the column
		db.select("*").from("users").where("id", "=", id)
		  .increment("entries", 1)
		  .returning("entries")
		  .then(entries => {
		  	if(entries.length) {
		  		res.json(entries[0]);
		  	} else {
		  		throw new Error("Entries not found"); // error message we throw from catch
		  	}
		  }).catch(error => res.status(400).json(error.message));
	}
}

module.exports = {
	handleProfile // ES6 handleProfile: handleProfile
}
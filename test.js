const expect  = require('chai').expect,
	  database = require("./database");

it('Create user', async function(done) {
    var result = await database.createUser({"_id":"5dcce9618a5d632450dea80a","firstname":"rylee","lastname":"hancock","email":"ryleehancock@gmail.com","datejoined":"October 11, 2019","password":"pw1","friends":[]})
    console.log(result);
    done()
});
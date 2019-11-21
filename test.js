
const expect  = require('chai').expect;

describe("generic database access functions", () => {
	before(async () => {
	    database = await require("./database")(false);
	    await database.removeAll("test");
	})
	it("should create an object", async() => {
	    var result = (await database.createEntity("test")({"a": "a"})).result;
	    console.log(result)
	    expect(result.n).to.equal(result.ok)
	});
	it("should find our created object", async() => {
		var result = await database.getEntity("test")({"a":"a"});
		expect(result.a).to.equal("a")
	});
	it("should find all our objects", async() => {
		var result = await database.getEntities("test")();
		expect(result.length).to.equal(1);
	})
	it("should delete our object", async() => {
		await database.deleteEntity("test")({"a": "a"}).result;
		var result = await database.getEntities("test")();
		expect(result.length).to.equal(0);
	})
})

describe("get events by user and get users by event", () => {
	before(async() => {
		await database.removeAll("userEvents");
		await database.removeAll("users");
		await database.removeAll("events");
	})
	it("should get users with a given status going to an event", async() => {
		var userId = (await database.createUser({"username":"am0002","firstname":"alexa",
			"lastname":"mendez","email":"alexamendez@gmail.com","datejoined":"October 12, 2019",
			"password":"pw2","friends":"[]"})).insertedId.toString();
		var eventId = (await database.createEvent({"refs":{},"updater":{},"name":"HotChoc",
			"desc":"Jasper", "start_date":"2019-11-16T05:20:15.000Z","end_date":"2019-11-17T05:20:29.000Z",
			"addr":"Crerar Library","loc":{"lat":41.790524,"lng":-87.602854},"isBoosted":false,
			"tags":["study","chocolate"],"admins":["user1"]})).insertedId.toString();
		console.log(userId)
		await database.createUserEvent(userId, eventId, "Going")
		var usersGoing = await database.getUsersByEventAndStatus(eventId, "Going");
		var eventsGoing = await database.getEventsByUserAndStatus(userId, "Going");
		console.log(usersGoing)
		expect(usersGoing.length).to.equal(1)
		expect(usersGoing[0]._id.toString()).to.equal(userId)
		expect(eventsGoing.length).to.equal(1)
		expect(eventsGoing[0]._id.toString()).to.equal(eventId)		
	})
	after(async() => {
		await database.removeAll("userEvents");
		await database.removeAll("users");
		await database.removeAll("events");
	})
})



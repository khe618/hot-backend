const
    MongoClient = require("mongodb").MongoClient,
    ObjectId = require('mongodb').ObjectId,
	TEST_DATABASE_URL = "mongodb://heroku_9h24ss95:uk5629915p1ji1c9nbr9idd8fp@ds123490.mlab.com:23490/heroku_9h24ss95",
	TEST_DATABASE = "heroku_9h24ss95",
	PRODUCTION_DATABASE_URL = "mongodb://heroku_4bgzbp8r:srsgfdtlepejihdfa2ruarggr5@ds053937.mlab.com:53937/heroku_4bgzbp8r",
	PRODUCTION_DATABASE = "heroku_4bgzbp8r";


module.exports = async function(production){
	if (production){
		var client = await MongoClient.connect(PRODUCTION_DATABASE_URL)
    	var db = client.db(PRODUCTION_DATABASE);
	}
	else{
		var client = await MongoClient.connect(TEST_DATABASE_URL);
		var db = client.db(TEST_DATABASE)
	}
	
	var exports = {};

	function getEntities(collection){
		return async function(){
			return await db.collection(collection).find({}).toArray();
		}
	}

	function getEntity(collection){
		return async function(query){
			return await db.collection(collection).findOne(query)
		}
	}

	function deleteEntity(collection){
		return async function (query){
			return await db.collection(collection).deleteOne(query)
		}
	}

	function createEntity(collection){
		return async function(data){
			return await db.collection(collection).insertOne(data)
		}
	}
	exports.getEvents = getEntities("events");
	exports.getEvent = getEntity("events");
	exports.createEvent = createEntity("events");
	exports.deleteEvent= deleteEntity("events");
	exports.getUsers = getEntities("users");
	exports.getUser = getEntity("users");
	exports.createUser = createEntity("users");
	exports.deleteUser = deleteEntity("users");
	exports.getUserEvents = getEntities("userEvents");
	exports.createTestEvent = createEntity("testEvents")
	exports.getTestEvents = getEntities("testEvents")

	exports.getEntities = getEntities;
	exports.getEntity = getEntity;
	exports.deleteEntity = deleteEntity;
	exports.createEntity = createEntity;


	exports.getEventsByUserAndStatus = async function(userId, status){
		var query = {userId: userId, status: status};
	    var userEvents = await db.collection("userEvents").find(query).toArray()
	    var eventIds = userEvents.map(e => ObjectId(e.eventId))
	    return await db.collection("events").find({_id: {$in: eventIds}}).toArray()
	}

	exports.getUsersByEventAndStatus = async function(eventId, status){
		var query = {eventId: eventId, status: status};
	    var userEvents = await db.collection("userEvents").find(query).toArray()
	    var userIds = userEvents.map(e => ObjectId(e.userId))
	    return await db.collection("users").find({_id: {$in: userIds}}).toArray()
	}

	exports.deleteUserEvent = async function(userId, eventId){
		var query = {userId: userId, eventId: eventId}
		return await db.collection("userEvents").deleteOne(query);
	}

	exports.getUserEvent = async function(userId, eventId){
		var query = {userId: userId, eventId: eventId};
		return await db.collection("userEvents").findOne(query);
	}

	exports.createUserEvent = async function(userId, eventId, status){
		var query = {userId: userId, eventId: eventId}
		var obj = {userId: userId, eventId: eventId, status: status}
		return await db.collection("userEvents").update(query, obj, {upsert:true})
	}

	exports.getFriendsEvents = async function(userId){
		var user = await exports.getUser(userId);
		var userEvents = await db.collection("userEvents").find({userId: {$in: user.friends}}).toArray()
		var eventIds = userEvents.map(x => ObjectId(x.eventId))
		return await db.collection("events").find({_id: {$in: eventIds}}).toArray()
	}

	exports.getEventsByTag = async function(tag){
		var query = {tags: tag}
		return await db.collection("events").find(query).toArray()
	}

	exports.getFriendsAttendingEvent = async function(userId, eventId, status){
		var user = await exports.getUser(userId)
		var friendsAttending = await db.collection("userEvents").find({userId: {$in: user.friends}, eventId: eventId, status: status}).toArray();
		console.log(friendsAttending)
		var friendsIds = friendsAttending.map(x => ObjectId(x.userId));
		return await db.collection("users").find({_id: {$in: friendsIds}}).toArray()
	}

	exports.searchEvents = async function(query){
		return await db.collection("events").find({$or: [{"name" : {$regex : query, $options:'i'}}, {"desc" : {$regex : query, $options:'i'}}, {"tags": {$regex : query, $options:'i'}}]}).toArray()
	}

	exports.searchUsers = async function(query){
		return await db.collection("users").find({$or: [{"username" : {$regex : query, $options:'i'}}, {"firstname" : {$regex : query, $options:'i'}}, {"lastname": {$regex : query, $options:'i'}}]}).toArray()
	}

	exports.getUserByUsername = async function(username){
		return await db.collection("users").findOne({username: username})
	}

	exports.getUserByEmail = async function(email){
		return await db.collection("users").findOne({email: email})
	}

	exports.removeAll = async function(collection){
		return await db.collection(collection).remove({})
	}

	return exports
}





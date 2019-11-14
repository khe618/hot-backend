const
    MongoClient = require("mongodb").MongoClient,
    ObjectId = require('mongodb').ObjectId;

MongoClient.connect("mongodb://heroku_4bgzbp8r:srsgfdtlepejihdfa2ruarggr5@ds053937.mlab.com:53937/heroku_4bgzbp8r", function (err, client){
    db = client.db("heroku_4bgzbp8r");
})

var exports = module.exports = {};

function getEntities(collection){
	return async function(){
		return await db.collection(collection).find({}).toArray();
	}
}

function getEntity(collection){
	return async function(entityId){
		var query = {_id: ObjectId(entityId)}
		return await db.collection(collection).findOne(query)
	}
}

function deleteEntity(collection){
	return async function (entityId){
		var query = {_id: ObjectId(entityId)}
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
exports.getUserEvent = getEntity("userEvents");
exports.createUserEvent = createEntity("userEvents");
//exports.deleteUserEvent = deleteEntity("userEvents");



exports.getEventsByUserAndStatus = async function(userId, status){
	var query = {userId: userId, status: status};
    var userEvents = await exports.getUserEvents()
    var eventIds = userEvents.map(e => ObjectId(e.eventId))
    return await db.collection("events").find({_id: {$in: eventIds}}).toArray()
}

exports.getUsersByEventAndStatus = async function(eventId, status){
	var query = {eventId: eventId, status: status};
    var userEvents = await exports.getUserEvents()
    var userIds = userEvents.map(e => ObjectId(e.userId))
    return await db.collection("users").find({_id: {$in: userIds}}).toArray()
}

exports.deleteUserEvent = async function(userId, eventId){
	var query = {userId: userId, eventId: eventId}
	return await db.collection("userEvents").deleteOne(query);
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


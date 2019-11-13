const
	https = require("https"),
	bodyParser = require("body-parser"),
	express = require("express"),
	path = require("path"),
	request = require("request"),
	MongoClient = require("mongodb").MongoClient,
	ObjectId = require('mongodb').ObjectId,
	admin = require('firebase-admin');

var app = express();
var db;

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

const asyncMiddleware = fn =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(next);
  };

app.get("/events/:eventId([0-9a-f]{24})", asyncMiddleware(async (req, res, next) => {
	var eventId = req.params.eventId;
	var query = {_id: ObjectId(eventId)}
	var result = await db.collection("events").findOne(query)
	res.json(result);
}))

app.delete("/events/:eventId([0-9a-f]{24})", asyncMiddleware(async (req, res, next) => {
	var eventId = req.params.eventId;
	var query = {_id: ObjectId(eventId)}
	var result = await db.collection("events").deleteOne(query)
	res.json(result);
}))

app.post("/events", asyncMiddleware(async (req, res, next) => {
	var data = req.body;
	var result = await db.collection("events").insertOne(data)
	res.send(result.insertedId)
}))

app.get("/events", asyncMiddleware(async (req, res, next) => {
	result = await db.collection("events").find({}).toArray()
	res.json(result)
}))


app.get("/users/:userId([0-9a-f]{24})", asyncMiddleware(async (req, res, next) => {
	var userId = req.params.userId;
	var query = {_id: ObjectId(userId)}
	result = await db.collection("users").findOne(query)
	res.json(result)
}))

app.delete("/users/:userId([0-9a-f]{24})", asyncMiddleware(async (req, res, next) => {
	var userId = req.params.userId;
	var query = {_id: ObjectId(userId)}
	var result = await db.collection("users").deleteOne(query)
	res.json(result)
}))

app.post("/users", asyncMiddleware(async (req, res, next) => {
	var data = req.body
	var result = await db.collection("users").insertOne(data)
	res.send(result.insertedId)
}))

app.get("/users", asyncMiddleware(async (req, res, next) => {
	var result = await db.collection("users").find({}).toArray()
	res.json(result)
}))

app.get("/usersEvents/:userEventId([0-9a-f]{24})", asyncMiddleware(async (req, res, next) => {
	var userEventId = req.params.userEventId;
	var query = {_id:ObjectId(userEventId)}
	var result = await db.collection("usersEvents").findOne(query)
	res.json(result)
}))

app.get("/userEvents", asyncMiddleware(async (req, res, next) => {
	var result = await db.collection("usersEvents").find({}).toArray()
	res.json(result)
}))

app.post("/userEvents", asyncMiddleware(async (req, res, next) => {
	var data = req.body
	result = await db.collection("usersEvents").insertOne(data)
	res.send(result.insertedId)
}))

app.delete("/usersEvents/:userEventId([0-9a-f]{24})", asyncMiddleware(async (req, res, next) => {
	var userEventId = req.params.userEventId;
	var query = {_id:ObjectId(userEventId)}
	await db.collection("usersEvents").deleteOne(query)
	res.sendStatus(200)
}))

app.get("/usersEvents/users/:userId([0-9a-f]{24})/:status", asyncMiddleware(async (req, res, next) => {
	var userId = req.params.userId;
	var status = req.params.status;
	var query = {userId: userId, status: status};
	var events = await db.collection("userEvents").find(query).toArray()
	var eventIds = events.map(e => ObjectId(e.eventId))
	var eventObjects = await db.collection("events").find({_id: {$in: eventIds}}).toArray()
	res.json(eventObjects)
}))


MongoClient.connect("mongodb://heroku_4bgzbp8r:srsgfdtlepejihdfa2ruarggr5@ds053937.mlab.com:53937/heroku_4bgzbp8r", function (err, client){
	db = client.db("heroku_4bgzbp8r")
	app.listen(process.env.PORT || 5000);	
})

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

app.get("/events/:eventId([0-9A-Za-z]*)", async function (req, res){
	var eventId = req.params.eventId;
	var query = {_id: ObjectId(eventId)}
	var result = await db.collection("events").findOne(query)
	return result;
})

app.delete("/events/:eventId([0-9A-Za-z]*)", async function (req, res){
	var eventId = req.params.eventId;
	var query = {_id: ObjectId(eventId)}
	var result = await db.collection("events").deleteOne(query)
	res.json(result);
})

app.post("/events", async function(req, res){
	var data = req.body;
	var result = await db.collection("events").insertOne(data)
	res.send(result.insertedId)
})

app.get("/events", async function(req, res){
	result = await db.collection("events").find({}).toArray()
	res.json(result)
})


app.get("/users/:userId([0-9A-Za-z]*)", async function (req, res){
	var userId = req.params.userId;
	var query = {_id: ObjectId(userId)}
	result = await db.collection("users").findOne(query)
	res.json(result)
})

app.delete("/users/:userId([0-9A-Za-z]*)", async function (req, res){
	var userId = req.params.userId;
	var query = {_id: ObjectId(userId)}
	var result = await db.collection("users").deleteOne(query)
	res.json(result)
})

app.post("/users", async function(req, res){
	var data = req.body
	var result = await db.collection("users").insertOne(data)
	res.send(result.insertedId)
})

app.get("/users", async function(req, res){
	var result = await db.collection("users").find({}).toArray()
	res.json(result)
})

app.get("/users-events/:userId([0-9A-Za-z]*)", async function(req, res){
	var userId = req.params.userId;
	var query = {_id:ObjectId(userId)}
	var result = await db.collection("users-events").findOne(query)
	res.json(result)
})

app.get("/user-events", async function(req, res){
	var result = await db.collection("users-events").find({}).toArray()
	res.json(result)
})

app.post("/user-events", async function(req, res){
	var data = req.body
	result = await db.collection("users-events").insertOne(data)
	res.send(result.insertedId)
})

app.delete("/users-events/:userEventId([0-9A-Za-z]*)", async function(req, res){
	var userEventId = req.params.userEventId;
	var query = {_id:ObjectId(userEventId)}
	await db.collection("users-events").deleteOne(query)
	res.sendStatus(200)
})


MongoClient.connect("mongodb://heroku_4bgzbp8r:srsgfdtlepejihdfa2ruarggr5@ds053937.mlab.com:53937/heroku_4bgzbp8r", function (err, client){
	db = client.db("heroku_4bgzbp8r")
	app.listen(process.env.PORT || 5000);	
})

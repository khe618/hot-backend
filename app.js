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

app.get("/events/:eventId([0-9A-Za-z]*)", function (req, res){
	var eventId = req.params.eventId;
	var query = {_id: ObjectId(eventId)}
	db.collection("events").findOne(query, function(err, result){
		if (err) throw err;
		res.json(result)
	})
})

app.delete("/events/:eventId([0-9A-Za-z]*)", function (req, res){
	var eventId = req.params.eventId;
	var query = {_id: ObjectId(eventId)}
	db.collection("events").deleteOne(query, function(err, result){
		if (err) throw err;
		res.json(result)
	})
})

app.post("/events", function(req, res){
	var data = req.body
	db.collection("events").insertOne(data, function(err, result){
		if(err) throw err;
		else{
			res.sendStatus(200)
		}
	})
})

MongoClient.connect("mongodb://heroku_4bgzbp8r:srsgfdtlepejihdfa2ruarggr5@ds053937.mlab.com:53937/heroku_4bgzbp8r", function (err, client){
	db = client.db("heroku_4bgzbp8r")
	app.listen(process.env.PORT || 5000);	
})

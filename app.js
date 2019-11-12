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


MongoClient.connect("mongodb://heroku_27t6lj7p:o0sscid6eke2jcn6009s68o30u@ds115762.mlab.com:15762/heroku_27t6lj7p", function (err, client){
	db = client.db("heroku_27t6lj7p")
	app.listen(process.env.PORT || 5000);
	
})

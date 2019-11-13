const
    https = require("https"),
    bodyParser = require("body-parser"),
    express = require("express"),
    path = require("path"),
    MongoClient = require("mongodb").MongoClient,
    ObjectId = require('mongodb').ObjectId;
    request = require("request"),
    swaggerJSDoc = require('swagger-jsdoc'),
    database = require("./database"),
    admin = require('firebase-admin');

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

const asyncMiddleware = fn =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(next);
  };

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}




// -- setup up swagger-jsdoc --
const swaggerDefinition = {
  info: {
    title: 'Hot Backend',
    version: '1.0.0',
    description: 'Hot Backend',
  },
  host: 'hot-backend.herokuapp.com',
  basePath: '/',
};
const options = {
  swaggerDefinition,
  apis: [path.resolve(__dirname, 'app.js')],
};
const swaggerSpec = swaggerJSDoc(options);

// -- routes for docs and generated swagger spec --

app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'redoc.html'));
});

/**
 * @swagger
 * /events/{eventId}:
 *   get:
 *     summary: Gets an event
 *     description: Returns an event object with the specified id
 *     tags:
 *       - events
 *     parameters:
 *       - in: path
 *         name: eventId
 *         type: string
 *         required: true
 *         description: Must be a 24 digit hexadecimal number
 *     responses:
 *       200:
 *         description: Event object
 *         schema:
 *           type: object
 *           properties:
 *             _id: 
 *               type: ObjectId
 *               description: The MongoDb ObjectId. Should match the eventId parameter
 *             name:
 *               type: string
 *               description: Name of the event
 *             description:
 *               type: string
 *               description:
 *                 Description of the event
 *             date:
 *               type: Date
 *               description:
 *                 Date of the event. Includes time
 *             latitude:
 *               type: float
 *               description:
 *                 The latitude coordinates of the event location
 *             longitude:
 *               type: float
 *               description:
 *                 The longitude coordinates of the event location    
 *             tags:
 *               type: Array
 *               description:
 *                 List of tags associated with the event
 *             admin:
 *               type: string
 *               description:
 *                 The admin who created the event
 * 
 */
app.get("/events/:eventId([0-9a-f]{24})", asyncMiddleware(async (req, res, next) => {
    res.json(await database.getEvent(req.params.eventId));
}))

app.delete("/events/:eventId([0-9a-f]{24})", asyncMiddleware(async (req, res, next) => {
    res.json(await database.deleteEvent(req.params.eventId))
}))

app.post("/events", asyncMiddleware(async (req, res, next) => {
    var result = await database.createEvent(req.body)
    res.send(result.insertedId)
}))

app.get("/events", asyncMiddleware(async (req, res, next) => {
    res.json(await database.getEvents())
}))


app.get("/users/:userId([0-9a-f]{24})", asyncMiddleware(async (req, res, next) => {
    res.json(await database.getUser(req.params.userId))
}))

app.delete("/users/:userId([0-9a-f]{24})", asyncMiddleware(async (req, res, next) => {
    res.json(await database.deleteUser(req.params.userId))
}))

app.post("/users", asyncMiddleware(async (req, res, next) => {
    var result = await database.createUser(req.body);
    res.send(result.insertedId)
}))

app.get("/users", asyncMiddleware(async (req, res, next) => {
    res.json(await database.getUsers())
}))

app.get("/userEvents/:userEventId([0-9a-f]{24})", asyncMiddleware(async (req, res, next) => {
    res.json(await database.getUserEvent(req.params.userEventId))
}))

app.get("/userEvents", asyncMiddleware(async (req, res, next) => {
    res.json(await database.getUserEvents())
}))

app.post("/userEvents", asyncMiddleware(async (req, res, next) => {
    var result = await database.createUserEvent(req.body);
    res.send(result.insertedId)
}))

app.delete("/userEvents/:userEventId([0-9a-f]{24})", asyncMiddleware(async (req, res, next) => {
    res.json(await database.deleteUserEvent(req.params.userEventId));
}))

app.get("/userEvents/users/:userId([0-9a-f]{24})/:status", asyncMiddleware(async (req, res, next) => {
    res.json(await database.getEventsByUserAndStatus(req.params.userId, req.params.status))
}))

app.get("/userEvents/events/:eventId([0-9a-f]{24})/:status", asyncMiddleware(async (req, res, next) => {
    res.json(await database.getUsersByEventAndStatus(req.params.eventId, req.params.status))
}))

app.get("/nearestEvents", asyncMiddleware(async (req, res, next) => {
    var latitude = req.query.latitude;
    var longitude = req.query.longitude;
    var events = await database.getEvents();
    result.sort((a, b) => getDistanceFromLatLonInKm(latitude, longitude, a.latitude, a.longitude) - 
        getDistanceFromLatLonInKm(latitude, longitude, b.latitude, b.longitude))
    res.json(result)
}))

app.listen(process.env.PORT || 5000);


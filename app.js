(async function(){
    const https = require("https"),
          bodyParser = require("body-parser"),
          express = require("express"),
          path = require("path"),
          MongoClient = require("mongodb").MongoClient,
          ObjectId = require('mongodb').ObjectId;
          request = require("request"),
          swaggerJSDoc = require('swagger-jsdoc'),
          database = await require("./database")(true),
          admin = require('firebase-admin');
    var app = express();

    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());

    app.use(function(error, req, res, next) {
      res.status(500).json({error: error.message });
    });

    const asyncMiddleware = fn =>
      (req, res, next) => {
        Promise.resolve(fn(req, res, next))
          .catch(next);
      };

    function validateUserEvents(req, res, next){
        if (!("userId" in req.query && "eventId" in req.query)) {
            throw Error("Invalid parameters");
        }
        next()
    }

    function deg2rad(deg) {
      return deg * (Math.PI/180)
    }

    function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
      if (typeof lat1 === 'undefined' || typeof lon1 === 'undefined' ||
          typeof lat2 === 'undefined' || typeof lon2 === 'undefined') {
        return Infinity;
      }
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
      // host: 'localhost:5000',
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
     *     summary: Get an event
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
     *             desc:
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
        var query = {_id: ObjectId(req.params.eventId)}
        res.json(await database.getEvent(query));
    }))

    /**
     * @swagger
     * /events/{eventId}:
     *   delete:
     *     summary: Delete an event
     *     description: Delete event object with specified ID
     *     tags:
     *       - events
     *     parameters:
     *       - in: path
     *         name: eventId
     *         type: string
     *         required: true
     *         description: Must be a 24 digit hexadecimal number
     *     responses:
     *       204:
     *         description: Delete event object
     *
     */
    app.delete("/events/:eventId([0-9a-f]{24})", asyncMiddleware(async (req, res, next) => {
        var query = {_id: ObjectId(req.params.eventId)}
        res.json(await database.deleteEvent(query))
    }))

    /**
     * @swagger
     * /events:
     *   post:
     *     summary: Post an event
     *     description: Create a new event with specified body
     *     tags:
     *       - events
     *     parameters:
     *       - in: path
     *         name: name
     *         type: string
     *         required: true
     *         description: Name of event
     *       - in: path
     *         name: desc
     *         type: string
     *         required: true
     *         description: Description of event
     *       - in: path
     *         name: start_date
     *         type: Date
     *         required: true
     *         description: Start date of event
     *       - in: path
     *         name: end_date
     *         type: Date
     *         required: true
     *         description: End date of event
     *       - in: path
     *         name: addr
     *         type: string
     *         required: true
     *         description: Address of event
     *       - in: path
     *         name: loc
     *         type: json
     *         required: true
     *         description: Json object containing latitude and longitude
     *       - in: path
     *         name: isBoosted
     *         type: bool
     *         required: true
     *         description: Boolean for determining if admin boosted event
     *       - in: path
     *         name: tags
     *         type: array
     *         required: true
     *         description: Array containing associated tags
     *       - in: path
     *         name: admins
     *         type: array
     *         required: true
     *         description: Array containing the user ID's of the admins
     *     responses:
     *       200:
     *         description: Create and returns an event object
     *
     */
    app.post("/events", asyncMiddleware(async (req, res, next) =>{
        var result = await database.createEvent(req.body);
        res.send(result.insertedId);
    }))

    app.put("/events", asyncMiddleware(async (req, res, next) => {
        var result = await database.updateEvent(req.body)
        res.json(result)
    }))

    /**
     * @swagger
     * /events:
     *   get:
     *     summary: Get all events
     *     description: Returns list of all event objects in the database
     *     tags:
     *       - events
     *     responses:
     *       200:
     *         description: List of event objects
     *
     */
    app.get("/events", asyncMiddleware(async (req, res, next) => {
        var events = await database.getEvents()
        if ("latitude" in req.query && "longitude" in req.query && "limit" in req.query){
            var {latitude, longitude, limit} = req.query;
            events = events.filter(event => event.loc && getDistanceFromLatLonInKm(event.loc.lat, event.loc.lng, latitude, longitude) < limit)
        }
        res.json(events)
    }))

    app.get("/events/now", asyncMiddleware(async (req, res, next) => {
        res.json(await database.getCurrentEvents())
    }))

    app.get("/events/upcoming", asyncMiddleware(async (req, res, next) => {
        var hours = req.query.hours;
        res.json(await database.getUpcomingEvents(hours))
    }))

    app.post("/events/test", asyncMiddleware(async (req, res, next) => {
        var result = await database.createTestEvent(req.body);
        res.send(result.insertedId);
    }))

    app.get("/events/test", asyncMiddleware(async (req, res, next) => {
        res.json(await database.getTestEvents());
    }))


    /**
     * @swagger
     * /users/{userId}:
     *   get:
     *     summary: Get a user
     *     description: Returns a user object with the specified id
     *     tags:
     *       - users
     *     parameters:
     *       - in: path
     *         name: userId
     *         type: string
     *         required: true
     *         description: Must be a 24 digit hexadecimal number
     *     responses:
     *       200:
     *         description: User object
     *         schema:
     *           type: object
     *           properties:
     *             _id:
     *               type: ObjectId
     *               description: The MongoDb ObjectId. Should match the eventId parameter
     *             firstname:
     *               type: string
     *               description: First name of the user
     *             lastname:
     *               type: string
     *               description: Last name of the user
     *             email:
     *               type: string
     *               description: Email of the user
     *             datejoined:
     *               type: Date
     *               description: The date which the user joined the app
     *             password:
     *               type: string
     *               description: The password of the user
     *             friends:
     *               type: Array
     *               description: List of userIds that the user is friends with
     *
     */
    app.get("/users/:userId([0-9a-f]{24})", asyncMiddleware(async (req, res, next) => {
        var query = {_id: ObjectId(req.params.userId)};
        res.json(await database.getUser(query));
    }))

    /**
     * @swagger
     * /users/{userId}:
     *   delete:
     *     summary: Delete a user
     *     description: Delete user object with specified ID
     *     tags:
     *       - users
     *     parameters:
     *       - in: path
     *         name: eventId
     *         type: string
     *         required: true
     *         description: Must be a 24 digit hexadecimal number
     *     responses:
     *       204:
     *         description: Delete user object
     *
     */
    app.delete("/users/:userId([0-9a-f]{24})", asyncMiddleware(async (req, res, next) => {
        var query = {_id: ObjectId(req.params.userId)};
        res.json(await database.deleteUser(query))
    }))

    /**
     * @swagger
     * /users:
     *   post:
     *     summary: Post a user
     *     description: Create a new user with specified body
     *     tags:
     *       - users
     *     parameters:
     *       - in: path
     *         name: firstname
     *         type: string
     *         required: true
     *         description: First name of the user
     *       - in: path
     *         name: lastname
     *         type: string
     *         required: true
     *         description: Last name of the user
     *       - in: path
     *         name: email
     *         type: string
     *         required: true
     *         description: Email of the user
     *       - in: path
     *         name: password
     *         type: string
     *         required: true
     *         description: Password of the user
     *       - in: path
     *         name: friends
     *         type: array
     *         required: true
     *         description: List of user ID's that the user is friends with
     *     responses:
     *       200:
     *         description: Create and returns a user object
     *
     */
    app.post("/users", asyncMiddleware(async (req, res, next) => {
        var admins = req.body.admins;
        for (var admin of admins){
            if (admin.length != 24 || !database.getUser(admin)){
                throw Error("Admin does not exist")
            }
        }
        var result = await database.createUser(req.body);
        res.send(result.insertedId);
    }))

    app.put("/users", asyncMiddleware(async(req, res, next) => {
        var admins = req.body.admins;
        for (var admin of admins){
            if (admin.length != 24 || !database.getUser(admin)){
                throw Error("Admin does not exist")
            }
        }
        res.json(await database.updateUser(req.body))
    }))

    /**
     * @swagger
     * /users:
     *   get:
     *     summary: Get all users
     *     description: Returns list of all user objects in the database
     *     tags:
     *       - users
     *     responses:
     *       200:
     *         description: List of user objects
     *
     */
    app.get("/users", asyncMiddleware(async (req, res, next) => {
        res.json(await database.getUsers());
    }))

    /**
     * @swagger
     * /userEvents/all:
     *   get:
     *     summary: Get all userEvents objects
     *     description: Returns list of all userEvent objects which contain status of a user for an event
     *     tags:
     *       - userEvents
     *     responses:
     *       200:
     *         description: List of userEvents objects
     *
     */
    app.get("/userEvents/all", asyncMiddleware(async (req, res, next) => {
        res.json(await database.getUserEvents());
    }))

    /**
     * @swagger
     * /userEvents:
     *   get:
     *     summary: Get a userEvents object
     *     description: Returns userEvents object with matching userId and eventId
     *     parameters:
     *       - in: path
     *         name: userId
     *         type: string
     *         required: true
     *         description: Must be a 24 digit hexadecimal number
     *       - in: path
     *         name: eventId
     *         type: string
     *         required: true
     *         description: Must be a 24 digit hexadecimal number
     *     tags:
     *       - userEvents
     *     responses:
     *       200:
     *         description: Returns a specific userEvents object
     *         schema:
     *           type: object
     *           properties:
     *             _id:
     *               type: ObjectId
     *               description: The MongoDb ObjectId. Should match the eventId parameter
     *             userId:
     *               type: ObjectId
     *               description: The MongoDb ObjectId. Should match the eventId parameter
     *             eventId:
     *               type: ObjectId
     *               description: The MongoDb ObjectId. Should match the eventId parameter
     *             status:
     *               type: string
     *               description: One of {going, interested, declined}
     *
     */
    app.get("/userEvents", validateUserEvents, asyncMiddleware(async (req, res, next) => {
        /*if (!("userId" in req.query && "eventId" in req.query)){
            throw Error("Invalid parameters")
        }*/
        var {userId, eventId} = req.query;
        var query = {userId: userId, eventId: eventId}
        res.json(await database.getUserEvent(query));
    }))

    /**
     * @swagger
     * /userEvents:
     *   post:
     *     summary: Post a userEvents object
     *     description: Create a new userEvents with specified body
     *     tags:
     *       - userEvents
     *     parameters:
     *       - in: path
     *         name: userId
     *         type: string
     *         required: true
     *         description: Must be a 24 digit hexadecimal number
     *       - in: path
     *         name: eventId
     *         type: string
     *         required: true
     *         description: Must be a 24 digit hexadecimal number
     *       - in: path
     *         name: status
     *         type: string
     *         required: true
     *         description: User's status regarding particular event
     *     responses:
     *       200:
     *         description: Create and returns a userEvents object
     *
     */
    app.post("/userEvents", asyncMiddleware(async (req, res, next) => {
        var {userId, eventId, status} = req.body;
        var result = await database.createUserEvent(userId, eventId, status);
        if (status === "checkedIn"){
            var hotLevel = await database.getHotLevel(eventId)
            var update = {_id: ObjectId(eventId), $set: {hot_level: hotLevel}}
            await database.updateEvent(update)
        }
        res.sendStatus(200);
    }))

    /**
     * @swagger
     * /userEvents:
     *   delete:
     *     summary: Delete a userEvents
     *     description: Delete userEvents object with specified userId and eventId
     *     tags:
     *       - userEvents
     *     parameters:
     *       - in: path
     *         name: userId
     *         type: string
     *         required: true
     *         description: Must be a 24 digit hexadecimal number
     *       - in: path
     *         name: eventId
     *         type: string
     *         required: true
     *         description: Must be a 24 digit hexadecimal number
     *     responses:
     *       204:
     *         description: Delete userEvents object
     *
     */
    app.delete("/userEvents", asyncMiddleware(async (req, res, next) => {
        var {userId, eventId} = req.query;
        var query = {userId: userId, eventId: eventId}
        res.json(await database.deleteUserEvent(query));
    }))

    /**
     * @swagger
     * /userEvents/users/{userId}/{status}:
     *   get:
     *     summary: Get events with same user and status
     *     description: Returns list of event objects which user submitted specific status to
     *     tags:
     *       - userEvents
     *     parameters:
     *       - in: path
     *         name: userId
     *         type: string
     *         required: true
     *         description: Must be a 24 digit hexadecimal number
     *       - in: path
     *         name: status
     *         type: string
     *         required: true
     *         description: One of {going, interested, declined}
     *     responses:
     *       200:
     *         description: Returns list of event objects
     *
     */
    app.get("/userEvents/users/:userId([0-9a-f]{24})/:status", asyncMiddleware(async (req, res, next) => {
        res.json(await database.getEventsByUserAndStatus(req.params.userId, req.params.status));
    }))

    /**
     * @swagger
     * /userEvents/events/{eventId}/{status}:
     *   get:
     *     summary: Get users with same event and status
     *     description: Returns list of users objects corresponding to users attending a specific event and having marked a specific status
     *     tags:
     *       - userEvents
     *     parameters:
     *       - in: path
     *         name: eventId
     *         type: string
     *         required: true
     *         description: Must be a 24 digit hexadecimal number
     *       - in: path
     *         name: status
     *         type: string
     *         required: true
     *         description: One of {going, interested, declined}
     *     responses:
     *       200:
     *         description: Returns list of user objects
     *
     */
    app.get("/userEvents/events/:eventId([0-9a-f]{24})/:status", asyncMiddleware(async (req, res, next) => {
        res.json(await database.getUsersByEventAndStatus(req.params.eventId, req.params.status));
    }))

    /**
     * @swagger
     * /exploreEvents:
     *   get:
     *     summary: Get events for a user
     *     description: Returns list of events ranked by interest for a specific user
     *     tags:
     *       - exploreEvents
     *     parameters:
     *       - in: path
     *         name: userId
     *         type: string
     *         required: true
     *         description: Must be a 24 digit hexadecimal number
     *       - in: path
     *         name: latitude
     *         type: float
     *         required: true
     *         description: Between 0 and 90
     *       - in: path
     *         name: longitude
     *         type: float
     *         required: true
     *         description: Between 0 and 180
     *     responses:
     *       200:
     *         description: Returns list of event objects
     *
     */
    app.get("/exploreEvents", asyncMiddleware(async (req, res, next) => {
        var {userId, latitude, longitude} = req.query;
        if (typeof userId === 'undefined' || typeof latitude === 'undefined' ||
        typeof longitude === 'undefined') {
            throw Error("Invalid parameters")
        }

        userId = ObjectId(userId);
        //var events = await database.getFriendsEvents(userId);
        var events = await database.getUpcomingEvents(24)
        var result = events.sort((a, b) => getDistanceFromLatLonInKm(latitude, longitude, a.loc.lat, a.loc.lng) -
            getDistanceFromLatLonInKm(latitude, longitude, b.loc.lat, b.loc.lng));
        res.json(result)

    }))

    /**
     * @swagger
     * /adminEvents:
     *   get:
     *     summary: Get events with same admin
     *     description: Returns list of all events with a specific admin
     *     tags:
     *       - adminEvents
     *     parameters:
     *       - in: path
     *         name: admin
     *         type: string
     *         required: true
     *         description: Must be a 24 digit hexadecimal number
     *     responses:
     *       200:
     *         description: Returns list of event objects
     *
     */
    app.get("/adminEvents", asyncMiddleware(async(req, res, next) => {
        var admin = req.query.admin;
        if (typeof admin === 'undefined') {
            res.send({error: 'Invalid parameter'});
        } else {
            var adminEvents = [];
            var events = await database.getEvents();
            var numEvents = events.length;
            for (var i = 0; i < numEvents; i++) {
                if (Array.isArray(events[i].admins) &&
                    events[i].admins.includes(admin)) {
                    adminEvents.push(events[i]);
                }
            }
            res.json(adminEvents);
        }
    }))

    /**
     * @swagger
     * /queryUserByUsername:
     *   get:
     *     summary: Get a user
     *     description: Returns user with matching username
     *     tags:
     *       - queryUserByUsername
     *     parameters:
     *       - in: path
     *         name: username
     *         type: string
     *         required: true
     *         description: Username of a user
     *     responses:
     *       '200':
     *         description: Returns a user with matching username
     *       '500':
     *         description: Error if no user with matching username found
     *
     */
    app.get("/queryUserByUsername", asyncMiddleware(async(req, res, next) => {
        var username = req.query.username;
        if (typeof username === 'undefined') {
            res.send({error: 'Invalid parameter'});
        } else {
            var query = {username: username}
            var user = await database.getUser(query)
            if (!!user) {
                res.send(user);
            } else {
                res.send({error: 'No user with this username'});
            }
        }
    }))

    /**
     * @swagger
     * /queryUserByEmail:
     *   get:
     *     summary: Get a user
     *     description: Returns user with matching email
     *     tags:
     *       - queryUserByEmail
     *     parameters:
     *       - in: path
     *         name: email
     *         type: string
     *         required: true
     *         description: Email of a user
     *     responses:
     *       '200':
     *         description: Returns a user with matching email
     *       '500':
     *         description: Error if no user with matching email found
     *
     */
    app.get("/queryUserByEmail", asyncMiddleware(async(req, res, next) => {
        var email = req.query.email;
        if (typeof email === 'undefined') {
            res.send({error: 'Invalid parameter'});
        } else {
            var query = {email: email}
            var user = await database.getUser(query)
            if (!!user) {
                res.send(user);
            } else {
                res.send({error: 'No user with this email'});
            }
        }
    }))

    /**
     * @swagger
     * /events/tags/{tag}:
     *   get:
     *     summary: Get all events with specific tag
     *     description: Returns list of all event objects with specific tag
     *     tags:
     *       - events
     *     parameters:
     *       - in: path
     *         name: tag
     *         type: string
     *         required: true
     *         description: Tag of an event
     *     responses:
     *       200:
     *         description: Returns list of event objects
     *
     */
    app.get("/events/tags/:tag", asyncMiddleware(async(req, res, next) => {
        var tag = req.params.tag;
        res.json(await database.getEventsByTag(tag));
    }))

    /*app.get("/queryFriendsAttendingEvent", asyncMiddleware(async(req, res, next) => {
        var userId = req.query.userId;
        var eventId = req.query.eventId;
        var status = req.query.status;
        if (typeof userId === 'undefined' || typeof eventId === 'undefined' ||
            typeof status === 'undefined') {
            res.send({error: 'Invalid parameter'});
            return;
        }
        var user = await database.getUser(userId)
        var event = await database.getEvent(eventId)
        if (!user) {
            res.send({error: 'No user with this username'});
            return;
        }
        if (!event) {
            res.send({error: 'No event with this name'});
            return;
        }

        var userEvents = await database.getUserEvents();
        var friendsAttending = []
        for (var i = 0; i < userEvents.length; i++) {
            if (userEvents[i].eventID === event._id &&
                user.friends.includes(userEvents[i].userId) &&
                userEvents[i].status === status) {
                friendsAttending.push(userEvents[i].userId);
            }
        }
        res.send(requestedEvents);
    }))*/

    /**
     * @swagger
     * /queryFriendsAttendingEvent:
     *   get:
     *     summary: Get friends attending an event
     *     description: Get list of friends' user IDs attending an event
     *     tags:
     *       - queryFriendsAttendingEvent
     *     parameters:
     *       - in: path
     *         name: userId
     *         type: string
     *         required: true
     *         description: Must be a 24 digit hexadecimal number
     *       - in: path
     *         name: eventId
     *         type: string
     *         required: true
     *         description: Must be a 24 digit hexadecimal number
     *       - in: path
     *         name: status
     *         type: string
     *         required: true
     *         description: User's status regarding particular event
     *     responses:
     *       200:
     *         description: Returns list of user ID's
     *
     */
    app.get("/queryFriendsAttendingEvent", asyncMiddleware(async(req, res, next) => {
        var {userId, eventId, status} = req.query;
        var userId = ObjectId(userId);
        res.json(await database.getFriendsAttendingEvent(userId, eventId, status))
    }))

    // this is repeated function so not including it in documentations
    app.get("/queryEventUserInterested", asyncMiddleware(async(req, res, next) => {
        var username = req.query.username;
        var status = req.query.status;
        if (typeof username === 'undefined' || typeof status === 'undefined') {
            res.send({error: 'Invalid parameter'});
            return;
        }
        var query = {username: username}
        var user = await database.getUser(query)
        if (!user) {
            res.send({error: 'No user with this username'});
            return;
        }
        var userEvents = await database.getUserEvents();
        var interestedEvents = []
        for (var i = 0; i < userEvents.length; i++) {
            if (userEvents[i].userID === user._id && userEvents[i].status === status) {
                interestedEvents.push(userEvents[i].eventID);
            }
        }
        res.send(interestedEvents);

    }))

    /**
     * @swagger
     * /search:
     *   get:
     *     summary: Get users and events matching query
     *     description: Get list of users and events with any fields that match the query
     *     tags:
     *       - search
     *     parameters:
     *       - in: path
     *         name: query
     *         type: string
     *         required: true
     *         description: A string to query
     *     responses:
     *       200:
     *         description: Json containing user and event objects
     *
     */
    app.get("/search", asyncMiddleware(async(req, res, next) => {
        var {query} = req.query;
        var userResults = await database.searchUsers(query);
        var eventResults = await database.searchEvents(query)
        res.json({users:userResults, events: eventResults})
    }))

    app.listen(process.env.PORT || 5000);

})()

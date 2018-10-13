const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config({ path: path.join(__dirname, ".env")});
const config = require("./server/config");
const DB = require("./server/db");
const passport = require("passport");

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(passport.initialize()); 

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

const noresRep = new (require("./server/repositories/notes.js"))(DB);
const logRep = new (require("./server/repositories/log.js"))(DB);
const usersRep = new (require("./server/repositories/users"))(DB);

const localStrategy = require("./server/auth/local-strategy");
const jwtStrategy = require("./server/auth/jwt-strategy");
passport.use(localStrategy(usersRep));
passport.use(jwtStrategy(usersRep));

const auth = require('./server/routes/auth');
app.use("/api/auth/", auth(usersRep));

const notes = require('./server/routes/notes');
app.use("/api/notes/", notes(noresRep));

const synchronization = require('./server/routes/synchronization');
app.use("/api/sync/", synchronization(noresRep));

const log = require('./server/routes/log');
app.use("/api/log/", log(logRep));

app.use(express.static(path.join(__dirname, 'public')));
app.use('*', express.static(path.join(__dirname, '/public/index.html')));

app.use(function error404Handler(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});


app.use(function commonErrorHandler(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
        err: err.message,
        stack: err.stack
    });
});


let debug = require('debug')('untitled:server');
let http = require('http');

let port = config.port;
app.set('port', port);

let server = http.createServer(app);

server.listen(port);
server.on('error',
    function onError(error) {
        switch (error.code) {
        case 'EACCES':
            console.error(`${port} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`${port} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
        }
    });
server.on('listening', function onListening() {
    debug('Listening on ' + port);
});

module.exports = app;

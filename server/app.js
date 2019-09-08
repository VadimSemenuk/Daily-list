let express = require('express');
let path = require('path');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let app = express();
require('dotenv').config({ path: path.join(__dirname, ".env")});
let config = require("./server/config");
let DB = require("./server/db");
let passport = require("passport");
let fs = require('fs');

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

let logRep = new (require("./server/repositories/log.js"))(DB);
let usersRep = new (require("./server/repositories/users"))(DB);

let localStrategy = require("./server/auth/local-strategy");
let jwtStrategy = require("./server/auth/jwt-strategy");
passport.use(localStrategy(usersRep));
passport.use(jwtStrategy(usersRep));

let auth = require('./server/routes/auth');
app.use("/api/auth/", auth(usersRep));

let log = require('./server/routes/log');
app.use("/api/log/", log(logRep));

let localPassword = require('./server/routes/local-password');
app.use("/api/local-password/", localPassword());

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

let server;
let port;

if (config.allowHttps === "true") {
    port = config.httpsPort;
    app.set('port', port);

    let https = require('https');
    let options = {
        key: fs.readFileSync(config.sslKeyPath),
        cert: fs.readFileSync(config.sslCertPath)
    };
    server = https.createServer(options, app);
} else {
    port = config.httpPort;
    app.set('port', port);

    let http = require('http');
    server = http.createServer(app);
}

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

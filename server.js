require('rootpath')();
var express = require('express');
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var expressJwt = require('express-jwt');
var config = require('config.json');
var request = require('request');

const OktaJwtVerifier = require('@okta/jwt-verifier');
var cors = require('cors');



const oktaJwtVerifier = new OktaJwtVerifier({
    issuer: 'https://dev-432293.okta.com/oauth2/default',
    clientId: '0oa14wenqdmlFynMp357',
    // assertClaims: {
    //     cid: '0oa13rvul8MFlTv6I357'
    // },
});

/**
 * A simple middleware that asserts valid access tokens and sends 401 responses
 * if the token is not present or fails validation.  If the token is valid its
 * contents are attached to req.jwt
 */
function authenticationRequired(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/Bearer (.+)/);

    if (!match) {
        return res.status(401).end();
    }

    const accessToken = match[1];
    const expectedAudience = '0oa13rvul8MFlTv6I357';
    return request.post({
        url: 'https://cpwnweqcs1.cepheid.pri:44316/sap/bc/sec/oauth2/authorize?response_type=code&client_id=TT-MPOWER&redirect_uri=http://localhost:3000/redirect&scope=ZQTC_EQUIPMENT_SRV_0001&state=anystate',
        json: true
    }, function (error, response, body) {
        console.log(response);
        next();
    });
    // return oktaJwtVerifier.verifyAccessToken(accessToken)
    //     .then((jwt) => {
    //         console.log(jwt)
    //         req.jwt = jwt;
    //         next();
    //     })
    //     .catch((err) => {
    //         console.log(err);
    //         res.status(401).send("un authorized");
    //     });
}

/**
 * For local testing only!  Enables CORS for all domains
 */
app.use(cors());

/**
 * An example route that requires a valid access token for authentication, it
 * will echo the contents of the access token if the middleware successfully
 * validated the token.
 */
app.get('/secure', authenticationRequired, (req, res) => {
    res.json(req.jwt);
});



/**
 * Another example route that requires a valid access token for authentication, and
 * print some messages for the user if they are authenticated
 */
app.get('/apiv1/messages', authenticationRequired, (req, res) => {
    res.json([{
        message: 'Hello, word!'
    }]);
}, (error) => {
    console.log(error);
});

app.get('/redirect', (req, res) => {
    res.json([{
        message: 'Hello, word!'
    }]);
});

app.get('/apiv2/messages', (req, res) => {
    res.json([{
        message: 'Hello, word!'
    }]);
});

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({ secret: config.secret, resave: false, saveUninitialized: true }));

// use JWT auth to secure the api
app.use('/api', expressJwt({ secret: config.secret }).unless({ path: ['/api/users/authenticate', '/api/users/register', '/api/users/current'] }));

// routes
app.use('/login', require('./controllers/login.controller'));
app.use('/register', require('./controllers/register.controller'));
app.use('/app', require('./controllers/app.controller'));
app.use('/api/users', require('./controllers/api/users.controller'));

// make '/app' default route
app.get('/', function (req, res) {
    return res.redirect('/app');
});

// start server
var server = app.listen(3000, function () {
    console.log('Server listening at http://' + server.address().address + ':' + server.address().port);
});

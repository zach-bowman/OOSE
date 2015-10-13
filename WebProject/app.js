
// Express provides us with a server
var express = require('express');
// Define where the controller for the login and signup are
var routes = require('./routes');
var login_customer = require('./routes/login_customer');
var login_business = require('./routes/login_business');
var login_employee = require('./routes/login_employee');
var Signup = require('./routes/signup');
// For HTTP server
var http = require('http');
// Parses the path
var path = require('path');
// MongoDB schema definitions
var mongoose = require('mongoose');
// Passport allows us to get login info from places like Facebook
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
// Import user model
var User = require('./models/user.js');
// Declares the server (creates a server called 'app')
var app = express();

// Specifies the location of the database, and whether it's development or production
var dbLocation;

// Development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
    dbLocation = 'mongodb://localhost/test';
}
if ('production' == app.get('env')) {
    dbLocation = 'mongodb://Ricky:kenshin7553@paulo.mongohq.com:10088/app17872142';
}

// Set the server to use the following parameters
app.set('port', process.env.PORT || 80);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Sets express middleware parameters and functions
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: 'secretnumber1' }));
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

// Sets the passport local strategy (i.e., if you are not using a social login)
passport.use(new LocalStrategy({
        usernameField: 'emailForLogin',
        passwordField: 'passwordForLogin'
    },
    function (email, password, done) {

        User.findOne({email: email}, function (err, user) {

            if (err) {
                return done(err);
            }

            if (user && user.authenticate(password)) {
                return done(null, user);
            }

            else {

                return done(null, false, {message: 'Please check password and email'});

            }
        });
    }
));

// Manage sessions for users once they have logged on/off
passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

// Initialize passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Must be called after passport middleware
app.use(app.router);

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

// Establishes a database connection
mongoose.connect(dbLocation);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
    console.log("Database connection made");
});

// valid get routes
app.get('/', routes.index);
app.get('/login_customer', login_customer.login_customer);
app.get('/login_employee', login_employee.login_employee);
app.get('/login_business', login_business.login_business);
app.get('/signup', Signup.signup)

// valid post routes
// signup route for customer, adds a customer to the database
app.post('/signup_customer', function (req, res) {

    email = req.param('emailAddressForSignup_customer'); //refactor this
    password = req.param('passwordForSignup_customer');
    firstName = req.param('firstNameForSignup_customer');
    lastName = req.param('lastNameForSignup_customer');

    //Need a way to add the business name
    var newUser = new User({email: email, password: password, firstname: firstName, lastname: lastName});

    newUser.save(function (err) {
        if (err) {
            console.log(err);
            res.send(500, {error: "DB error"});
        }
        else {
            return res.redirect('customer_home')
            //res.send({success: 'yes'});
        }
    });
});

// signup route for employee, adds an employee to the database
app.post('/signup_employee', function (req, res) {

    email = req.param('emailAddressForSignup_employee'); //refactor this
    password = req.param('passwordForSignup_employee');
    firstName = req.param('firstNameForSignup_employee');
    lastName = req.param('lastNameForSignup_employee');
    accessCodeForEmployee = req.param('accessCodeForSignup_employee');

    //TODO: INSERT CODE TO CHECK FOR BUSINESS and add BUSINESS to the User constructor below
    var newUser = new User({email: email, password: password, firstname: firstName, lastname: lastName, accessCodeForEmployee: accessCodeForEmployee, typeaccount: "employee"});

    newUser.save(function (err) {
        if (err) {
            res.send(500, {error: "DB error"});
        }
        else {

            res.send({success: 'yes'});
        }
    });
});

// signup route for a business, adds a business to the database
app.post('/signup_business', function (req, res) {

    email = req.param('emailAddressForSignup_business'); //refactor this
    password = req.param('passwordForSignup_business');
    firstName = req.param('firstNameForSignup_business');
    lastName = req.param('lastNameForSignup_business');
    businessName = req.param('businessNameForSignup_business');

    var newUser = new User({email: email, password: password, firstname: firstName, lastname: lastName, business: businessName, typeaccount: "business"});

    newUser.save(function (err) {
        if (err) {
            res.send(500, {error: "DB error"});
        }
        else {

            res.send({success: 'yes'});
        }
    });
});

// Generate token for employee
app.post('/generateToken', function (req, res) {

    var randomToken = Math.random().toString(36).substr(2, 5);
    console.log('token: ' + randomToken);
    req.user
});

// Authenticate local passport using our local strategy
app.post('/login', passport.authenticate('local'), function (req, res) {

    res.redirect("login_"+req.user.typeaccount); //for testing only
});

/* logic to check if email during sign up is unique */
app.post('/isUnique', function (req, res) {

    email = req.param('email');
    User.findOne({email: email}, function (err, user) {

        if (err) {
            res.send({error: "DB Error"});
        }

        else if (user) {
            res.send({error: 'email already been taken'});
        }
        else {
            res.send({error: 'None'});
        }
    });
});

// Instantiate the HTTP Express server
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});



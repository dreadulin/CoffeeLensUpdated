const LocalStrategy = require("passport-local");
const passport = require("passport");
const user = require("../schemas/userSchema");

passport.serializeUser(function(user, done){
    done(null, user.username);
});

passport.deserializeUser(function(username, done){
    const searchQuery = { username: username };
    user.findOne(searchQuery).then(function(user){
        if(user){
            done(null, user);
        }
    }).catch(errorFn);
});


passport.use(new LocalStrategy(function(username, password, done){
    const searchQuery = { username: username, password: password };
    user.findOne(searchQuery).then(function(user){
        if(!user){
            done(null, false);
        } else {
            done(null, user);
        }
    }).catch(errorFn);
    }
));
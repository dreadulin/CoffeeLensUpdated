const user = require("../schemas/userSchema");
const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 11;

function errorFn(err){
    console.log('Error found');
    console.error(err);
}

router.get('/login', function(req,resp){
    resp.render('login',{
        title: 'Log In | Coffee Lens'
    });
});

// current logged in user
var loggedInUser = "cinnamoroll";
var loggedInUserPfp = "https://i.pinimg.com/736x/96/c6/5d/96c65d40ec3d11eb24b73e0e33b568f7.jpg";
var loggedInUserId = 1001;

/*
    list of username and unhashed passwords (remove comment later)
    cinnamoroll
    sanriocinna

    sunnyangel
    sonnyangel

    parksunghoon
    parksunghoon

    leeheeseung
    leeheeseung

    coffeelover
    ilovecoffee

    bonobono
    12341234

    germgerm
    germgerm
*/


router.post('/check_login', function(req,resp){ 
    const searchQuery = { username: req.body.username };
    user.findOne(searchQuery).then(function(user){
        if(user){
            //console.log('Finding User');
            //loggedInUser = user.username;
            //loggedInUserPfp = user.profpic;
            //loggedInUserId = user.userid;

            bcrypt.compare(req.body.password, user.password, function(err, result){
                if(result){
                    
                    req.session.loggedInUser = user.username;
                    req.session.loggedInUserPfp = user.profpic;
                    req.session.loggedInUserId = user.userid;

                    resp.render('check-login',{
                        title: 'Log In | Coffee Lens',
                        success: true
                    });
                } else{
                    resp.render('check-login',{
                        title: 'Log In | Coffee Lens',
                        success: false
                    });
                }
            });

            
        } else{
            resp.render('check-login',{
                title: 'Log In | Coffee Lens',
                success: false
            });
        }
        
    }).catch(errorFn);
});

router.get('/logout', function(req, resp){
    req.session.destroy(function(err) {
        resp.redirect('/login');
    });

});

module.exports = router;
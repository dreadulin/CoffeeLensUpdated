const user = require("../schemas/userSchema");
const post = require("../schemas/postSchema");


const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 11;

function errorFn(err){
    console.log('Error found');
    console.error(err);
}

function formatDate(date) {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
}

router.get('/create_acc', function(req,resp){
    resp.render('create-acc',{
        title: 'Register | Coffee Lens'
    });
});

router.post('/create_acc', async function(req,resp){
    const previousUser = await user.findOne().sort({userid: -1}).exec();
    let previousUserId;
    if (previousUser) {
        previousUserId = previousUser.userid + 1;
    } else {
        previousUserId = 1000;
    }

    const {username, password, confirmPassword, accountType} = req.body;
    let isOwner = false;
    if(accountType == 'owner'){
        isOwner = true;
    } //dunno if this fixes it
    const currentDate = new Date();
    const formattedDate = formatDate(currentDate);
    bcrypt.hash(password, saltRounds, function(err, hash) {
        const newUser = new user({
            userid: previousUserId,
            username: username,
            password: hash,
            joindate: formattedDate,
            isOwner: isOwner,
            profpic: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
        });
        
        newUser.save().then(function(){
            resp.redirect('/login');
            console.log('Registered Successfully');
        });
    });
});

router.get('/edit_profile', function(req,resp){
    const userId = req.session.loggedInUserId;
    user.findOne({userid: userId}).lean().then(function(user){
        //console.log(user);
        resp.render('edit-profile',{
            title: 'Edit Profile | Coffee Lens',
            'user-data': user,
            'userPfp': user.profpic,
            password: user.password,
            loggedInUserId: userId
        });
    }).catch(errorFn);
}); 

router.post('/edit_profile', function(req, resp){
    const { username, filename } = req.body;
    const loggedInUserId = req.session.loggedInUserId;

    user.findOneAndUpdate({ userid: loggedInUserId }, 
        {
            username: username,
            profpic: filename
        }, { new: true }).then(function(updatedUser){
            console.log('Updated Profile Successfully');
            // Update the session with the new profile picture filename
            req.session.loggedInUserPfp = updatedUser.profpic;
            resp.redirect('/');
        }).catch(errorFn);
});

router.get('/view_profile', function(req,resp){
    let userId = req.query.userId;

    user.findOne({userid: userId}).lean().then(function(profile){
        post.find({authorid: userId}).lean().then(function(posts){
            var isLoggedIn
            if(req.session.loggedInUserId === profile.userid){
                isLoggedIn = true;
            } else{
                isLoggedIn = false;
            }
            resp.render('view-profile',{
                title: 'Profile | Coffee Lens',
                'posts': posts,
                'user-data': profile,
                userPfp: req.session.loggedInUserPfp,
                'isLoggedIn': isLoggedIn,
                loggedInUserId: req.session.loggedInUserId
            });
            
        }).catch(errorFn);
    }).catch(errorFn);
}); 

module.exports = router;
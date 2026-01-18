const post = require("../schemas/postSchema");
const user = require("../schemas/userSchema");
const cafe =  require("../schemas/cafeSchema");
const comment =  require("../schemas/commentSchema");
const archive = require("../schemas/archiveSchema");


const express = require("express");
const router = express.Router();

const databaseName = "mco";
const collectionName = "posts";

// current logged in user
var loggedInUser = "cinnamoroll";
var loggedInUserPfp = "https://i.pinimg.com/736x/96/c6/5d/96c65d40ec3d11eb24b73e0e33b568f7.jpg";
var loggedInUserId = 1001;

function errorFn(err){
    console.log('Error found');
    console.error(err);
}

router.get('/view_post', function(req, resp){
    const postId = req.query.postId;

    post.findById(postId).lean().then(function(post) {
        if (post) {
            user.findOne({ userid: post.authorid }).lean().then(function(poster) {
                comment.find({postid: post.postid}).lean().then(function(comments){
                    if(comments){
                        const authorIds = comments.map(comment => comment.authorid);
                        user.find({userid: { $in: authorIds }}).lean().then(function(users){
                            const commentsWithUserInfo = comments.map(comment =>{
                                const author = users.find(user => user.userid === comment.authorid);
                                return{
                                    ...comment,
                                    profpic: author ? author.profpic : null,
                                    username: author ? author.username : null,
                                    isOwner: author ? author.isOwner : false
                                };
                            });
                            var isLoggedIn;
                            if(post.authorid===req.session.loggedInUserId){
                                isLoggedIn = true;
                            } else{
                                isLoggedIn = false;
                            }
                            resp.render('view-post', {
                                title: 'View Promo | Coffee Lens',
                                'post-data': post,
                                'user-data' : poster,
                                'comments-data': commentsWithUserInfo,
                                userPfp: req.session.loggedInUserPfp,
                                'isLoggedIn': isLoggedIn,
                                loggedInUserId: req.session.loggedInUserId
                            });

                        }).catch(errorFn);
                    } else {
                        resp.status(404).send('Comments not found');
                    }
                }).catch(errorFn);
            }).catch(errorFn);
        } else {
            resp.status(404).send('Post not found');
        }
    }).catch(errorFn);
});

router.get('/edit_post', function(req,resp){
    const postId = req.query.postId;
    const currentDate = new Date();
    const formattedDate = formatDate(currentDate);
    post.findById(postId).lean().then(function(post){
        if(post){
            user.findOne({ userid: post.authorid }).lean().then(function(poster){
                cafe.find({}).lean().then(function(cafes){
                    resp.render('edit-post',{
                        title: 'Edit Post | Coffee Lens',
                        'post-data': post,
                        'user-data': poster,
                        'cafe-list': cafes,
                        currentDate: formattedDate,
                        userPfp: req.session.loggedInUserPfp,
                        loggedInUserId: req.session.loggedInUserId
                    });
                }).catch(errorFn);
            }).catch(errorFn);
        } else{
            resp.status(404).send('Post not found');
        }
    }).catch(errorFn);
    
}); 

router.post('/edit_post', async (req, res) => {
    const postId = req.body.postId; 
    const updatedTitle = req.body.title; 
    const updatedDescription = req.body.description; 
    const updatedImage = req.body.filename; 
    const rating = parseInt(req.body.rate);

    try {
        const updatedPost = await post.findByIdAndUpdate(postId, {
            title: updatedTitle,
            description: updatedDescription,
            image: updatedImage,
            rating: rating,
            updateDate: req.body.currentDate,
        }, { new: true }); 

        if (updatedPost) {
            res.redirect(`/view_post?postId=${postId}`);
        } else {
            res.status(404).send('Post not found');
        }
    } catch (error) {
        res.status(500).send('Error updating post');
    }
});

function formatDate(date) {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
}

router.get('/post_promo', function(req, resp){
    const searchQuery = {};
    const currentDate = new Date();
    const formattedDate = formatDate(currentDate);
    cafe.find(searchQuery).lean().then(function(cafes){
        resp.render('post-promo', {
            title: 'Post A Promo | Coffee Lens',
            'cafe-data': cafes,
            currentDate: formattedDate,
            userPfp: req.session.loggedInUserPfp,
            user: req.session.loggedInUser,
            loggedInUserId: req.session.loggedInUserId
        });
    }).catch(errorFn);
});

router.post('/post_promo', async function(req, resp){
    // Fetch all posts and sort them by postid in descending order
    const posts = await post.find().sort({ postid: -1 }).exec();
        
    // Get the highest postid or set it to 3000 if no posts exist
    let previousPostId = posts.length > 0 ? posts[0].postid + 1 : 3000;

    const storeid = req.body.cafeid.toString();

    const postInstance = new post({
        authorid: req.body.authorid,
        upvote: 0,
        downvote: 0,
        title: req.body.title,
        description: req.body.promo_content,
        image: req.body.filename,
        isPromo: true,
        storeid: storeid,
        postid: previousPostId,
        rating: null,
        createdate: req.body.currentDate,
        updatedate: req.body.currentDate,
        dateposted: req.body.currentDate,
        likedby:[0],
        dislikedby:[0]
    });

    postInstance.save().then(function() {
      resp.redirect('/?success=true');
    }).catch(errorFn);
});

router.get('/post_review', function(req, resp){
    const searchQuery = {};
    const currentDate = new Date();
    const formattedDate = formatDate(currentDate);
    cafe.find(searchQuery).lean().then(function(cafes){
        resp.render('post-review', {
            title: 'Post A Review | Coffee Lens',
            'cafe-data': cafes,
            currentDate: formattedDate,
            userPfp: req.session.loggedInUserPfp,
            user: req.session.loggedInUser,
            loggedInUserId: req.session.loggedInUserId
        });
    }).catch(errorFn);
});

// adding review
router.post('/post_review', async function(req, resp){
    try {
        // Fetch all posts and sort them by postid in descending order
        const posts = await post.find().sort({ postid: -1 }).exec();
        
        // Get the highest postid or set it to 3000 if no posts exist
        let previousPostId = posts.length > 0 ? posts[0].postid + 1 : 3000;


        const rating = parseInt(req.body.rate);
        const storeid = req.body.cafeid.toString();

        const postInstance = new post({
            authorid: req.body.authorid,
            upvote: 0,
            downvote: 0,
            title: req.body.title,
            description: req.body.review_content,
            image: req.body.filename,
            isPromo: false,
            storeid: storeid,
            postid: previousPostId,
            rating: rating,
            createdate: req.body.currentDate,
            updatedate: req.body.currentDate,
            dateposted: req.body.currentDate,
            likedby: [0],
            dislikedby: [0]
        });

        await postInstance.save();
        console.log('Added Post Successfully');
        resp.redirect('/');
    } catch (error) {
        console.error(error);
        resp.status(500).send('Internal Server Error');
    }
});


router.get("/delete/:postId", async function (req, res) {
    const postId = req.params.postId;
    
    try {
        const deletedPost = await post.findByIdAndDelete(postId);
        if (deletedPost) {
            await archive.create({
                createdate: deletedPost.createdate,
                updatedate: deletedPost.updatedate,
                dateposted: deletedPost.dateposted,
                upvote: deletedPost.upvote,
                downvote: deletedPost.downvote,
                title: deletedPost.title,
                description: deletedPost.description,
                image: deletedPost.image,
                isPromo: deletedPost.isPromo,
                storeid: deletedPost.storeid,
                postid: deletedPost.postid,
                rating: deletedPost.rating,
                likedby: deletedPost.likedby,
                dislikedby: deletedPost.dislikedby
            });
            res.redirect("/");
        } else {
            res.status(404).send('Post not found');
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).send('Error deleting post');
    }
});



router.post('/like_comment', function(req, resp){
    const commentId = req.body.commentId;
    const likeOrDislike = req.body.likeOrDislike;
    const userId = req.session.loggedInUserId;
    
    comment.findById(commentId).lean().then(function(commentToUpdate){
        console.log(commentToUpdate);
        console.log(commentId);
        console.log(likeOrDislike);
        var isLiked = commentToUpdate.likedby.includes(userId);
        var isDisliked = commentToUpdate.dislikedby.includes(userId);
        if (likeOrDislike==='like'){
            if(!isLiked){
                if(isDisliked){
                    var dislikeIndex = commentToUpdate.dislikedby.indexOf(userId);
                    commentToUpdate.dislikedby.splice(dislikeIndex,1);
                    commentToUpdate.downvote = commentToUpdate.downvote-1;
                }
                commentToUpdate.likedby.push(userId);
                commentToUpdate.upvote = Number(commentToUpdate.upvote) +1;
            }
        } else if (likeOrDislike==='dislike'){
            if(!isDisliked){
                if(isLiked){
                    var likeIndex = commentToUpdate.dislikedby.indexOf(userId);
                    commentToUpdate.likedby.splice(likeIndex,1);
                    commentToUpdate.upvote = commentToUpdate.upvote-1;
                } 
                commentToUpdate.dislikedby.push(userId);
                commentToUpdate.downvote = Number(commentToUpdate.downvote) +1;
            }
        }
        comment.findByIdAndUpdate(commentId,commentToUpdate, {new:true}).then(function(updatedComment){
            console.log('Updated Successfully');
            console.log(updatedComment);
            resp.send({status: 'success'});
        });
    }).catch(errorFn);
});

router.post('/like_post',function(req,resp){
    const postId = req.body.postId;
    const likeOrDislike = req.body.likeOrDislike;
    var postInstance;
    const userId = req.session.loggedInUserId;
    post.findById(postId).lean().then(function(postToUpdate){
        console.log(postToUpdate);
        console.log(postId);
        console.log(likeOrDislike);
        var isLiked = postToUpdate.likedby.includes(userId);
        var isDisliked = postToUpdate.dislikedby.includes(userId);
        if(likeOrDislike ==='like'){
            if(!isLiked){
                if(isDisliked){
                    var dislikeIndex = postToUpdate.dislikedby.indexOf(userId);
                    postToUpdate.dislikedby.splice(dislikeIndex,1);
                    postToUpdate.downvote = postToUpdate.downvote-1;
                }
                postToUpdate.likedby.push(userId);
                postToUpdate.upvote = Number(postToUpdate.upvote) +1;
            }
        } else if (likeOrDislike === 'dislike'){
            if(!isDisliked){
                if(isLiked){
                    var likeIndex = postToUpdate.likedby.indexOf(userId);
                    postToUpdate.likedby.splice(likeIndex,1);
                    postToUpdate.upvote = postToUpdate.upvote-1;
                }
                postToUpdate.dislikedby.push(userId);
                postToUpdate.downvote = Number(postToUpdate.downvote) +1;
            }
        }
        post.findByIdAndUpdate(postId,postToUpdate, {new:true}).then(function(updatedPost){
            console.log('Updated Successfully');
            console.log(updatedPost);
            resp.send({status: 'success'});
        });
    }).catch(errorFn);
});

router.post('/post_comment', function(req,resp){
    const postId = req.body.postId;
    const postId2 = req.body.postId2; //for redirect
    const content = req.body.content;
    const newComment = new comment({
        upvote: 0,
        downvote: 0,
        content: content,
        authorid: req.session.loggedInUserId,
        likedby: [0],
        postid: postId,
        dislikedby:[0]
    });
    newComment.save().then(function(){
        console.log('Comment Added Successfully');
        resp.redirect(`/view_post?postId=${postId2}`);
    });
});

module.exports = router;
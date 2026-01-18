const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    upvote: { type: Number }, 
    downvote: {type: Number},
    content: {type: String},
    authorid: {type: Number}, 
    postid: {type: Number},
    likedby: [{type: Number}],
    dislikedby: [{type: Number}]
},{ versionKey: false });

const commentModel = mongoose.model('comment',commentSchema, 'comments');
module.exports = commentModel; 
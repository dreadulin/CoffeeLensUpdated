const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    authorid: {type: Number},
    createdate: {type: String},
    updatedate: {type: String},
    dateposted: {type: String},
    upvote: { type: Number, default: 0}, 
    downvote: {type: Number, default: 0},
    title: {type: String},
    description: {type: String},
    image: {type: String},
    isPromo: {type: Boolean},
    storeid: {type: String},
    postid: {type: Number},
    rating: {type: Number},
    likedby: [{type: Number}],
    dislikedby: [{type: Number}]
 },{ versionKey: false });

const postModel = mongoose.model('post',postSchema, 'posts');
module.exports = postModel; 
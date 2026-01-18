// We will store here the deleted posts 

const mongoose = require('mongoose');

const archiveSchema = new mongoose.Schema({
    authorid: {type: Number},
    createdate: {type: String},
    updatedate: {type: String},
    dateposted: {type: String},
    upvote: { type: Number }, 
    downvote: {type: Number},
    title: {type: String},
    description: {type: String},
    image: {type: String},
    isPromo: {type: Boolean},
    storeid: {type: Number},
    postid: {type: Number},
    rating: {type: Number}
 },{ versionKey: false });

const archiveModel = mongoose.model('archive',archiveSchema,'archives');
module.exports = archiveModel; 
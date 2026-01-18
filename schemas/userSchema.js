const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userid: { type: Number }, 
    username: {type: String},
    password: { type: String}, 
    profpic: {type: String},
    joindate: {type: String},
    isOwner: {type: Boolean}
 },{ versionKey: false });

 const userModel = mongoose.model('user',userSchema, 'users');
 module.exports = userModel; 
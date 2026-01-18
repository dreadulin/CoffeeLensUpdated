const mongoose = require('mongoose');

const cafeSchema = new mongoose.Schema({
    cafeid: {type: Number}, 
    cafename: {type: String},
    ownerid: {type: Number}, 
    logo: {type: String},
    rating: {
        type: Number,
        default: 0,
        set: function(value) {
            // If the value is "NaN" or not a number, set it to 0
            return isNaN(value) ? 0 : value;
        }
    },
    cafedesc: {type: String}
 },{ versionKey: false });

 const cafeModel = mongoose.model('store',cafeSchema, 'stores');
 module.exports = cafeModel; 
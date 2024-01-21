const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const userlogin = new Schema({  
  name:String,                        //( name,email,password, phone number, profile image, 
  image:String,
  email:String,
  password:String,
  status:String
});

module.exports = mongoose.model('userlogin', userlogin);
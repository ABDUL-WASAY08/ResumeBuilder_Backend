const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true, 
    trim: true,
  },
  password: {
    type: String,
    trim: true, 
    select:false
  },
  googleId:{
    type:String
  }
},{timestamps:true});
module.exports=mongoose.model('User',userSchema);
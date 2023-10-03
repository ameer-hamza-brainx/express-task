const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    id:Number,
    task:String
})

const userSchema = new mongoose.Schema({ 
    name:String,
    email:{
        type:String,
        required:true
    },
    password:String,
    isVerified:{
        type:Boolean,
        default:false
    },
    tasks:[taskSchema],
    token:{
        key:String,
        expiry:Date
    }
});
module.exports = mongoose.model("User",userSchema);
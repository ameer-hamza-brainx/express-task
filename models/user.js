const mongoose = require("mongoose");

// const taskSchema = new mongoose.Schema({
//     id:Number,
//     task:String
// })

const userSchema = new mongoose.Schema({ 
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:String,
    isVerified:{
        type:Boolean,
        default:false
    },
    tasks:Array,
    token:{
        key:String,
        expiry:Date
    }
});
module.exports = mongoose.model("User",userSchema);
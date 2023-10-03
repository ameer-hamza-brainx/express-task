const path = require("path");
const express = require('express');
require("../db/conn");
const app = express();
const port = 5000;
const fs = require('fs');
const session = require('express-session');
const filePath = path.join(__dirname+"/../data/userData.json")
const User = require("../models/user");


app.use(session({
  secret: 'secret_key_here',
  resave: false,
  saveUninitialized: true
}));

app.use(express.json());

// function to generate token
function generateToken(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters.charAt(randomIndex);
    }
    return token;
  }

function readFile()
{
    let usersjson = fs.readFileSync(filePath,"utf-8");
    let users = JSON.parse(usersjson);
    return users;
}
function writeFile(users,context,res)
{
    usersjson = JSON.stringify(users);
    fs.writeFile(filePath,usersjson,err=>{
        if(err)
        {
            res.status(400).send("Some problem occured");
        }
        else
        {
            res.status(200).send(context);
        }
   });
}
// function saveToDb(users,context,res)
// {
//     usersjson = JSON.stringify(users);
//     fs.writeFile(filePath,usersjson,err=>{
//         if(err)
//         {
//             res.status(400).send("Some problem occured");
//         }
//         else
//         {
//             res.status(200).send(context);
//         }
//    });
// }

function isLogIn(req,res,next){
    if(req.session.loggedIn)
    {
        next();
    }
    else{
        res.send("Log In first");
    }
}

async function isVerified(req,res,next){
    const foundUser = await User.findOne({email:req.session.email});

    if(foundUser.isVerified)
    {
        next();
    }
    else{
        res.send("Verify your email first");
    }
}

app.get("/",(req,res)=>{
    res.status(200).send("<h1>Home page</h1>");
});

//Signup api

app.post("/signup",async(req,res)=>{

   const foundUser =await User.where("email").equals(req.body.email);
   if(!foundUser)
   {
       const newUser = new User(req.body);
        newUser.save().then(()=>{
        res.send("Sucessfully registered")})
        .catch((e)=>{
            console.log(e);
            res.status(400).send("Some problem occured")});
   }
   else{
    res.send("User already exist");
   }
    
});

// Login Api

app.post("/signin",async(req,res)=>{
    const foundUser =await User.findOne({email:req.body.email});
    if(foundUser)
    {
        if(foundUser.password == req.body.password)
        {
            req.session.loggedIn = true;
            req.session.email = req.body.email;
            res.status(200).send("Signin successful");
        }
        else
        {
            res.status(401).send("Invalid password");
            // console.log(foundUser);
        }
    }
    else
    {
        res.status(401).send("Invalid credentials");
    }
});

// change password

app.post("/changepassword",isLogIn,isVerified,async(req,res)=>{
    let user = await User.findOne({email:req.session.email});
    user.password = req.body.password;
    try{
        user.save();
        res.send("password changed");
    }
    catch(e){
        res.status(500).send("problem occured");
    }
});

app.get("/verifyEmail",isLogIn,async(req,res)=>{
    let user = await User.findOne({email:req.session.email});
    user.isVerified = true;
    user.save().then(()=>{
        res.send("Email verified")})
        .catch((e)=>{
            console.log(e);
            res.status(500).send("problem occured")});
});



// Task create API
app.post("/createTask",isLogIn,isVerified, async(req,res)=>{
    let user = await User.findOne({email:req.session.email});
        if(user.tasks.length ===0)
            {
                let newObj = {
                    "id":"1",
                    "task":req.body.task
                }
                user.tasks.push(newObj);
                user.save().then(()=>{
                    res.send("task added");
                }).catch((e)=>{
                    res.status(400).send("Internal error");
                })
            }
            else
            {
                let id = user.tasks[user.tasks.length-1].id;
                id = Number(id)+1;
                id = id.toString();
                // res.send(id);
                let newObj = {
                    "id":id,
                    "task":req.body.task
                }
                user.tasks.push(newObj);
                // writeFile(users,"task added",res);
                user.save().then(()=>{
                    res.send("task added");
                }).catch((e)=>{
                    res.status(400).send("Internal error");
                })
            }
});

//Task remove API

app.post("/removeTask",isLogIn,isVerified,(req,res)=>{
    let users = readFile();
    let taskExist = false;
    users.forEach(user => {
        if(user.email === req.session.email)
        {
            if(JSON.stringify(user.tasks)==='[]')
            {
                res.send("Task not exist");
            }
            else
            {
                let tasks = user.tasks;
                tasks.forEach((task,index) => {
                    if(task.id === req.body.id)
                    {
                        taskExist = true;
                        tasks.splice(index, 1);
                    }
                });
                user.tasks = tasks;
                taskExist?writeFile(users,"task removed",res):res.send("task not exist");
            }
        }
    });
});
//Task update API

app.patch("/updateTask",isLogIn,isVerified,(req,res)=>{
    let users = readFile();
    let taskExist = false;
    users.forEach(user => {
        if(user.email === req.session.email)
        {
            if(JSON.stringify(user.tasks)==='[]')
            {
                res.send("Task not exist");
            }
            else
            {
                let tasks = user.tasks;
                tasks.forEach(task => {
                    if(task.id === req.body.id)
                    {
                        taskExist = true;
                        task.task = req.body.updatedTask;
                    }
                });
                user.tasks = tasks;
                taskExist?writeFile(users,"task updated",res):res.send("task not exist");
            }
        }
    });
});

// Get tasks

app.get("/getTasks",isLogIn,isVerified,(req,res)=>{
    let user = User.findOne({email:req.session.email});
    if(user.tasks)
    {
        res.send(user.tasks);
    }
    else
    {
        res.send("Task not exist");
    }
    
});


app.post("/forgotPassword",async(req,res)=>{
    const foundUser = await User.findOne({email:req.body.email});
    const token = generateToken(16);
    if(foundUser)
    {
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + 2);
        foundUser.token = {
            "key":token,
            "expiry":expirationTime
        }
        foundUser.save().then(()=>{
            res.send("http://localhost:5000/resetPassword/"+token)
        }).catch((e)=>{
            console.log(e);
            res.status(500).send("Some problem occured")});
    }
    else
    {
        res.send("user not exist");
    }
});

//Reset password

app.post("/resetPassword/:token",async(req,res)=>{
    // let users = readFile();
    // let exist = false;
    const foundUser = await User.findOne({"token.key":req.params.token});
    if(foundUser)
    {
        const dateNow = new Date();
        const expiryDate = new Date(foundUser.token.expiry);
        if(dateNow <= expiryDate)
        {
            foundUser.password = req.body.password;
            foundUser.save().then(()=>{
                res.send("pasword changed");
            }).catch((e)=>{
                res.status(500).send(e);
            })
        }
        else
        {
            res.status(400).send("token expired");
        }
    }
    else
    {
        res.send("Invalid token");
    }
    // users.forEach(user => {
    //     if(user.hasOwnProperty('token') && user.token.key === req.params.token)
    //     {
    //         exist = true;
            
    //         else
    //         {
    //             res.send("Token Expired");
    //         }
    //     }
    // });
});

// listening on port

app.listen(port,()=>{
    console.log("listening on port "+port);
})

const path = require("path");
const express = require('express');
const app = express();
const port = 5000;
const fs = require('fs');
const session = require('express-session');
const filePath = path.join(__dirname+"/../data/userData.json")

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

function isLogIn(req,res,next){
    if(req.session.loggedIn)
    {
        next();
    }
    else{
        res.send("Log In first");
    }
}

function isVerified(req,res,next){
    let users = readFile();
    const foundUser = users.find(user => user.email === req.session.email);

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

app.post("/signup",(req,res)=>{
   let users = readFile();
   const foundUser = users.find(user => user.email === req.body.email);
   if(!foundUser)
   {
       users.push(req.body);
       writeFile(users,"Sucessfully signed up",res);
   }
   else{
    res.send("User already exist");
   }
    
});

// Login Api

app.post("/signin",(req,res)=>{
    let users = readFile();

    const foundUser = users.find(user => user.email === req.body.email);
    if(foundUser)
    {
        if(foundUser.password === req.body.password)
        {
            req.session.loggedIn = true;
            req.session.email = req.body.email;
            res.status(200).send("Signin successful");
        }
        else
        {
            res.status(401).send("Invalid credentials");
        }
    }
    else
    {
        res.status(401).send("Invalid credentials");
    }
});

// change password

app.post("/changepassword",isLogIn,isVerified,(req,res)=>{
    
    let users = readFile();
    users.forEach(user => {
        if(user.email === req.session.email)
        {
            user.password = req.body.password;
        }
    });
    writeFile(users,"Password changed sucessfully",res);
});

app.get("/verifyEmail",isLogIn,(req,res)=>{
    let users = readFile();
    users.forEach(user => {
        if(user.email === req.session.email)
        {
            user.isVerified = true;
        }
    });
    writeFile(users,"Email verified",res);
});



// Task create API
app.post("/createTask",isLogIn,isVerified,(req,res)=>{
    let users = readFile();
    users.forEach(user => {
        if(user.email === req.session.email)
        {
            // user.tasks.push(req.body.task);
            if(JSON.stringify(user.tasks)==='[]')
            {
                let newObj = {
                    "id":"1",
                    "task":req.body.task
                }
                user.tasks.push(newObj);
                writeFile(users,"task added",res);
                // res.send("empty");
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
                writeFile(users,"task added",res);
            }
        }
    });
    
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
    let users = readFile();
    users.forEach(user => {
        if(user.email === req.session.email)
        {
            if(JSON.stringify(user.tasks)==='[]')
            {
                res.send("Task not exist");
            }
            else
            {
                res.send(user.tasks);
            }
        }
    });
});


app.post("/forgotPassword",(req,res)=>{
    let users = readFile();
    const foundUser = users.find(user => user.email === req.body.email);
    const token = generateToken(16);
    if(foundUser)
    {
        users.forEach(user => {
            if(user.email === req.body.email)
            {
                const expirationTime = new Date();
                expirationTime.setMinutes(expirationTime.getMinutes() + 2);
                foundUser.token = {
                    "key":token,
                    "expiry":expirationTime
                }
            }
        });
        writeFile(users,"http://localhost:5000/resetPassword/"+token,res);
    }
    else
    {
        res.send("user not exist");
    }
});

//Reset password

app.post("/resetPassword/:token",(req,res)=>{
    let users = readFile();
    let exist = false;
    
    // const foundUser = users.find(user => user.token.key === req.body.email);
    users.forEach(user => {
        if(user.hasOwnProperty('token') && user.token.key === req.params.token)
        {
            exist = true;
            const dateNow = new Date();
            const expiryDate = new Date(user.token.expiry);
            if(dateNow <= expiryDate)
            {
                user.password = req.body.password;
                writeFile(users,"password changed",res);
                return;
            }
            else
            {
                res.send("Token Expired");
            }
        }
    });
    if(!exist){res.send("Invalid token");}
});

// listening on port

app.listen(port,()=>{
    console.log("listening on port "+port);
})

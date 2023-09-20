const path = require("path");
const express = require('express');
const app = express();
const port = 5000;
const fs = require('fs');

app.use(express.json());
// function middleware(req,res,next){
//     console.log("global middleware");
//     next();
// }
// app.use(middleware);


// app.get("/about",auth,(req,res)=>{
//     res.send("about page");
//     console.log("about page")
// })

// function auth(req,res,next){
//     if(req.query.admin === "true")
//     {
//         console.log("single middleware");
//         next();
//     }
//     else{
//         res.send("You are not allowed to visit");
//     }
// }

app.get("/",(req,res)=>{
    res.status(200).send("<h1>Hello</h1>");
});

//Signup api

app.post("/signup",(req,res)=>{
   let usersjson = fs.readFileSync("./data/userData.json","utf-8");
   let users = JSON.parse(usersjson);
   users.push(req.body);
   usersjson = JSON.stringify(users);
   fs.writeFile("./data/userData.json",usersjson,err=>{
        if(err)
        {
            res.send("Error saving data");
        }
        else
        {
            res.send("signup sucessful");
        }
   });
    
});

// Login Api

app.post("/signin",(req,res)=>{
    console.log(req.body.email)
    res.send("hit ")
})

app.listen(port,()=>{
    console.log("listening on port "+port);
})

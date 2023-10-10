const express = require('express');
require("../db/conn");
const app = express();
const port = 5000;
const session = require('express-session');
const User = require("../models/user");
const cors = require("cors");

app.use(session({
    secret: 'secret_key_here',
    resave: false,
    saveUninitialized: true
}));

app.use(express.json());
app.use(cors());

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


async function getUser(req, res, next) {
    try {
        req.user = await User.findOne({ email: req.body.email });
    }
    catch (e) {
        res.status(500).send("Internal error");
    }
    next();
}

//Signup api

app.post("/signup", async (req, res) => {
    try {
        const foundUser = await User.findOne({ email: req.body.email });
        if (!foundUser) {
            const newUser = new User(req.body);
            newUser.save().then(() => {
                res.send("Sucessfully registered")
            })
                .catch((e) => {
                    console.log(e);
                    res.status(400).send("Some problem occured")
                });
        }
        else {
            res.send({error:true,errorMsg:"Email already exist!"});
        }
    }
    catch (e) {
        res.status(500).send("Internal error");
    }


});

// Login Api

app.post("/signin", async (req, res) => {
    try {
        const foundUser = await User.findOne({ email: req.body.email });
        if (foundUser) {
            if (foundUser.password == req.body.password) {
                req.session.loggedIn = true;
                req.session.email = req.body.email;
                res.status(200).send(foundUser);
            }
            else {
                res.status(401).send({error:true,errorMsg:"Invalid Credentials"});
            }
        }
        else {
            res.status(401).send({error:true,errorMsg:"Invalid Credentials"});
        }
    }
    catch (e) {
        res.status(500).send("Internal error");
    }

});

// change password

app.post("/changepassword", getUser, async (req, res) => {
    req.user.password = req.body.password;
    try {
        req.user.save();
        res.status(200).send("password changed");
    }
    catch (e) {
        res.status(500).send("problem occured");
    }
});

app.post("/verifyEmail", async (req, res) => {
    const foundUser = await User.findOne({ email: req.body.emailState });
    foundUser.isVerified = true;
    console.log(foundUser)
    foundUser.save().then(() => {
        res.status(200).send({error:false,msg:"Email verified"})
    }).catch((e) => {
            console.log(e);
            res.status(500).send({error:true,msg:"problem occured"})
        });
});


//Task update API

app.post("/updateTask", async (req, res) => {
    const foundUser = await User.findOne({ email: req.body.emailState });
    try{
        foundUser.tasks = req.body.tasks;
        foundUser.save();
        res.status(200).send("tasks changed");
    }
    catch(e)
    {
        res.status(500).send("problem occured")
    }
});

// Get tasks

app.post("/getTasks", async (req, res) => {
    const foundUser = await User.findOne({ email: req.body.emailState });
    res.send(foundUser);

});


app.post("/forgotPassword", async (req, res) => {
    const foundUser = await User.findOne({ email: req.body.email });
    const token = generateToken(16);
    if (foundUser) {
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + 2);
        foundUser.token = {
            "key": token,
            "expiry": expirationTime
        }
        foundUser.save().then(() => {
            res.send({userExist:true,msg:"http://localhost:3000/resetPassword?token=" + token})
        }).catch((e) => {
            console.log(e);
            res.status(500).send("Some problem occured")
        });
    }
    else {
        res.send({userExist:false,msg:"user not exist"});
    }
});

//Reset password

app.post("/resetPassword/:token", async (req, res) => {
    const foundUser = await User.findOne({ "token.key": req.params.token });
    if (foundUser) {
        const dateNow = new Date();
        const expiryDate = new Date(foundUser.token.expiry);
        if (dateNow <= expiryDate) {
            res.status(200).send(foundUser.email);
        }
        else {
            res.status(400).send({isValid:false,msg:"token expired"});
        }
    }
    else {
        res.send({isValid:false,msg:"Invalid token"});
    }

});

// listening on port

app.listen(port, () => {
    console.log("listening on port " + port);
})

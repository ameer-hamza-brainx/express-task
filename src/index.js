const express = require('express');
require("../db/conn");
const app = express();
const port = 5000;
const session = require('express-session');
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

function isLogIn(req, res, next) {
    if (req.session.loggedIn) {
        next();
    }
    else {
        res.send("Log In first");
    }
}

async function getUser(req, res, next) {
    try {
        req.user = await User.findOne({ email: req.session.email });
    }
    catch (e) {
        res.status(500).send("Internal error");
    }
    next();
}
async function isVerified(req, res, next) {
    try {
        req.user = await User.findOne({ email: req.session.email });
    }
    catch (e) {
        res.status(500).send("Internal error");
    }

    if (req.user.isVerified) {
        next();
    }
    else {
        res.send("Verify your email first");
    }
}

app.get("/", (req, res) => {
    res.status(200).send("<h1>Home page</h1>");
});

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
            res.send("User already exist");
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
                res.status(200).send("Signin successful");
            }
            else {
                res.status(401).send("Invalid password");
            }
        }
        else {
            res.status(401).send("Invalid credentials");
        }
    }
    catch (e) {
        res.status(500).send("Internal error");
    }

});

// change password

app.post("/changepassword", isLogIn, isVerified, getUser, async (req, res) => {
    req.user.password = req.body.password;
    try {
        req.user.save();
        res.send("password changed");
    }
    catch (e) {
        res.status(500).send("problem occured");
    }
});

app.get("/verifyEmail", isLogIn, getUser, async (req, res) => {
    req.user.isVerified = true;
    req.user.save().then(() => {
        res.send("Email verified")
    })
        .catch((e) => {
            console.log(e);
            res.status(500).send("problem occured")
        });
});



// Task create API
app.post("/createTask", isLogIn, isVerified, getUser, async (req, res) => {

    let newObj = {
        "task": req.body.task
    }
    req.user.tasks.push(newObj);
    req.user.save().then(() => {
        res.send("task added");
    }).catch((e) => {
        res.status(400).send("Internal error");
    })
});

//Task remove API

app.post("/removeTask", isLogIn, isVerified, getUser, async (req, res) => {
    let taskExist = false;
    if (req.user.tasks) {
        let tasks = req.user.tasks;
        tasks.forEach((task, index) => {
            if (task._id == req.body.id) {
                taskExist = true;
                tasks.splice(index, 1);
                req.user.tasks = tasks;
            }
        });
        if (taskExist) {
            req.user.save().then(() => {
                res.status(200).send("Task removed");
            }).catch((e) => {
                res.status(500).send("Internal error");
            })
        }
        else {
            res.status(200).send("Task not exist");
        }
    }
    else {
        res.send("Task not exist");
    }
});
//Task update API

app.patch("/updateTask", isLogIn, isVerified, getUser, async (req, res) => {
    let taskExist = false;
    if (req.user.tasks) {
        let tasks = req.user.tasks;
        tasks.forEach((task, index) => {
            if (task._id == req.body.id) {
                taskExist = true;
                task.task = req.body.updatedTask;
            }
        });
        if (taskExist) {
            req.user.save().then(() => {
                res.status(200).send("Task Updated");
            }).catch((e) => {
                res.status(500).send("Internal error");
            })
        }
        else {
            res.status(200).send("Task not exist");
        }
    }
    else {
        res.send("Task not exist");
    }
});

// Get tasks

app.get("/getTasks", isLogIn, isVerified, getUser, async (req, res) => {
    if (req.user.tasks) {
        res.send(req.user.tasks);
    }
    else {
        res.send("Task not exist");
    }

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
            res.send("http://localhost:5000/resetPassword/" + token)
        }).catch((e) => {
            console.log(e);
            res.status(500).send("Some problem occured")
        });
    }
    else {
        res.send("user not exist");
    }
});

//Reset password

app.post("/resetPassword/:token", async (req, res) => {
    const foundUser = await User.findOne({ "token.key": req.params.token });
    if (foundUser) {
        const dateNow = new Date();
        const expiryDate = new Date(foundUser.token.expiry);
        if (dateNow <= expiryDate) {
            foundUser.password = req.body.password;
            foundUser.save().then(() => {
                res.send("pasword changed");
            }).catch((e) => {
                res.status(500).send(e);
            })
        }
        else {
            res.status(400).send("token expired");
        }
    }
    else {
        res.send("Invalid token");
    }

});

// listening on port

app.listen(port, () => {
    console.log("listening on port " + port);
})

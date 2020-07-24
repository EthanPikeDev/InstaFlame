const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = mongoose.model("User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/keys");
//import the secret jwt key
const requireLogin = require("../middleware/requireLogin");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      //insert API KEY here
    },
  })
);



/*
//protected route when user is logged in
router.get('/protected',requireLogin, (req, res)=> {
  res.send("hello user")
})
*/

//Route for signup
router.post("/signup", (req, res) => {
  const { name, email, password, pic } = req.body;
  if (!email || !password || !name) {
    return res.status(422).json({ error: "please enter all fields" });
  }
  //query database to check if there is already a user in the database with the email
  User.findOne({ email: email })
    .then((savedUser) => {
      if (savedUser) {
        return res
          .status(422)
          .json({ error: "user already exists with that email" });
      }

      //Create new user if the email does not exist already in the database
      bcrypt.hash(password, 12).then((hashedpassword) => {
        const user = new User({
          email,
          password: hashedpassword,
          name,
          pic,
        });
        //log if the user is saved in the database successfully
        user
          .save()
          .then((user) => {
            //use nodemailer transporter to send the following mail to user upon successfull sign up
            transporter.sendMail({
              to: user.email,
              from: "No-Reply@instaflame.com",
              subject: "InstaFlame Sign Up",
              html: "<h1>Welcome to InstaFlame</h1>",
            });
            res.json({ message: "saved successfully" });
          })
          .catch((err) => {
            console.log(err);
          });
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

//Route for signin
router.post("/signin", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(422).json({ error: "please provide email or password" });
  }
  User.findOne({ email: email }).then((savedUser) => {
    if (!savedUser) {
      return res.status(422).json({ error: "Invalid Email or Password" });
    }
    bcrypt
      .compare(password, savedUser.password)
      .then((doMatch) => {
        if (doMatch) {
          //res.json({message:"successfully signed in"})
          //recieve jsonwebtoken upon login
          const token = jwt.sign({ _id: savedUser._id }, JWT_SECRET);
          const { _id, name, email, followers, following, pic } = savedUser;
          res.json({
            token,
            user: { _id, name, email, followers, following, pic },
          });
        } else {
          return res.status(422).json({ error: "Invalid Email or Password" });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });
});

module.exports = router;

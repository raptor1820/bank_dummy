const express = require("express");
const app = express();
const env = require("dotenv");
const mongoose = require("mongoose");
const user = require("./models/usermodel.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

app.use(cookieParser());
app.use(express.json());
env.config({
  path: "./config.env",
});
app.set("view engine", "ejs");
var secret = process.env.secret;

mongoose
  .connect(process.env.url, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("connected to database");
  })
  .catch((error) => {
    console.log(error);
  });

app.get("/admin", async (req, res) => {
  var user_list = await user.find({ approved: false });
  var approved_user = await user.find({ approved: true });
  res.render("admin", { user_list, approved_user });
});
app.get("/", (req, res) => {
  res.render("signup");
});
app.get("/approve/:id", async (req, res) => {
  var id = req.params.id;
  var approve_user = await user.findOneAndUpdate(
    { _id: id },
    { approved: true }
  );
  res.redirect("/admin");
});

app.get("/delete/:id", async (req, res) => {
  var id = req.params.id;
  var approve_user = await user.findOneAndDelete({ _id: id });
  res.redirect("/admin");
});

app.get("/reject/:id", async (req, res) => {
  var id = req.params.id;
  var approve_user = await user.findOneAndUpdate(
    { _id: id },
    { approved: false }
  );
  res.redirect("/admin");
});
app.post("/login", async (req, res) => {
  var { email, password } = req.body;

  if (!email || !password) {
    res.json({ code: 404, message: "please enter both email and password" });
  } else {
    var tempUser = await user.find({ email: email });

    if (tempUser.length == 0) {
      res.json({ code: 404, message: "email or password is incorrect" });
    } else {
      let result = await bcrypt.compare(password, tempUser[0].password);
      if (result) {
        if (tempUser[0].approved) {
          let token = await jwt.sign({ id: tempUser[0]._id }, secret);
          res.cookie("jwt", token, {
            maxAge: 15000,
            httpOnly: true,
          });
          res.json({ code: 200, message: "login successful", link: "home" });
        } else {
          res.json({ code: 200, message: "login successful", link: "pending" });
          let token = await jwt.sign({ id: tempUser[0]._id }, secret);
          res.cookie("jwt", token, {
            maxAge: 15000,
            httpOnly: true,
          });
        }
      } else {
        res.json({ code: 404, message: "email or password is incorrect" });
      }
    }
  }
});

app.post("/signup", async (req, res) => {
  var email = await user.find({ email: req.body.email });
  if (email.length > 0) {
    res.json({ message: "unsuccessful" });
    return -1;
  }
  var password = await bcrypt.hash(req.body.password, 10);
  const tempUser = new user({
    firstname: req.body.fn,
    lastname: req.body.ln,
    email: req.body.email,
    password: password,
    approved: false,
  });
  tempUser
    .save()
    .then((data) => {})
    .catch((error) => {
      console.log(error);
    });

  res.json({
    message: "successful",
  });
});

async function auth(req, res, next) {
  var token = req.cookies.jwt;
  try {
    var verify = await jwt.verify(token, secret);
    var find = await user.find({ _id: verify.id });
    if (find.length == 1) {
      next();
    } else {
      res.redirect("/");
    }
  } catch (error) {
    res.redirect("/");
  }
}
app.use(auth);

app.get("/home", (req, res) => {
  res.render("home");
});

app.get("/pending", (req, res) => {
  res.render("about");
});
app.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  res.redirect("/");
});

app.listen(process.env.PORT, (error) => {
  if (error) console.log("error");
  else console.log("connected to server");
});

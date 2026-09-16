const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwtToken = require("jsonwebtoken");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./userSchema");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let database;

const initialiseDbAndStartServer = async () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("Mongo DB Connected successfully");
    })
    .catch((err) => {
      console.log("MongoError:", err);
    });

  app.listen(5000, (err) => {
    if (err) {
      console.log("Error:", err);
    } else {
      console.log("Server running at http://localhost:5000");
    }
  });
};

initialiseDbAndStartServer();

app.post("/register", async (request, response) => {
  const { username, email, password, mobileNo } = request.body;
  console.log(request.body);

  if (username === "" || email === "" || password === "" || mobileNo === "") {
    response.status(400);
    response.send({ err_msg: "All Fields Are Reuired" });
  } else {
    // const getUserQuery = `select * from user where username='${username}';`;
    const dbUser = await User.findOne({ username: username });

    if (dbUser) {
      response.status(400);
      response.send({ err_msg: "User Already Exist" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    // const addUserQuery = `INSERT INTO user (username, email, password, mobile_no) values ('${username}', '${email}', '${hashedPassword}', '${mobileNo}');`;
    // await database.run(addUserQuery);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      mobileNo,
    });

    await newUser.save();
    response.status(200);
    response.send({ message: "User Added Successfully" });
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  console.log(request.body);

  // const getDbUser = `select * from user where username = '${username}';`;

  const dbUser = await User.findOne({ username: username });

  if (dbUser) {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const jwt_token = jwtToken.sign(
        { username: username },
        "JWT_ACCESS_TOKEN",
      );
      response.send({ jwt_token, username });
    } else {
      response.status(400);
      response.send({ err_msg: "Invalid Username or Password" });
    }
  } else {
    response.status(400);
    response.send({ err_msg: "Invalid User Credentials" });
  }
});

module.exports = app;

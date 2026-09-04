const express = require("express");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const cors = require("cors");
const path = require("path");
const jwtToken = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

let database;

const initialiseDbAndStartServer = async () => {
  database = await open({
    filename: path.join(__dirname, "usersData.db"),
    driver: sqlite3.Database,
  });

  console.log(path.join(__dirname, "usersData.db"));

  app.listen(5000, (err) => {
    if (err) {
      console.log("Error:", err);
    } else {
      console.log(
        "Connected to Database and Server running at http://localhost:5000",
      );
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
    const getUserQuery = `select * from user where username='${username}';`;
    const dbUser = await database.get(getUserQuery);

    if (dbUser === undefined) {
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log(hashedPassword);
      const addUserQuery = `INSERT INTO user (username, email, password, mobile_no) values ('${username}', '${email}', '${hashedPassword}', '${mobileNo}');`;
      await database.run(addUserQuery);
      response.status(200);
      response.send({ message: "User Added Successfully" });
    } else {
      response.status(400);
      response.send({ err_msg: "User Already Exist" });
    }
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  console.log(request.body);

  const getDbUser = `select * from user where username = '${username}';`;

  const dbUser = await database.get(getDbUser);

  if (dbUser === undefined) {
    response.status(400);
    response.send({ err_msg: "Invalid User Credentials" });
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const jwt_token = jwtToken.sign(
        { username: username },
        "JWT_ACCESS_TOKEN",
      );
      response.send({ jwt_token });
    } else {
      response.status(400);
      response.send({ err_msg: "Invalid Username or Password" });
    }
  }
});

module.exports = app;

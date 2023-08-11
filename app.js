const express = require("express");
const path = require("path");

const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const toCheck = (length) => {
  return length > 4;
};

//TO register user//
app.post("/register", async (request, response) => {
  const userInfo = request.body;
  const { username, name, password, gender, location } = userInfo;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userData = `
    SELECT * FROM user WHERE username='${username}';`;
  const userDetails = await db.get(userData);
  const lenPassword = password.length;
  if (userDetails === undefined) {
    if (toCheck(lenPassword)) {
      const queryResults = `
            INSERT INTO user
            (username,name,password,gender,location)
            VALUES
            ('${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}');`;

      await db.run(queryResults);

      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//TO login user//
app.post("/login", async (request, response) => {
  const userInfo = request.body;
  const { username, password } = userInfo;
  const userData = `
    SELECT * FROM user WHERE username='${username}';`;
  const userDetails = await db.get(userData);
  if (userDetails === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      userDetails.password
    );
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
//TO CHANGE PASSWORD//

app.put("/change-password", async (request, response) => {
  const userInfo = request.body;
  const { username, oldPassword, newPassword } = userInfo;
  const lenNewPassword = newPassword.length;
  const userData = `
    SELECT * FROM user WHERE username='${username}';`;
  const userDetails = await db.get(userData);
  if (userDetails === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );
    if (isPasswordMatched === true) {
      if (toCheck(lenNewPassword)) {
        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        const updateData = `
            UPDATE user
            SET 
            password='${newHashedPassword}'
            WHERE username='${username}';`;
        const updateDataTable = await db.run(updateData);
        response.status(200);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const PORT = process.env.PORT || 5000; //for deploy so heroku can choose which port to use
//import the secret key from keys, this will not be included in github
const { MONGOURI } = require("./config/keys");

//use mongoose to connect to the database
//pass in url parser and topology to get rid of
//deprecation errora
mongoose.connect(MONGOURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//Log the successfull connection
mongoose.connection.on("connected", () => {
  console.log("connected to mongoDB");
});

//Log the error connecting to the database
mongoose.connection.on("error", () => {
  console.log("error connecting to mongodb", err);
});

//Require the user schema or model
require("./models/user");
require("./models/post");
app.use(express.json());
//require the auth from routes
app.use(require("./routes/auth"));
app.use(require("./routes/post"));
app.use(require("./routes/user"));

//If in production, serve the static build files
if (process.env.NODE_ENV == "production") {
  app.use(express.static("client/build"));
  const path = require("path");
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

//define port to listen on
app.listen(PORT, () => {
  console.log("server is running on ", PORT);
});

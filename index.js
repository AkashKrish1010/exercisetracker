const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require("mongoose");
const dotenv = require('dotenv').config()

app.use(express.json());
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(express.urlencoded({ extended: false }))
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Schemas
const exerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: String,
});

const userSchema = new mongoose.Schema({
  username: String,
  exercises: [exerciseSchema],
});

const User = mongoose.model("User", userSchema);


app.post("/api/users", async (req, res) => {
  const { username } = req.body;
  const user = new User({ username });
  await user.save();
  res.json({ username: user.username, _id: user._id }); 
});


app.get("/api/users", async (req, res) => {
  const users = await User.find({}, "_id username"); 
  res.json(users);
});

//  Route to add exercise
app.post("/api/users/:_id/exercises", async (req, res) => {
  const { description, duration, date } = req.body;
  const user = await User.findById(req.params._id);
  if (!user) {
    return res.json({ error: "User not found" });
  }

  const newExercise = {
    description,
    duration: Number(duration),
    date: date ? new Date(date).toDateString() : new Date().toDateString(),
  };
  user.exercises.push(newExercise);
  await user.save();

  res.json({
    _id: user._id,
    username: user.username,
    description: newExercise.description,
    duration: newExercise.duration,
    date: newExercise.date,
  }); 
});


app.get("/api/users/:_id/logs", async (req, res) => {
  const { from, to, limit } = req.query;

  const user = await User.findById(req.params._id);
  if (!user) {
    return res.json({ error: "User not found" }); 
  }

  let log = user.exercises;

 
  if (from) {
    const fromDate = new Date(from);
    log = log.filter((entry) => new Date(entry.date) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    log = log.filter((entry) => new Date(entry.date) <= toDate);
  }

  
  if (limit) {
    log = log.slice(0, Number(limit));
  }

  res.json({
    _id: user._id,
    username: user.username,
    count: log.length,
    log: log,
  }); 
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

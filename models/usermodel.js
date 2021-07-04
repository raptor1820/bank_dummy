const mongoose = require("mongoose");
var userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  approved: {
    type: Boolean,
    required: true,
  },
});

var userModel = mongoose.model("bank", userSchema);

module.exports = userModel;

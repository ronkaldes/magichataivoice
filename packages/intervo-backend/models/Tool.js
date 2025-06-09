const mongoose = require("mongoose");

const toolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  schema: {
    type: String,
    required: true,
  },
  authorizationMethod: {
    type: {
      authorizationType: {
        type: String,
        enum: ["none", "apikey"]
      },
      authType: {
        type: String,
        enum: ["basic", "bearer", "custom"],
      },
      key: String,
      value: String,
    },
    required: true,
  },
  tags: {
    type: [String]
  },
  privacyPolicy: {
    type: String,
    required: true,
  },
  disclaimer: {
    type: String,
    required: true,
  },
});

toolSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Tool = mongoose.model("Tool", toolSchema);

module.exports = Tool;

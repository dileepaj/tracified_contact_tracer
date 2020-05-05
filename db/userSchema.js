const mongoose = require('mongoose');

const Schema = mongoose.Schema;
 
const user = new Schema({
    firstName: String,
    lastName: String,
    PSID: String,
    tenantId: String,
    lastLoggedIn: Date,
    lastAnsweredTimestamp: Date,
    answers: mongoose.Schema.Types.Mixed,
    startOverInitiated: {
        default: true,
        type: Boolean,
    },
});

const UserSchema = mongoose.model("User", user);
module.exports = UserSchema;
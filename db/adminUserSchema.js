const mongoose = require('mongoose');

const Schema = mongoose.Schema;
 
const adminUser = new Schema({
    firstName: String,
    lastName: String,
    PSID: String,
    tenantId: String,
    token: String,
    lastLoggedIn: Date,
    username: String,
    password: String
});

const AdminUserSchema = mongoose.model("AdminUser", adminUser);
module.exports = AdminUserSchema;
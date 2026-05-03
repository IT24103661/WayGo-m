const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const User = require('./models/User');
    const user = await User.findOne({});
    if (user) {
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        console.log("TOKEN:", token);
    } else {
        console.log("No users found");
    }
    process.exit(0);
});

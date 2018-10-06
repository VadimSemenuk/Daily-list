const LocalStrategy = require('passport-local');
const bcrypt = require("bcryptjs");

module.exports = (usersRep) => (
    new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
            session: false
        },
        async (email, password, done) => {           
            const user = await usersRep.getUserByField("email", email);
            if (!user) {
                return done(null, false, {message: "User with this email hasn't registered"});
            }
            if (!bcrypt.compareSync(password, user.password)) {
                return done(null, false, {message: 'Invalid password'});
            }
            return done(null, user);
        }
    )
)
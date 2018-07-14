const router = require('express-promise-router')();
const config = require("../config");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

module.exports = function (authRep) {  
    router.post('/sign-in', async (req, res, next) => {
        passport.authenticate('local', async (err, user) => {
			if (user == false) {
			
			} else {
				const payload = {
					id: user.id
				};
				const token = jwt.sign(payload, config.jwtSecret);
				res.json({
					...payload,
					...user,
					token: `Bearer ${token}`
				});
			}
		})(req, res, next);
    });

    router.post('/sign-up', async (req, res, next) => {
        const id = await authRep.createUser({
          	...req.body,
          	password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(4))
		})
		const payload = {
			id
		};
		const token = jwt.sign(payload, config.jwtSecret);
		res.json({
			...payload,
			token: `Bearer ${token}`
		});
    });

    return router
}
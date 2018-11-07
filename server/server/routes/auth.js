const router = require('express-promise-router')();
const config = require("../config");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {OAuth2Client} = require('google-auth-library');

const client = new OAuth2Client(config.webClientId);

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
	
    router.post('/sign-in-google', async (req, res, next) => {
		const ticket = await client.verifyIdToken({
			idToken: req.body.idToken,
		}).catch((err) => {
			console.log(err);
			return null;
		})
		if (!ticket) {
			res.status(500);
			res.end();
		}

		const payload = ticket.getPayload();
		let user = await authRep.getUserByField("google_id", payload.sub);
		if (!user) {
			user = {
				id: null,
				name: payload.name,
				password: null,
				email: payload.email,
				google_id: payload.sub,
			}
			 let userId = await authRep.createUser(user);
			 user.id = userId;
		}

		const token = jwt.sign({
			id: user.id
		}, config.jwtSecret);

		res.json({
			id: user.id,
			email: user.email,
			name: user.name,
			picture: user.picture,
			token: `Bearer ${token}`
		});
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
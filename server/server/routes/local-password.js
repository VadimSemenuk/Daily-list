const router = require('express-promise-router')();
const md5 = require('md5');
const nodemailer = require('nodemailer');
const config = require("../config");

module.exports = function () {
    router.post('/reset', async (req, res, next) => {
        let lang = req.body.lang;

        let newPassword = Math.random().toString(36).slice(-8);

        let subject = "";
        let text = "";
        switch (lang) {
            case "ru": {
                subject = "Сбросс пароля в приложении Ежедневник";
                text = "Ваш новый пароль в приложении Ежедневник: " + newPassword;
                break;
            }
            case "be": {
                subject = "Сбросс пароля ў дадатку Штодзённік";
                text = "Ваш новы пароль у дадатку Штодзённік: " + newPassword;
                break;
            }
            default: {
                subject = "Password reset in the Diary application";
                text = "Your new password in the Diary app: " + newPassword;
                break;
            }
        }

        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: config.smtpUsername,
                pass: config.smtpPassword
            }
        });

        await transporter.sendMail(
            {
                from: config.emailFrom,
                to: req.body.email,
                subject: subject,
                text: text,
            }
        );

        res.send(md5(newPassword));
    });

    return router
}
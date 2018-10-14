const router = require('express-promise-router')();
let config = require('../config');
let axios = require('axios');

module.exports = function (reportRep) {  
    router.post('/message', (req, res, next) => {
        if (!req.body.message || !req.body.message.text) {
            res.end();
            return;
        }
        let chatId = req.body.message.chat.id;
        let message = req.body.message.text;
        let normalizedMessage = message.trim().toLowerCase();
        let period = normalizedMessage.split("-")[1] || "today";

        reportRep.logsReport(period).then((result) => {
            let text = 
            `Total ${period} loads: ${result.total_loads}
            Avarage ${period} loads count ${result.avarage_load_count}`;

            axios.post(
                `https://api.telegram.org/bot${config.telegramToken}/sendMessage`, 
                {
                    chat_id: chatId,
                    text
                }
            );
            res.end();
        })
    });

    return router
}
const aws = require('aws-sdk');

module.exports.send = function(data) {
    let ses = new aws.SES();

    let charset = "UTF-8";

    let params = {
        Source: data.from,
        Destination: {
            ToAddresses: data.to,
        },
        Message: {
            Subject: {
                Data: data.subject,
                Charset: charset
            },
            Body: {
                Text: {
                    Data: data.text,
                    Charset: charset
                },
                Html: {
                    Data: data.text,
                    Charset: charset
                }
            }
        },
    };

    return new Promise((resolve, reject) => {
        ses.sendEmail(params, function(err, data) {
            if(err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}
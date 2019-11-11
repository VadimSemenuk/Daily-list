const ENV = process.env.NODE_ENV || 'DEVELOPMENT';

const config = {
    DEVELOPMENT: {
        db: {
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_DATABASE || 'dbname',
            password: process.env.DB_PASSWORD || '1234',
            port: process.env.DB_PORT || '5432'
        },
        jwtSecret: process.env.JWT_SECRET || '$doyoureallywannaknow',
        webClientId: process.env.WEB_CLIENT_ID || "390152836612-5rcub6svcoico5lterd17i6fog3pg9lg.apps.googleusercontent.com",
        httpPort: process.env.HTTP_PORT || '3001',
        httpsPort: process.env.HTTPS_PORT || '3001',
        allowHttps: process.env.ALLOW_HTTPS || 'false',
        sslKeyPath: process.env.SSL_KEY_PATH,
        sslCertPath: process.env.SSL_CERT_PATH,
        smtpUsername: process.env.SMTP_USERNAME,
        smtpPassword: process.env.SMTP_PASSWORD,
        emailFrom: process.env.EMAIL_FROM,
    },
};

module.exports = config[ENV];
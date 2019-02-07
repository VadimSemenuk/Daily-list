class CustomError extends Error {
    constructor(message, description) {
        super(message);
        Error.captureStackTrace(this, CustomError);

        this.description = description;
    }
}

export default CustomError;
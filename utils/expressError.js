// Error with an HTTP status code. Thrown in controllers, caught by the handler in app.js.
class ExpressError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

module.exports = ExpressError;

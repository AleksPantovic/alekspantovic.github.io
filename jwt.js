const jwt = require('jsonwebtoken');

module.exports = {
    decode: (token) => {
        let decodedToken = jwt.decode(token, { complete: true });
        return decodedToken;
    }
};

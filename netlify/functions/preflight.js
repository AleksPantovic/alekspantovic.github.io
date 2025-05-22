// UNUSED FUNCTION: This Netlify function is not used by the current plugin logic.
// To enable later, uncomment the code below.
/*
exports.handler = async (event, context) => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
                'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Requested-With',
                'Access-Control-Allow-Credentials': 'true',
            },
        };
    }

    return {
        statusCode: 405,
        body: 'Method Not Allowed',
    };
};
*/

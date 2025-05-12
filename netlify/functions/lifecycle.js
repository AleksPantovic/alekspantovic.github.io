const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
    jwksUri: 'https://certificates.plugins.coyoapp.com/.well-known/jwks.json'
});

exports.handler = async (event) => {
    try {
        const { path } = event;
        const body = JSON.parse(event.body || '{}');
        console.log(`Received lifecycle event: ${path}`);
        console.log('Event Body:', body);

        if (path.endsWith('/install')) {
            // Handle install event
            console.log('Processing install event...');
            return {
                statusCode: 201,
                body: JSON.stringify({ message: 'Plugin installed successfully' }),
            };
        } else if (path.endsWith('/uninstall')) {
            // Handle uninstall event
            console.log('Processing uninstall event...');
            return {
                statusCode: 201,
                body: JSON.stringify({ message: 'Plugin uninstalled successfully' }),
            };
        } else if (path.endsWith('/instance_add')) {
            // Handle instance add event
            console.log('Processing instance add event...');
            return {
                statusCode: 201,
                body: JSON.stringify({ message: 'Instance added successfully' }),
            };
        } else if (path.endsWith('/instance_remove')) {
            // Handle instance remove event
            console.log('Processing instance remove event...');
            return {
                statusCode: 201,
                body: JSON.stringify({ message: 'Instance removed successfully' }),
            };
        } else if (path.endsWith('/access_token')) {
            // Handle access token event
            console.log('Processing access token event...');
            return {
                statusCode: 201,
                body: JSON.stringify({ message: 'Access token processed successfully' }),
            };
        } else {
            console.error('Unknown lifecycle event');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Unknown lifecycle event' }),
            };
        }
    } catch (error) {
        console.error('Error processing lifecycle event:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
        };
    }
};

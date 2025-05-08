export default async (request, context) => {
    // Exclude /manifest.json from CORS headers
    if (request.url.endsWith('/manifest.json')) {
        return context.next();
    }

    const response = await context.next();
    return new Response(response.body, {
        ...response,
        headers: {
            ...response.headers,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
            'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Requested-With',
            'Access-Control-Allow-Credentials': 'true',
        },
    });
};

export const config = {
    path: '/*', // Apply to all paths except /manifest.json
};

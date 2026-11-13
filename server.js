const http = require('http');
const url = require('url');
const postManager = require('./postManager');

const PORT = 3000;

function sendJson(response, status, data) {
    response.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
    });
    response.end(JSON.stringify(data));
}

function parseJsonBody(request, callback) {
    let body = '';
    request.setEncoding('utf8');

    request.on('data', (chunk) => {
        body += chunk;
    });

    request.on('end', () => {
        let data;
        try {
            data = JSON.parse(body);
        } catch (error) {
            return callback(error);
        }

        if (data === null || typeof data !== 'object' || Array.isArray(data)) {
            return callback(new Error('Un objet JSON est attendu'));
        }

        callback(null, data);
    });
}

function sendResult(response, successStatus) {
    return (error, data) => {
        if (error) {
            console.error(error);
            return sendJson(response, 500, { error: 'Erreur serveur' });
        }

        if (data === null) {
            return sendJson(response, 404, { error: 'Publication introuvable' });
        }

        sendJson(response, successStatus, data);
    };
}

const server = http.createServer((request, response) => {
    const { pathname } = url.parse(request.url, true);
    const method = request.method;
    const postRoute = /^\/api\/posts\/(\d+)$/.exec(pathname);

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
        response.writeHead(204);
        return response.end();
    }

    if (pathname === '/api/posts' && method === 'GET') {
        return postManager.getAllPosts(sendResult(response, 200));
    }

    if (postRoute && method === 'GET') {
        return postManager.getPost(postRoute[1], sendResult(response, 200));
    }

    if (pathname === '/api/posts' && method === 'POST') {
        return parseJsonBody(request, (error, post) => {
            if (error) {
                return sendJson(response, 400, { error: 'Objet JSON invalide' });
            }

            postManager.insertPost(post, sendResult(response, 201));
        });
    }

    if (postRoute && method === 'PUT') {
        return parseJsonBody(request, (error, post) => {
            if (error) {
                return sendJson(response, 400, { error: 'Objet JSON invalide' });
            }

            postManager.updatePost(postRoute[1], post, sendResult(response, 200));
        });
    }

    if (postRoute && method === 'DELETE') {
        return postManager.deletePost(postRoute[1], sendResult(response, 200));
    }

    sendJson(response, 404, { error: 'Route non trouvée' });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`Serveur API démarré sur http://localhost:${PORT}`);
});
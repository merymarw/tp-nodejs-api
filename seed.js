const https = require('https');
const fs = require('fs');

const API_URL = 'https://jsonplaceholder.typicode.com/posts';

function fetchPosts() {
    https.get(API_URL, (response) => {
        if (response.statusCode !== 200) {
            console.error(`Erreur HTTP ${response.statusCode}`);
            response.resume();
            process.exitCode = 1;
            return;
        }

        let data = '';
        response.setEncoding('utf8');

        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            try {
                const posts = JSON.parse(data);
                savePosts(posts);
            } catch (error) {
                console.error('Réponse JSON invalide :', error.message);
                process.exitCode = 1;
            }
        });

        response.on('error', (error) => {
            console.error('Erreur de lecture de la réponse :', error.message);
            process.exitCode = 1;
        });
    }).on('error', (error) => {
        console.error('Erreur de connexion :', error.message);
        process.exitCode = 1;
    });
}

function savePosts(posts) {
    fs.writeFile('posts.json', JSON.stringify(posts, null, 2), 'utf8', (error) => {
        if (error) {
            console.error('Erreur de sauvegarde :', error.message);
            process.exitCode = 1;
            return;
        }

        console.log(`${posts.length} publications enregistrées dans posts.json.`);
    });
}

fetchPosts();
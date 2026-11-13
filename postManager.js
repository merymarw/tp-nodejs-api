const fs = require('fs');
const path = require('path');

const POSTS_FILE = path.join(__dirname, 'posts.json');

function getAllPosts(callback) {
    fs.readFile(POSTS_FILE, 'utf8', (error, data) => {
        if (error) {
            return callback(error);
        }

        let posts;
        try {
            posts = JSON.parse(data);
        } catch (parseError) {
            return callback(parseError);
        }

        callback(null, posts);
    });
}

function getPost(id, callback) {
    getAllPosts((error, posts) => {
        if (error) {
            return callback(error);
        }

        const post = posts.find((post) => post.id === Number(id));
        callback(null, post ?? null);
    });
}

function savePosts(posts, callback) {
    fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8', callback);
}

// Exécute les modifications une par une pour éviter de perdre des changements.
let pendingWrite = Promise.resolve();

function changePosts(change, callback) {
    const operation = pendingWrite.then(() => new Promise((resolve, reject) => {
        getAllPosts((error, posts) => {
            if (error) {
                return reject(error);
            }

            const result = change(posts);
            if (result === null) {
                return resolve(null);
            }

            savePosts(posts, (error) => {
                if (error) {
                    return reject(error);
                }

                resolve(result);
            });
        });
    }));

    pendingWrite = operation.catch(() => {});
    operation.then((result) => callback(null, result), callback);
}

function insertPost(newPost, callback) {
    changePosts((posts) => {
        const maxId = posts.reduce((max, post) => Math.max(max, post.id), 0);
        const post = { ...newPost, id: maxId + 1 };

        posts.push(post);
        return post;
    }, callback);
}

function updatePost(id, updatedPost, callback) {
    changePosts((posts) => {
        const index = posts.findIndex((post) => post.id === Number(id));
        if (index === -1) {
            return null;
        }

        const original = posts[index];
        const post = { ...original, ...updatedPost, id: original.id };

        posts[index] = post;
        return post;
    }, callback);
}

function deletePost(id, callback) {
    changePosts((posts) => {
        const index = posts.findIndex((post) => post.id === Number(id));
        if (index === -1) {
            return null;
        }

        const [deletedPost] = posts.splice(index, 1);
        return deletedPost;
    }, callback);
}

module.exports = {
    getAllPosts,
    getPost,
    insertPost,
    updatePost,
    deletePost,
};
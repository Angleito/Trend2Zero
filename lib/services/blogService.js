const { apiClient } = require('../api/apiClient');

async function getAllPosts() {
    try {
        const response = await apiClient.get('/api/blog');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        return [];
    }
}

async function getPostBySlug(slug) {
    try {
        const response = await apiClient.get(`/api/blog/${slug}`);
        return response.data.data;
    } catch (error) {
        console.error(`Error fetching blog post with slug ${slug}:`, error);
        return null;
    }
}

async function createPost(postData) {
    const response = await apiClient.post('/api/blog', postData);
    return response.data.data;
}

async function updatePost(id, postData) {
    const response = await apiClient.patch(`/api/blog/${id}`, postData);
    return response.data.data;
}

async function deletePost(id) {
    await apiClient.delete(`/api/blog/${id}`);
}

module.exports = {
    getAllPosts,
    getPostBySlug,
    createPost,
    updatePost,
    deletePost
}; 
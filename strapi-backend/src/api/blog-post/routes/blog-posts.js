module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/blog-posts',
      handler: 'blog-posts.find',
      config: {
        policies: []
      }
    },
    {
      method: 'GET',
      path: '/blog-posts/:id',
      handler: 'blog-posts.findOne',
      config: {
        policies: []
      }
    }
  ]
};
module.exports = {
  async find(ctx) {
    return await strapi.service('api::blog-posts.blog-posts').find(ctx.query);
  },
  async findOne(ctx) {
    const { id } = ctx.params;
    return await strapi.service('api::blog-posts.blog-posts').findOne(id, ctx.query);
  }
};
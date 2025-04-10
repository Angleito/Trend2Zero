module.exports = {
  async find(ctx) {
    return await strapi.service('api::blog-post.blog-post').find(ctx.query);
  },
  async findOne(ctx) {
    const { id } = ctx.params;
    return await strapi.service('api::blog-post.blog-post').findOne(id, ctx.query);
  }
};
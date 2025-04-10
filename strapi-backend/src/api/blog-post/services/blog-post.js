module.exports = {
  async find(params) {
    const { results, pagination } = await strapi.entityService.findMany('api::blog-post.blog-post', {
      ...params,
      populate: ['*']
    });
    return { results, pagination };
  },
  async findOne(id, params) {
    return await strapi.entityService.findOne('api::blog-post.blog-post', id, {
      ...params,
      populate: ['*']
    });
  }
};
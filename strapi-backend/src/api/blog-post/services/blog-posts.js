module.exports = {
  async find(params) {
    const { results, pagination } = await strapi.entityService.findMany('api::blog-posts.blog-posts', {
      ...params,
      populate: ['*']
    });
    return { results, pagination };
  },
  async findOne(id, params) {
    return await strapi.entityService.findOne('api::blog-posts.blog-posts', id, {
      ...params,
      populate: ['*']
    });
  }
};
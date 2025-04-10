module.exports = {
  async find(ctx) {
    return await strapi.service('api::historical-data.historical-data').find(ctx.query);
  },
  async findOne(ctx) {
    const { id } = ctx.params;
    return await strapi.service('api::historical-data.historical-data').findOne(id, ctx.query);
  }
};
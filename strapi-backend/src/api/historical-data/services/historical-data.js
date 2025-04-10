module.exports = {
  async find(params) {
    const { results, pagination } = await strapi.entityService.findMany('api::historical-data.historical-data', {
      ...params,
      populate: ['asset']
    });
    return { results, pagination };
  },
  async findOne(id, params) {
    return await strapi.entityService.findOne('api::historical-data.historical-data', id, {
      ...params,
      populate: ['asset']
    });
  }
};
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/historical-data-entries',
      handler: 'historical-data.find',
      config: {
        policies: []
      }
    },
    {
      method: 'GET',
      path: '/historical-data-entries/:id',
      handler: 'historical-data.findOne',
      config: {
        policies: []
      }
    }
  ]
};
'use strict';

module.exports = [
  {
    method: 'GET',
    path: '/mock-data',
    handler: 'mockIntegration.getMockData',
    config: {
      policies: [],
      auth: false,
    },
  },
  {
    method: 'POST',
    path: '/seed-mock-data',
    handler: 'mockIntegration.seedMockData',
    config: {
      policies: [],
      auth: {
        scope: ['admin::isAuthenticatedAdmin'],
      },
    },
  },
];

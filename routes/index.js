const router = require('express').Router();

const asyncMiddleware = require.main.require('./middleware/asyncMiddleware');
const utils = require.main.require('./utils');
const benchmark = require.main.require('./controllers/benchmark');

router.get('/', [
  asyncMiddleware(async (req, res, next) => {
    const coefficient = req.query.c || 1;
    const cpu = benchmark.cpuPerfTest(coefficient);
    const networkGithub = await benchmark.networkTestGithub(coefficient);
    return utils.apiResponse(res, {
      cpu,
      networkGithub,
    });
  }),
]);

const routes = (app) => {
  app.use('/', router);
};

module.exports = routes;

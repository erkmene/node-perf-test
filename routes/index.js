const router = require('express').Router();

const asyncMiddleware = require.main.require('./middleware/asyncMiddleware');
const utils = require.main.require('./utils');
const benchmark = require.main.require('./controllers/benchmark');

router.get('/', [
  asyncMiddleware(async (req, res, next) => {
    return utils.apiResponse(res, { hello: 'bye!' });
  }),
]);

router.get('/cpu', [
  asyncMiddleware(async (req, res, next) => {
    const coefficient = req.query.c || 1;
    const cpu = benchmark.cpuPerfTest(coefficient);
    return utils.apiResponse(res, cpu);
  }),
]);

router.get('/network-github', [
  asyncMiddleware(async (req, res, next) => {
    const coefficient = req.query.c || 1;
    const networkGithub = await benchmark.networkTestGithub(coefficient);
    return utils.apiResponse(res, networkGithub);
  }),
]);

router.get('/network-contentful', [
  asyncMiddleware(async (req, res, next) => {
    const coefficient = req.query.c || 1;
    const networkContentful = await benchmark.networkTestContentful(coefficient);
    return utils.apiResponse(res, networkContentful);
  }),
]);

router.get('/network-internal', [
  asyncMiddleware(async (req, res, next) => {
    const coefficient = req.query.c || 1;
    const networkInternal = await benchmark.networkTestInternal(coefficient);
    return utils.apiResponse(res, networkInternal);
  }),
]);

const routes = (app) => {
  app.use('/', router);
};

module.exports = routes;

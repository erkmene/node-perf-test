const axios = require('axios');

const MODIFIERS = {
  CPU: 10000,
  NETWORK_GITHUB: 10,
  NETWORK_INTERNAL: 10,
  NETWORK_CONTENTFUL: 10,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fib = (n) => {
  if (n < 2) {
    return BigInt(1);
  }

  const prev = [BigInt(1), BigInt(1)];
  let result = prev[1];
  let i = 2;
  while (i < n) {
    result = prev[0] + prev[1];
    prev[0] = prev[1];
    prev[1] = result;
    i++;
  }
  return result;
};

const cpuPerfTest = (coefficient) => {
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  const nanoTimes = [];
  const iterations = Math.round(coefficient * MODIFIERS.CPU);
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    fib(5000);
    nanoTimes[i] = process.hrtime.bigint() - start;
  }
  const times = nanoTimes.map((time) => Number(time) / 1000000).sort();
  const total = times.reduce((acc, time) => acc + time);
  const average = total / times.length;
  const mean = times[Math.round(times.length / 2)];
  const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  return {
    // times,
    iterations,
    total,
    average,
    mean,
    startMemory,
    endMemory,
  };
};

const networkTest = async (url, iterations, data) => {
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  const nanoTimes = [];
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    await axios.get(url, data);
    nanoTimes[i] = process.hrtime.bigint() - start;
    await sleep(100);
  }
  const times = nanoTimes.map((time) => Number(time) / 1000000).sort();
  const total = times.reduce((acc, time) => acc + time);
  const average = total / times.length;
  const mean = times[Math.round(times.length / 2)];
  const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  return {
    // times,
    iterations,
    total,
    average,
    mean,
    startMemory,
    endMemory,
  };
};

const networkTestGithub = async (coefficient) => {
  const iterations = Math.round(coefficient * MODIFIERS.NETWORK_GITHUB);
  return networkTest(
    'https://gist.githubusercontent.com/kolyasademetrio/3679e8e2c2e2ed0a449270094bd6997d/raw/5fac5d71f17fce7fb2cd250712a1f2221d0e0bb7/bootstrap.css',
    iterations
  );
};

const networkTestContentful = async (coefficient) => {
  const iterations = Math.round(coefficient * MODIFIERS.NETWORK_CONTENTFUL);

  if (!process.env.NETWORK_CONTENTFUL_URL) {
    return 'Missing test URL';
  }

  return networkTest(process.env.NETWORK_CONTENTFUL_URL, iterations);
};

const networkTestInternal = async (coefficient) => {
  const iterations = Math.round(coefficient * MODIFIERS.NETWORK_INTERNAL);

  if (!process.env.NETWORK_INTERNAL_URL) {
    return 'Missing test URL';
  } else if (!process.env.NETWORK_INTERNAL_HEADERS) {
    return 'Missing test headers';
  }

  headers = JSON.parse(process.env.NETWORK_INTERNAL_HEADERS);
  return networkTest(process.env.NETWORK_INTERNAL_URL, iterations, { headers });
};

module.exports = {
  cpuPerfTest,
  networkTestGithub,
  networkTestInternal,
  networkTestContentful,
};

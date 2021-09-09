const axios = require('axios');
const fs = require('fs');
const ExcelJS = require('exceljs');

if (process.env.NODE_ENV && fs.existsSync(`./config/.env.${process.env.NODE_ENV}`)) {
  require('dotenv').config({
    path: `./config/.env.${process.env.NODE_ENV}`,
  });
}
let domains;

try {
  domains = JSON.parse(process.env.REPORT_DOMAINS);
} catch (err) {
  console.error('Report domains not found or invalid. Please provide them in the env vars.');
  process.exit();
}

const TESTS = [
  ['cpu', 1],
  ['network-internal', 3],
  ['network-github', 3],
  ['network-contentful', 3],
];

const ITERATIONS = 5;
const OUT_FILE_JSON = 'out.json';
const OUT_FILE_XLSX = 'out.xlsx';

const results = {};

const runTests = async () => {
  for (let i = 0; i < TESTS.length; i++) {
    const [test, testCoefficient] = TESTS[i];
    results[test] = {};
    for (let ii = 0; ii < domains.length; ii++) {
      const [env, domain] = domains[ii];
      const url = `${domain}/${test}/?c=${testCoefficient}`;
      results[test][env] = [];
      console.log(
        `Running test "${test}" on "${env}" with coefficient ${testCoefficient} for ${ITERATIONS} iterations:`
      );
      let total = 0;
      for (let iii = 0; iii < ITERATIONS; iii++) {
        const start = process.hrtime.bigint();
        try {
          const response = await axios.get(url);
          const time = Number(process.hrtime.bigint() - start) / 1000000000;
          total = total + time;
          results[test][env].push(response.data.data);
          console.log(`  Iteration ${iii + 1} took ${time} seconds.`);
        } catch (err) {
          results[test][env].push({ error: err.message });
          console.error(`  Iteration ${iii + 1} errored!`);
          console.error(`  Message: ${err.message}`);
        }
      }
      console.log(`    "${test}" on "${env}" took ${total} seconds.`);
    }
  }
  return results;
};

const limitDecimals = (num, limit = 3) => {
  const c = Math.pow(10, limit);
  return Math.round(num * c) / c;
};

const createReportExcel = async () => {
  const results = require(`${__dirname}/${OUT_FILE_JSON}`);
  const workbook = new ExcelJS.Workbook();

  workbook.creator = 'eerkmen@maark.com';
  workbook.created = new Date();
  const summary = workbook.addWorksheet('Summary');

  const runs = workbook.addWorksheet('Results');
  runs.addRow([
    'test',
    'env',
    'test iteration',
    'iterations in test',
    'total (ms)',
    'average (ms)',
    'median (ms)',
  ]);

  const totals = {};

  Object.keys(results).forEach((testKey) => {
    const test = results[testKey];
    totals[testKey] = {};
    Object.keys(test).forEach((envKey) => {
      const env = test[envKey];
      let total = 0;
      let average = 0;
      let median = [];
      totals[testKey][envKey] = {};
      env.forEach((iteration, index) => {
        total += iteration.total;
        average += iteration.average;
        median.push(iteration.median);
        runs.addRow([
          testKey,
          envKey,
          index + 1,
          iteration.iterations,
          limitDecimals(iteration.total),
          limitDecimals(iteration.average),
          limitDecimals(iteration.median),
        ]);
      });
      totals[testKey][envKey].total = total / env.length;
      totals[testKey][envKey].average = average / env.length;
      totals[testKey][envKey].median = median[Math.floor(median.length / 2)];
    });
  });

  let envs;

  Object.keys(totals).forEach((testKey) => {
    const test = totals[testKey];
    if (!envs) {
      envs = Object.keys(test);
      summary.addRow(
        ['test', 'env', 'total (ms)', 'average (ms)', 'median (ms)'].concat(
          envs.map((envName) => `times slower than ${envName}`)
        )
      );
    }
    envs.forEach((envKey) => {
      const env = test[envKey];
      const row = [testKey, envKey, env.total, env.average, env.median];
      envs.forEach((envKey2) => {
        const env2 = test[envKey2];
        const diff = limitDecimals(env.total / env2.total);
        row.push(diff === 1 ? '-' : diff);
      });
      summary.addRow(row);
    });
  });

  return workbook;
};

(async () => {
  if (fs.existsSync(OUT_FILE_JSON)) {
    console.log(
      `Data already exists from previous tests. Skipping the tests and generating report from that data. If you don't want them to be used, remove ${OUT_FILE_JSON}.`
    );
  } else {
    const results = await runTests();
    console.log(`Writing results to ${OUT_FILE_JSON}`);
    fs.writeFileSync(OUT_FILE_JSON, JSON.stringify(results, null, 2));
  }
  console.log(`Creating Excel workbook`);
  const workbook = await createReportExcel();
  console.log(`Writing workbook to ${OUT_FILE_XLSX}`);
  await workbook.xlsx.writeFile(OUT_FILE_XLSX);
  console.log(`Done. Have a nice day!`);
})();

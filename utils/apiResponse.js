const util = require('util'); // has no default export

const apiResponse = (res, data, statusCode, message) => {
  res.statusCode = statusCode || res.statusCode || 200;

  const response = {
    statusCode: res.statusCode,
    ok: res.statusCode === 200,
  };

  // Prevent creation of the attributes if the values are missing.
  if (data) response.data = data;
  if (message) response.message = message;

  return res.json(response);
};

// Changed parameter order is because `data` is mostly unnecessary for errors
const apiError = (res, message, statusCode, data = null) => {
  if (typeof message === 'object') {
    // To prevent circular JSONs.
    message = util.inspect(message);
  }
  return apiResponse(res, data, statusCode || 500, message);
};

module.exports = {
  apiResponse,
  apiError,
};

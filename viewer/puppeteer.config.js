/*!
 * Copyright 2022 Cognite AS
 */
const path = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer.
  cacheDirectory: path.join(__dirname, 'node_modules', 'puppeteer', '.cache')
};

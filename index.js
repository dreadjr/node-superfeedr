/**
 * node-superfeedr
 *
 * Install:
 *
 * ```bash
 * npm install node-superfeedr
 * ```
 *
 * Example:
 *
 * ```javascript
 * var superfeedr = require('node-superfeedr');
 * ```
 *
 * @module superfeedr
 */
module.exports = {
  Subscribers: {
    HttpClient: require('./lib/subscribers/http')
  }
};

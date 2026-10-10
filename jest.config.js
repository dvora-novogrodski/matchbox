// Editor test buttons run Jest from the repo root. Reuse the API config so those
// runs use ts-jest and select the unit or e2e project from the file path.
module.exports = require('./apps/api/jest.config.js');

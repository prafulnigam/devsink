// Create React App without ejecting, via CRACO.
const { WebpackDevSink } = require('devsink/webpack');

module.exports = {
  webpack: { plugins: { add: [new WebpackDevSink()] } },
};

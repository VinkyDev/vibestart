module.exports = {
  presets: ["babel-preset-expo"],
  // Hermes rejects the rest-parameter destructuring used by oRPC's client.
  plugins: ["@babel/plugin-transform-parameters"],
};

module.exports = {
  // Hermes rejects the rest-parameter destructuring used by oRPC's client.
  plugins: ["@babel/plugin-transform-parameters"],
  presets: ["babel-preset-expo"],
};

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated v4 moved its worklets transform into the
    // separate react-native-worklets package; its Babel plugin must be
    // listed last.
    plugins: ['react-native-worklets/plugin'],
  };
};

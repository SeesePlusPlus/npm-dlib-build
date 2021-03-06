const path = require('path')
const { isWin } = require('./lib/utils')

const rootDir = __dirname
const dlibRoot = path.join(rootDir, 'dlib')
const dlibSrc = path.join(dlibRoot, 'dlib')
const dlibBuild = path.join(dlibRoot, 'build')
const dlibLibDir = isWin() ? path.join(dlibBuild, 'dlib/Release') : path.join(dlibBuild, 'dlib')
const dlibLocalLib = isWin() ? path.join(dlibLibDir, 'dlib.lib') : path.join(dlibLibDir, 'libdlib.a')

module.exports = {
  rootDir,
  dlibRoot,
  dlibSrc,
  dlibBuild,
  dlibLocalLib,
  dlibLibDir
}
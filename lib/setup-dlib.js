const { exec, spawn, isWin } = require('./utils')
const findMsBuild = require('./find-msbuild')
const {
  rootDir,
  dlibRoot,
  dlibSrc,
  dlibBuild,
  dlibLocalLib
} = require('../constants')
const numCPUs = process.env.NUM_CPUS || require('os').cpus().length

function getIfExistsDirCmd(dirname, exists = true) {
  return isWin() ? `if ${!exists ? 'not ' : ''}exist ${dirname}` : ''
}

function getMkDirCmd(dirname) {
  return isWin() ? `${getIfExistsDirCmd(dirname, false)} mkdir ${dirname}` : `mkdir -p ${dirname}`
}

function getRmDirCmd(dirname) {
  return isWin() ? `${getIfExistsDirCmd(dirname)} rd /s /q ${dirname}` : `rm -rf ${dirname}`
}

function getMsbuildArgs() {
  return [
    './dlib/dlib.sln',
    '/p:Configuration=Release',
    '/p:Platform=x64'
  ]
}

function getRunBuildCmd() {
  if (isWin()) {
    return findMsBuild()
      .then(msbuild =>
        () => spawn(
          `${msbuild}`,
          getMsbuildArgs(),
          { cwd: dlibBuild }
        )
      )
  }
  return Promise.resolve(
      () => spawn('make', ['all', `-j${numCPUs}`], {cwd: dlibBuild}))
}

function getCmakeFlags() {
  const flags = [];

  if (isWin()) {
    flags = flags.concat([
      '-G',
      'Visual Studio 15 2017 Win64'
    ].concat(
      process.env.OPENBLAS_LIB_DIR
        ? [
          '-DDLIB_USE_BLAS=ON',
          `-DBLAS_Accelerate_LIBRARY=${process.env.OPENBLAS_LIB_DIR}\\libopenblas.lib`
        ]
        : []
    ))
  }

  if (process.env.DLIB_USE_CUDA) {
    flags.push(`-DDLIB_USE_CUDA=${process.env.DLIB_USE_CUDA}`)
  }

  if (process.env.USE_AVX_INSTRUCTIONS) {
    flags.push(`-DUSE_AVX_INSTRUCTIONS=${process.env.USE_AVX_INSTRUCTIONS}`)
  }

  if (process.env.CUDA_ARCH) {
    flags.push(`-DCUDA_ARCH=${process.env.CUDA_ARCH}`)
  }
}

function getCmakeArgs() {
  return [dlibSrc].concat(getCmakeFlags())
}

module.exports = function() {
  const repo = 'https://github.com/seeseplusplus/dlib.git'
  return getRunBuildCmd().then(runBuildCmd =>
    exec(getMkDirCmd('dlib'), { cwd: rootDir })
      .then(() => exec(getMkDirCmd('build'), { cwd: dlibRoot }))
      .then(() => exec(getRmDirCmd('dlib'), { cwd: dlibRoot }))
      .then(() => spawn('git', ['clone', '--progress', repo], { cwd: dlibRoot }))
      .then(() => spawn('git', ['checkout', 'vfr'], { cwd: dlibSrc }))
      .then(() => spawn('cmake', getCmakeArgs(), { cwd: dlibBuild }))
      .then(runBuildCmd)
  )
}
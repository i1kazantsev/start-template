const { src, dest, watch, series } = require('gulp')
const del = require('del')

const sass = require('gulp-sass')
const server = require('browser-sync').create()
const rename = require('gulp-rename')
const postcss = require('gulp-postcss')
const autoprefixer = require('autoprefixer')
const csso = require('gulp-csso')
const mqpacker = require('css-mqpacker')
const concat = require('gulp-concat')
const uglify = require('gulp-uglify-es').default
const svgstore = require('gulp-svgstore')
const svgmin = require('gulp-svgmin')
const tinypng = require('gulp-tinypng-compress')
const webp = require('gulp-webp')

const startServer = () => {
  server.init({
    server: 'build/',
    notify: false,
    open: false,
    // tunnel: true,
    // tunnel: 'demonstration'
  })

  watch('src/*.html', series(html, reload))
  watch('src/scss/**/*.scss', css)
  watch('src/js/**/*.js', series(js, reload))
  watch('src/img/**/*.svg', series(svg, reload))
}

const reload = (done) => {
  server.reload()
  done()
}

const html = () => {
  return src('src/*.html')
  .pipe(dest('build'))
}

const css = () => {
  return src('src/scss/style.scss')
  .pipe(sass().on('error', sass.logError))
  .pipe(postcss([
    autoprefixer(),
    mqpacker()
  ]))
  .pipe(csso())
  .pipe(rename({ suffix: '.min' }))
  .pipe(dest('build/css'))
  .pipe(server.stream())
}

const js = () => {
  return src('src/js/scripts.js')
  .pipe(concat('scripts.js'))
  .pipe(rename({ suffix: '.min' }))
  .pipe(dest('build/js'))
}

const jsBuild = () => {
  return src('build/js/scripts.min.js')
  .pipe(uglify())
  .pipe(dest('build/js'))
}

const generateWebp = () => {
  return src([
    'build/img/**/*.{jpg,png}',
    '!build/img/manifest/**'
  ])
  .pipe(webp())
  .pipe(dest('build/img'))
}

const createSprite = () => {
  return src('src/img/sprite/*.svg')
  .pipe(svgstore({ inlineSvg: true }))
  .pipe(svgmin({ plugins: [{ cleanupIDs: false }] }))
  .pipe(rename('sprite.svg'))
  .pipe(dest('build/img'))
}

const svgMin = () => {
  return src(['src/img/**/*.svg', '!src/img/sprite/**'])
  .pipe(svgmin({ plugins: [{ cleanupIDs: false }] }))
  .pipe(dest('build/img'))
}

const svg = series(createSprite, svgMin)

// get key: https://tinypng.com/
const imageMin = () => {
  return src('src/img/**/*.{jpg,png}')
  .pipe(tinypng({
    key: '#',
    sigFile: '.tinypng-sigs'
  }))
  .pipe(dest('build/img'))
}

const clean = () => del('build')

const copy = () => {
  return src(
    [
      'src/fonts/**/*.{woff,woff2}',
      'src/img/**/*.{jpg,png}'
    ],
    { base: 'src' }
  )
  .pipe(dest('build'))
}

exports.dev = series(clean, copy, generateWebp, svg, html, css, js, startServer)
exports.build = series(clean, copy, generateWebp, imageMin, svg, html, css, js, jsBuild)

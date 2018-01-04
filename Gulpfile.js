var gulp = require('gulp');
var environments = require('gulp-environments');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var mq4HoverShim = require('mq4-hover-shim');
var rimraf = require('rimraf').sync;
var cssnano = require('gulp-cssnano');
var browser = require('browser-sync');
var panini = require('panini');
var validator = require('gulp-html');
var bootlint  = require('gulp-bootlint');
var concat = require('gulp-concat');
var scsslint = require('gulp-scss-lint');
var port = process.env.SERVER_PORT || 8080;
var development = environments.development;
var production = environments.production;
var bowerpath = process.env.BOWER_PATH || 'bower_components/';
var node_modules_path = 'node_modules/';


// Starts a BrowerSync instance
gulp.task('server', ['build'], function(){
  browser.init({server: './_site', port: port});
});

// Watch files for changes
gulp.task('watch', function() {
  gulp.watch('scss/**/*', ['compile-sass', browser.reload]);
  gulp.watch('html/pages/**/*', ['compile-html']);
  gulp.watch(['./html/{layouts,includes,helpers,data}/**/*'], ['compile-html:reset','compile-html']);
});

// Erases the dist folder
gulp.task('clean', function() {
  rimraf('_site');
});

// Copy assets
gulp.task('copy', function() {
  gulp.src(['assets/**/*']).pipe(gulp.dest('_site'));
});

var sassOptions = {
  errLogToConsole: true,
  outputStyle: 'expanded',
  //includePaths: bowerpath
  includePaths: node_modules_path
};

gulp.task('compile-sass', function () {
    var processors = [
        mq4HoverShim.postprocessorFor({ hoverSelectorPrefix: '.bs-true-hover ' }),
        autoprefixer({
            browsers: [
              "Chrome >= 45",
              "Firefox ESR",
              "Edge >= 12",
              "Explorer >= 10",
              "iOS >= 9",
              "Safari >= 9",
              "Android >= 4.4",
              "Opera >= 30"
            ]
          })
    ];
    return gulp.src('./scss/app.scss')
        .pipe(development(sourcemaps.init()))
        .pipe(sass(sassOptions).on('error', sass.logError))
        .pipe(postcss(processors))
        .pipe(production(cssnano()))
        .pipe(development(sourcemaps.write()))
        .pipe(gulp.dest('./_site/css/'));
});

gulp.task('compile-html', function(cb) {
  gulp.src('html/pages/**/*.html')
    .pipe(panini({
      root: 'html/pages/',
      layouts: 'html/layouts/',
      partials: 'html/includes/',
      helpers: 'html/helpers/',
      data: development() ? 'html/data/development' : 'html/data/production'
     }))
    .pipe(gulp.dest('_site'))
    .on('finish', browser.reload);
    cb();
});

gulp.task('compile-html:reset', function(done) {
  panini.refresh();
  done();
});

gulp.task('validate-html',['compile-html'], function() {
  gulp.src('_site/**/*.html')
    .pipe(validator())
    .pipe(bootlint());
});

gulp.task('compile-js', function() {
  return gulp.src([node_modules_path+ 'jquery/dist/jquery.min.js',
                    node_modules_path+ 'bootstrap/dist/js/bootstrap.min.js',
                    'js/main.js'])
    .pipe(concat('app.js'))
    .pipe(gulp.dest('./_site/js/'));
});
 
gulp.task('scss-lint', function() {
  return gulp.src('scss/**/*.scss')
    .pipe(scsslint({'config': 'scss/.scss-lint.yml'}));
});


gulp.task('set-development', development.task);
gulp.task('set-production', production.task);
gulp.task('test',['scss-lint','validate-html']);
gulp.task('build', ['clean','copy','compile-js','compile-sass','compile-html']);
gulp.task('default', ['set-development','server', 'watch']);
gulp.task('deploy', ['set-production','server', 'watch']);

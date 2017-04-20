#!/usr/bin/env node
var args = process.argv.splice(2)
var fs = require('fs')

switch(args[0]) {
  case 'install':
    install();
    break;
  case 'compile-directives':
    compileDirectives();
    break;
  default:
    console.log('Usage: angular-cbc install')
    break;
}

function createDir(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path)
  }
}

function install() {

  var folders = ['./js', './pages']

  console.log('Creating project structure...\n')
  folders.map(f => {
    createDir(f)
  })

  createDir('./js/controllers')
  createDir('./css')

  const TEMPLATES_DIR = __dirname + '/templates'

  console.log('Creating some files...\n')
  fs.writeFileSync('./js/controllers/BaseController.js', fs.readFileSync(TEMPLATES_DIR + '/BaseController.js'));

  // Copy files in the js folder
  var jsFiles = ['app.js','config.js','directives.js','routes.js']
  jsFiles.map(function(js) {
    var source = TEMPLATES_DIR + '/' + js
    var target = './js/' + js
    fs.writeFileSync(target, fs.readFileSync(source));
  })

  var otherFiles = ['webpack.config.js','index.html','README.md']
  otherFiles.map(function (f) {
    var source = TEMPLATES_DIR + '/' + f
    var target = './' + f
    fs.writeFileSync(target, fs.readFileSync(source));
  })

  var styleFile = './css/application.scss'
  fs.writeFileSync(styleFile, '/* Your style goes here */');

  console.log('Updating your package.json file...\n')
  // set dependencies in the user package.json
  var userPkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(TEMPLATES_DIR + '/pkg.json', 'utf8'));

  var entries = ['devDependencies','dependencies','scripts','bin']
  entries.map(function (e) {
    userPkg[e] = userPkg[e] || {}
    userPkg[e] = Object.assign(userPkg[e],pkg[e])
  })

  fs.writeFileSync('./package.json', JSON.stringify(userPkg))

  console.log('Installing dependencies. May take a while...\n')

  npmInstall(function() {
    fs.symlinkSync('./node_modules/angular-cbc/index.js', './angular-cbc')
    console.log('Everything is ok! Please take a look at the Readme file!')
  })
}

function npmInstall(onExit) {
  var spawn = require('child_process').spawn
  var cmd = spawn('npm', ['install'])

  cmd.stdout.on('data', function (data) {
    console.log(data.toString());
  });

  cmd.stderr.on('data', function (data) {
    console.log('Error: ' + data.toString());
  });

  cmd.on('exit', function (code) {
    onExit()
  });
}

function compileDirectives() {
  const BASE_DIR = './js/directives'
  const BASE_FILE = './js/directives.js'
  var watch = require('node-watch')
  var watcher = watch(BASE_DIR, { recursive: true })
  var glob = require('glob')

  watcher.on('change', function (evt, name) {
    if (name.indexOf('.js')) {
      generate()
    }
  })
  watcher.close()

  function generate () {
    glob(BASE_DIR + '/**/*.js', {}, function (er, files) {
      fs.truncateSync(BASE_FILE)
      var disclaimer = `/*
      PLEASE NOTE: THIS FILE IS AUTO GENERATED.
      IF YOU NOTICE SOMETHING PLEASE ENSURE FIRST YOUR FILES HAVE THE SAME NAME
      OF THE EXPORTED FUNCTION IN THE CODE
      */\n`
      fs.writeFileSync(BASE_FILE, disclaimer)
      files.map(f => {
        var path = f.replace(BASE_DIR, './directives')
        var regex = new RegExp(BASE_DIR + '.*/')
        var name = f.replace(regex, '').replace(/\.js/, '')
        var template = `// ------ ${name} directive
        import ${name} from '${path}'\nexport {${name}}
        // ------ \n`
        fs.appendFileSync(BASE_FILE, template)
      })
    })
  }

}

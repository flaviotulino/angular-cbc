#!/usr/bin/env node
const args = process.argv.splice(2)
const fs = require('fs-extra')

/* eslint no-eval: 0 */
try {
  let name = args[0].replace(/(-.)/g, function (x) {
    return x[1].toUpperCase()
  })
  eval(name.toString())()
} catch (e) {
  console.log('Usage: angular-cbc install')
  process.exit(1)
}

function install () {
  const TEMP_FOLDER = '.temp_app'
  console.log('Downloading the project from remote...')
  require('child_process').execSync(`git clone --quiet https://github.com/flaviotulino/angular-cbc.git ${TEMP_FOLDER}`)

  fs.copySync(TEMP_FOLDER + '/app', './', {filter: (src, dest) => {
    if (src === TEMP_FOLDER + '/app/package.json') {
      return false
    } else {
      return true
    }
  }})

  // set dependencies in the user package.json
  let userPkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
  const pkg = JSON.parse(fs.readFileSync(TEMP_FOLDER + '/app/package.json', 'utf8'))

  const entries = ['devDependencies', 'dependencies', 'scripts']
  entries.map(function (e) {
    userPkg[e] = userPkg[e] || {}
    userPkg[e] = Object.assign(userPkg[e], pkg[e])
  })

  fs.writeFileSync('./package.json', JSON.stringify(userPkg))
  fs.emptyDirSync(TEMP_FOLDER)
  fs.removeSync(TEMP_FOLDER)

  console.log('Installing dependencies. May take a while...\n')
  npmInstall(function () {
    fs.symlinkSync('./node_modules/angular-cbc/index.js', './angular-cbc')
    console.log('Everything is ok! Please take a look at the Readme file!')
  })
}

function npmInstall (onExit) {
  const spawn = require('child_process').spawn
  const cmd = spawn('npm', ['install'])

  cmd.stdout.on('data', function (data) {
    console.log(data.toString())
  })

  cmd.stderr.on('data', function (data) {
    console.log('Error: ' + data.toString())
  })

  cmd.on('exit', function (code) {
    onExit()
  })
}

function assets () {
  const cheerio = require('cheerio')
  let index = fs.readFileSync('index.html', 'utf8')
  const $ = cheerio.load(index)

  let scripts = $('script')
    .filter((i, el) => $(el).attr('src').indexOf('application.js') < 0 && !$(el).attr('src').match(/http|https/))
    .map((index, el) => $(el).attr('src')).get()

  scripts.map(s => {
    let name = s.slice(s.lastIndexOf('/') + 1, s.length)
    fs.copySync('../' + s, name)
    index.replace(s, name)
  })
}

function compileDirectives () {
  const BASE_DIR = './js/directives'
  const BASE_FILE = './js/directives.js'
  const watch = require('node-watch')
  const watcher = watch(BASE_DIR, { recursive: true })
  const glob = require('glob')

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
        let path = f.replace(BASE_DIR, './directives')
        let regex = new RegExp(BASE_DIR + '.*/')
        let name = f.replace(regex, '').replace(/\.js/, '')
        let template = `// ------ ${name} directive
        import ${name} from '${path}'\nexport {${name}}
        // ------ \n`
        fs.appendFileSync(BASE_FILE, template)
      })
    })
  }
}

#!/usr/bin/env node
const args = process.argv.splice(2)
const fs = require('fs-extra')

/** Get any argument passed to the CLI */
/* eslint no-eval: 0 */
try {
  /*
  * Transform any command argument with a dash(-) in
  * a camel notation string, calling a function defined
  * in this file. Basically avoid the usage of a switch case statement
  */
  let name = args[0].replace(/(-.)/g, function (x) {
    return x[1].toUpperCase()
  })

  // Call the function with the argument name
  eval(name.toString())()
} catch (e) {
  // In any other case, just show the usage guide
  console.log('Usage: angular-cbc install')
  process.exit(1)
}

/*
* Perform the full installation of this module
* - Download the module from a remote repository
* - Add dependencies and scripts to the existing package.json file
* - Install all the dependencies
* - Create a symlink to the binary inside the root folder
*/
function install () {
  // this the temp folder where to download the module
  const TEMP_FOLDER = '.temp_app'

  // empty this folder to avoid overwriting
  fs.emptyDirSync(TEMP_FOLDER)

  // download the entire module from the remote repository
  console.log('Downloading the project from remote...')
  require('child_process').execSync(`git clone --quiet https://github.com/flaviotulino/angular-cbc.git ${TEMP_FOLDER}`)

  /*
  * copy all the downloaded files in the root folder, except the
  * package.json to keep the user one
  */
  fs.copySync(TEMP_FOLDER + '/app', './', {filter: (src, dest) => {
    if (src === TEMP_FOLDER + '/app/package.json') {
      return false
    } else {
      return true
    }
  }})

  // set dependencies extending the user's package.json
  let userPkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
  const pkg = JSON.parse(fs.readFileSync(TEMP_FOLDER + '/app/package.json', 'utf8'))

  const entries = ['devDependencies', 'dependencies', 'scripts']
  entries.map(function (e) {
    // extend the user package.json entry with the custom content
    userPkg[e] = userPkg[e] || {}
    userPkg[e] = Object.assign(userPkg[e], pkg[e])
  })

  fs.writeFileSync('./package.json', JSON.stringify(userPkg))

  // empty and remove the folder
  fs.emptyDirSync(TEMP_FOLDER)
  fs.removeSync(TEMP_FOLDER)

  console.log('Installing dependencies. May take a while...\n')
  npmInstall(function () {
    fs.symlinkSync('./node_modules/angular-cbc/index.js', './angular-cbc')
    console.log('Everything is ok! Please take a look at the Readme file!')
  })
}

/**
* Install all the node_modules listed in the package.json file
* using a separate thread
* @param onExit Function, the function called at the end of the execution
*/
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

/**
* Perform some replacements in the bundled index.html file
*/
function assets () {
  const BUILD_PATH = 'build/'
  fs.emptyDirSync(BUILD_PATH)

  const cheerio = require('cheerio')

  // load the index.html file content
  let index = fs.readFileSync(BUILD_PATH + 'index.html', 'utf8')
  const $ = cheerio.load(index)

  /**
  * retrieve all the script tags source URI, excluding
  * remote scripts and the application.js file.
  * @return scripts Array, a list of URIs
  */
  let scripts = $('script')
  .filter((i, el) => $(el).attr('src').indexOf('application.js') < 0 && !$(el).attr('src').match(/http|https/))
  .map((index, el) => $(el).attr('src')).get()

  scripts.map(s => {
    /**
    * for each URI, explode the name in order to find the
    * script name, and copy the script itself in the build folder
    */
    let name = s.slice(s.lastIndexOf('/') + 1, s.length)
    fs.copySync(s, BUILD_PATH + name)

    // replace the URI with the copied one
    index = index.replace(s, name)
  })

  // overwrite the old index.html file the manipulated one
  fs.writeFileSync(BUILD_PATH + 'index.html', index)
}

/**
* Watch for changes in the directive files and folder
* and generate the right file
*/
function compileDirectives () {
  const BASE_DIR = './js/directives'
  const BASE_FILE = './js/directives.js'
  const watch = require('node-watch')

  // init a watcher ONLY in the directives folder
  const watcher = watch(BASE_DIR, { recursive: true })
  const glob = require('glob')

  // whatch for changes in any .js file
  watcher.on('change', function (evt, name) {
    if (name.indexOf('.js')) {
      generate()
    }
  })
  watcher.close()

  function generate () {
    glob(BASE_DIR + '/**/*.js', {}, function (er, files) {
      // delete the directives.js file content
      fs.truncateSync(BASE_FILE)

      // a disclaimer to be printend in the generated file
      var disclaimer = `/*
      PLEASE NOTE: THIS FILE IS AUTO GENERATED.
      IF YOU NOTICE SOMETHING PLEASE ENSURE FIRST YOUR FILES HAVE THE SAME NAME
      OF THE EXPORTED FUNCTION IN THE CODE
      */\n`

      // write the disclaimer in the head of the file
      fs.writeFileSync(BASE_FILE, disclaimer)

      files.map(f => {
        // normalize file path and name
        let path = f.replace(BASE_DIR, './directives')
        let regex = new RegExp(BASE_DIR + '.*/')
        let name = f.replace(regex, '').replace(/\.js/, '')

        // define a template for any entry
        let template = `// ------ ${name} directive
        import ${name} from '${path}'\nexport {${name}}
        // ------ \n`

        // create the entry
        fs.appendFileSync(BASE_FILE, template)
      })
    })
  }
}

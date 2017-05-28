#!/usr/bin/env node
/** Get any argument passed to the CLI */
const args = process.argv.splice(2)
const fs = require('fs-extra')

function dir (...segments) {
  segments = segments.map(s => s.replace(/\//, ''))
  return segments.join('/')
}

/**
* This class handles the entire CBC behaviour.
* Add a method in camel case notation to run it
* automatically when passed to CLI
* NOTE: callThisMethod becomes ```./angular-cbc call-this-method```
*/
class CBC {
  /**
  * Specify which methods are not visible outside the class
  * This avoids the method call via CLI
  */
  static get RESTRICTED_METHODS () {
    return ['npmInstall', 'constructor']
  }

  /**
  * Perform the full installation of this module
  *   - Download the module from a remote repository
  *   - Add dependencies and scripts to the existing package.json file
  *   - Install all the dependencies
  *   - Create a symlink to the binary inside the root folder
  */
  install () {
    // this the temp folder where to download the module
    const TEMP_FOLDER = '.temp_app'

    // empty this folder to avoid overwriting
    fs.emptyDirSync(TEMP_FOLDER)

    // download the entire module from the remote repository
    console.log('Downloading the project from remote...')
    require('child_process').execSync(`git clone --quiet https://github.com/flaviotulino/angular-cbc.git ${TEMP_FOLDER}`)

    /**
    * copy all the downloaded files in the root folder, except the
    * package.json to keep the user one
    */
    fs.copySync(dir(TEMP_FOLDER, 'app', './'), {filter: (src, dest) => {
      if (src === dir(TEMP_FOLDER, 'app', 'package.json')) {
        return false
      } else {
        return true
      }
    }})

    // set dependencies extending the user's package.json
    let userPkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
    const pkg = JSON.parse(fs.readFileSync(dir(TEMP_FOLDER, 'app', 'package.json'), 'utf8'))

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
    this.npmInstall(function () {
      fs.symlinkSync('./node_modules/angular-cbc/index.js', './angular-cbc')
      console.log('Everything is ok! Please take a look at the Readme file!')
    })
  }

  /**
  * Install all the node_modules listed in the package.json file
  * using a separate thread
  * @param onExit Function, the function called at the end of the execution
  */
  npmInstall (onExit) {
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
  assets () {
    const BUILD_PATH = 'build'
    fs.emptyDirSync(BUILD_PATH)

    const cheerio = require('cheerio')

    // load the index.html file content
    let index = fs.readFileSync(dir(BUILD_PATH, 'index.html'), 'utf8')
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
      fs.copySync(s, dir(BUILD_PATH, name))

      // replace the URI with the copied one
      index = index.replace(s, name)
    })

    // overwrite the old index.html file the manipulated one
    fs.writeFileSync(dir(BUILD_PATH, 'index.html'), index)
  }

  /**
  * Watch for changes in the directive files and folder
  * and generate the right file
  */
  compileDirectives () {
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

  // a shortcut
  g () {
    this.generate()
  }

  generate () {
    switch (args[1]) {
      case 'controller':
        let controllerName =
          args[2].toLowerCase().indexOf('controller') < 0
          ? args[2] + 'Controller' : args[2]

        let controllerTemplate = `import BaseController from './BaseController'
export default class ${controllerName} extends BaseController {
  constructor ($scope) {
    super($scope)
  }
}
${controllerName}.$inject = ['$scope']`

        fs.writeFileSync(dir('js', 'controllers', `${args[2]}.js`), controllerTemplate)
        break
      case 'directive':
        let directiveTemplate = `export default function ${args[2]}() {
  return {
  }
}
${args[2]}.$inject = []`
        fs.writeFileSync(dir('js', 'directives', `${args[2]}.js`), directiveTemplate)
        break
      default:
        console.log('Generator usage: ./angular-cbc generator controller|directive <name>')
        break
    }
  }
}

/*  ******************** NODOBY SHOULD EDIT THIS PART ********************** */
// Run the relative task parsing CLI arguments
try {
  /*
  * Transform any command argument with a dash(-) in
  * a camel notation string, calling a function defined
  * in this file. Basically avoid the usage of a switch case statement
  */
  let name = args[0].replace(/(-.)/g, function (x) {
    return x[1].toUpperCase()
  })

  /*
  * if the user is trying to call a restricted method
  * i.e. ./angular-cbc npm-install
  */
  if (CBC.RESTRICTED_METHODS.indexOf(name) >= 0) {
    throw 'error'
  }
  // Call the function with the argument name
  new CBC()[name]()
} catch (e) {
  // Show a backtrace only if requested
  if (args.indexOf('--v') >= 0 || args.indexOf('--verbose') >= 0) {
    console.log(e)
  }
  // In any other case, just show the usage guide
  let tasks = Object.getOwnPropertyNames(CBC.prototype).filter(t => {
    return CBC.RESTRICTED_METHODS.indexOf(t) < 0
  })
  console.log(`Usage: angular-cbc <${tasks.join('|')}>`)
  process.exit(1)
}

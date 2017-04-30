import config from './config'
import * as directives from './directives'
import deps from './dependencies'

import preConfig from './hooks/preConfig'
import postConfig from './hooks/postConfig'
import preDirectives from './hooks/preDirectives'
import postDirectives from './hooks/postDirectives'
import preBootstrap from './hooks/preBootstrap'
import postBootstrap from './hooks/postBootstrap'

var angular = window.angular || {}
const application = angular.module('app', deps.concat('ui.router'))

if (hookIsValid(preConfig)) {
  preConfig()
}

application.config(config)

if (hookIsValid(postConfig)) {
  postConfig()
}

if (hookIsValid(preDirectives)) {
  preDirectives()
}

Object.keys(directives).map(directive => {
  application.directive(directive, directives[directive])
})

if (hookIsValid(postDirectives)) {
  postDirectives()
}

if (hookIsValid(preBootstrap)) {
  preBootstrap()
}

angular.element(document).ready(() => {
  angular.bootstrap(document, ['app'])

  if (hookIsValid(postBootstrap)) {
    postBootstrap()
  }
})

function hookIsValid (hook) {
  return typeof hook === 'function' && hook !== undefined
}

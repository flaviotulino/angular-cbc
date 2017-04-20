import config from './config'
//  import angular from 'angular'
//  import angularUIRouter from 'angular-ui-router'
import * as directives from './directives'

var angular = window.angular || {}
const application = angular.module('app', ['ui.router'])
application.config(config)

Object.keys(directives).map(directive => {
  application.directive(directive, directives[directive])
})

angular.element(document).ready(() => {
  angular.bootstrap(document, ['app'])
})

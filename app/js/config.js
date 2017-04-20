import routes from './routes'

function config ($stateProvider, $urlRouterProvider) {
  routes.map(route => {
    if (route.abstract) {
      route.template = '<ui-view></ui-view>'
    } else if (!route.template && !route.templateUrl) {
      route.templateUrl = `pages/${route.name}.html`
    }
    $stateProvider.state(route)
  })

  let _404route = null
  if ((_404route = (routes.find(r => r.name === '404' || r.render404 === true)))) {
    $urlRouterProvider.otherwise(_404route.url)
  } else {
    $urlRouterProvider.otherwise('/')
  }

  $urlRouterProvider.rule(function ($injector, $location) {
    var re = /(.+)(\/+)(\?.*)?$/
    var path = $location.url()
    if (re.test(path)) {
      return path.replace(re, '$1$3')
    }
    return false
  })
}
config.$inject = ['$stateProvider', '$urlRouterProvider']
export default config

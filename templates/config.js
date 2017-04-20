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

  if (routes.find(r => r.name === '404' || r.render404 == true)) {
    $urlRouterProvider.otherwise(r.url)
  } else {
    $urlRouterProvider.otherwise('/')
  }
}
config.$inject = ['$stateProvider', '$urlRouterProvider']
export default config

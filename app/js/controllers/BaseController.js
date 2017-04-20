export default class BaseController {
  constructor (scope) {
    let constructorName = this.getClassName(this.constructor.name)
    scope[constructorName] = this
    scope.$ = this
  }
  getClassName (classInstance) {
    let constructorName = classInstance.replace(/controller/i, '')
    return constructorName.charAt(0).toLowerCase() + constructorName.slice(1)
  }
}

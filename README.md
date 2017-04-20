# Angular CBC - code angular by conventions!
The purpose of this module is to provide a quick way to start a new Angular 1.x application, using ES6 modules and its awesome syntax!
You will use some conventions in order to maximize the result with less effort!

## Usage
### Install
> Please be sure you have already run ```npm init``` command in your project!

Once you're sure you have a valid package.json file, run these commands in your shell:
- ```npm i angular-cbc```
- ```./node_modules/.bin/angular-cbc install```

### Concepts your should know
This project uses Angular UI Router, an awesome Angular module which provides states instead of routes and a lot of possibilities. [Take a look if you don't know it!](https://github.com/angular-ui/ui-router)

### Effects
Something happened... Your project now has a new structure, with a js folder, a css folder, an index.html file, a webpack.config.js file and a pages folder.

#### js folder
In this folder you will have:
- **app.js**, if you know Angular you know what's that. But there is just one difference: basically you do not have to touch this file... maybe never! :)
- **routes.js**, this file contains an array of routes that will be automatically used in this project! Just provide a name for the route, a matching URL and the controller used in this route! That's it!

> **The first convention**
Each routes/state uses a template called as the route itself. So, if you provide a named state like **home**, the file under **pages/home.html** will be rendered!
Another example with nested states? Let's imagine we are under a state called **home.list**... well, it's assumed the template to be used is **pages/home.list.html**!

- **config.js**, sets the routes and some other initial configs
- **directives.js**, this file is used to import all the directives you will write. Don't forget to do **not** edit this file! It's autogenerated!

> **The second convention**
In order to write autoloading directives, you must to write them inside the **directives** folder, creating a sub folder with the same name of the .js file you will create... An example:
We are going to create a navbar directive; let's create a **navbar** folder under the directives one, and a **navbar.js** file inside the **navbar folder**
Note: Don't forget to export the function itself, according to the new ES6 module syntax

```javascript
export default function navbar() {
    return {
        link: ...
        template: ...
    }
}
```

#### js/controllers folder
Put your controllers in this folder, export the class by default and import it inside your routes file, creating a controller entry inside any object

From routes.js
```javascript
    import HomeController from './controllers/HomeController'
    ...
    [
        name: 'home',
        url: '/home',
        controller: HomeController
    ]
    ...
```

> **The third convention**
You must extend the BaseController in any controller your create, in this way you can use the controller name to refer to its scope inside your html templates.
Example:
We create an HomeController, which extends BaseController. We set this controller in the routes file for the home state.
We set in the HomeController constructor two fields:


```javascript
    export default class HomeController extends BaseController{
        constructor($scope){
            super($scope)
            this.name = 'Test'
            this.surname = 'McTest'
            }
        }
```

We want to show data in pages/home.html, and we can refer to the scope using home.name and home.surname! So basically the controller name withouth the controller suffix by convention!
> TIP: you can refer to the controller scope inside the html template also using the dollar sign... Just a shortcut so!
```
    <div>
        {{home.name}} is equivalent to
        {{$.name}}
    </div>
    <div>
        {{home.surname}} is equivalent to
        {{$.surname}}
    </div>
```

### Run
To run the project, just type `npm start` in your terminal and visit http://localhost:8080 from your browser


## Contributors Guide
I would be happy if anyone will contribute with coding or just with ideas! The Git repository is [this one](https://github.com/flaviotulino/angular-cbc)

### App folder
The app folder is the folder that will be downloaded by the module, in order to copy files and directory locally for the user who run the install command.

You can clone the repo and treat the app folder as an Angular app. Anything put under this folder will be copied into the user project, unless you do not set a filter in the dirCopy function in index.js (~ line 22)

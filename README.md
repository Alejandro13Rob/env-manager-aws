# AWS PARAMETER STORE ENV CONFIG


It allows you to configure your environment variable file in seconds and to be able to quickly switch between environments

## <a name="installation-and-usage"></a>Installation and Usage

Prerequisites: [Node.js](https://nodejs.org/) (`^10.12.0`, or `>=12.0.0`) built with SSL support. (If you are using an official Node.js distribution, SSL is always built in.)

You can install env-manager-aws using npm:

```
$ npm install env-manager-aws --save-dev
```

## <a name="configuration"></a>Configuration

You need to create a `envconfig.js` file in your root directoy with structure like:

```javascript
module.exports = {
  filePath: ['.env'],
  enableUpdateDate: false,
  envs: [
    { name: 'development', paths: ['/path/common/', '/path/development'] },
    { name: 'production', paths: ['/path/common/', '/path/production'] },
  ],
};
```

The names `"semi"` and `"quotes"` are the names of [rules](https://eslint.org/docs/rules) in ESLint. The first value is the error level of the rule and can be one of these values:

* `filePath:` The name of your file
* `enableUpdateDate` This option will allow the script to print the latest date update for each parameter. For example: `REACT_APP_BACKEND_URL=https://....  # updated - 2021-06-29 03:59:15`
* `envs` Define your environments like `development`, `staging`, `production`or whatever you use
  * `name` The name of the environment
  * `paths` the paths that will define the environment and will be downloaded recursively     
    

To find how to set up your environments in AWS Parameter Store check this documentation
https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html


### Usage

You can use directly in you project repository 

```
env-manager configure
```

Or you can run 

```
node node_modules/env-manager-aws/dist/cli.js configure
```

Or run

```
npm run env-manager-aws
```
inside of your project

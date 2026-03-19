# rataqa/amir

AMQP message consumer that passes the task to workers

## requirements

* Node.js v22.x, v24.x is recommended
* npm v11.x

## development

```sh
# install Node modules
npm i

# modify code inside ./src

# build
npm run build

# test
npm run test
npm run test:coverage

# review/modify version number in package.json
# login and publish
npm login
npm publish --access=public
```

## usage

```sh
npm i @rataqa/amir
```

Example: see [mock-app/](mock-app)

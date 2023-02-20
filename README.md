# vue-log
Vue log plugin

automate record page navigate info with [vue-router]('https://github.com/vuejs/router#readme') guard(`afterEach`), also you can record the log manually.
## How to Use
1. Install package from npm
```shell
npm install @rulaicd-lining/vue-log
```
Or with yarn
```shell
yarn add @rulaicd-lining/vue-log
```
2. import to vue project and use it
```js
import logs from '@rulaicd-lining/vue-log'

// 数据埋点插件
Vue.use(logs, {
    router, // vue-router
    app: 'app_name',
    endpoint: 'request endpoint',
    secure: 'request security key',
    get userId() {
        return 'current login userId'
    },
    get orgId() {
        return 'current login user orgId'
    },
})
```
Configration

|field|type|required|remark|
|---|---|---|---|
|router|vue-router instance|true|vue-rouer for navigate info automated record |
|app|string|false|app name, default: `main`|
|endpoint|string|true|endpoint for logs submit to|
|secure|string|true|server side security key|
|userId|string/number|false|getter for current login user Id|
|orgId|string/number|false|getter for current login user orgId|
|interval|number|false|log buffer time, default: 2s|
|usePath|boolean|false|use router path instead of name, default: `false`|
|routeNameFormatter|function|false|format route name |

## Log Datastruct
Logs will post to endpoint with `post` method use `axios`, like:
```js
await axios({
  url: endpoint,
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  params: { secure, ts },
  data: { logs },
})

```

### Query
|field|type|required|remark|
|---|---|---|---|
|secure|string|true|md5 hash string|
|ts|number|true|timestamp with millisecond|


### Post body
```js
{ "logs": [ log ] }
```
log document fields:
|field|type|required|default|remark|
|---|---|---|---|---|
|app|string|true|main|app name|
|page|string|true|--|current page name|
|source|string|true|--|current operate source|
|action|enum|true|--|current operation|
|ts|number|true|Date.now()|log timestamp|
|orgId|string|false|--|login user orgId|
|userId|string|false|--|login user id|
|extra|any|false|--|extra data info|

action enum
|field|description|
|---|---|
|view|page view|
|new|create source|
|edit|edit source|
|delete|delete source|
|navigate|router navigate with extra data: `{ to: 'navigate to name', duration: 'page stay duration' }`|
|click|click event|
|request|server request|

## Secure md5 Hash
`secure` field hashed by md5 with timestamp, there is the algorithm
```js
secure = md5(secure + Date.now())
```
The `secure` field will available in next 10 seconds, so our request must finished in 10 seconds.

### Methods
vue-log can automated log the navigation info by every navigate success. but we can manually do the log by action.

- in vue template
```js
<template>
  <button name="add" @click="$log.click('AddButton')"></button>
</template>
```
- in vue component
```js
this.$log.click('AddButton')
```


method signature
```ts
type method = 'view' | 'edit' | 'new' | 'delete' | 'navigate' | 'click' | 'request'

this.$log[method](source: string, extra: any): void
```

import axios from 'axios'
import md5 from 'md5'

const ACTIONS = {
  VIEW: 'view',
  NEW: 'new',
  EDIT: 'edit',
  DELETE: 'delete',
  NAVIGATE: 'navigate',
  CLICK: 'click',
  REQUEST: 'request',
}

let currentRoute = null

export default {
  install(Vue, options) {
    const { router, endpoint, secure, app = 'main', delay = 2000, usePath = false } = options
    const pageField = usePath ? 'path' : 'name'
    const buffers = []
    const flush = () => {
      const data = buffers.slice()
      buffers.length = 0
      data.length && flushLogs(data, endpoint, secure)
    }

    let timer = 0
    const log = info => {
      clearTimeout(timer)
      buffers.push(info)
      timer = setTimeout(() => {
        flush()
      }, delay)
    }

    if (!router) {
      console.error('router is required for logs! ')
      return
    }
    if (!endpoint) {
      console.error('endpoint is required for logs! ')
      return
    }
    if (!secure) {
      console.error('secure is required for logs! ')
      return
    }

    const getRouteName = (route) => {
      if (options.routeNameFormatter) {
        return options.routeNameFormatter(route)
      }
      return route[pageField]
    }

    // 监听操作
    const methods = {}
    Object.values(ACTIONS).forEach(action => {
      methods[action] = function (source, extra) {
        if (!source) {
          return console.error('source required!')
        }
        const info = {
          app,
          page: currentRoute ? getRouteName(currentRoute) : '--',
          source,
          action,
          orgId: options.orgId,
          userId: options.userId,
          extra,
          ts: Date.now()
        }

        if (action === ACTIONS.NAVIGATE) {
          info.page = info.source
        }

        log(info)

        return { flush  }
      }
    })

    Vue.prototype.$log = methods

    // 监听页面跳转
    let durations = new Map()
    router.afterEach((to, from) => {
      currentRoute = to
      const now = Date.now()
      durations.set(to.name, now)
      let duration
      if ((duration = durations.get(from.name))) {
        duration = now - duration
        methods.navigate(getRouteName(from), { to: getRouteName(to), duration })
      }
    })
  }
}

async function flushLogs(logs, endpoint, key) {
  const ts = Date.now()
  const secure = md5(key + ts)

  let ret
  try {
    ret = await axios({
      url: endpoint,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      params: { secure, ts },
      data: { logs },
    })
    if (ret.data.code !== 0) {
      console.error('save logs to endpoint failed!', ret.data)
    }
  } catch (err) {
    console.error('save logs to endpoint failed!', err)
  }
  return ret
}

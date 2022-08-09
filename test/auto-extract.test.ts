import { expect, describe, it } from 'vitest'
import { resolvePreset } from '../src/preset'

describe('auto-extract', () => {
  it('h3', async () => {
    expect(
      await resolvePreset({
        package: 'h3',
        ignore: [/^[A-Z]/, /^[a-z]*$/, r => r.length > 4]
      })
    ).toMatchInlineSnapshot(`
      [
        {
          "from": "h3",
          "name": "appendHeader",
        },
        {
          "from": "h3",
          "name": "appendHeaders",
        },
        {
          "from": "h3",
          "name": "appendResponseHeader",
        },
        {
          "from": "h3",
          "name": "appendResponseHeaders",
        },
        {
          "from": "h3",
          "name": "assertMethod",
        },
        {
          "from": "h3",
          "name": "callHandler",
        },
        {
          "from": "h3",
          "name": "createApp",
        },
        {
          "from": "h3",
          "name": "createAppEventHandler",
        },
        {
          "from": "h3",
          "name": "createError",
        },
        {
          "from": "h3",
          "name": "createEvent",
        },
        {
          "from": "h3",
          "name": "createRouter",
        },
        {
          "from": "h3",
          "name": "defaultContentType",
        },
        {
          "from": "h3",
          "name": "defineEventHandler",
        },
        {
          "from": "h3",
          "name": "defineHandle",
        },
        {
          "from": "h3",
          "name": "defineHandler",
        },
        {
          "from": "h3",
          "name": "defineLazyEventHandler",
        },
        {
          "from": "h3",
          "name": "defineLazyHandler",
        },
        {
          "from": "h3",
          "name": "defineMiddleware",
        },
        {
          "from": "h3",
          "name": "deleteCookie",
        },
        {
          "from": "h3",
          "name": "dynamicEventHandler",
        },
        {
          "from": "h3",
          "name": "eventHandler",
        },
        {
          "from": "h3",
          "name": "getCookie",
        },
        {
          "from": "h3",
          "name": "getHeader",
        },
        {
          "from": "h3",
          "name": "getHeaders",
        },
        {
          "from": "h3",
          "name": "getMethod",
        },
        {
          "from": "h3",
          "name": "getQuery",
        },
        {
          "from": "h3",
          "name": "getRequestHeader",
        },
        {
          "from": "h3",
          "name": "getRequestHeaders",
        },
        {
          "from": "h3",
          "name": "getResponseHeader",
        },
        {
          "from": "h3",
          "name": "getResponseHeaders",
        },
        {
          "from": "h3",
          "name": "getRouterParam",
        },
        {
          "from": "h3",
          "name": "getRouterParams",
        },
        {
          "from": "h3",
          "name": "handleCacheHeaders",
        },
        {
          "from": "h3",
          "name": "isError",
        },
        {
          "from": "h3",
          "name": "isEvent",
        },
        {
          "from": "h3",
          "name": "isEventHandler",
        },
        {
          "from": "h3",
          "name": "isMethod",
        },
        {
          "from": "h3",
          "name": "isStream",
        },
        {
          "from": "h3",
          "name": "lazyEventHandler",
        },
        {
          "from": "h3",
          "name": "lazyHandle",
        },
        {
          "from": "h3",
          "name": "parseCookies",
        },
        {
          "from": "h3",
          "name": "promisifyHandle",
        },
        {
          "from": "h3",
          "name": "promisifyHandler",
        },
        {
          "from": "h3",
          "name": "readBody",
        },
        {
          "from": "h3",
          "name": "readRawBody",
        },
        {
          "from": "h3",
          "name": "sendError",
        },
        {
          "from": "h3",
          "name": "sendRedirect",
        },
        {
          "from": "h3",
          "name": "sendStream",
        },
        {
          "from": "h3",
          "name": "setCookie",
        },
        {
          "from": "h3",
          "name": "setHeader",
        },
        {
          "from": "h3",
          "name": "setHeaders",
        },
        {
          "from": "h3",
          "name": "setResponseHeader",
        },
        {
          "from": "h3",
          "name": "setResponseHeaders",
        },
        {
          "from": "h3",
          "name": "toEventHandler",
        },
        {
          "from": "h3",
          "name": "useBase",
        },
        {
          "from": "h3",
          "name": "useBody",
        },
        {
          "from": "h3",
          "name": "useCookie",
        },
        {
          "from": "h3",
          "name": "useCookies",
        },
        {
          "from": "h3",
          "name": "useMethod",
        },
        {
          "from": "h3",
          "name": "useQuery",
        },
        {
          "from": "h3",
          "name": "useRawBody",
        },
      ]
    `)
  })
})

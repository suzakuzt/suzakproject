const MAX_MESSAGE_LENGTH = 480

export const PAGE_NODE_REQUIREMENTS = {
  home: ['.home-stage', '.lottery-tube', '.draw-button'],
  p2: ['[data-testid="p2-combined-card"]', '[data-testid="p2-product-image"]', '[data-testid="share-poster"]'],
  p6: ['.p6-stage', '[data-testid="p6-rules"]'],
  rules: ['.p7-stage'],
  p8: ['.p8-stage'],
}

const truncate = (value, maxLength = MAX_MESSAGE_LENGTH) => {
  const text = String(value ?? '')
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

const serializeConsoleArg = (arg) => {
  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}`
  }
  if (typeof arg === 'string') {
    return arg
  }
  try {
    return JSON.stringify(arg)
  } catch {
    return String(arg)
  }
}

const getElementUrl = (target) => {
  if (!target || typeof target.getAttribute !== 'function') {
    return ''
  }

  return target.getAttribute('src') || target.getAttribute('href') || ''
}

export const installRuntimeMonitor = ({
  getPageCode = () => 'unknown',
  report = () => {},
  windowRef = typeof window === 'undefined' ? undefined : window,
  documentRef = typeof document === 'undefined' ? undefined : document,
  consoleRef = typeof console === 'undefined' ? undefined : console,
  pageNodeRequirements = PAGE_NODE_REQUIREMENTS,
} = {}) => {
  const reportedKeys = new Set()

  const reportOnce = (eventName, payload = {}, key = `${eventName}:${JSON.stringify(payload)}`) => {
    if (!eventName || reportedKeys.has(key)) {
      return
    }

    reportedKeys.add(key)
    try {
      report(eventName, {
        page_code: getPageCode(),
        location_href: windowRef?.location?.href ?? '',
        ...payload,
      })
    } catch {
      // Monitoring must never break the activity flow.
    }
  }

  const checkPageNodes = () => {
    if (!documentRef?.querySelector) {
      return
    }

    const pageCode = getPageCode()
    const selectors = pageNodeRequirements[pageCode] ?? []
    selectors.forEach((selector) => {
      if (!documentRef.querySelector(selector)) {
        reportOnce(
          'runtime_page_node_missing',
          {
            level: 'warning',
            selector,
            source: 'page_node_check',
          },
          `node:${pageCode}:${selector}`,
        )
      }
    })
  }

  const originalWarn = consoleRef?.warn
  const originalError = consoleRef?.error

  if (consoleRef && typeof originalWarn === 'function') {
    consoleRef.warn = (...args) => {
      originalWarn.apply(consoleRef, args)
      reportOnce(
        'runtime_console_warning',
        {
          level: 'warning',
          message: truncate(args.map(serializeConsoleArg).join(' ')),
          source: 'console.warn',
        },
        `warn:${args.map(serializeConsoleArg).join('|')}`,
      )
    }
  }

  if (consoleRef && typeof originalError === 'function') {
    consoleRef.error = (...args) => {
      originalError.apply(consoleRef, args)
      reportOnce(
        'runtime_console_error',
        {
          level: 'error',
          message: truncate(args.map(serializeConsoleArg).join(' ')),
          source: 'console.error',
        },
        `error:${args.map(serializeConsoleArg).join('|')}`,
      )
    }
  }

  const handleWindowError = (event) => {
    if (event.target && event.target !== windowRef) {
      const target = event.target
      reportOnce(
        'runtime_resource_load_error',
        {
          level: 'error',
          tag_name: target.tagName || '',
          resource_url: truncate(getElementUrl(target)),
          source: 'resource_error',
        },
        `resource:${target.tagName || ''}:${getElementUrl(target)}`,
      )
      return
    }

    reportOnce(
      'runtime_unhandled_error',
      {
        level: 'error',
        message: truncate(event.message || event.error?.message || 'unhandled error'),
        filename: event.filename || '',
        lineno: event.lineno || 0,
        colno: event.colno || 0,
        source: 'window.error',
      },
      `window-error:${event.message || event.error?.message || ''}:${event.filename || ''}:${event.lineno || 0}`,
    )
  }

  const handleUnhandledRejection = (event) => {
    const reason = event.reason instanceof Error ? event.reason.message : serializeConsoleArg(event.reason)
    reportOnce(
      'runtime_unhandled_rejection',
      {
        level: 'error',
        message: truncate(reason || 'unhandled rejection'),
        source: 'window.unhandledrejection',
      },
      `rejection:${reason || ''}`,
    )
  }

  windowRef?.addEventListener?.('error', handleWindowError, true)
  windowRef?.addEventListener?.('unhandledrejection', handleUnhandledRejection)

  return {
    checkPageNodes,
    dispose() {
      windowRef?.removeEventListener?.('error', handleWindowError, true)
      windowRef?.removeEventListener?.('unhandledrejection', handleUnhandledRejection)
      if (consoleRef && originalWarn) {
        consoleRef.warn = originalWarn
      }
      if (consoleRef && originalError) {
        consoleRef.error = originalError
      }
    },
  }
}

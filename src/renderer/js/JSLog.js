JSLog('module loaded', 'JSLog')

/**
 * 전역 로그
 * @param option 옵션 'to' -> toString
 * @param list
 * @constructor
 */
export default function JSLog (option, ...list) {
  if (process.env.NODE_ENV === 'development') {
    if (option === 'to') {
      list.forEach(obj => {
        let log = ''
        const objs = []
        let isFirst = false
        Object.keys(obj).forEach(prop => {
          if (isFirst) {
            log += 'JSLog: '
          }
          isFirst = true
          log += `${prop} : ${obj[prop]} \n`
          if (typeof (obj[prop]) === 'object') {
            objs.push({
              name: prop,
              o: obj[prop]
            })
          }
        })
        JSLog(log)
        objs.forEach(function (v) {
          JSLog(`-> ${v.name}`)
          JSLog('to', v.o)
        })
      })
    } else {
      let args = Array.prototype.slice.call(arguments)
      if (window.console) console.log(`JSLog: ${args.join(' | ')}`)
    }
  }
}

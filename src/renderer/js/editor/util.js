import JSLog from '../JSLog'
import ERD from './ERD'
import fileNameRex from 'filename-reserved-regex'

JSLog('module loaded', 'util')

// UUID 생성
export const guid = () => {
  const s4 = () => {
    return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1)
  }

  return [s4(), s4(), '-', s4(), '-', s4(), '-', s4(), '-', s4(), s4(), s4()].join('')
}

// id -> data 반환
export const getData = (list, id) => {
  for (let v of list) {
    if (id === v.id) {
      return v
    }
  }
}

// 데이터 셋팅
export const setData = (oldData, newData) => {
  Object.keys(newData).forEach(key => {
    if (typeof newData[key] === 'object') {
      setData(oldData[key], newData[key])
    } else {
      oldData[key] = newData[key]
    }
  })
}

// 파일이름 휴효성처리
export const validFileName = name => {
  return name.replace(fileNameRex(), '').replace(fileNameRex.windowsNames(), '')
}

// 날짜 포맷 yyyy, MM, dd, hh, mm, ss
export const formatDate = (format, date) => {
  const d = new Date(date)
  let year = d.getFullYear()
  let month = (d.getMonth() + 1)
  let day = d.getDate()
  let hh = d.getHours().toString()
  let mm = d.getMinutes().toString()
  let ss = d.getSeconds().toString()

  if (month < 10) month = '0' + month
  if (day < 10) day = '0' + day
  if (hh < 10) hh = '0' + hh
  if (mm < 10) mm = '0' + mm
  if (ss < 10) ss = '0' + ss
  hh = hh === '0' ? '00' : hh
  mm = mm === '0' ? '00' : mm
  ss = ss === '0' ? '00' : ss

  format = format.replace('yyyy', year)
  format = format.replace('MM', month)
  format = format.replace('dd', day)
  format = format.replace('hh', hh)
  format = format.replace('mm', mm)
  format = format.replace('ss', ss)
  return format
}

// max z-index 반환
export const getZIndex = () => {
  let max = 0

  ERD.store().state.tables.forEach(v => {
    if (v.ui.zIndex > max) {
      max = v.ui.zIndex
    }
  })
  ERD.store().state.memos.forEach(v => {
    if (v.ui.zIndex > max) {
      max = v.ui.zIndex
    }
  })
  return ++max
}

// dom 순서
export const index = (elem, selector) => {
  if (typeof selector === 'object') {
    for (let i = 0; i < elem.length; i++) {
      if (selector.isEqualNode(elem[i])) {
        return i
      }
    }
  } else if (selector) {
    if (elem && elem.querySelector(selector)) {
      return index(elem.querySelector(selector))
    }
  } else {
    const children = elem.parentNode.childNodes
    for (let i = 0; i < children.length; i++) {
      if (elem.isEqualNode(children[i])) {
        return i
      }
    }
  }
  return -1
}

// 생성위치
export const setPosition = target => {
  let isPosition = true
  while (isPosition) {
    isPosition = false
    for (let table of ERD.store().state.tables) {
      if (table.ui.top === target.ui.top && table.ui.left === target.ui.left) {
        isPosition = true
        target.ui.top += 50
        target.ui.left += 50
        break
      }
    }
    for (let memo of ERD.store().state.memos) {
      if (memo.ui.top === target.ui.top && memo.ui.left === target.ui.left) {
        isPosition = true
        target.ui.top += 50
        target.ui.left += 50
        break
      }
    }
  }
}

// 자동 이름 생성
export const autoName = (list, name, num) => {
  if (!num) num = 1
  for (let v of list) {
    if (name === v.name) {
      return autoName(list, name.replace(/[0-9]/g, '') + num, num + 1)
    }
  }
  return name
}

// 테이블 옵션 컬럼 리스트 반환
export const getColumnOptions = (target, columns) => {
  return columns.filter(column => {
    return column.options[target]
  })
}

// 컬럼 옵션 체크
export const isColumnOption = (target, columns) => {
  return columns.some(column => {
    return column.options[target]
  })
}

// 컬럼 데이터타입 동기화 여부 확인
export const isRelationSync = (state, tableId, column) => {
  return state.lines.some(line => {
    return line.points.some((point, i) => {
      if (point.id === tableId) {
        return point.columnIds.some((columnId, j) => {
          if (column.id === columnId) {
            if (i === 0) {
              const targetTable = getData(state.tables, line.points[1].id)
              const targetColumn = getData(targetTable.columns, line.points[1].columnIds[j])
              return column.dataType !== targetColumn.dataType
            } else {
              const targetTable = getData(state.tables, line.points[0].id)
              const targetColumn = getData(targetTable.columns, line.points[0].columnIds[j])
              return column.dataType !== targetColumn.dataType
            }
          } else {
            return false
          }
        })
      } else {
        return false
      }
    })
  })
}

// 탐색할 관계 있는지 확인
function isLineSync (lines, tableId, column) {
  return lines.some(line => {
    return line.points.some(point => {
      if (point.id === tableId) {
        return point.columnIds.some(columnId => {
          return column.id === columnId
        })
      } else {
        return false
      }
    })
  })
}

// 동기화할 관계 컬럼 탐색
export const getColumnsSync = (columns, lines, state, tableId, column) => {
  let targetTable = null
  let targetColumn = null
  let targetIndex = null

  for (let i in lines) {
    let isTarget = false

    if (lines[i].points[0].id === tableId) {
      for (let j in lines[i].points[0].columnIds) {
        if (column.id === lines[i].points[0].columnIds[j]) {
          targetTable = getData(state.tables, lines[i].points[1].id)
          targetColumn = getData(targetTable.columns, lines[i].points[1].columnIds[j])
          isTarget = true
          break
        }
      }
      targetIndex = i
    }
    if (lines[i].points[1].id === tableId) {
      for (let j in lines[i].points[1].columnIds) {
        if (column.id === lines[i].points[1].columnIds[j]) {
          targetTable = getData(state.tables, lines[i].points[0].id)
          targetColumn = getData(targetTable.columns, lines[i].points[0].columnIds[j])
          isTarget = true
          break
        }
      }
      targetIndex = i
    }
    if (isTarget) break
  }

  // 탐색 완료 관계 목록 제거
  if (targetIndex !== null) {
    lines.splice(targetIndex, 1)
  }

  if (isLineSync(lines, tableId, column)) {
    // 탐색한 컬럼 중첩 검색
    getColumnsSync(columns, lines, state, tableId, column)
  }

  // 관계 상대방 탐색
  if (targetTable !== null) {
    columns.push(targetColumn)
    getColumnsSync(columns, lines, state, targetTable.id, targetColumn)
  }
}

// 관계 식별, 비식별 변경
export const changeIdentification = (state, table) => {
  for (let line of state.lines) {
    if (line.points[1].id === table.id) {
      const isPK = line.points[1].columnIds.some(columnId => {
        return table.columns.some(column => {
          return column.id === columnId && !column.options.primaryKey
        })
      })
      ERD.store().commit({
        type: 'lineChangeIdentification',
        id: line.id,
        isIdentification: !isPK
      })
    }
  }
}

// 컬럼 max width
const textWidthTag = document.createElement('span')
if (document.getElementById('textWidth')) {
  document.getElementById('textWidth').remove()
}
textWidthTag.setAttribute('id', 'textWidth')
textWidthTag.setAttribute('style', 'visibility:hidden; position:absolute; top:-10000; font: 400 12px Arial;')
document.body.appendChild(textWidthTag)
function getTextWidth (text) {
  textWidthTag.innerHTML = text
  return textWidthTag.offsetWidth
}
export const columnMaxWidth = (state, columns) => {
  const max = {
    name: state.COLUMN_WIDTH,
    dataType: state.COLUMN_WIDTH,
    comment: state.COLUMN_WIDTH,
    domain: state.COLUMN_WIDTH
  }
  columns.forEach(column => {
    const widthName = getTextWidth(column.name)
    const widthDataType = getTextWidth(column.dataType)
    const widthComment = getTextWidth(column.comment)
    const widthDomain = getTextWidth(column.domain)
    if (max.name < widthName) {
      max.name = widthName
    }
    if (max.dataType < widthDataType) {
      max.dataType = widthDataType
    }
    if (max.comment < widthComment) {
      max.comment = widthComment
    }
    if (max.domain < widthDomain) {
      max.domain = widthDomain
    }
  })
  return max
}

// line convert
export const convertLine = v => {
  // start,end key 및 points data convert
  const key = convertPoints(v)
  // path data
  const path = getPath(v, key)
  // line data
  const line = getLine(v, key)

  return {
    id: v.id,
    type: v.type,
    isIdentification: v.isIdentification,
    key: key,
    path: path,
    line: line.line,
    circle: line.circle,
    isDraw: key.end != null
  }
}

// 좌표 데이터 정제
export const getPoint = (ui) => {
  return {
    width: ui.width,
    height: ui.height,
    x: ui.left,
    y: ui.top,
    top: {
      x: ui.left + (ui.width / 2),
      y: ui.top
    },
    bottom: {
      x: ui.left + (ui.width / 2),
      y: ui.top + ui.height
    },
    left: {
      x: ui.left,
      y: ui.top + (ui.height / 2)
    },
    right: {
      x: ui.left + ui.width,
      y: ui.top + (ui.height / 2)
    },
    lt: {
      x: ui.left,
      y: ui.top
    },
    rt: {
      x: ui.left + ui.width,
      y: ui.top
    },
    lb: {
      x: ui.left,
      y: ui.top + ui.height
    },
    rb: {
      x: ui.left + ui.width,
      y: ui.top + ui.height
    }
  }
}

// convert points
function convertPoints (v) {
  const startTable = getData(ERD.store().state.tables, v.points[0].id)
  const endTable = getData(ERD.store().state.tables, v.points[1].id)
  const startPoint = getPoint(startTable.ui)
  const key = {
    start: 'left',
    end: null,
    startPoint: startPoint,
    endPoint: null
  }

  const filter = it => {
    return it === 'left' || it === 'right' || it === 'top' || it === 'bottom'
  }

  // 연결좌표 처리
  if (endTable && v.points[0].id === v.points[1].id) {
    // self
    const endPoint = key.endPoint = getPoint(endTable.ui)
    key.start = 'top'
    key.end = 'right'
    v.points[0].x = startPoint.rt.x - 20
    v.points[0].y = startPoint.rt.y
    v.points[1].x = endPoint.rt.x
    v.points[1].y = endPoint.rt.y + 20
  } else if (endTable) {
    key.end = 'left'
    const endPoint = key.endPoint = getPoint(endTable.ui)
    let minXY = Math.abs(startPoint.left.x - endPoint.left.x) + Math.abs(startPoint.left.y - endPoint.left.y)
    v.points[0].x = startPoint.left.x
    v.points[0].y = startPoint.left.y
    v.points[1].x = endPoint.left.x
    v.points[1].y = endPoint.left.y

    Object.keys(startPoint).filter(filter).forEach(function (k) {
      Object.keys(endPoint).filter(filter).forEach(function (k2) {
        let tempXY = Math.abs(startPoint[k].x - endPoint[k2].x) + Math.abs(startPoint[k].y - endPoint[k2].y)
        if (minXY > tempXY) {
          minXY = tempXY
          key.start = k
          key.end = k2
          v.points[0].x = startPoint[k].x
          v.points[0].y = startPoint[k].y
          v.points[1].x = endPoint[k2].x
          v.points[1].y = endPoint[k2].y
        }
      })
    })
  } else {
    let minXY = Math.abs(startPoint.left.x - v.points[1].x) + Math.abs(startPoint.left.y - v.points[1].y)
    v.points[0].x = startPoint.left.x
    v.points[0].y = startPoint.left.y

    Object.keys(startPoint).filter(filter).forEach(function (k) {
      let tempXY = Math.abs(startPoint[k].x - v.points[1].x) + Math.abs(startPoint[k].y - v.points[1].y)
      if (minXY > tempXY) {
        minXY = tempXY
        key.start = k
        v.points[0].x = startPoint[k].x
        v.points[0].y = startPoint[k].y
      }
    })
  }

  return key
}

// path data
const PATH_HEIGHT = 40
const PATH_END_HEIGHT = PATH_HEIGHT + 20
const PATH_LINE_HEIGHT = 35

function getPath (v, key) {
  const line = {
    start: {
      x1: v.points[0].x,
      y1: v.points[0].y,
      x2: v.points[0].x,
      y2: v.points[0].y
    },
    end: {
      x1: v.points[1].x,
      y1: v.points[1].y,
      x2: v.points[1].x,
      y2: v.points[1].y
    }
  }
  const path = {
    M: { x: 0, y: 0 },
    L: { x: 0, y: 0 },
    Q: { x: 0, y: 0 }
  }
  let change = 1

  if (key.start === 'left' || key.start === 'right') {
    if (key.start === 'left') change *= -1
    line.start.x2 = v.points[0].x + (change * PATH_HEIGHT)
    path.M.x = line.start.x2
    path.M.y = v.points[0].y
  } else if (key.start === 'top' || key.start === 'bottom') {
    if (key.start === 'top') change *= -1
    line.start.y2 = v.points[0].y + (change * PATH_HEIGHT)
    path.M.x = v.points[0].x
    path.M.y = line.start.y2
  }

  if (key.end) {
    change = 1
    if (key.end === 'left' || key.end === 'right') {
      if (key.end === 'left') change *= -1
      line.end.x2 = v.points[1].x + (change * PATH_END_HEIGHT)
      line.end.x1 += (change * PATH_LINE_HEIGHT)
      path.L.x = line.end.x2
      path.L.y = v.points[1].y
    } else if (key.end === 'top' || key.end === 'bottom') {
      if (key.end === 'top') change *= -1
      line.end.y2 = v.points[1].y + (change * PATH_END_HEIGHT)
      line.end.y1 += (change * PATH_LINE_HEIGHT)
      path.L.x = v.points[1].x
      path.L.y = line.end.y2
    }
  } else {
    path.L.x = v.points[1].x
    path.L.y = v.points[1].y
  }

  return {
    path: path,
    d: () => {
      return `M ${path.M.x} ${path.M.y} L ${path.L.x} ${path.L.y}`
    },
    line: line
  }
}

// line data
const LINE_SIZE = 10
const LINE_HEIGHT = 15
const CIRCLE_HEIGHT = 26

function getLine (v, key) {
  const line = {
    start: {
      x1: v.points[0].x,
      y1: v.points[0].y,
      x2: v.points[0].x,
      y2: v.points[0].y
    },
    end: {
      base: {
        x1: v.points[1].x,
        y1: v.points[1].y,
        x2: v.points[1].x,
        y2: v.points[1].y
      },
      left: {
        x1: v.points[1].x,
        y1: v.points[1].y,
        x2: v.points[1].x,
        y2: v.points[1].y
      },
      center: {
        x1: v.points[1].x,
        y1: v.points[1].y,
        x2: v.points[1].x,
        y2: v.points[1].y
      },
      right: {
        x1: v.points[1].x,
        y1: v.points[1].y,
        x2: v.points[1].x,
        y2: v.points[1].y
      }
    }
  }
  let change = 1

  if (key.start === 'left' || key.start === 'right') {
    if (key.start === 'left') change *= -1
    line.start.x1 = line.start.x2 += (change * LINE_HEIGHT)
    line.start.y1 -= LINE_SIZE
    line.start.y2 += LINE_SIZE
  } else if (key.start === 'top' || key.start === 'bottom') {
    if (key.start === 'top') change *= -1
    line.start.y1 = line.start.y2 += (change * LINE_HEIGHT)
    line.start.x1 -= LINE_SIZE
    line.start.x2 += LINE_SIZE
  }

  const circle = {
    cx: v.points[1].x,
    cy: v.points[1].y
  }

  if (key.end) {
    change = 1
    if (key.end === 'left' || key.end === 'right') {
      if (key.end === 'left') change *= -1
      line.end.left.x1 = line.end.center.x1 = line.end.right.x1 = line.end.base.x1 = line.end.base.x2 += (change * LINE_HEIGHT)
      line.end.base.y1 -= LINE_SIZE
      line.end.base.y2 += LINE_SIZE
      line.end.left.y2 += LINE_SIZE
      line.end.right.y2 -= LINE_SIZE

      circle.cx += (change * CIRCLE_HEIGHT)
    } else if (key.end === 'top' || key.end === 'bottom') {
      if (key.end === 'top') change *= -1
      line.end.left.y1 = line.end.center.y1 = line.end.right.y1 = line.end.base.y1 = line.end.base.y2 += (change * LINE_HEIGHT)
      line.end.base.x1 -= LINE_SIZE
      line.end.base.x2 += LINE_SIZE
      line.end.left.x2 += LINE_SIZE
      line.end.right.x2 -= LINE_SIZE

      circle.cy += (change * CIRCLE_HEIGHT)
    }
  }

  return {
    line: line,
    circle: circle
  }
}

// 위치 중첩 재가공
export const convertPointOverlay = arr => {
  const count = arr.length
  const point = pointOverlay(arr[0], count)

  for (let i in arr) {
    if (arr[i].type === 'start') {
      let key = 'x'
      if (arr[i].data.key.start === 'left' || arr[i].data.key.start === 'right') {
        key = 'y'
      }
      const key1 = key + '1'
      const key2 = key + '2'
      const keyArr = key + 'Arr'

      arr[i].data.path.line.start[key1] = point[keyArr][i]
      arr[i].data.path.line.start[key2] = point[keyArr][i]
      arr[i].data.line.start[key1] = point[keyArr][i] - LINE_SIZE
      arr[i].data.line.start[key2] = point[keyArr][i] + LINE_SIZE
      arr[i].data.path.path.M[key] = point[keyArr][i]
    } else if (arr[i].type === 'end') {
      let key = 'x'
      if (arr[i].data.key.end === 'left' || arr[i].data.key.end === 'right') {
        key = 'y'
      }
      const key1 = key + '1'
      const key2 = key + '2'
      const keyArr = key + 'Arr'
      const keyc = 'c' + key

      arr[i].data.path.line.end[key1] = point[keyArr][i]
      arr[i].data.path.line.end[key2] = point[keyArr][i]
      arr[i].data.circle[keyc] = point[keyArr][i]
      arr[i].data.line.end.base[key1] = point[keyArr][i] - LINE_SIZE
      arr[i].data.line.end.base[key2] = point[keyArr][i] + LINE_SIZE
      arr[i].data.line.end.left[key1] = point[keyArr][i]
      arr[i].data.line.end.left[key2] = point[keyArr][i] + LINE_SIZE
      arr[i].data.line.end.center[key1] = point[keyArr][i]
      arr[i].data.line.end.center[key2] = point[keyArr][i]
      arr[i].data.line.end.right[key1] = point[keyArr][i]
      arr[i].data.line.end.right[key2] = point[keyArr][i] - LINE_SIZE
      arr[i].data.path.path.L[key] = point[keyArr][i]
    }
  }
}

function pointOverlay (v, count) {
  const point = v.type === 'start' ? v.data.key.startPoint : v.data.key.endPoint
  const margin = {
    x: point.width / count,
    y: point.height / count
  }
  const padding = {
    x: margin.x / 2,
    y: margin.y / 2
  }

  const xArr = []
  const yArr = []

  if (v.type === 'start') {
    if (v.data.key.start === 'left' || v.data.key.start === 'right') {
      let sum = point.y - padding.y
      for (let i = 0; i < count; i++) {
        sum += margin.y
        yArr.push(sum)
      }
    } else if (v.data.key.start === 'top' || v.data.key.start === 'bottom') {
      let sum = point.x - padding.x
      for (let i = 0; i < count; i++) {
        sum += margin.x
        xArr.push(sum)
      }
    }
  } else if (v.type === 'end') {
    if (v.data.key.end === 'left' || v.data.key.end === 'right') {
      let sum = point.y - padding.y
      for (let i = 0; i < count; i++) {
        sum += margin.y
        yArr.push(sum)
      }
    } else if (v.data.key.end === 'top' || v.data.key.end === 'bottom') {
      let sum = point.x - padding.x
      for (let i = 0; i < count; i++) {
        sum += margin.x
        xArr.push(sum)
      }
    }
  }

  return {
    xArr: xArr,
    yArr: yArr
  }
}

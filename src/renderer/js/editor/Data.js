import JSLog from '../JSLog'
import * as util from './util'
import dataType from '@/store/editor/dataType'

const TABLE_WIDTH = 350
const TABLE_HEIGHT = 84
const COLUMN_WIDTH = 50
const MEMO_WIDTH = 150
const MEMO_HEIGHT = 100

// 데이터 구조 초기값
const tab = {
  id: util.guid(),
  name: 'untitled',
  active: true,
  ui: {
    isReadName: true
  }
}
const erd = {
  TABLE_WIDTH: 350,
  TABLE_HEIGHT: 84,
  COLUMN_WIDTH: 50,
  COLUMN_HEIGHT: 25,
  PREVIEW_WIDTH: 150,
  CANVAS_WIDTH: 5000,
  CANVAS_HEIGHT: 5000,
  MEMO_WIDTH: 150,
  MEMO_HEIGHT: 100,
  DBType: 'MySQL',
  dataTypes: dataType['MySQL'],
  searchDomains: []
}
const table = {
  id: util.guid(),
  name: '',
  comment: '',
  ui: {
    selected: false,
    top: document.documentElement.scrollTop + 100,
    left: document.documentElement.scrollLeft + 200,
    width: TABLE_WIDTH,
    height: TABLE_HEIGHT,
    zIndex: 0,
    isReadName: true,
    isReadComment: true
  }
}
const column = {
  id: util.guid(),
  name: '',
  comment: '',
  dataType: '',
  domain: '',
  domainId: '',
  default: '',
  options: {
    autoIncrement: false,
    primaryKey: false,
    unique: false,
    notNull: false
  },
  ui: {
    selected: false,
    pk: false,
    fk: false,
    pfk: false,
    isDataTypeHint: false,
    isDomainHint: false,
    isHover: false,
    widthName: COLUMN_WIDTH,
    widthDataType: COLUMN_WIDTH,
    widthComment: COLUMN_WIDTH,
    widthDomain: COLUMN_WIDTH,
    isReadName: true,
    isReadDataType: true,
    isReadComment: true,
    isReadDomain: true
  }
}
const line = {
  id: util.guid(),
  type: 'QuickMenu.vue',
  isIdentification: false,
  points: [
    {
      id: null,
      x: 0,
      y: 0,
      columnIds: []
    },
    {
      id: null,
      x: 0,
      y: 0,
      columnIds: []
    }
  ]
}
const memo = {
  id: util.guid(),
  content: '',
  ui: {
    selected: false,
    top: document.documentElement.scrollTop + 100,
    left: document.documentElement.scrollLeft + 200,
    width: MEMO_WIDTH,
    height: MEMO_HEIGHT,
    zIndex: 0
  }
}
const domain = {
  id: util.guid(),
  name: '',
  dataType: '',
  default: '',
  ui: {
    isReadname: true,
    isReaddataType: true,
    isReaddefault: true
  }
}

/**
 * 데이터 구조 호환성
 */
class Data {
  constructor () {
    JSLog('module loaded', 'Data')
    this.core = null
  }

  // 종속성 초기화
  init (core) {
    JSLog('module dependency init', 'Data')
    this.core = core
  }

  set (old) {
    if (old.id === undefined) {
      old.id = util.guid()
    }
    this.setTab(old.tabs)
  }
  setTab (list) {
    list.forEach(old => {
      this.setData(old, tab)
      this.setErd(old.store)
    })
  }
  setErd (old) {
    this.setData(old, erd)
    this.setTable(old.tables)
    this.setList(line, old.lines)
    this.setList(memo, old.memos)
    this.setList(domain, old.domains)
  }
  setTable (list) {
    list.forEach(old => {
      this.setData(old, table)
      this.setList(column, old.columns)
    })
  }
  setList (type, list) {
    list.forEach(old => {
      this.setData(old, type)
    })
  }

  setData (oldData, newData) {
    if (newData !== null) {
      Object.keys(newData).forEach(key => {
        if (typeof newData[key] === 'object') {
          if (oldData[key] === undefined) {
            oldData[key] = newData[key]
          } else {
            this.setData(oldData[key], newData[key])
          }
        } else {
          if (oldData[key] === undefined) {
            oldData[key] = newData[key]
          }
        }
      })
    }
  }

  // 객체 정리
  destroy () {}
}

export default new Data()

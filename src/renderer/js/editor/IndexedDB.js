import JSLog from '../JSLog'
import model from '@/store/editor/model'
import storeERD from '@/store/editor/erd'
import * as util from './util'

const DB_NAME = 'verd'
const DB_VERSION = 2
const DB_STORE_NAME = 'project'
const DB_STORE_NAME_MODEL = 'model'
const MODE = {
  RW: 'readwrite',
  R: 'readonly'
}

/**
 * indexDB
 */
class IndexedDB {
  constructor () {
    JSLog('module loaded', 'IndexedDB')
    this.core = null
  }

  init (core) {
    JSLog('module dependency init', 'IndexedDB')
    this.core = core
    this.lastLoaded([], v => {
      this.core.file.loaded('verd', v.json)
    })
  }

  openIndexedDB () {
    const openDB = indexedDB.open(DB_NAME, DB_VERSION)
    openDB.onerror = e => {
      alert('IndexedDB onerror')
    }
    openDB.onupgradeneeded = e => {
      JSLog('IndexedDB onupgradeneeded')
      e.currentTarget.result.createObjectStore(DB_STORE_NAME, { keyPath: 'id' })
      e.currentTarget.result.createObjectStore(DB_STORE_NAME_MODEL, { keyPath: 'id', autoIncrement: true })
    }
    return openDB
  }

  getObjectStore (openDB, storeName, mode) {
    const db = {}
    db.result = openDB.result
    db.tx = db.result.transaction(storeName, mode)
    db.store = db.tx.objectStore(storeName)
    db.tx.oncomplete = e => {
      db.result.close()
    }
    return db
  }

  // 추가
  add (type, data) {
    switch (type) {
      case 'project':
        const openDB = this.openIndexedDB()
        openDB.onsuccess = e => {
          const db = this.getObjectStore(openDB, DB_STORE_NAME, MODE.RW)
          const project = {
            id: util.guid(),
            tabs: [{
              id: util.guid(),
              name: 'untitled',
              active: true,
              store: storeERD(),
              ui: {
                isReadName: true
              }
            }]
          }
          const json = this.core.file.toJSON(project)
          this.core.file.loaded('verd', json)
          db.store.add({
            id: project.id,
            name: this.getProjectName(),
            json: json,
            update_date: util.formatDate('yyyy-MM-dd hh:mm:ss', new Date())
          })
        }
        break
      case 'model':
        const openDB2 = this.openIndexedDB()
        openDB2.onsuccess = e => {
          const db = this.getObjectStore(openDB2, DB_STORE_NAME_MODEL, MODE.RW)
          db.store.add({
            name: data.name,
            json: JSON.stringify({
              id: data.id,
              name: data.name,
              active: data.active,
              store: data.store.state,
              ui: {
                isReadName: true
              }
            }),
            update_date: util.formatDate('yyyy-MM-dd hh:mm:ss', new Date())
          })
        }
        break
    }
  }

  // import 파일 추가
  setImport (name) {
    name = util.validFileName(name)
    const openDB = this.openIndexedDB()
    openDB.onsuccess = e => {
      const db = this.getObjectStore(openDB, DB_STORE_NAME, MODE.RW)
      db.store.add({
        id: model.state.id,
        name: name,
        json: this.core.file.toJSON(),
        update_date: util.formatDate('yyyy-MM-dd hh:mm:ss', new Date())
      })
    }
  }

  // 리스트
  list (type, list, callback) {
    const openDB = this.openIndexedDB()
    openDB.onsuccess = e => {
      let db = null
      switch (type) {
        case 'project':
          db = this.getObjectStore(openDB, DB_STORE_NAME, MODE.R)
          break
        case 'model':
          db = this.getObjectStore(openDB, DB_STORE_NAME_MODEL, MODE.R)
          break
      }
      const req = db.store.openCursor()
      req.onsuccess = e => {
        const cursor = e.target.result
        if (cursor) {
          const req = db.store.get(cursor.key)
          req.onsuccess = e => {
            list.push(e.target.result)
          }
          cursor.continue()
        } else {
          list.sort((a, b) => {
            return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
          })
          callback(list)
        }
      }
    }
  }

  // 선택 파일 load
  loaded (type, id) {
    switch (type) {
      case 'project':
        const openDB = this.openIndexedDB()
        openDB.onsuccess = e => {
          const db = this.getObjectStore(openDB, DB_STORE_NAME, MODE.R)
          const req = db.store.get(id)
          req.onsuccess = e => {
            this.core.file.loaded('verd', e.target.result.json)
          }
        }
        break
      case 'model':
        const openDB2 = this.openIndexedDB()
        openDB2.onsuccess = e => {
          const db = this.getObjectStore(openDB2, DB_STORE_NAME_MODEL, MODE.R)
          const req = db.store.get(id)
          req.onsuccess = e => {
            const json = JSON.parse(e.target.result.json)
            const newTab = {
              name: json.name,
              store: storeERD()
            }
            newTab.store.commit({
              type: 'importData',
              state: json.store
            })
            model.commit({
              type: 'modelAdd',
              isInit: true,
              name: newTab.name,
              store: newTab.store
            })
          }
        }
        break
    }
  }

  // 단일 조회
  one (id, callback) {
    const openDB = this.openIndexedDB()
    openDB.onsuccess = e => {
      const db = this.getObjectStore(openDB, DB_STORE_NAME, MODE.R)
      const req = db.store.get(id)
      req.onsuccess = e => {
        callback(e.target.result)
      }
    }
  }

  // 수정
  update (data) {
    if (data) {
      const openDB = this.openIndexedDB()
      openDB.onsuccess = e => {
        const db = this.getObjectStore(openDB, DB_STORE_NAME, MODE.RW)
        const req = db.store.get(data.id)
        req.onsuccess = e => {
          const oldData = req.result
          oldData.update_date = util.formatDate('yyyy-MM-dd hh:mm:ss', new Date())
          util.setData(oldData, data)
          db.store.put(oldData)
          this.core.event.components.CanvasMenu.isSave = true
        }
      }
    } else {
      const openDB = this.openIndexedDB()
      openDB.onsuccess = e => {
        this.core.event.onCursor('stop')
        const db = this.getObjectStore(openDB, DB_STORE_NAME, MODE.RW)
        const req = db.store.get(model.state.id)
        req.onsuccess = e => {
          const oldData = req.result
          oldData.update_date = util.formatDate('yyyy-MM-dd hh:mm:ss', new Date())
          oldData.json = this.core.file.toJSON()
          db.store.put(oldData)
          this.core.event.components.CanvasMenu.isSave = true
        }
      }
    }
  }

  // 마지막 작업 내용 로드
  lastLoaded (list, callback) {
    const openDB = this.openIndexedDB()
    openDB.onsuccess = e => {
      const db = this.getObjectStore(openDB, DB_STORE_NAME, MODE.R)
      const req = db.store.openCursor()
      req.onsuccess = e => {
        const cursor = e.target.result
        if (cursor) {
          const req = db.store.get(cursor.key)
          req.onsuccess = e => {
            list.push(e.target.result)
          }
          cursor.continue()
        } else {
          if (list.length !== 0) {
            let last = list[0]
            list.forEach(v => {
              const old = new Date(last.update_date)
              const date = new Date(v.update_date)
              if (old.getTime() < date.getTime()) {
                last = v
              }
            })
            callback(last)
          } else {
            this.add('project')
          }
        }
      }
    }
  }

  // 삭제
  delete (type, id, callback) {
    switch (type) {
      case 'project':
        const openDB = this.openIndexedDB()
        openDB.onsuccess = e => {
          const db = this.getObjectStore(openDB, DB_STORE_NAME, MODE.RW)
          const req = db.store.get(id)
          req.onsuccess = e => {
            db.store.delete(id)
            if (model.state.id === id) {
              this.lastLoaded([], v => {
                this.core.file.loaded('verd', v.json)
              })
            } else {
              callback()
            }
          }
        }
        break
      case 'model':
        const openDB2 = this.openIndexedDB()
        openDB2.onsuccess = e => {
          const db = this.getObjectStore(openDB2, DB_STORE_NAME_MODEL, MODE.RW)
          const req = db.store.get(id)
          req.onsuccess = e => {
            db.store.delete(id)
            callback()
          }
        }
        break
    }
  }

  // get name
  getProjectName () {
    return `unnamed-${util.formatDate('yyyy-MM-dd_hhmmss', new Date())}`
  }

  // 객체 정리
  destroy () {}
}

export default new IndexedDB()

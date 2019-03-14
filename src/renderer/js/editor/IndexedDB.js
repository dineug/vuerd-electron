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
    this.request = null
    this.db = null
    this.openDB()
  }

  init (core) {
    JSLog('module dependency init', 'IndexedDB')
    this.core = core
  }

  openDB () {
    this.request = indexedDB.open(DB_NAME, DB_VERSION)
    this.request.onerror = e => {
      alert('IndexedDB onerror')
    }
    this.request.onsuccess = e => {
      JSLog('IndexedDB onsuccess')
      this.db = this.request.result

      this.lastLoaded([], v => {
        this.core.file.loaded('verd', v.json)
      })
    }
    this.request.onupgradeneeded = e => {
      JSLog('IndexedDB onupgradeneeded')
      e.currentTarget.result.createObjectStore(DB_STORE_NAME, { keyPath: 'id' })
      e.currentTarget.result.createObjectStore(DB_STORE_NAME_MODEL, { keyPath: 'id', autoIncrement: true })
    }
  }

  getObjectStore (storeName, mode) {
    const tx = this.db.transaction(storeName, mode)
    return tx.objectStore(storeName)
  }

  // 추가
  add (type, data) {
    switch (type) {
      case 'project':
        const store = this.getObjectStore(DB_STORE_NAME, MODE.RW)
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
        const req = store.add({
          id: project.id,
          name: this.getProjectName(),
          json: json,
          update_date: util.formatDate('yyyy-MM-dd hh:mm:ss', new Date())
        })
        req.onsuccess = e => {
          JSLog('IndexedDB save onsuccess')
        }
        req.onerror = e => {
          alert('IndexedDB save onerror')
        }
        break
      case 'model':
        const store2 = this.getObjectStore(DB_STORE_NAME_MODEL, MODE.RW)
        const req2 = store2.add({
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
        req2.onsuccess = e => {
          JSLog('IndexedDB save onsuccess')
        }
        req2.onerror = e => {
          alert('IndexedDB save onerror')
        }
        break
    }
  }

  // import 파일 추가
  setImport (name) {
    name = util.validFileName(name)
    const store = this.getObjectStore(DB_STORE_NAME, MODE.RW)
    const req = store.add({
      id: model.state.id,
      name: name,
      json: this.core.file.toJSON(),
      update_date: util.formatDate('yyyy-MM-dd hh:mm:ss', new Date())
    })
    req.onsuccess = e => {
      JSLog('IndexedDB save onsuccess')
    }
    req.onerror = e => {
      alert('IndexedDB save onerror')
    }
  }

  // 리스트
  list (type, list, callback) {
    let store = null
    switch (type) {
      case 'project':
        store = this.getObjectStore(DB_STORE_NAME, MODE.R)
        break
      case 'model':
        store = this.getObjectStore(DB_STORE_NAME_MODEL, MODE.R)
        break
    }
    const req = store.openCursor()
    req.onsuccess = e => {
      const cursor = e.target.result
      if (cursor) {
        const req = store.get(cursor.key)
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

  // 선택 파일 load
  loaded (type, id) {
    switch (type) {
      case 'project':
        const store = this.getObjectStore(DB_STORE_NAME, MODE.R)
        const req = store.get(id)
        req.onsuccess = e => {
          this.core.file.loaded('verd', e.target.result.json)
        }
        req.onerror = e => {
          alert('IndexedDB verd loaded error')
        }
        break
      case 'model':
        const store2 = this.getObjectStore(DB_STORE_NAME_MODEL, MODE.R)
        const req2 = store2.get(id)
        req2.onsuccess = e => {
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
        req2.onerror = e => {
          alert('IndexedDB model loaded error')
        }
        break
    }
  }

  // 단일 조회
  one (id, callback) {
    const store = this.getObjectStore(DB_STORE_NAME, MODE.R)
    const req = store.get(id)
    req.onsuccess = e => {
      callback(e.target.result)
    }
    req.onerror = e => {
      alert('')
    }
  }

  // 수정
  update (data) {
    if (data) {
      const store = this.getObjectStore(DB_STORE_NAME, MODE.RW)
      const req = store.get(data.id)
      req.onsuccess = e => {
        const oldData = req.result
        oldData.update_date = util.formatDate('yyyy-MM-dd hh:mm:ss', new Date())
        util.setData(oldData, data)
        store.put(oldData)
        this.core.event.components.CanvasMenu.isSave = true
      }
    } else {
      this.core.event.onCursor('stop')
      const store = this.getObjectStore(DB_STORE_NAME, MODE.RW)
      const req = store.get(model.state.id)
      req.onsuccess = e => {
        const oldData = req.result
        oldData.update_date = util.formatDate('yyyy-MM-dd hh:mm:ss', new Date())
        oldData.json = this.core.file.toJSON()
        store.put(oldData)
        this.core.event.components.CanvasMenu.isSave = true
      }
    }
  }

  // 마지막 작업 내용 로드
  lastLoaded (list, callback) {
    const store = this.getObjectStore(DB_STORE_NAME, MODE.R)
    const req = store.openCursor()
    req.onsuccess = e => {
      const cursor = e.target.result
      if (cursor) {
        const req = store.get(cursor.key)
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

  // 삭제
  delete (type, id, callback) {
    switch (type) {
      case 'project':
        const store = this.getObjectStore(DB_STORE_NAME, MODE.RW)
        const req = store.get(id)
        req.onsuccess = e => {
          store.delete(id)
          if (model.state.id === id) {
            this.lastLoaded([], v => {
              this.core.file.loaded('verd', v.json)
            })
          } else {
            callback()
          }
        }
        break
      case 'model':
        const store2 = this.getObjectStore(DB_STORE_NAME_MODEL, MODE.RW)
        const req2 = store2.get(id)
        console.log(req2)
        req2.onsuccess = e => {
          store2.delete(id)
          callback()
        }
        req2.onerror = e => {
          console.log('호출')
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

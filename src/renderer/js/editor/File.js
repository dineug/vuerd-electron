import JSLog from '../JSLog'
import storeERD from '@/store/editor/erd'
import model from '@/store/editor/model'
import domToImage from 'dom-to-image'
import * as util from './util'

/**
 * 파일 클래스
 */
class File {
  constructor () {
    JSLog('module loaded', 'File')

    this.core = null
    this.setImport()
    this.a = document.createElement('a')
  }

  // 종속성 초기화
  init (core) {
    JSLog('module dependency init', 'File')
    this.core = core
  }

  // import ready
  setImport () {
    this.importJSONTag = document.createElement('input')
    this.importJSONTag.setAttribute('type', 'file')
    this.importJSONTag.setAttribute('accept', '.verd')
    // this.importJSONTag.setAttribute('webkitdirectory', 'webkitdirectory')
    this.importJSONTag.addEventListener('change', e => {
      const f = e.target.files[0]
      if (/\.(verd)$/i.test(f.name)) {
        const reader = new FileReader()
        reader.readAsText(f)
        reader.onload = () => {
          this.loaded('verd', reader.result, true)
          this.core.indexedDB.setImport(f.name.substr(0, f.name.lastIndexOf('.')))
          this.importJSONTag.value = ''
        }
      } else {
        alert('Just upload the verd file')
      }
    })
    this.importSQLTag = document.createElement('input')
    this.importSQLTag.setAttribute('type', 'file')
    this.importSQLTag.setAttribute('accept', '.sql')
    this.importSQLTag.addEventListener('change', e => {
      const f = e.target.files[0]
      if (/\.(sql)$/i.test(f.name)) {
        const reader = new FileReader()
        reader.readAsText(f)
        reader.onload = () => {
          this.loaded('sql', reader.result, true)
          this.importSQLTag.value = ''
        }
      } else {
        alert('Just upload the sql file')
      }
    })
  }

  // file import click event
  click (type) {
    switch (type) {
      case 'verd':
        this.importJSONTag.click()
        break
      case 'sql':
        this.importSQLTag.click()
        break
    }
  }

  // loaded
  loaded (type, data, isImport) {
    switch (type) {
      case 'verd':
        try {
          const json = JSON.parse(data)
          this.core.data.set(json)
          if (isImport) {
            json.id = util.guid()
          }
          const tabs = []
          for (let tab of json.tabs) {
            const newTab = {
              id: util.guid(),
              name: tab.name,
              active: tab.active,
              store: storeERD(),
              ui: {
                isReadName: true
              }
            }
            newTab.store.commit({
              type: 'importData',
              state: tab.store
            })
            tabs.push(newTab)
          }
          model.commit({
            type: 'importData',
            state: {
              id: json.id,
              tabs: tabs
            }
          })
          this.core.event.components.CanvasMenu.isSave = true
        } catch (e) {
          alert('verd parsing error')
        }
        break
    }
  }

  // export
  exportData (type) {
    this.core.indexedDB.one(model.state.id, v => {
      const fileName = `${v.name}.${type}`
      switch (type) {
        case 'verd':
          const json = this.toJSON()
          const blobJson = new Blob([json], { type: 'application/json' })
          this.execute(blobJson, fileName)
          break
        case 'sql':
          const sql = this.core.sql.toDDL()
          const blobSQL = new Blob([sql], { type: 'text' })
          this.execute(blobSQL, fileName)
          break
        case 'png':
          domToImage.toBlob(document.querySelector('.canvas')).then(blob => {
            this.execute(blob, fileName)
          })
          break
      }
    })
  }

  // download
  execute (blob, fileName) {
    this.a.href = window.URL.createObjectURL(blob)
    this.a.download = fileName
    this.a.click()
  }

  // json 데이터 정제
  toJSON (data) {
    let state = model.state
    if (data) {
      state = data
    }
    const models = {
      id: state.id,
      tabs: []
    }
    for (let tab of state.tabs) {
      models.tabs.push({
        id: tab.id,
        name: tab.name,
        active: tab.active,
        store: tab.store.state,
        ui: {
          isReadName: true
        }
      })
    }
    return JSON.stringify(models)
  }

  // 현재 텝 복사 생성
  clone () {
    const tab = this.core.erd.active()
    const json = JSON.stringify(this.core.erd.store().state)
    const state = JSON.parse(json)
    const newTab = {
      name: tab.name,
      store: storeERD()
    }
    newTab.store.commit({
      type: 'importData',
      state: state
    })
    model.commit({
      type: 'modelAdd',
      isInit: true,
      name: newTab.name,
      store: newTab.store
    })
  }

  // 객체 정리
  destroy () {}
}

export default new File()

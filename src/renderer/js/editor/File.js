import JSLog from '../JSLog'
import storeERD from '@/store/editor/erd'
import model from '@/store/editor/model'
import domToImage from 'dom-to-image'
import * as util from './util'
import fs from 'fs'
import electron from 'electron'

const dialog = electron.remote.dialog

/**
 * 파일 클래스
 */
class File {
  constructor () {
    JSLog('module loaded', 'File')

    this.core = null
    this.a = document.createElement('a')
  }

  // 종속성 초기화
  init (core) {
    JSLog('module dependency init', 'File')
    this.core = core
  }

  // file import click event
  click (type) {
    switch (type) {
      case 'verd':
        dialog.showOpenDialog({
          properties: ['openFile'],
          filters: [
            { name: 'erd', extensions: ['verd'] }
          ]
        }, (fileNames) => {
          if (fileNames === undefined) return false

          // fileNames[0] file path
          if (/\.(verd)$/i.test(fileNames[0])) {
            fs.readFile(fileNames[0], 'utf-8', (err, data) => {
              if (err) {
                alert('An error ocurred reading the file :' + err.message)
              } else {
                this.loaded('verd', data, true)
                let path = fileNames[0]
                this.core.indexedDB.setImport(util.getPathToFileName(path), path)
              }
            })
          } else {
            alert('Just upload the verd file')
          }
        })
        break
    }
  }

  // loaded
  loaded (type, data, isImport, id) {
    switch (type) {
      case 'verd':
        try {
          const json = JSON.parse(data)
          this.core.data.set(json)
          if (isImport) {
            json.id = util.guid()
          } else {
            json.id = id
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
          dialog.showSaveDialog({
            defaultPath: fileName,
            filters: [
              { name: 'erd', extensions: ['verd'] }
            ]
          }, (fileName) => {
            if (fileName === undefined) return false
            const json = this.toJSON()
            fs.writeFile(fileName, json, (err) => {
              if (err) {
                alert('An error ocurred creating the file ' + err.message)
              } else {
                this.core.indexedDB.update({
                  id: model.state.id,
                  path: fileName,
                  name: util.getPathToFileName(fileName)
                })
              }
            })
          })
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

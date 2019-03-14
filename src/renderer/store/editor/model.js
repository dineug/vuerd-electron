import JSLog from '@/js/JSLog'
import Vue from 'vue'
import Vuex from 'vuex'
import * as util from '@/js/editor/util'
import storeERD from '@/store/editor/erd'
import ERD from '@/js/editor/ERD'
import storeTable from './table'

JSLog('store loaded', 'model')
Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    id: util.guid(),
    tabs: [
      {
        id: util.guid(),
        name: 'untitled',
        active: true,
        store: storeERD(),
        ui: {
          isReadName: true
        }
      }
    ]
  },
  mutations: {
    // 전체 import
    importData (state, data) {
      JSLog('mutations', 'model importData')
      Object.keys(state).forEach(key => {
        state[key] = data.state[key]
      })
    },
    // 모델 추가
    modelAdd (state, data) {
      JSLog('mutations', 'modelAdd')
      ERD.core.event.components.CanvasMenu.isSave = false

      const tab = {
        id: util.guid(),
        name: util.autoName(state.tabs, 'untitled'),
        active: false,
        store: storeERD(),
        ui: {
          isReadName: true
        }
      }
      if (data.isInit) {
        tab.name = data.name
        tab.store = data.store
      }
      state.tabs.push(tab)
      this.commit({
        type: 'modelActive',
        id: tab.id
      })
    },
    // 모델 변경
    modelActive (state, data) {
      JSLog('mutations', 'modelActive')

      const isTab = util.getData(state.tabs, data.id)
      if (isTab) {
        state.tabs.forEach(tab => {
          tab.active = tab.id === data.id
        })
      }

      // 모든 이벤트 중지
      ERD.core.event.stop()
      // 테이블 상세 그리드 해제
      storeTable.commit({ type: 'delete' })
    },
    // 모델 변경 단축키
    modelActiveKeyMap (state, data) {
      JSLog('mutations', 'modelActiveKeyMap')

      let isActive = false
      for (let i = 0; i < state.tabs.length; i++) {
        if (data.index === i + 1) {
          isActive = true
          break
        }
      }
      if (isActive) {
        state.tabs.forEach((tab, i) => {
          tab.active = data.index === i + 1
        })
      }

      // 모든 이벤트 중지
      ERD.core.event.stop()
      // 테이블 상세 그리드 해제
      storeTable.commit({ type: 'delete' })
    },
    // 모델 삭제
    modelDelete (state, data) {
      JSLog('mutations', 'modelDelete')
      ERD.core.event.components.CanvasMenu.isSave = false

      const tab = util.getData(state.tabs, data.id)
      if (tab) {
        ERD.core.indexedDB.add('model', tab)
      }
      for (let i in state.tabs) {
        if (data.id === state.tabs[i].id) {
          state.tabs.splice(i, 1)
          if (state.tabs.length === 0) {
            this.commit({ type: 'modelAdd' })
          } else if (tab && tab.active) {
            state.tabs[state.tabs.length - 1].active = true
            document.getElementById(`tab_${state.tabs[state.tabs.length - 1].id}`).focus()
          }
          break
        }
      }

      // 모든 이벤트 중지
      ERD.core.event.stop()
    },
    // edit on/off
    modelEdit (state, data) {
      JSLog('mutations', 'modelEdit')

      const tab = util.getData(state.tabs, data.id)
      tab.ui.isReadName = data.isRead
    },
    // edit 전체 해제
    modelEditAllNone (state) {
      JSLog('mutations', 'modelEditAllNone')
      state.tabs.forEach(tab => {
        tab.ui.isReadName = true
      })
    }
  }
})

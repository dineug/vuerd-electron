import JSLog from '@/js/JSLog'
import Vue from 'vue'
import Vuex from 'vuex'
import ERD from '@/js/editor/ERD'
import * as util from '@/js/editor/util'

JSLog('store loaded', 'table')
Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    table: null,
    rows: []
  },
  mutations: {
    // 그리드 활성화
    active (state, data) {
      JSLog('mutations', 'table grid', 'active')
      state.rows = []
      state.table = util.getData(ERD.store().state.tables, data.id)
      if (state.table) {
        state.table.columns.forEach(column => {
          state.rows.push({
            id: column.id,
            name: column.name,
            dataType: column.dataType,
            primaryKey: column.options.primaryKey,
            notNull: column.options.notNull,
            unique: column.options.unique,
            autoIncrement: column.options.autoIncrement,
            default: column.default,
            comment: column.comment,
            ui: {
              isReadname: true,
              isReaddataType: true,
              isReaddefault: true,
              isReadcomment: true
            }
          })
        })
      }
    },
    // 삭제
    delete (state) {
      JSLog('mutations', 'table grid', 'delete')
      state.rows = []
      state.table = null
    },
    // 컬럼데이터 동기화
    sync (state, data) {
      JSLog('mutations', 'table grid', 'sync')
      ERD.core.event.components.CanvasMenu.isSave = false

      if (state.table) {
        ERD.core.undoRedo.set()
        const undo = JSON.stringify(ERD.core.erd.store().state)
        if (data.isPK) {
          state.table.columns.forEach(column => {
            if (column.id === data.columnId) {
              column.ui.selected = true
            } else {
              column.ui.selected = false
            }
          })
          ERD.store().commit({
            type: 'columnKey',
            key: 'pk'
          })
          util.setData(util.getData(state.rows, data.columnId), data.columnGrid)
        } else {
          state.table.columns.forEach(column => {
            if (column.id === data.columnId) {
              column.ui.selected = true
            } else {
              column.ui.selected = false
            }
          })
          util.setData(util.getData(state.table.columns, data.columnId), data.column)
          util.setData(util.getData(state.rows, data.columnId), data.columnGrid)
          if (data.column.dataType) {
            // 컬럼 데이터타입 관계 동기화
            ERD.store().commit({
              type: 'columnRelationSync',
              tableId: state.table.id,
              columnId: data.columnId
            })
          }
          // 도메인 동기화
          if (data.column.dataType || data.column.default) {
            ERD.store().commit({
              type: 'columnDomainSync',
              tableId: state.table.id,
              columnId: data.columnId
            })
          }
        }
        ERD.core.erd.store().commit({
          type: 'columnWidthReset',
          id: state.table.id
        })
        // undo, redo 등록
        ERD.core.undoRedo.add({
          undo: undo,
          redo: JSON.stringify(ERD.core.erd.store().state)
        })
      }
    },
    // 수정모드
    edit (state, data) {
      JSLog('mutations', 'table grid', 'edit')
      const column = util.getData(state.rows, data.columnId)
      column.ui[data.current] = data.isRead
    },
    // edit 해제
    editAllNone (state) {
      JSLog('mutations', 'table grid', 'editAllNone')
      if (state.table) {
        state.rows.forEach(row => {
          row.ui.isReadname = true
          row.ui.isReaddataType = true
          row.ui.isReaddefault = true
          row.ui.isReadcomment = true
        })
      }
    }
  }
})

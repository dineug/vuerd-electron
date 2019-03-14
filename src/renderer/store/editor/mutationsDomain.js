import JSLog from '@/js/JSLog'
import * as util from '@/js/editor/util'
import ERD from '@/js/editor/ERD'

JSLog('store loaded', 'mutationsDomain')

export default {
  // 도메인 추가
  add (state) {
    JSLog('mutations', 'domain', 'add')
    ERD.core.event.components.CanvasMenu.isSave = false
    ERD.core.undoRedo.set()
    const undo = JSON.stringify(ERD.core.erd.store().state)

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
    state.domains.push(domain)

    // undo, redo 등록
    ERD.core.undoRedo.add({
      undo: undo,
      redo: JSON.stringify(ERD.core.erd.store().state)
    })
  },
  // 도메인 삭제
  delete (state, data) {
    JSLog('mutations', 'domain', 'delete')
    ERD.core.event.components.CanvasMenu.isSave = false
    ERD.core.undoRedo.set()
    const undo = JSON.stringify(ERD.core.erd.store().state)

    for (let i in state.domains) {
      if (data.id === state.domains[i].id) {
        state.domains.splice(i, 1)
        break
      }
    }

    // 도메인 연동 초기화
    state.tables.forEach(table => {
      table.columns.forEach(column => {
        if (data.id === column.domainId) {
          column.domain = ''
          column.domainId = ''
        }
      })
    })

    // undo, redo 등록
    ERD.core.undoRedo.add({
      undo: undo,
      redo: JSON.stringify(ERD.core.erd.store().state)
    })
  },
  // 도메인값 변경
  change (state, data) {
    JSLog('mutations', 'domain', 'change')
    ERD.core.event.components.CanvasMenu.isSave = false
    ERD.core.undoRedo.set()
    const undo = JSON.stringify(ERD.core.erd.store().state)

    const domain = util.getData(state.domains, data.id)
    util.setData(domain, data.domain)

    state.tables.forEach(table => {
      table.columns.forEach(column => {
        if (domain.id === column.domainId) {
          column.domain = domain.name
          column.dataType = domain.dataType
          column.default = domain.default
        }
      })
    })

    // updated 강제
    if (data.isUpdated) {
      state.domains = state.domains.slice()
    }

    this.commit({ type: 'columnWidthReset' })

    // undo, redo 등록
    ERD.core.undoRedo.add({
      undo: undo,
      redo: JSON.stringify(ERD.core.erd.store().state)
    })
  },
  // 도메인 수정모드
  edit (state, data) {
    JSLog('mutations', 'domain', 'edit')
    const domain = util.getData(state.domains, data.id)
    domain.ui[data.current] = data.isRead
  },
  // 도메인 edit 해제
  editAllNone (state) {
    JSLog('mutations', 'domain', 'editAllNone')
    state.domains.forEach(domain => {
      domain.ui.isReadname = true
      domain.ui.isReaddataType = true
      domain.ui.isReaddefault = true
    })
  }
}

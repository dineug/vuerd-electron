import JSLog from '@/js/JSLog'
import * as util from '@/js/editor/util'
import storeTable from './table'
import ERD from '@/js/editor/ERD'

JSLog('store loaded', 'mutationsColumn')

export default {
  // 컬럼 추가
  add (state, data) {
    JSLog('mutations', 'column', 'add')
    ERD.core.event.components.CanvasMenu.isSave = false
    ERD.core.undoRedo.set()
    const undo = JSON.stringify(state)

    ERD.core.event.isEdit = true

    for (let table of state.tables) {
      if (data.id === table.id) {
        table.ui.height += state.COLUMN_HEIGHT
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
            widthName: state.COLUMN_WIDTH,
            widthDataType: state.COLUMN_WIDTH,
            widthComment: state.COLUMN_WIDTH,
            widthDomain: state.COLUMN_WIDTH,
            isReadName: true,
            isReadDataType: true,
            isReadComment: true,
            isReadDomain: true
          }
        }
        if (data.isInit) {
          util.setData(column, data.column)
        }
        if (table.columns.length !== 0) {
          column.ui.widthName = table.columns[0].ui.widthName
          column.ui.widthDataType = table.columns[0].ui.widthDataType
          column.ui.widthComment = table.columns[0].ui.widthComment
          column.ui.widthDomain = table.columns[0].ui.widthDomain
        }
        table.columns.push(column)
        break
      }
    }

    if (!data.isInit) {
      // undo, redo 등록
      ERD.core.undoRedo.add({
        undo: undo,
        redo: JSON.stringify(state)
      })
    }
  },
  // 컬럼 삭제
  delete (state, data) {
    JSLog('mutations', 'column', 'delete')
    ERD.core.event.components.CanvasMenu.isSave = false
    ERD.core.undoRedo.set()
    const undo = JSON.stringify(state)

    const table = util.getData(state.tables, data.tableId)
    for (let i in table.columns) {
      if (data.columnId === table.columns[i].id) {
        table.columns.splice(i, 1)
        table.ui.height -= state.COLUMN_HEIGHT
        break
      }
    }

    // 관계처리
    for (let i = 0; i < state.lines.length; i++) {
      if (state.lines[i].points[0].id === data.tableId || state.lines[i].points[1].id === data.tableId) {
        let endColumnId = null
        for (let j in state.lines[i].points[0].columnIds) {
          if (data.columnId === state.lines[i].points[0].columnIds[j] || data.columnId === state.lines[i].points[1].columnIds[j]) {
            endColumnId = state.lines[i].points[1].columnIds[j]
            state.lines[i].points[0].columnIds.splice(j, 1)
            state.lines[i].points[1].columnIds.splice(j, 1)
            util.changeIdentification(state, util.getData(state.tables, state.lines[i].points[1].id))
            break
          }
        }
        // fk시 해제처리
        if (state.lines[i].points[0].id === data.tableId) {
          const endTable = util.getData(state.tables, state.lines[i].points[1].id)
          for (let column of endTable.columns) {
            if (column.id === endColumnId) {
              if (column.ui.pfk) {
                column.ui.pk = true
                column.ui.pfk = false
              } else if (column.ui.fk) {
                column.ui.fk = false
              }
              break
            }
          }
        }
        // 관계 컬럼이 0개시 삭제
        if (state.lines[i].points[0].columnIds.length === 0 || state.lines[i].points[1].columnIds.length === 0) {
          this.commit({
            type: 'lineDelete',
            id: state.lines[i].id
          })
          i--
        }
      }
    }

    // 테이블 상세 활성화
    storeTable.commit({
      type: 'active',
      id: data.tableId
    })

    // 마지막 컬럼 포커스
    const isColumns = table.columns.length
    if (isColumns !== 0) {
      document.getElementById(`columnName_${table.columns[isColumns - 1].id}`).focus()
    }

    this.commit({
      type: 'columnWidthReset',
      id: data.tableId
    })
    // undo, redo 등록
    ERD.core.undoRedo.add({
      undo: undo,
      redo: JSON.stringify(state)
    })
  },
  // 컬럼 NULL 조건 변경
  changeNull (state, data) {
    JSLog('mutations', 'column', 'changeNull')
    ERD.core.event.components.CanvasMenu.isSave = false
    ERD.core.undoRedo.set()
    const undo = JSON.stringify(state)

    const table = util.getData(state.tables, data.tableId)
    const column = util.getData(table.columns, data.columnId)
    column.options.notNull = !column.options.notNull

    // undo, redo 등록
    ERD.core.undoRedo.add({
      undo: undo,
      redo: JSON.stringify(state)
    })
  },
  // 컬럼 선택
  selected (state, data) {
    JSLog('mutations', 'column', 'selected')
    this.commit({
      type: 'tableSelectedAllNone',
      isTable: false,
      isColumn: true
    })
    const table = util.getData(state.tables, data.tableId)
    if (table) {
      const column = util.getData(table.columns, data.columnId)
      if (column) column.ui.selected = true
    }

    // 테이블 상세 활성화
    storeTable.commit({
      type: 'active',
      id: data.tableId
    })
  },
  // 컬럼 key active
  key (state, data) {
    JSLog('mutations', 'column', 'key')
    ERD.core.event.components.CanvasMenu.isSave = false
    ERD.core.undoRedo.set()
    const undo = JSON.stringify(state)

    for (let table of state.tables) {
      let check = false
      for (let column of table.columns) {
        if (column.ui.selected) {
          if (data.key === 'pk') {
            column.options.primaryKey = !column.options.primaryKey
            if (column.options.primaryKey) {
              column.options.notNull = true
            }
          }
          if (column.ui.fk) {
            column.ui.fk = false
            column.ui.pfk = true
            util.changeIdentification(state, table)
          } else if (column.ui.pfk) {
            column.ui.fk = true
            column.ui.pfk = false
            util.changeIdentification(state, table)
          } else {
            column.ui[data.key] = !column.ui[data.key]
          }
          check = true

          // 테이블 상세 활성화
          storeTable.commit({
            type: 'active',
            id: table.id
          })
        }
      }
      if (check) {
        break
      }
    }

    // undo, redo 등록
    ERD.core.undoRedo.add({
      undo: undo,
      redo: JSON.stringify(state)
    })
  },
  // 컬럼 데이터변경
  changeDataType (state, data) {
    JSLog('mutations', 'column', 'changeDataType')
    ERD.core.event.components.CanvasMenu.isSave = false
    ERD.core.undoRedo.set()
    const undo = JSON.stringify(state)

    const table = util.getData(state.tables, data.tableId)
    const column = util.getData(table.columns, data.columnId)
    column.dataType = data.dataType

    // 테이블 상세 활성화
    storeTable.commit({
      type: 'active',
      id: data.tableId
    })

    if (column.domainId.trim() !== '') {
      this.commit({
        type: 'domainChange',
        id: column.domainId,
        domain: {
          name: column.domain,
          dataType: column.dataType,
          default: column.default
        }
      })
    }

    this.commit({
      type: 'columnWidthReset',
      id: data.tableId
    })
    // undo, redo 등록
    ERD.core.undoRedo.add({
      undo: undo,
      redo: JSON.stringify(state)
    })
  },
  // 컬럼 데이터타입 힌트 show/hide
  dataTypeHintVisible (state, data) {
    JSLog('mutations', 'column', 'dataTypeHintVisible')
    const table = util.getData(state.tables, data.tableId)
    const column = util.getData(table.columns, data.columnId)
    column.ui.isDataTypeHint = data.isDataTypeHint
  },
  // 컬럼 데이터타입 힌트 show/hide ALL
  dataTypeHintVisibleAll (state, data) {
    JSLog('mutations', 'column', 'dataTypeHintVisibleAll')
    for (let table of state.tables) {
      for (let column of table.columns) {
        column.ui.isDataTypeHint = data.isDataTypeHint
      }
    }
  },
  // 컬럼 데이터타입 관계 동기화
  relationSync (state, data) {
    JSLog('mutations', 'column', 'relationSync')
    ERD.core.event.components.CanvasMenu.isSave = false
    const table = util.getData(state.tables, data.tableId)
    const column = util.getData(table.columns, data.columnId)
    if (util.isRelationSync(state, data.tableId, column)) {
      // 동기화 컬럼 탐색
      const columns = []
      const lines = state.lines.slice()
      util.getColumnsSync(columns, lines, state, data.tableId, column)
      // 컬럼 데이터 동기화
      columns.forEach(v => {
        v.dataType = column.dataType
        v.domain = column.domain
        v.domainId = column.domainId
        v.default = column.default
      })
    }
  },
  // 컬럼 너비 리셋
  widthReset (state, data) {
    JSLog('mutations', 'column', 'widthReset')
    if (data.id) {
      const table = util.getData(state.tables, data.id)
      const max = util.columnMaxWidth(state, table.columns)
      table.columns.forEach(column => {
        column.ui.widthName = max.name
        column.ui.widthDataType = max.dataType
        column.ui.widthComment = max.comment
        column.ui.widthDomain = max.domain
      })
      if (table.columns.length !== 0) {
        let width = table.columns[0].ui.widthName +
          table.columns[0].ui.widthDataType +
          table.columns[0].ui.widthComment +
          table.columns[0].ui.widthDomain
        if (width > state.COLUMN_WIDTH * 4) {
          table.ui.width = state.TABLE_WIDTH + width - state.COLUMN_WIDTH * 4
        } else {
          table.ui.width = state.TABLE_WIDTH
        }
      } else {
        table.ui.width = state.TABLE_WIDTH
      }
    } else {
      state.tables.forEach(table => {
        const max = util.columnMaxWidth(state, table.columns)
        table.columns.forEach(column => {
          column.ui.widthName = max.name
          column.ui.widthDataType = max.dataType
          column.ui.widthComment = max.comment
          column.ui.widthDomain = max.domain
        })
        if (table.columns.length !== 0) {
          let width = table.columns[0].ui.widthName +
            table.columns[0].ui.widthDataType +
            table.columns[0].ui.widthComment +
            table.columns[0].ui.widthDomain
          if (width > state.COLUMN_WIDTH * 4) {
            table.ui.width = state.TABLE_WIDTH + width - state.COLUMN_WIDTH * 4
          } else {
            table.ui.width = state.TABLE_WIDTH
          }
        } else {
          table.ui.width = state.TABLE_WIDTH
        }
      })
    }
  },
  // 컬럼 편집모드
  edit (state, data) {
    JSLog('mutations', 'column', 'edit')
    const table = util.getData(state.tables, data.tableId)
    const column = util.getData(table.columns, data.columnId)
    column.ui[data.current] = data.isRead
    this.commit({ type: 'columnValidDomain' })
  },
  // 컬럼 도메인 힌트 show/hide
  domainHintVisible (state, data) {
    JSLog('mutations', 'column', 'domainHintVisible')
    const table = util.getData(state.tables, data.tableId)
    const column = util.getData(table.columns, data.columnId)
    column.ui.isDomainHint = data.isDomainHint
  },
  // 컬럼 도메인 힌트 show/hide ALL
  domainHintVisibleAll (state, data) {
    JSLog('mutations', 'column', 'domainHintVisibleAll')
    for (let table of state.tables) {
      for (let column of table.columns) {
        column.ui.isDomainHint = data.isDomainHint
      }
    }
  },
  // 컬럼 도메인 변경
  changeDomain (state, data) {
    JSLog('mutations', 'column', 'changeDomain')
    ERD.core.event.components.CanvasMenu.isSave = false
    ERD.core.undoRedo.set()
    const undo = JSON.stringify(state)

    const table = util.getData(state.tables, data.tableId)
    const column = util.getData(table.columns, data.columnId)
    const domain = util.getData(state.domains, data.domainId)
    column.domain = domain.name
    column.domainId = data.domainId
    column.dataType = domain.dataType
    column.default = domain.default

    // 컬럼 데이터타입 관계 동기화
    this.commit({
      type: 'columnRelationSync',
      tableId: data.tableId,
      columnId: data.columnId
    })

    this.commit({
      type: 'columnWidthReset',
      id: data.tableId
    })
    // undo, redo 등록
    ERD.core.undoRedo.add({
      undo: undo,
      redo: JSON.stringify(state)
    })
  },
  // 컬럼 도메인 유효성
  validDomain (state) {
    JSLog('mutations', 'column', 'validDomain')

    state.tables.forEach(table => {
      table.columns.forEach(column => {
        if (column.domainId.trim() === '') {
          column.domain = ''
        }
      })
    })
    this.commit({ type: 'columnWidthReset' })
  },
  // 컬럼 도메인 동기화
  domainSync (state, data) {
    JSLog('mutations', 'column', 'domainSync')
    ERD.core.event.components.CanvasMenu.isSave = false
    const table = util.getData(state.tables, data.tableId)
    const column = util.getData(table.columns, data.columnId)
    if (column.domain === '') {
      ERD.core.undoRedo.set()
      const undo = JSON.stringify(state)

      column.domainId = ''
      // 동기화 컬럼 탐색
      const columns = []
      const lines = state.lines.slice()
      util.getColumnsSync(columns, lines, state, data.tableId, column)
      // 컬럼 동기화
      columns.forEach(v => {
        v.domain = column.domain
        v.domainId = column.domainId
      })

      // undo, redo 등록
      ERD.core.undoRedo.add({
        undo: undo,
        redo: JSON.stringify(state)
      })
    } else if (column.domainId.trim() !== '') {
      this.commit({
        type: 'domainChange',
        isUpdated: true,
        id: column.domainId,
        domain: {
          name: column.domain,
          dataType: column.dataType,
          default: column.default
        }
      })
    }
  }
}

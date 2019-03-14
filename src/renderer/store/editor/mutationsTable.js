import JSLog from '@/js/JSLog'
import * as util from '@/js/editor/util'
import ERD from '@/js/editor/ERD'
import storeTable from './table'

JSLog('store loaded', 'mutationsTable')

export default {
  // 테이블 추가
  add (state, data) {
    JSLog('mutations', 'table', 'add')
    ERD.core.event.components.CanvasMenu.isSave = false
    ERD.core.undoRedo.set()
    const undo = JSON.stringify(state)

    ERD.core.event.isEdit = true

    const newTable = {
      id: util.guid(),
      name: '',
      comment: '',
      columns: [],
      ui: {
        selected: false,
        top: document.documentElement.scrollTop + 100,
        left: document.documentElement.scrollLeft + 200,
        width: state.TABLE_WIDTH,
        height: state.TABLE_HEIGHT,
        zIndex: util.getZIndex(),
        isReadName: true,
        isReadComment: true
      }
    }

    util.setPosition(newTable)
    state.tables.push(newTable)
    this.commit({
      type: 'tableSelected',
      id: newTable.id,
      isNotRelation: true
    })

    // undo, redo 등록
    ERD.core.undoRedo.add({
      undo: undo,
      redo: JSON.stringify(state)
    })
  },
  // 테이블 삭제
  delete (state, data) {
    JSLog('mutations', 'table', 'delete')
    ERD.core.event.components.CanvasMenu.isSave = false
    ERD.core.undoRedo.set()
    const undo = JSON.stringify(state)

    // 테이블 상세 그리드 해제
    storeTable.commit({ type: 'delete' })

    for (let i in state.tables) {
      if (data.id === state.tables[i].id) {
        state.tables.splice(i, 1)
        break
      }
    }
    // 관계처리
    for (let i = 0; i < state.lines.length; i++) {
      let isLine = false
      for (let j in state.lines[i].points) {
        if (data.id === state.lines[i].points[j].id) {
          isLine = true
          break
        }
      }
      if (isLine) {
        // fk시 해제처리
        if (data.id === state.lines[i].points[0].id) {
          const endTable = util.getData(state.tables, state.lines[i].points[1].id)
          if (endTable) {
            for (let column of endTable.columns) {
              for (let columnId of state.lines[i].points[1].columnIds) {
                if (columnId === column.id) {
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
          }
        }
        // 관계 컬럼이 0개시 삭제
        this.commit({
          type: 'lineDelete',
          id: state.lines[i].id
        })
        i--
      }
    }
    for (let i in ERD.core.event.tableIds) {
      if (ERD.core.event.tableIds[i] === data.id) {
        ERD.core.event.tableIds.splice(i, 1)
        break
      }
    }

    // undo, redo 등록
    ERD.core.undoRedo.add({
      undo: undo,
      redo: JSON.stringify(state)
    })
  },
  // 테이블 높이 리셋
  heightReset (state) {
    JSLog('mutations', 'table', 'heightReset')
    ERD.core.event.components.CanvasMenu.isSave = false
    for (let table of state.tables) {
      table.ui.height = table.columns.length * state.COLUMN_HEIGHT + state.TABLE_HEIGHT
    }
  },
  // 테이블 선택
  selected (state, data) {
    JSLog('mutations', 'table', 'selected')
    const table = util.getData(state.tables, data.id)
    // z-index 처리
    const zIndex = util.getZIndex()
    if (table && table.ui.zIndex !== zIndex - 1) {
      table.ui.zIndex = zIndex
    }

    // multi select
    if (data.ctrlKey) {
      table.ui.selected = true
    } else {
      state.tables.forEach(v => {
        v.ui.selected = data.id === v.id
      })
      this.commit({ type: 'memoSelectedAllNone' })
    }
    // column 선택 제거
    if (!data.isColumnSelected) {
      this.commit({
        type: 'tableSelectedAllNone',
        isTable: false,
        isColumn: true
      })
    }

    if (data.isEvent) {
      const tableIds = []
      const memoIds = []
      for (let targetTable of state.tables) {
        if (targetTable.ui.selected) {
          tableIds.push(targetTable.id)
        }
      }
      for (let targetMemo of state.memos) {
        if (targetMemo.ui.selected) {
          memoIds.push(targetMemo.id)
        }
      }
      ERD.core.event.onDraggable('start', tableIds, memoIds)
    }

    // 테이블추가에서 호출시 처리
    if (!data.isNotRelation) {
      // 관계 drawing 시작
      if (ERD.core.event.isCursor && !ERD.core.event.isDraw) {
        // table pk 컬럼이 있는지 체크 없으면 자동생성
        if (!util.isColumnOption('primaryKey', table.columns)) {
          this.commit({
            type: 'columnAdd',
            id: table.id,
            isInit: true,
            column: {
              name: util.autoName(table.columns, 'unnamed'),
              options: {
                primaryKey: true,
                notNull: true
              },
              ui: {
                pk: true
              }
            }
          })
        }
        this.commit({
          type: 'lineAdd',
          tableId: data.id,
          x: table.ui.left,
          y: table.ui.top
        })
        // 관계 drawing 종료
      } else if (ERD.core.event.isDraw) {
        ERD.core.event.onDraw('stop', data.id)
      }
    }

    // 테이블 상세 활성화
    storeTable.commit({
      type: 'active',
      id: data.id
    })
  },
  // 테이블 top, left 변경
  draggable (state, data) {
    JSLog('mutations', 'table', 'draggable')
    ERD.core.event.components.CanvasMenu.isSave = false
    const table = util.getData(state.tables, data.id)
    table.ui.top += data.y
    table.ui.left += data.x
    // 관계 업데이트
    state.lines.forEach(line => {
      line.points.forEach(v => {
        if (v.id === data.id) {
          v.x = table.ui.left
          v.y = table.ui.top
        }
      })
    })
  },
  // 테이블 및 컬럼 selected All 해제
  selectedAllNone (state, data) {
    JSLog('mutations', 'table', 'selectedAllNone')
    // 테이블 상세 그리드 해제
    if (data.isTable) {
      storeTable.commit({ type: 'delete' })
    }

    state.tables.forEach(table => {
      if (data.isTable) table.ui.selected = false
      table.columns.forEach(column => {
        if (data.isColumn) column.ui.selected = false
      })
    })
  },
  // 테이블 드래그 selected
  multiSelected (state, data) {
    JSLog('mutations', 'table', 'multiSelected')
    state.tables.forEach(table => {
      const point = util.getPoint(table.ui)
      if (data.min.x <= point.top.x &&
        data.min.y <= point.left.y &&
        data.max.x >= point.top.x &&
        data.max.y >= point.left.y) {
        table.ui.selected = true
      } else {
        table.ui.selected = false
      }
    })
  },
  // 테이블 전체 선택
  selectedAll (state) {
    JSLog('mutations', 'table', 'selectedAll')
    state.tables.forEach(table => {
      table.ui.selected = true
    })
  },
  // 테이블 편집모드
  edit (state, data) {
    JSLog('mutations', 'table', 'edit')
    const table = util.getData(state.tables, data.id)
    table.ui[data.current] = data.isRead
  },
  // 테이블 및 컬럼 edit all 해제
  editAllNone (state, data) {
    JSLog('mutations', 'table', 'editAllNone')

    state.tables.forEach(table => {
      if (data.isTable) {
        table.ui.isReadName = true
        table.ui.isReadComment = true
      }
      table.columns.forEach(column => {
        if (data.isColumn) {
          column.ui.isReadName = true
          column.ui.isReadDataType = true
          column.ui.isReadComment = true
          column.ui.isReadDomain = true
        }
      })
    })

    this.commit({ type: 'columnValidDomain' })
  }
}

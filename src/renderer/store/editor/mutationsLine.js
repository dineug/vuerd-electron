import JSLog from '@/js/JSLog'
import * as util from '@/js/editor/util'
import ERD from '@/js/editor/ERD'

JSLog('store loaded', 'mutationsLine')

export default {
  // 관계 생성
  add (state, data) {
    ERD.core.undoRedo.setUndo('draw')

    const line = {
      id: util.guid(),
      type: ERD.core.event.cursor,
      isIdentification: false,
      points: [
        {
          id: data.tableId,
          x: data.x,
          y: data.y,
          columnIds: []
        },
        {
          id: null,
          x: data.x,
          y: data.y,
          columnIds: []
        }
      ]
    }
    state.lines.push(line)
    ERD.core.event.onDraw('start', line.id)
  },
  // 관계 drawing
  draw (state, data) {
    JSLog('mutations', 'line', 'draw')
    const line = util.getData(state.lines, data.id)
    line.points[1].x = data.x
    line.points[1].y = data.y
    line.points[0].columnIds = data.startColumnIds
    line.points[1].columnIds = data.endColumnIds
    if (data.tableId) line.points[1].id = data.tableId
    this.commit({ type: 'columnWidthReset' })
  },
  // 관계 삭제
  delete (state, data) {
    JSLog('mutations', 'line', 'delete')
    for (let i in state.lines) {
      if (data.id === state.lines[i].id) {
        state.lines.splice(i, 1)
        break
      }
    }
  },
  // 관계 식별, 비식별 변경
  changeIdentification (state, data) {
    JSLog('mutations', 'line', 'changeIdentification')
    const line = util.getData(state.lines, data.id)
    line.isIdentification = data.isIdentification
  },
  // 관계 컬럼 이동 유효성
  validColumn (state, data) {
    JSLog('mutations', 'line', 'validColumn')
    // 테이블 id 탐색
    let tableId = null
    for (let table of state.tables) {
      for (let column of table.columns) {
        if (data.id === column.id) {
          tableId = table.id
          ERD.store().commit({
            type: 'tableSelected',
            id: table.id,
            isColumnSelected: true
          })
          break
        }
      }
      if (tableId) break
    }

    // 관계처리
    for (let i = 0; i < state.lines.length; i++) {
      let isFk = false
      let endColumnId = null
      for (let j in state.lines[i].points[0].columnIds) {
        if (data.id === state.lines[i].points[0].columnIds[j] && tableId !== state.lines[i].points[0].id) {
          endColumnId = state.lines[i].points[1].columnIds[j]
          state.lines[i].points[0].columnIds.splice(j, 1)
          state.lines[i].points[1].columnIds.splice(j, 1)
          util.changeIdentification(state, util.getData(state.tables, state.lines[i].points[1].id))
          break
        }
      }
      for (let j in state.lines[i].points[1].columnIds) {
        if (data.id === state.lines[i].points[1].columnIds[j] && tableId !== state.lines[i].points[1].id) {
          isFk = true
          state.lines[i].points[0].columnIds.splice(j, 1)
          state.lines[i].points[1].columnIds.splice(j, 1)
          util.changeIdentification(state, util.getData(state.tables, state.lines[i].points[1].id))
          break
        }
      }
      // fk시 해제처리
      if (endColumnId != null) {
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
      // fk시 해제처리
      if (isFk) {
        const table = util.getData(state.tables, tableId)
        const column = util.getData(table.columns, data.id)
        if (column.ui.pfk) {
          column.ui.pk = true
          column.ui.pfk = false
        } else if (column.ui.fk) {
          column.ui.fk = false
        }
      }
    }

    this.commit({ type: 'columnWidthReset' })
    // undo, redo 등록
    ERD.core.undoRedo.add({
      undo: ERD.core.undoRedo.undoJson.draggable,
      redo: JSON.stringify(state)
    })
  },
  // 관계 컬럼 hover 처리
  hover (state, data) {
    JSLog('mutations', 'line', 'hover')
    if (!ERD.core.event.isDraw) {
      const line = util.getData(state.lines, data.id)
      const startTable = util.getData(state.tables, line.points[0].id)
      const endTable = util.getData(state.tables, line.points[1].id)
      for (let columnId of line.points[0].columnIds) {
        for (let column of startTable.columns) {
          if (column.id === columnId) {
            column.ui.isHover = data.isHover
            break
          }
        }
      }

      for (let columnId of line.points[1].columnIds) {
        for (let column of endTable.columns) {
          if (column.id === columnId) {
            column.ui.isHover = data.isHover
            break
          }
        }
      }
    }
  }
}

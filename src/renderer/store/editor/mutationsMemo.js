import JSLog from '@/js/JSLog'
import * as util from '@/js/editor/util'
import ERD from '@/js/editor/ERD'

JSLog('store loaded', 'mutationsMemo')

export default {
  // 메모 추가
  add (state, data) {
    JSLog('mutations', 'memo', 'add')
    ERD.core.event.components.CanvasMenu.isSave = false
    ERD.core.undoRedo.set()
    const undo = JSON.stringify(state)

    const newMemo = {
      id: util.guid(),
      content: '',
      ui: {
        selected: false,
        top: document.documentElement.scrollTop + 100,
        left: document.documentElement.scrollLeft + 200,
        width: state.MEMO_WIDTH,
        height: state.MEMO_HEIGHT,
        zIndex: util.getZIndex()
      }
    }

    util.setPosition(newMemo)
    state.memos.push(newMemo)
    this.commit({
      type: 'memoSelected',
      id: newMemo.id
    })

    // undo, redo 등록
    ERD.core.undoRedo.add({
      undo: undo,
      redo: JSON.stringify(state)
    })
  },
  // 메모 삭제
  delete (state, data) {
    JSLog('mutations', 'memo', 'delete')
    ERD.core.event.components.CanvasMenu.isSave = false
    ERD.core.undoRedo.set()
    const undo = JSON.stringify(state)

    for (let i in state.memos) {
      if (data.id === state.memos[i].id) {
        state.memos.splice(i, 1)
        break
      }
    }

    // undo, redo 등록
    ERD.core.undoRedo.add({
      undo: undo,
      redo: JSON.stringify(state)
    })
  },
  // 메모 크기 수정
  setWidthHeight (state, data) {
    JSLog('mutations', 'memo', 'setWidthHeight')
    ERD.core.event.components.CanvasMenu.isSave = false
    const memo = util.getData(state.memos, data.id)
    memo.ui.width = data.width
    memo.ui.height = data.height
  },
  // 메모 선택
  selected (state, data) {
    JSLog('mutations', 'memo', 'selected')
    const memo = util.getData(state.memos, data.id)
    // z-index 처리
    const zIndex = util.getZIndex()
    if (memo && memo.ui.zIndex !== zIndex - 1) {
      memo.ui.zIndex = zIndex
    }

    // multi select
    if (data.ctrlKey) {
      memo.ui.selected = true
    } else {
      state.memos.forEach(v => {
        v.ui.selected = data.id === v.id
      })
      this.commit({
        type: 'tableSelectedAllNone',
        isTable: true,
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
  },
  // 메모 top, left 변경
  draggable (state, data) {
    JSLog('mutations', 'memo', 'draggable')
    ERD.core.event.components.CanvasMenu.isSave = false
    const memo = util.getData(state.memos, data.id)
    memo.ui.top += data.y
    memo.ui.left += data.x
  },
  // 메모 선택 전체 해제
  selectedAllNone (state) {
    JSLog('mutations', 'memo', 'selectedAllNone')
    state.memos.forEach(memo => {
      memo.ui.selected = false
    })
  },
  // 메모 드래그 selected
  multiSelected (state, data) {
    JSLog('mutations', 'memo', 'multiSelected')
    state.memos.forEach(memo => {
      const point = util.getPoint(memo.ui)
      if (data.min.x <= point.top.x &&
        data.min.y <= point.left.y &&
        data.max.x >= point.top.x &&
        data.max.y >= point.left.y) {
        memo.ui.selected = true
      } else {
        memo.ui.selected = false
      }
    })
  },
  // 메모 전체 선택
  selectedAll (state) {
    JSLog('mutations', 'memo', 'selectedAll')
    state.memos.forEach(memo => {
      memo.ui.selected = true
    })
  },
  // 메모 리사이징
  resize (state, data) {
    JSLog('mutations', 'memo', 'resize')
    ERD.core.event.components.CanvasMenu.isSave = false
    const memo = util.getData(state.memos, data.id)
    memo.ui.height += data.y
    memo.ui.width += data.x
    if (memo.ui.height < state.MEMO_HEIGHT) {
      memo.ui.height = state.MEMO_HEIGHT
    }
    if (memo.ui.width < state.MEMO_WIDTH) {
      memo.ui.width = state.MEMO_WIDTH
    }
  }
}

<template lang="pug">
  .main_canvas(v-if="!isPreview"
  :style="`width: ${CANVAS_WIDTH}px; height: ${CANVAS_HEIGHT}px;`")
    // mouse drag
    svg.svg_drag(v-if="svg.isDarg"
    :style="`top: ${svg.top}px; left: ${svg.left}px; width: ${svg.width}px; height: ${svg.height}px;`")
      rect(:width="svg.width" :height="svg.height"
      stroke="#0098ff" stroke-width="1" stroke-opacity="0.9" stroke-dasharray="3"
      fill-opacity="0.3")

    // 테이블
    .erd_table(v-for="table in tables" :key="table.id" :table_id="table.id"
    :class="{ selected: table.ui.selected}"
    :style="`width: ${table.ui.width}px; top: ${table.ui.top}px; left: ${table.ui.left}px; z-index: ${table.ui.zIndex};`"
    @mousedown="tableSelected($event, table.id)")

      // 테이블 해더
      .erd_table_top
        button.close(title="Ctrl + Delete"
        @click="tableDelete(table.id)")
          font-awesome-icon(icon="times")

        button.add(title="Alt + Enter"
        @click="columnAdd(table.id)")
          font-awesome-icon(icon="plus")

      .erd_table_header
        input(v-model="table.name" v-focus :readonly="table.ui.isReadName"
        :class="{ edit: !table.ui.isReadName }"
        type="text" placeholder="table" spellcheck="false"
        @input="onChangeTableGrid(table.id)"
        @keydown="onKeyArrowMoveHead($event, table.ui.isReadName)"
        @keyup.enter="onEnterEditor($event, table.ui.isReadName, 'isReadName', table.id)"
        @dblclick="onEnterEditor($event, table.ui.isReadName, 'isReadName', table.id)"
        @focus="onFocus(table.id)"
        @blur="onBlur")

        input(v-model="table.comment" :readonly="table.ui.isReadComment"
        :class="{ edit: !table.ui.isReadComment }"
        type="text" placeholder="comment" spellcheck="false"
        @keydown="onKeyArrowMoveHead($event, table.ui.isReadComment)"
        @keyup.enter="onEnterEditor($event, table.ui.isReadComment, 'isReadComment', table.id)"
        @dblclick="onEnterEditor($event, table.ui.isReadComment, 'isReadComment', table.id)"
        @focus="onFocus(table.id)"
        @blur="onBlur")

      draggable(v-model="table.columns" :options="{group:'table'}"
      @start="onDraggableUndo"
      @update="onDraggable"
      @add="onDraggable")

        // 컬럼
        .erd_column(v-for="column in table.columns" :key="column.id" :column_id="column.id"
        :class="{ selected: column.ui.selected, relation_active: column.ui.isHover}"
        :style="`height: ${COLUMN_HEIGHT}px;`"
        @mousedown.stop="onColumnSelected($event, table.id, column.id)")

          // 컬럼 key
          .erd_column_key(:class="{ pk: column.ui.pk, fk: column.ui.fk, pfk: column.ui.pfk }")
            font-awesome-icon(icon="key")

          // 컬럼 이름
          input(v-model="column.name" v-focus :id="`columnName_${column.id}`" :readonly="column.ui.isReadName"
          :class="{ edit: !column.ui.isReadName }"
          :style="`width: ${column.ui.widthName}px;`"
          type="text" placeholder="column" spellcheck="false"
          @input="onChangeTableGrid(table.id)"
          @keyup.enter="onEnterEditor($event, column.ui.isReadName, 'isReadName', table.id, column.id)"
          @dblclick="onEnterEditor($event, column.ui.isReadName, 'isReadName', table.id, column.id)"
          @keydown="onKeyArrowMove($event, column.ui.isReadName)"
          @focus="onFocus(table.id, column.id)"
          @blur="onBlur")

          // 도메인
          div
            input.erd_domain(v-model="column.domain" :readonly="column.ui.isReadDomain"
            :class="{ edit: !column.ui.isReadDomain }"
            :style="`width: ${column.ui.widthDomain}px;`"
            type="text" placeholder="domain" spellcheck="false"
            @input="onChangeTableGrid(table.id)"
            @change="changeDomain(table.id, column.id)"
            @keyup="domainHintVisible($event, table.id, column.id, !column.ui.isReadDomain)"
            @keyup.enter="onEnterEditor($event, column.ui.isReadDomain, 'isReadDomain', table.id, column.id)"
            @dblclick="onEnterEditor($event, column.ui.isReadDomain, 'isReadDomain', table.id, column.id)"
            @keydown="hintFocus($event, table.id, column.id, column.ui.isReadDomain, 'domain')"
            @focus="onFocus(table.id, column.id)"
            @blur="onBlur")

            transition-group.erd_domain_list(v-if="column.ui.isDomainHint"
            tag="ul"
            @before-enter="onBeforeEnter"
            @enter="onEnter"
            @leave="onLeave")
              li(v-for="domain in domains" :key="domain.id" :domain_id="domain.id"
              @click="columnChangeDomain($event, table.id, column.id, domain.id)"
              @mouseover="hintAddClass") {{ domain.name }}

          // 컬럼 데이터타입
          div
            input.erd_data_type(v-model="column.dataType" :readonly="column.ui.isReadDataType"
            :class="{ edit: !column.ui.isReadDataType }"
            :style="`width: ${column.ui.widthDataType}px;`"
            type="text" placeholder="dataType" spellcheck="false"
            @input="onChangeTableGrid(table.id, column.id)"
            @keyup="dataTypeHintVisible($event, table.id, column.id, !column.ui.isReadDataType)"
            @keyup.enter="onEnterEditor($event, column.ui.isReadDataType, 'isReadDataType', table.id, column.id)"
            @dblclick="onEnterEditor($event, column.ui.isReadDataType, 'isReadDataType', table.id, column.id)"
            @keydown="hintFocus($event, table.id, column.id, column.ui.isReadDataType, 'dataType')"
            @focus="onFocus(table.id, column.id)"
            @blur="onBlur")

            transition-group.erd_data_type_list(v-if="column.ui.isDataTypeHint"
            tag="ul"
            @before-enter="onBeforeEnter"
            @enter="onEnter"
            @leave="onLeave")
              li(v-for="dataType in dataTypes" :key="dataType.name"
              @click="columnChangeDataType($event, table.id, column.id, dataType.name)"
              @mouseover="hintAddClass") {{ dataType.name }}

          // 컬럼 not-null
          input.erd_column_not_null(v-if="column.options.notNull"
          type="text" readonly value="N-N"
          @click="columnChangeNull(table.id, column.id)"
          @keyup.13="columnChangeNull(table.id, column.id)"
          @keydown="onKeyArrowMove($event, true)"
          @focus="onFocus(table.id, column.id)"
          @blur="onBlur")
          input.erd_column_not_null(v-else
          type="text" readonly value="NULL"
          @click="columnChangeNull(table.id, column.id)"
          @keyup.13="columnChangeNull(table.id, column.id)"
          @keydown="onKeyArrowMove($event, true)"
          @focus="onFocus(table.id, column.id)"
          @blur="onBlur")

          // 컬럼 comment
          input(v-model="column.comment" :readonly="column.ui.isReadComment"
          :class="{ edit: !column.ui.isReadComment }"
          :style="`width: ${column.ui.widthComment}px;`"
          type="text" placeholder="comment" spellcheck="false"
          @input="onChangeTableGrid(table.id)"
          @keyup.enter="onEnterEditor($event, column.ui.isReadComment, 'isReadComment', table.id, column.id)"
          @dblclick="onEnterEditor($event, column.ui.isReadComment, 'isReadComment', table.id, column.id)"
          @keydown="onKeyArrowMove($event, column.ui.isReadComment)"
          @keydown.9="columnLastTabFocus"
          @focus="onFocus(table.id, column.id)"
          @blur="onBlur")

          // 컬럼 삭제 버튼
          button(title="Alt + Delete"
          @click="columnDelete(table.id, column.id)")
            font-awesome-icon(icon="times")

    // 메모
    .erd_memo(v-for="memo in memos" :key="memo.id"
    :class="{ selected: memo.ui.selected }"
    :style="`top: ${memo.ui.top}px; left: ${memo.ui.left}px; z-index: ${memo.ui.zIndex};`"
    @mousedown="memoSelected($event, memo.id)")
      .erd_memo_top
        button.close(title="Ctrl + Delete"
        @click="memoDelete(memo.id)")
          font-awesome-icon(icon="times")

      textarea(v-model="memo.content" spellcheck="false"
      :style="`width: ${memo.ui.width}px; height: ${memo.ui.height}px;`"
      @mouseup="memoSize($event, memo.id)")

      .erd_memo_bottom
        button(@mousedown.stop="memoResize(memo.id)")
          font-awesome-icon(icon="expand-arrows-alt")

  // ========================================== 미리보기 영역 이벤트 중첩방지 ==========================================
  .main_canvas(v-else
  :style="`width: ${CANVAS_WIDTH}px; height: ${CANVAS_HEIGHT}px;`")
    svg.svg_drag(v-if="svg.isDarg" :style="`top: ${svg.top}px; left: ${svg.left}px; width: ${svg.width}px; height: ${svg.height}px;`")
      rect(:width="svg.width" :height="svg.height" stroke="#0098ff" stroke-width="1" stroke-opacity="0.9" stroke-dasharray="3" fill-opacity="0.3")
    .erd_table(v-for="table in tables" :key="table.id" :table_id="table.id" :class="{ selected: table.ui.selected}" :style="`width: ${table.ui.width}px; top: ${table.ui.top}px; left: ${table.ui.left}px; z-index: ${table.ui.zIndex};`")
      .erd_table_top
        button
          font-awesome-icon(icon="times")
        button
          font-awesome-icon(icon="plus")
      .erd_table_header
        input(v-model="table.name" type="text" placeholder="table" spellcheck="false")
        input(v-model="table.comment" type="text" placeholder="comment" spellcheck="false")
      .erd_column(v-for="column in table.columns" :key="column.id" :column_id="column.id" :class="{ selected: column.ui.selected, relation_active: column.ui.isHover}" :style="`height: ${COLUMN_HEIGHT}px;`")
        .erd_column_key(:class="{ pk: column.ui.pk, fk: column.ui.fk, pfk: column.ui.pfk }")
          font-awesome-icon(icon="key")
        input(v-model="column.name" type="text" placeholder="column" spellcheck="false" :style="`width: ${column.ui.widthName}px;`")
        div
          input.erd_domain(v-model="column.domain" :class="{ edit: !column.ui.isReadDomain }" :style="`width: ${column.ui.widthDomain}px;`" type="text" placeholder="domain" spellcheck="false")
        div
          input.erd_data_type(v-model="column.dataType" type="text" placeholder="dataType" spellcheck="false" :style="`width: ${column.ui.widthDataType}px;`")
        input.erd_column_not_null(v-if="column.options.notNull" type="text" readonly value="N-N")
        input.erd_column_not_null(v-else type="text" readonly value="NULL")
        input(v-model="column.comment" type="text" placeholder="comment" spellcheck="false" :style="`width: ${column.ui.widthComment}px;`")
        button(title="Delete")
          font-awesome-icon(icon="times")
    .erd_memo(v-for="memo in memos" :key="memo.id" :class="{ selected: memo.ui.selected }" :style="`top: ${memo.ui.top}px; left: ${memo.ui.left}px; z-index: ${memo.ui.zIndex};`")
      .erd_memo_top
        button.close(title="Ctrl + Delete")
          font-awesome-icon(icon="times")
      textarea(v-model="memo.content" :style="`width: ${memo.ui.width}px; height: ${memo.ui.height}px;`" spellcheck="false")
      .erd_memo_bottom
        button
          font-awesome-icon(icon="expand-arrows-alt")
</template>

<script>
import ERD from '@/js/editor/ERD'
import storeTable from '@/store/editor/table'
import draggable from 'vuedraggable'
import Velocity from 'velocity-animate'
import * as util from '@/js/editor/util'

export default {
  name: 'CanvasMain',
  components: {
    draggable
  },
  directives: {
    // focus 정의
    focus: {
      inserted (el) {
        if (ERD.core.event.isEdit) {
          el.focus()
          ERD.core.event.isEdit = false
        }
      }
    }
  },
  props: {
    isPreview: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      svg: {
        isDarg: false,
        top: 0,
        left: 0,
        width: 0,
        height: 0
      }
    }
  },
  computed: {
    tables () {
      return ERD.store().state.tables
    },
    memos () {
      return ERD.store().state.memos
    },
    TABLE_WIDTH () {
      return ERD.store().state.TABLE_WIDTH
    },
    COLUMN_HEIGHT () {
      return ERD.store().state.COLUMN_HEIGHT
    },
    CANVAS_WIDTH () {
      return ERD.store().state.CANVAS_WIDTH
    },
    CANVAS_HEIGHT () {
      return ERD.store().state.CANVAS_HEIGHT
    },
    dataTypes () {
      return ERD.store().state.dataTypes
    },
    domains () {
      return ERD.store().state.searchDomains
    }
  },
  methods: {
    // 컬럼 추가
    columnAdd (id) {
      ERD.store().commit({
        type: 'columnAdd',
        id: id
      })
    },
    // 컬럼 삭제
    columnDelete (tableId, columnId) {
      ERD.store().commit({
        type: 'columnDelete',
        tableId: tableId,
        columnId: columnId
      })
    },
    // NULL 조건 변경
    columnChangeNull (tableId, columnId) {
      ERD.store().commit({
        type: 'columnChangeNull',
        tableId: tableId,
        columnId: columnId
      })
      this.onChangeTableGrid(tableId)
    },
    // 테이블 삭제
    tableDelete (id) {
      ERD.store().commit({
        type: 'tableDelete',
        id: id
      })
    },
    // 테이블 선택
    tableSelected (e, id) {
      ERD.core.event.isSelectedColumn = false
      ERD.store().commit({
        type: 'tableSelected',
        id: id,
        ctrlKey: e.ctrlKey,
        isEvent: true
      })
    },
    // 포커스 이벤트
    onFocus (tableId, columnId) {
      if (columnId) {
        this.columnSelected(tableId, columnId)
      } else {
        // 컬럼 selected 해제
        ERD.store().commit({
          type: 'tableSelectedAllNone',
          isTable: false,
          isColumn: true
        })
      }
    },
    // 포커스 out
    onBlur () {
      // 전체 수정모드 해제
      ERD.store().commit({
        type: 'tableEditAllNone',
        isTable: true,
        isColumn: true
      })
    },
    // 컬럼 선택 전역
    onColumnSelected (e, tableId, columnId) {
      // 데이터 타입 힌트 hide
      if (!e.target.closest('.erd_data_type_list')) {
        ERD.core.erd.store().commit({
          type: 'columnDataTypeHintVisibleAll',
          isDataTypeHint: false
        })
      }
      ERD.store().commit({
        type: 'tableSelected',
        id: tableId,
        ctrlKey: e.ctrlKey,
        isColumnSelected: true
      })
      this.columnSelected(tableId, columnId)
    },
    // 컬럼 선택
    columnSelected (tableId, columnId) {
      ERD.store().commit({
        type: 'columnSelected',
        tableId: tableId,
        columnId: columnId
      })
      ERD.core.event.isSelectedColumn = true
    },
    // 데이터타입 힌트 show/hide
    dataTypeHintVisible (e, tableId, columnId, isDataTypeHint) {
      if (e.keyCode === 27) { // key: ESC
        ERD.store().commit({
          type: 'columnDataTypeHintVisibleAll',
          isDataTypeHint: false
        })
      } else {
        ERD.store().commit({
          type: 'columnDataTypeHintVisible',
          tableId: tableId,
          columnId: columnId,
          isDataTypeHint: isDataTypeHint
        })
      }

      if (e.keyCode !== 38 && e.keyCode !== 40) {
        // 데이터타입 검색 정렬
        if (isDataTypeHint) {
          ERD.store().commit({
            type: 'changeDataTypeHint',
            key: e.target.value
          })
        }
      }

      // 컬럼 데이터타입 관계 동기화
      ERD.store().commit({
        type: 'columnRelationSync',
        tableId: tableId,
        columnId: columnId
      })
    },
    // 데이터 타입, 도메인 힌트 포커스
    hintFocus (e, tableId, columnId, isRead, type) {
      if (!isRead) {
        // 힌트 포커스 이동
        const lis = e.target.parentNode.querySelectorAll('li')
        const index = util.index(e.target.parentNode.querySelector('ul'), '.selected')
        const len = lis.length
        switch (e.keyCode) {
          case 38: // key: Arrow up
            e.preventDefault()
            if (index === -1) {
              lis[len - 1] && lis[len - 1].classList.add('selected')
            } else {
              lis[index].classList.remove('selected')
              lis[index - 1 < 0 ? len - 1 : index - 1].classList.add('selected')
            }
            break
          case 40: // key: Arrow down
            e.preventDefault()
            if (index === -1) {
              lis[0] && lis[0].classList.add('selected')
            } else {
              lis[index].classList.remove('selected')
              lis[index + 1 === len ? 0 : index + 1].classList.add('selected')
            }
            break
          case 13: // key: Enter
            e.preventDefault()
            if (e.altKey) {
              if (type === 'dataType') {
                ERD.store().commit({
                  type: 'columnDataTypeHintVisibleAll',
                  isDataTypeHint: false
                })
              } else if (type === 'domain') {
                ERD.store().commit({
                  type: 'columnDomainHintVisibleAll',
                  isDomainHint: false
                })
              }
            } else {
              if (e.ctrlKey && index !== -1) {
                if (type === 'dataType') {
                  ERD.store().commit({
                    type: 'columnChangeDataType',
                    tableId: tableId,
                    columnId: columnId,
                    dataType: e.target.parentNode.querySelector('ul').querySelector('.selected').innerHTML
                  })
                } else if (type === 'domain') {
                  ERD.store().commit({
                    type: 'columnChangeDomain',
                    tableId: tableId,
                    columnId: columnId,
                    domainId: e.target.parentNode.querySelector('ul').querySelector('.selected').getAttribute('domain_id')
                  })
                }
              }
            }
            break
        }
      }
      this.onKeyArrowMove(e, isRead)
    },
    // 데이터변경
    columnChangeDataType (e, tableId, columnId, dataType) {
      ERD.store().commit({
        type: 'columnChangeDataType',
        tableId: tableId,
        columnId: columnId,
        dataType: dataType
      })
      e.target.parentNode.parentNode.querySelector('.erd_data_type').focus()
      ERD.store().commit({
        type: 'columnEdit',
        tableId: tableId,
        columnId: columnId,
        current: 'isReadDataType',
        isRead: false
      })
    },
    // 도메인변경
    columnChangeDomain (e, tableId, columnId, domainId) {
      ERD.store().commit({
        type: 'columnChangeDomain',
        tableId: tableId,
        columnId: columnId,
        domainId: domainId
      })
      e.target.parentNode.parentNode.querySelector('.erd_domain').focus()
      ERD.store().commit({
        type: 'columnEdit',
        tableId: tableId,
        columnId: columnId,
        current: 'isReadDomain',
        isRead: false
      })
    },
    // 도메인 힌트 show/hide
    domainHintVisible (e, tableId, columnId, isDomainHint) {
      if (e.keyCode === 27) { // key: ESC
        ERD.store().commit({
          type: 'columnDomainHintVisibleAll',
          isDomainHint: false
        })
      } else {
        ERD.store().commit({
          type: 'columnDomainHintVisible',
          tableId: tableId,
          columnId: columnId,
          isDomainHint: isDomainHint
        })
      }

      if (e.keyCode !== 38 && e.keyCode !== 40) {
        // 도메인 검색 정렬
        if (isDomainHint) {
          ERD.store().commit({
            type: 'changeDomainHint',
            key: e.target.value
          })
        }
      }
    },
    // 컬럼 수정 이벤트
    onEnterEditor (e, isRead, current, tableId, columnId) {
      if (!e.altKey) {
        if (columnId === undefined) {
          ERD.store().commit({
            type: 'tableEdit',
            id: tableId,
            current: current,
            isRead: !isRead
          })
        } else {
          if (!e.ctrlKey) {
            ERD.store().commit({
              type: 'columnEdit',
              tableId: tableId,
              columnId: columnId,
              current: current,
              isRead: !isRead
            })
          }
        }
      }
      if (!e.ctrlKey && !isRead) {
        ERD.store().commit({
          type: 'columnDataTypeHintVisibleAll',
          isDataTypeHint: false
        })
        ERD.store().commit({
          type: 'columnDomainHintVisibleAll',
          isDomainHint: false
        })
      }
    },
    // 테이블명, 코멘트 영역
    onKeyArrowMoveHead (e, isRead) {
      if (isRead) {
        const divColumns = e.target.parentNode.parentNode.querySelectorAll('.erd_column')
        const inputs = e.target.parentNode.querySelectorAll('input')
        const rowIndex = util.index(e.target)
        switch (e.keyCode) {
          case 37: // key: Arrow left
            e.preventDefault()
            inputs[rowIndex === 0 ? 1 : 0].focus()
            break
          case 39: // key: Arrow right
            e.preventDefault()
            inputs[rowIndex === 0 ? 1 : 0].focus()
            break
          case 38: // key: Arrow up
            e.preventDefault()
            if (divColumns.length !== 0) {
              divColumns[divColumns.length - 1].querySelector('input').focus()
            }
            break
          case 40: // key: Arrow down
            e.preventDefault()
            if (divColumns.length !== 0) {
              divColumns[0].querySelector('input').focus()
            }
            break
        }
      }
    },
    // 컬럼 화살표 이동
    onKeyArrowMove (e, isRead) {
      if (isRead) {
        let table = e.target.parentNode.parentNode.parentNode
        let column = e.target.parentNode
        if (!table.querySelector('.erd_table_header')) {
          table = e.target.parentNode.parentNode.parentNode.parentNode
          column = e.target.parentNode.parentNode
        }
        const tableInputs = table.querySelector('.erd_table_header').querySelectorAll('input')
        const divColumns = table.querySelectorAll('.erd_column')
        const inputs = column.querySelectorAll('input')
        const rowIndex = util.index(inputs, e.target)
        const colIndex = util.index(divColumns, column)
        const len = divColumns.length
        switch (e.keyCode) {
          case 38: // key: Arrow up
            e.preventDefault()
            if (colIndex === 0) {
              tableInputs[0].focus()
            } else {
              divColumns[colIndex - 1].querySelectorAll('input')[rowIndex].focus()
            }
            break
          case 40: // key: Arrow down
            e.preventDefault()
            if (colIndex === len - 1) {
              tableInputs[0].focus()
            } else {
              divColumns[colIndex + 1 === len ? 0 : colIndex + 1].querySelectorAll('input')[rowIndex].focus()
            }
            break
          case 37: // key: Arrow left
            e.preventDefault()
            divColumns[colIndex].querySelectorAll('input')[rowIndex - 1 < 0 ? inputs.length - 1 : rowIndex - 1].focus()
            break
          case 39: // key: Arrow right
            e.preventDefault()
            divColumns[colIndex].querySelectorAll('input')[rowIndex + 1 === inputs.length ? 0 : rowIndex + 1].focus()
            break
        }
      }
    },
    // 컬럼 마지막 tab 포커스처리
    columnLastTabFocus (e) {
      e.preventDefault()
      const table = e.target.parentNode.parentNode.parentNode
      const tableInputs = table.querySelector('.erd_table_header').querySelectorAll('input')
      const divColumns = table.querySelectorAll('.erd_column')
      const index = util.index(table, '.selected')
      const len = divColumns.length
      if (index === len - 1) {
        tableInputs[0].focus()
      } else {
        divColumns[index + 1].querySelector('input').focus()
      }
    },
    // 힌트 hover addClass
    hintAddClass (e) {
      e.target.parentNode.querySelectorAll('li').forEach(li => {
        li.classList.remove('selected')
      })
      e.target.classList.add('selected')
    },
    // undo
    onDraggableUndo () {
      ERD.core.event.onCursor('stop')
      ERD.core.undoRedo.setUndo('draggable')
    },
    // draggable event
    onDraggable (e) {
      ERD.store().commit({
        type: 'tableHeightReset'
      })
      ERD.store().commit({
        type: 'lineValidColumn',
        id: e.item.getAttribute('column_id')
      })
    },
    // 테이블 그리드 동기화
    onChangeTableGrid (tableId, columnId) {
      storeTable.commit({
        type: 'active',
        id: tableId
      })
      if (columnId) {
        ERD.store().commit({
          type: 'columnDomainSync',
          tableId: tableId,
          columnId: columnId
        })
      }
      ERD.store().commit({ type: 'columnWidthReset' })
    },
    // 도메인 변경 처리
    changeDomain (tableId, columnId) {
      ERD.store().commit({
        type: 'columnDomainSync',
        tableId: tableId,
        columnId: columnId
      })
    },
    // 데이터 타입 힌트 애니메이션
    onBeforeEnter (el) {
      el.style.opacity = 0
      el.style.height = 0
    },
    onEnter (el, done) {
      const delay = el.dataset.index * 100
      setTimeout(() => {
        Velocity(
          el,
          { opacity: 1, height: '13.64px' },
          { complete: done }
        )
      }, delay)
    },
    onLeave (el, done) {
      const delay = el.dataset.index * 100
      setTimeout(() => {
        Velocity(
          el,
          { opacity: 0, height: 0 },
          { complete: done }
        )
      }, delay)
    },
    // 메모 선택
    memoSelected (e, id) {
      ERD.store().commit({
        type: 'memoSelected',
        id: id,
        ctrlKey: e.ctrlKey,
        isEvent: true
      })
    },
    // 메모 현재 사이즈 반영
    memoSize (e, id) {
      ERD.store().commit({
        type: 'memoSetWidthHeight',
        id: id,
        width: e.target.offsetWidth,
        height: e.target.offsetHeight
      })
    },
    // 메모 삭제
    memoDelete (id) {
      ERD.store().commit({
        type: 'memoDelete',
        id: id
      })
    },
    // 메모 리사이징
    memoResize (id) {
      ERD.core.event.onMemoResize('start', id)
    }
  },
  mounted () {
    // 이벤트 핸들러에 컴포넌트 등록
    ERD.core.event.components.CanvasMain.push(this)
  }
}
</script>

<style lang="scss" scoped>
  $table_background: #191919;
  $table_selected: #14496d;
  $column_selected: #00a9ff;
  $selected: #383d41;
  /* column key color */
  $key_pk: #B4B400;
  $key_fk: #dda8b1;
  $key_pfk: #60b9c4;

  ul, ol {
    padding-left: 0;
  }

  input, textarea {
    background-color: #191919;
    color: white;
  }

  .main_canvas {
    background-color: #282828;

    input:focus {
      border-bottom: solid $column_selected 1px;
    }

    .svg_drag {
      position: absolute;
      z-index: 2147483646;
    }

    .erd_table {
      position: absolute;
      box-sizing: border-box;
      background-color: $table_background;
      opacity: 0.9;
      padding: 10px;
      z-index: 1;

      .erd_table_top {
        height: 33px;

        button {
          width: 17px;
          height: 17px;
          font-size: .70em;
          float: right;
          margin-left: 5px;
          border: none;
          outline: none;
          cursor: pointer;
          border-radius: 50%;

          &.close {
            color: #9B0005;
            background-color: #9B0005;
          }
          &.add {
            color: #009B2E;
            background-color: #009B2E;
          }

          &:hover {
            color: white;
          }
        }
      }

      .erd_table_header {
        box-sizing: border-box;
        margin-bottom: 15px;
        display: inline-block;
        width: 100%;

        input {
          width: 46%;
          height: 100%;
          font-size: 12px;
          margin-right: 10px;
        }
      }

      .erd_column {
        height: 25px;
        overflow: hidden;
        box-sizing: border-box;
        display: inline-flex;
        vertical-align: middle;
        align-items: center;

        input {
          float: left;
          margin-right: 10px;
          font-size: 12px;
        }

        .erd_column_not_null {
          width: 35px;
          cursor: pointer;
        }

        button {
          padding: 0;
          width: 25px;
          height: 25px;
          font-size: .70em;
          color: #b9b9b9;
          border: none;
          outline: none;
          background-color: $table_background;
          cursor: pointer;

          &:hover {
            color: white;
          }
        }

        /* 데이터 타입 힌트 */
        .erd_data_type_list {
          position: absolute;
          color: #a2a2a2;
          background-color: #191919;
          opacity: 0.9;
          margin-top: 25px;

          li {
            cursor: pointer;

            &.selected {
              color: white;
              background-color: $selected;
            }
          }
        }

        /* 도메인 힌트 */
        .erd_domain_list {
          position: absolute;
          color: #a2a2a2;
          background-color: #191919;
          opacity: 0.9;
          margin-top: 25px;

          li {
            cursor: pointer;

            &.selected {
              color: white;
              background-color: $selected;
            }
          }
        }

        /* column key */
        .erd_column_key {
          width: 16px;
          color: $table_background;
        }

        .pk {
          color: $key_pk;
        }

        .fk {
          color: $key_fk;
        }

        .pfk {
          color: $key_pfk;
        }

        /* 컬럼 선택시 */
        &.selected {
          border-left: solid $column_selected 3px;
        }

        /* 컬럼 관계 */
        &.relation_active {
          border: solid #ffc107 1px;
        }
      }

      .edit {
        border-bottom: solid greenyellow 1px;
      }
    }

    /* 테이블 선택시 */
    .erd_table.selected, .erd_memo.selected {
      border: solid $table_selected 1px;
      box-shadow: 0 1px 6px $table_selected;
    }

    .erd_memo {
      position: absolute;
      box-sizing: border-box;
      background-color: $table_background;
      opacity: 0.9;
      z-index: 1;

      .erd_memo_top {
        padding: 10px;
        button {
          width: 17px;
          height: 17px;
          font-size: .70em;
          float: right;
          margin-left: 5px;
          border: none;
          outline: none;
          cursor: pointer;
          border-radius: 50%;

          &:first-child {
            color: #9B0005;
            background-color: #9B0005;
          }
          &:hover {
            color: white;
          }
        }
      }

      .erd_memo_bottom {
        button {
          width: 17px;
          height: 17px;
          font-size: .70em;
          float: right;
          margin-left: 5px;
          border: none;
          outline: none;
          cursor: nw-resize;
          color: white;
          background-color: $table_background;
        }
      }

      textarea {
        box-sizing: border-box;
        padding: 10px;
        border: none;
        resize: none;
      }
    }
  }

  /* width */
  textarea::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  /* Track */
  textarea::-webkit-scrollbar-track {
    background: #191919;
    border-left: 1px solid  #191919;
  }
  /* Handle */
  textarea::-webkit-scrollbar-thumb {
    background: #aaa;
  }
  /* Handle : hover*/
  textarea::-webkit-scrollbar-thumb:hover {
    background: white;
  }
</style>

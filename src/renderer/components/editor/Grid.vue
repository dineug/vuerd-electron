<template lang="pug">
  .erd_grid
    table
      thead
        tr
          th(:colspan="columnData.length")
            .table_resize(@mousedown="resize")
            button.close(title="ESC" @click="close")
              font-awesome-icon(icon="times")
            button.add(v-if="gridType === 'domain'" @click="add")
              font-awesome-icon(icon="plus")

        tr
          th(v-for="column in columnData" :style="style(column)") {{ column.name }}
    .table_wrapper(:style="`height: ${reHeight}px;`")
      table
        tbody
          tr(v-for="(entry, col) in data" :index="col")
            td(v-for="(column, row) in columnData"
            :style="style(column)"
            :class="{ edit: !entry.ui[`isRead${column.key}`] && entry.ui[`isRead${column.key}`] !== undefined }")
              button(v-if="type(column) === 'button'" @click="onBtn(entry.id)")
                font-awesome-icon(:icon="column.icon")
              input(v-else :type="type(column)" :value="entry[column.key]" :index="row"
              :class="{ edit: !entry.ui[`isRead${column.key}`] && entry.ui[`isRead${column.key}`] !== undefined }"
              :checked="type(column) === 'checkbox' && entry[column.key]"
              :readonly="entry.ui[`isRead${column.key}`]"
              spellcheck="false"
              :placeholder="column.name"
              @keyup.enter="onEnterEditor($event, entry.ui[`isRead${column.key}`], column.key, entry.id)"
              @dblclick="onEnterEditor($event, entry.ui[`isRead${column.key}`], column.key, entry.id)"
              @keydown="onKeyArrowMove($event, entry.ui[`isRead${column.key}`])"
              @keydown.9="lastTabFocus($event, row === columnData.length - 1)"
              @focus="onFocus($event, type(column) === 'checkbox')"
              @blur="onBlur($event, type(column) === 'checkbox')"
              @change="change($event, column.key, entry.id)")
</template>

<script>
import ERD from '@/js/editor/ERD'
import table from '@/store/editor/table'

export default {
  name: 'Grid',
  props: {
    gridType: {
      type: String,
      default: 'grid'
    },
    columnData: {
      type: Array,
      default: () => {
        return []
      }
    },
    data: {
      type: Array,
      default: () => {
        return []
      }
    }
  },
  data () {
    return {
      height: 100
    }
  },
  computed: {
    reHeight () {
      const maxHeight = 25 * this.data.length
      if (this.height > maxHeight) {
        return maxHeight + 2
      }
      return this.height + 2
    }
  },
  methods: {
    // ui 옵션
    style (option) {
      const buffer = []
      if (option.width) {
        buffer.push(`width: ${option.width}%`)
      }
      return buffer.join('')
    },
    // input type
    type (option) {
      return option.type ? option.type : 'text'
    },
    // grid 리사이징
    resize () {
      ERD.core.event.onGridResize('start')
    },
    // grid cloase 이벤트
    close () {
      this.$emit('close')
    },
    // arrow key 이동 이벤트
    onKeyArrowMove (e, isRead) {
      if (isRead || isRead === undefined) {
        const tbody = e.target.parentNode.parentNode.parentNode
        const trs = tbody.querySelectorAll('tr')
        const tr = e.target.parentNode.parentNode
        const inputs = tr.querySelectorAll('input')
        const rowIndex = Number(e.target.getAttribute('index'))
        const colIndex = Number(tr.getAttribute('index'))
        const len = trs.length
        switch (e.keyCode) {
          case 38: // key: Arrow up
            e.preventDefault()
            trs[colIndex - 1 < 0 ? len - 1 : colIndex - 1].querySelectorAll('input')[rowIndex].focus()
            break
          case 40: // key: Arrow down
            e.preventDefault()
            trs[colIndex + 1 === len ? 0 : colIndex + 1].querySelectorAll('input')[rowIndex].focus()
            break
          case 37: // key: Arrow left
            e.preventDefault()
            trs[colIndex].querySelectorAll('input')[rowIndex - 1 < 0 ? inputs.length - 1 : rowIndex - 1].focus()
            break
          case 39: // key: Arrow right
            e.preventDefault()
            trs[colIndex].querySelectorAll('input')[rowIndex + 1 === inputs.length ? 0 : rowIndex + 1].focus()
            break
        }
      }
    },
    // 포커스 생성
    onFocus (e, isCheckbox) {
      if (isCheckbox) {
        e.target.parentNode.classList.add('selected')
      }
    },
    // 포커스 제거
    onBlur (e, isCheckbox) {
      if (isCheckbox) {
        e.target.parentNode.classList.remove('selected')
      }
      switch (this.gridType) {
        case 'table':
          table.commit({ type: 'editAllNone' })
          break
        case 'domain':
          ERD.store().commit({ type: 'domainEditAllNone' })
          break
      }
    },
    // 마지막 tab 포커스 이벤트
    lastTabFocus (e, isLast) {
      if (isLast) {
        e.preventDefault()
        const tbody = e.target.parentNode.parentNode.parentNode
        const trs = tbody.querySelectorAll('tr')
        const tr = e.target.parentNode.parentNode
        const colIndex = Number(tr.getAttribute('index'))
        const len = trs.length
        if (colIndex === len - 1) {
          trs[0].querySelector('input').focus()
        } else {
          trs[colIndex + 1].querySelector('input').focus()
        }
      }
    },
    // edit 이벤트
    onEnterEditor (e, isRead, current, id) {
      if (!e.altKey && isRead !== undefined) {
        if (!e.ctrlKey) {
          switch (this.gridType) {
            case 'table':
              table.commit({
                type: 'edit',
                columnId: id,
                current: `isRead${current}`,
                isRead: !isRead
              })
              break
            case 'domain':
              ERD.store().commit({
                type: 'domainEdit',
                id: id,
                current: `isRead${current}`,
                isRead: !isRead
              })
              break
          }
        }
      } else if (e.target.getAttribute('type') === 'checkbox') {
        e.target.checked = !e.target.checked
        this.change(e, current, id)
      }
    },
    // 변경값 동기화
    change (e, current, id) {
      switch (this.gridType) {
        case 'table':
          const column = {}
          const columnGrid = {}
          columnGrid[current] = e.target.value
          if (e.target.getAttribute('type') === 'checkbox') {
            column.options = {}
            column.options[current] = e.target.checked
            columnGrid[current] = e.target.checked
          } else {
            column[current] = e.target.value
          }
          table.commit({
            type: 'sync',
            columnId: id,
            isPK: current === 'primaryKey',
            column: column,
            columnGrid: columnGrid
          })
          break
        case 'domain':
          const domain = {}
          domain[current] = e.target.value
          ERD.store().commit({
            type: 'domainChange',
            id: id,
            domain: domain
          })
          break
      }
    },
    // 추가
    add () {
      switch (this.gridType) {
        case 'domain':
          ERD.store().commit({ type: 'domainAdd' })
          break
      }
    },
    // 버튼 이벤트
    onBtn (id) {
      switch (this.gridType) {
        case 'domain':
          ERD.store().commit({
            type: 'domainDelete',
            id: id
          })
          break
      }
    }
  },
  mounted () {
    ERD.core.event.components.Grid = this
  }
}
</script>

<style lang="scss" scoped>
  $selected: #00a9ff;

  .erd_grid {
    bottom: 0;
    width: 100%;
    background-color: #191919;

    .table_resize {
      width: 100%;
      height: 10px;
      position: absolute;
      top: 0;
      cursor: ns-resize;
    }

    .table_wrapper {
      overflow: auto;
      overflow-x: hidden;

      /* width */
      &::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      /* Track */
      &::-webkit-scrollbar-track {
        background: #191919;
        border-left: 1px solid  #191919;
      }
      /* Handle */
      &::-webkit-scrollbar-thumb {
        background: #aaa;
      }
      /* Handle : hover*/
      &::-webkit-scrollbar-thumb:hover {
        background: white;
      }
    }

    input, textarea {
      background-color: #191919;
      color: white;
    }

    input:focus {
      border-bottom: solid $selected 1px;
      &.edit {
        border-bottom: solid greenyellow 1px;
      }
    }

    input[type=text] {
      width: 100%;
    }

    table {
      width: 100%;
      height: 100%;
      background-color: #191919;
      color: white;
      min-width: 400px;

      th {
        padding: 10px 10px;
        text-align: center;

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
      td {
        padding: 5px 10px;
        text-align: center;

        &.selected {
          border-left: solid $selected 3px;
        }

        button {
          padding: 0;
          width: 15px;
          height: 15px;
          color: #b9b9b9;
          border: none;
          outline: none;
          background-color: #191919;
          cursor: pointer;

          &:hover {
            color: white;
          }
        }
      }
    }
  }
</style>

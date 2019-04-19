<template lang="pug">
  .menu_canvas
    // 메뉴 top
    draggable.menu_top(tag="ul" v-model="model.tabs" v-bind="{group:'tab', ghostClass: 'ghost'}")
      transition-group(type="transition" name="menu-top")

        li(v-for="(tab, i) in model.tabs" :key="tab.id")
          input(v-model="tab.name" :readonly="tab.ui.isReadName" v-focus :id="`tab_${tab.id}`"
          :class="{ tab_active: tab.active, edit: !tab.ui.isReadName }"
          type="text" :title="i < 9 ? `Ctrl + ${i+1}` : ''"
          @keydown="onKeyArrowMove($event, tab.ui.isReadName)"
          @keyup.enter="onEnterEditor($event, tab.ui.isReadName, tab.id)"
          @dblclick="onEnterEditor($event, tab.ui.isReadName, tab.id)"
          @focus="modelActive(tab.id)"
          @blur="onBlur")

          span.buttons(:class="{ tab_active: tab.active }")
            button(title="Ctrl + Shift + Delete"
            @click="modelDelete(tab.id)")
              font-awesome-icon(icon="times")

    // 메뉴 sidebar left
    ul.menu_sidebar
      li(v-for="(menu, i) in menus" :key="menu.id" :title="menu.name"
      :class="{ undo_none: menu.type === 'undo' && !isUndo, redo_none: menu.type === 'redo' && !isRedo, save: menu.type === 'save' && isSave, save_none: menu.type === 'save' && !isSave }"
      @click="menuAction(menu.type)")
        font-awesome-icon(:icon="menu.icon")
        ol(v-if="menu.type === 'DBType'" :style="`top: ${i * 32}px`")
          li(v-for="item in menu.list" :class="{ db_active: DBType === item }"
          @click="changeDB(item)") {{ item }}
        ol(v-else-if="menu.type === 'export' || menu.type === 'import'" :style="`top: ${i * 32}px`")
          li(v-if="item.type !== 'import-sql'" v-for="item in menu.list"
          @click="menuAction(item.type)") {{ item.name }}
          li.import_sql(v-else) {{ item.name }}
            ul
              li(v-for="child in item.list" @click="importSQL(child)") {{ child }}

    // 메뉴 Preview Navigation
    canvas-main.preview(:style="`top: ${preview.top}px; left: ${preview.left}px; transform: scale(${previewRatio}, ${previewRatio});`"
    :isPreview="true")
    .preview_border(:style="`top: ${preview.y}px; left: ${preview.x}px; width: ${PREVIEW_WIDTH}px; height: ${CANVAS_HEIGHT * previewRatio}px;`")
      .preview_target(:style="`top: ${preview.target.y}px; left: ${preview.target.x}px; width: ${preview.target.width}px; height: ${preview.target.height}px;`"
      @mousedown="onPreview")

    // view 셋팅 팝업
    modal(v-if="isModalView" type="view"
    @close="onClose('isModalView')")
    // 도움말 팝업
    modal(v-if="isModalHelp" type="help"
    @close="onClose('isModalHelp')")
    // 프로젝트
    modal(v-if="isModalProject" type="project"
    @close="onClose('isModalProject')")
    // 삭제 모델 리스트
    modal(v-if="isModalModel" type="model"
    @close="onClose('isModalModel')")

    // 테이블 컬럼 상세 옵션 그리드
    grid.menu_grid(v-if="isGridColumn"
    :columnData="gridDataColumn" :data="gridRowDataColumn" gridType="table"
    @close="gridClose")
    // 도메인
    grid.menu_grid(v-if="isGridDomain"
    :columnData="gridDataDomain" :data="gridRowDataDomain" gridType="domain"
    @close="gridClose")
</template>

<script>
import ERD from '@/js/editor/ERD'
import model from '@/store/editor/model'
import draggable from 'vuedraggable'
import CanvasMain from './CanvasMain'
import CanvasSvg from './CanvasSvg'
import Modal from './Modal'
import Grid from './Grid'
import gridDataColumn from '@/js/editor/grid/column'
import gridDataDomain from '@/js/editor/grid/domain'
import table from '@/store/editor/table'
import * as util from '@/js/editor/util'

export default {
  name: 'CanvasMenu',
  components: {
    draggable,
    CanvasMain,
    CanvasSvg,
    Modal,
    Grid
  },
  directives: {
    // focus 정의
    focus: {
      inserted (el) {
        el.focus()
      }
    }
  },
  data () {
    return {
      gridDataColumn: gridDataColumn,
      gridDataDomain: gridDataDomain,
      isGridColumn: false,
      isGridDomain: false,
      preview: {
        top: 0,
        left: 0,
        x: 0,
        y: 50,
        target: {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        }
      },
      isUndo: false,
      isRedo: false,
      isSave: true,
      isModalView: false,
      isModalHelp: false,
      isModalProject: false,
      isModalModel: false,
      menus: [
        {
          type: 'DBType',
          icon: 'database',
          name: 'DB',
          list: [
            'MariaDB',
            'MSSQL',
            'MySQL',
            'Oracle',
            'PostgreSQL'
          ]
        },
        {
          type: 'import',
          icon: 'file-import',
          name: 'import',
          list: [
            {
              type: 'import-verd',
              name: 'import-verd'
            },
            {
              type: 'import-sql',
              name: 'import-sql',
              list: [
                'MariaDB',
                'MSSQL',
                'MySQL',
                'Oracle',
                'PostgreSQL'
              ]
            }
          ]
        },
        {
          type: 'export',
          icon: 'file-export',
          name: 'export',
          list: [
            {
              type: 'export-png',
              name: 'export-png'
            },
            {
              type: 'export-sql',
              name: 'export-sql'
            }
          ]
        },
        {
          type: 'project',
          icon: 'folder-open',
          name: 'project'
        },
        {
          type: 'save',
          icon: 'save',
          name: 'save(Ctrl + S)'
        },
        {
          type: 'history',
          icon: 'trash-alt',
          name: 'history'
        },
        {
          type: 'clone',
          icon: 'copy',
          name: 'clone'
        },
        {
          type: 'table',
          icon: 'list',
          name: 'table options'
        },
        {
          type: 'domain',
          icon: 'book',
          name: 'domain'
        },
        {
          type: 'undo',
          icon: 'undo',
          name: 'undo(Ctrl + Z)'
        },
        {
          type: 'redo',
          icon: 'redo',
          name: 'redo(Ctrl + Shift + Z)'
        },
        {
          type: 'view',
          icon: 'eye',
          name: 'view setting'
        },
        {
          type: 'help',
          icon: 'question',
          name: 'help'
        }
      ]
    }
  },
  computed: {
    model () {
      return model.state
    },
    DBType () {
      return ERD.store().state.DBType
    },
    previewRatio () {
      return ERD.store().state.PREVIEW_WIDTH / ERD.store().state.CANVAS_WIDTH
    },
    CANVAS_WIDTH () {
      return ERD.store().state.CANVAS_WIDTH
    },
    CANVAS_HEIGHT () {
      return ERD.store().state.CANVAS_HEIGHT
    },
    PREVIEW_WIDTH () {
      return ERD.store().state.PREVIEW_WIDTH
    },
    gridRowDataColumn () {
      return table.state.rows
    },
    gridRowDataDomain () {
      return ERD.store().state.domains
    }
  },
  methods: {
    // 모델 활성화
    modelActive (id) {
      model.commit({
        type: 'modelActive',
        id: id
      })
    },
    // 모델 삭제
    modelDelete (id) {
      model.commit({
        type: 'modelDelete',
        id: id
      })
    },
    // sidebar action
    menuAction (type) {
      switch (type) {
        case 'export-png':
          ERD.core.file.exportData('png')
          break
        case 'export-sql':
          ERD.core.file.exportData('sql')
          break
        case 'import-verd':
          ERD.core.file.click('verd')
          break
        case 'project':
          this.isModalProject = true
          ERD.core.event.isStop = true
          break
        case 'save':
          ERD.core.indexedDB.update()
          break
        case 'history':
          this.isModalModel = true
          ERD.core.event.isStop = true
          break
        case 'clone':
          ERD.core.file.clone()
          break
        case 'view':
          this.isModalView = true
          ERD.core.event.isStop = true
          break
        case 'undo':
          if (this.isUndo) {
            ERD.core.undoRedo.undo()
          }
          break
        case 'redo':
          if (this.isRedo) {
            ERD.core.undoRedo.redo()
          }
          break
        case 'table':
          this.isGridColumn = !this.isGridColumn
          if (this.isGridColumn) {
            this.isGridDomain = false
          }
          break
        case 'domain':
          this.isGridDomain = !this.isGridDomain
          if (this.isGridDomain) {
            this.isGridColumn = false
          }
          break
        case 'help':
          this.isModalHelp = true
          ERD.core.event.isStop = true
          break
      }
    },
    // sql import
    importSQL (DBType) {
      ERD.core.file.click('sql', DBType)
    },
    // 미리보기 네비게이션 이벤트 시작
    onPreview () {
      ERD.core.event.onPreview('start')
    },
    // DB 변경
    changeDB (DBType) {
      ERD.store().commit({
        type: 'changeDB',
        DBType: DBType
      })
    },
    // 미리보기 셋팅
    setPreview () {
      const width = window.innerWidth
      const height = window.innerHeight
      this.preview.left = (-1 * this.CANVAS_WIDTH / 2) + (this.PREVIEW_WIDTH / 2) - this.PREVIEW_WIDTH - 20 + width
      this.preview.top = (-1 * this.CANVAS_HEIGHT / 2) + (this.CANVAS_HEIGHT * this.previewRatio / 2) + 50
      this.preview.x = width - this.PREVIEW_WIDTH - 20
      this.preview.target.width = width * this.previewRatio
      this.preview.target.height = height * this.previewRatio
      this.preview.target.x = window.scrollX * this.previewRatio
      this.preview.target.y = window.scrollY * this.previewRatio
    },
    // modal close
    onClose (type) {
      this[type] = false
      ERD.core.event.isStop = false
    },
    // edit on/off
    onEnterEditor (e, isRead, id) {
      model.commit({
        type: 'modelEdit',
        id: id,
        isRead: !isRead
      })
    },
    // 포커스 out
    onBlur (e) {
      model.commit({ type: 'modelEditAllNone' })
    },
    // 포커스 move
    onKeyArrowMove (e, isRead) {
      if (isRead) {
        const inputs = this.$el.querySelectorAll('.menu_top input')
        const index = util.index(e.target.parentNode)
        switch (e.keyCode) {
          case 37: // key: Arrow left
            e.preventDefault()
            inputs[index - 1 < 0 ? inputs.length - 1 : index - 1].focus()
            break
          case 39: // key: Arrow right
            e.preventDefault()
            inputs[index + 1 === inputs.length ? 0 : index + 1].focus()
            break
        }
      }
      if (e.keyCode === 9) {
        e.preventDefault()
        const inputs = this.$el.querySelectorAll('.menu_top input')
        const index = util.index(e.target.parentNode)
        inputs[index + 1 === inputs.length ? 0 : index + 1].focus()
      }
    },
    gridClose () {
      this.isGridColumn = false
      this.isGridDomain = false
    }
  },
  mounted () {
    // 이벤트 핸들러에 컴포넌트 등록
    ERD.core.event.components.CanvasMenu = this
    // 미리보기 셋팅
    this.setPreview()
    // undo, redo 활성화 callback 등록
    ERD.core.undoRedo.callback = () => {
      this.isUndo = ERD.core.undoRedo.getManager().hasUndo()
      this.isRedo = ERD.core.undoRedo.getManager().hasRedo()
    }
  },
  updated () {
    // 미리보기 셋팅
    this.setPreview()
    // undo, redo 활성화
    ERD.core.undoRedo.callback()
  }
}
</script>

<style lang="scss" scoped>
  $tab_color: #424242;
  $tab_active: #282828;
  $selected: #383d41;
  $menu_base_size: 30px;
  $column_selected: #00a9ff;

  ul, ol {
    padding-left: 0;
  }

  .menu_canvas {

    input:focus {
      border-bottom: solid $column_selected 1px;
    }

    input.edit {
      border-bottom: solid greenyellow 1px;
    }

    .menu_top {
      width: 100%;
      height: $menu_base_size;
      position: fixed;
      left: $menu_base_size;
      z-index: 2147483646;
      background-color: black;

      li {
        height: $menu_base_size;
        display: inline-flex;
      }

      .buttons {
        background-color: $tab_color;
        padding-right: 5px;
      }

      .tab_active {
        background-color: $tab_active;

        button {
          background-color: $tab_active;
        }
      }

      button {
        width: 17px;
        height: 17px;
        font-size: .70em;
        margin-top: 8px;
        border: none;
        outline: none;
        cursor: pointer;
        border-radius: 50%;
        color: #b9b9b9;
        background-color: $tab_color;

        &:hover {
          color: white;
        }
      }

      input {
        padding: 10px;
        width: 150px;
        color: white;
        background-color: $tab_color;
      }
    }

    .menu_sidebar {
      width: $menu_base_size;
      height: 100%;
      position: fixed;
      z-index: 2147483646;
      color: white;
      background-color: black;

      & > li {
        text-align: center;
        padding: 10px;
        cursor: pointer;

        &:hover {
          background-color: $selected;
        }

        ol {
          display: none;
          position: fixed;
          left: $menu_base_size;
          top: 0;
          background-color: black;

          li {
            padding: 10px;
            color: #a2a2a2;

            &:hover {
              color: white;
              background-color: $selected;
            }
          }

          li.import_sql {
            ul {
              display: none;
              position: fixed;
              left: 117.41px;
              top: 64px;
              background-color: black;
            }
            &:hover {
              ul {
                display: block;
              }
            }
          }

          .db_active {
            color: white;
            background-color: $selected;
          }
        }

        &:hover {
          ol {
            display: block;
          }
        }

        &.undo_none, &.redo_none {
          cursor: default;
          color: #a2a2a2;
        }

        &.save {
          color: #009B2E;
        }
        &.save_none {
          color: red;
        }
      }
    }

    .preview {
      position: fixed;
      z-index: 2147483646;
      overflow: hidden;
    }
    .preview_border {
      position: fixed;
      z-index: 2147483646;
      box-shadow: 1px 1px 6px 2px #171717;
      .preview_target {
        position: absolute;
        border: solid orange 1px;
      }
    }

    .menu_grid {
      position: fixed;
      z-index: 2147483646;
    }

    /* 이동 animation */
    .menu-top-move {
      transition: transform 0.5s;
    }
    /* 추가,삭제 animation */
    .menu-top-enter-active {
      transition: all .3s ease;
    }
    .menu-top-leave-active {
      transition: all .4s ease-out;
    }
    .menu-top-enter, .menu-top-leave-to {
      transform: translateX(10px);
      opacity: 0;
    }
    .ghost {
      opacity: 0.5;
    }
  }
</style>

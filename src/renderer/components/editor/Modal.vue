<template lang="pug">
    .modal
      .modal_background
      .modal_box
        .modal_btn
          button.close(title="ESC" @click="onClose")
            font-awesome-icon(icon="times")
          button.add(v-if="type === 'project'" @click="projectAdd")
            font-awesome-icon(icon="plus")

        .modal_head
          h3(v-if="type === 'view'") view setting
          h3(v-else-if="type === 'help'") help
          h3(v-else-if="type === 'project'") project
          h3(v-else-if="type === 'model'") model
        .modal_body(:class="{ help: type === 'help', project: type === 'project' || type === 'model' }")

          .modal_title(v-if="type === 'view'") canvas size
          .modal_content(v-if="type === 'view'")
            span x
            input(type="text" v-model="CANVAS_WIDTH" spellcheck="false"
            @change="onChangeCanvasWidth")
            span y
            input(type="text" v-model="CANVAS_HEIGHT" spellcheck="false"
            @change="onChangeCanvasHeight")

          .modal_title.help(v-if="type === 'help'") base
          .modal_content.help(v-if="type === 'help'")
            span(v-html="`right click${space(18)}- QuickMenu`")
            span(v-html="`Ctrl + Enter${space(6)}- Hint Choice`")
          .modal_content.help(v-if="type === 'help'")
            span(v-html="`Ctrl + Z${space(23)}- Undo`")
            span(v-html="`Ctrl + Shift + Z - Redo`")
          .modal_content.help(v-if="type === 'help'")
            span(v-html="`ESC${space(29)}- Event All stop`")
            span(v-html="`Ctrl + 1 - 9${space(8)} - Model Choice`")
          .modal_content.help(v-if="type === 'help'")
            span(v-html="`Ctrl + Shift + Delete - Model delete`")
            span(v-html="`Arrow key${space(7)} - Model focus move`")
          .modal_content.help(v-if="type === 'help'")
            span(v-html="`drag${space(27)}- Model move`")
            span(v-html="`Ctrl + S${space(14)}- save`")

          .modal_title.help(v-if="type === 'help'") table, memo
          .modal_content.help(v-if="type === 'help'")
            span(v-html="`Ctrl + drag${space(16)}- multi selected`")
            span(v-html="`Ctrl + click${space(8)}- multi selected`")
          .modal_content.help(v-if="type === 'help'")
            span(v-html="`Ctrl + A${space(22)}- selected All`")
            span(v-html="`Ctrl + Delete${space(4)}- delete`")
          .modal_content.help(v-if="type === 'help'")
            span(v-html="`drag${space(26)}- move`")
            span(v-html="`Arrow key${space(8)}- focus move`")
          .modal_content.help(v-if="type === 'help'")
            span(v-html="`Enter${space(25)}- edit on/off`")
            span(v-html="`Alt + Enter${space(8)}- column add`")
          .modal_content.help(v-if="type === 'help'")
            span(v-html="`Alt + Delete${space(14)}- column delete`")
            span(v-html="`drag${space(18)}- column move`")

          .modal_title.help(v-if="type === 'help'") Canvas
          .modal_content.help(v-if="type === 'help'")
            span(v-html="`drag${space(26)}- move`")
            span(v-html="`preview drag${space(3)}- move`")

          .modal_title.help(v-if="type === 'help'") QuickMenu
          .modal_content.help(v-if="type === 'help'")
            span(v-html="`Alt + N${space(22)}- New Model`")
            span(v-html="`Alt + T${space(15)}- New Table`")
          .modal_content.help(v-if="type === 'help'")
            span(v-html="`Alt + M${space(22)} - New Memo`")
            span(v-html="`Alt + K${space(15)}- Primary key`")
          .modal_content.help(v-if="type === 'help'")
            span(v-html="`Alt + 1${space(23)}- 1 : 1`")
            span(v-html="`Alt + 2${space(16)}- 1 : N`")

          ul.modal_content(v-if="type === 'project'")
            li(v-for="item in projectList" :class="{ project_active: projectId === item.id }")
              span(@click="historyLoaded(item.id)")
                font-awesome-icon(:icon="projectId === item.id ? 'folder-open' : 'folder'")
              input(type="text" :value="item.name" @change="projectNameChange($event, item.id)" spellcheck="false")
              button(@click="historyDelete(item.id)")
                font-awesome-icon(icon="times")

          ul.modal_content(v-if="type === 'model'")
            li(v-for="item in modelList")
              span(@click="historyLoaded(item.id)")
                font-awesome-icon(icon="history")
              span.model {{ item.name }} - {{ item.update_date }}
              button(@click="historyDelete(item.id)")
                font-awesome-icon(icon="times")
</template>

<script>
import ERD from '@/js/editor/ERD'
import model from '@/store/editor/model'
import * as util from '@/js/editor/util'

export default {
  name: 'Modal',
  props: {
    type: {
      type: String,
      default: 'view'
    }
  },
  data () {
    return {
      CANVAS_WIDTH: ERD.store().state.CANVAS_WIDTH,
      CANVAS_HEIGHT: ERD.store().state.CANVAS_HEIGHT,
      projectList: [],
      modelList: []
    }
  },
  computed: {
    projectId () {
      return model.state.id
    }
  },
  watch: {
    CANVAS_WIDTH (val, oldVal) {
      if (isNaN(val)) {
        this.CANVAS_WIDTH = oldVal
      }
    },
    CANVAS_HEIGHT (val, oldVal) {
      if (isNaN(val)) {
        this.CANVAS_HEIGHT = oldVal
      }
    }
  },
  methods: {
    onChangeCanvasWidth () {
      if (this.CANVAS_WIDTH < 2000) {
        this.CANVAS_WIDTH = 2000
      }
      ERD.store().commit({
        type: 'setConfig',
        config: {
          CANVAS_WIDTH: this.CANVAS_WIDTH
        }
      })
    },
    onChangeCanvasHeight () {
      if (this.CANVAS_HEIGHT < 2000) {
        this.CANVAS_HEIGHT = 2000
      }
      ERD.store().commit({
        type: 'setConfig',
        config: {
          CANVAS_HEIGHT: this.CANVAS_HEIGHT
        }
      })
    },
    onClose () {
      this.$emit('close')
    },
    space (n) {
      const buffer = []
      for (let i = 0; i < n; i++) {
        if (i % 2 === 0) {
          buffer.push('&nbsp;')
        } else {
          buffer.push(' ')
        }
      }
      return buffer.join('')
    },
    // 프로젝트 로드
    historyLoaded (id) {
      ERD.core.indexedDB.loaded(this.type, id)
    },
    // 프로젝트 이름 변경
    projectNameChange (e, id) {
      e.target.value = util.validFileName(e.target.value)
      if (e.target.value.trim() === '') {
        e.target.value = ERD.core.indexedDB.getProjectName()
      }
      ERD.core.indexedDB.update({
        id: id,
        name: e.target.value
      })
    },
    // 프로젝트 추가
    projectAdd () {
      ERD.core.indexedDB.add('project')
    },
    // 삭제
    historyDelete (id) {
      ERD.core.indexedDB.delete(this.type, id, () => {
        ERD.core.indexedDB.list(this.type, [], list => {
          if (this.type === 'project') {
            this.projectList = list
          } else if (this.type === 'model') {
            this.modelList = list
          }
        })
      })
    }
  },
  mounted () {
    if (this.type === 'project') {
      ERD.core.indexedDB.list(this.type, [], list => {
        this.projectList = list
      })
    } else if (this.type === 'model') {
      ERD.core.indexedDB.list(this.type, [], list => {
        this.modelList = list
      })
    }
  }
}
</script>

<style lang="scss" scoped>
  $selected: #383d41;
  $text: #a2a2a2;

  .modal {
    .modal_background {
      position: fixed;
      width: 100%;
      height: 100%;
      z-index: 2147483647;
      background-color: #848484;
      opacity: 0.5;
    }

    .modal_box {
      position: fixed;
      z-index: 2147483647;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      background-color: black;
      color: $text;

      input {
        background-color: $selected;
        color: white;
        height: 20px;
      }

      .modal_btn {
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

      .modal_head {
        font-size: 24px;
        padding: 10px;
      }
      .modal_body {
        padding: 10px;

        &.help {
          width: 530px;
        }

        &.project {
          width: 391px;
        }

        .modal_title {
          font-size: 20px;
          padding: 5px;

          &.help {
            margin-top: 20px;
            margin-bottom: 5px;
          }
        }
        .modal_content {
          padding: 5px;
          font-size: 14px;

          span, input {
            margin-right: 10px;
          }
          input {
            width: 100px;
          }

          &.help {
            span {
              display: inline-block;
              width: 240px;
              margin-left: 10px;
            }
          }
        }
        ul.modal_content {
          background-color: black;
          height: 400px;
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

          li {
            padding: 10px;
            color: $text;

            span {
              cursor: pointer;

              &.model {
                cursor: default;
                width: 295px;
                display: inline-block;
                text-overflow: ellipsis;
                overflow: hidden;
              }
            }

            &:hover {
              color: white;
              background-color: $selected;
              input {
                background-color: $selected;
              }
              button {
                color: white;
                background-color: $selected;
              }
            }

            input {
              background-color: black;
              width: 300px;
            }

            button {
              padding: 0;
              width: 25px;
              height: 25px;
              color: #b9b9b9;
              border: none;
              outline: none;
              background-color: black;
              cursor: pointer;
            }
          }

          .project_active {
            color: white;
            background-color: $selected;
            input {
              background-color: $selected;
            }
            button {
              color: white;
              background-color: $selected;
            }
          }

        }
      }
    }
  }
</style>

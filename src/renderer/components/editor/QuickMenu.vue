<template lang="pug">
  ul.quick_menu(v-if="isShow"
  :style="`top: ${top}px; left: ${left}px; z-index: ${zIndex};`")

    li(v-for="menu in menus" :key="menu.id"
    :class="{ quick_menu_pk: menu.type === 'pk' }"
    @click="menuAction(menu.type)")

      span
        img(v-if="menu.icon !== '' && menu.isImg"
        :src="menu.icon")

        font-awesome-icon(v-else-if="!menu.isImg"
        :icon="menu.icon"
        :class="{ pk: menu.icon === 'key' }")

        span(v-else)
      span {{ menu.name }}
      span {{ menu.keymap }}
</template>

<script>
import ERD from '@/js/editor/ERD'
import model from '@/store/editor/model'
import * as util from '@/js/editor/util'
import relationship from '@/js/editor/img/relationship'

export default {
  name: 'QuickMenu',
  data () {
    return {
      top: 0,
      left: 0,
      zIndex: 0,
      isShow: false,
      menus: [
        {
          type: 'modelAdd',
          icon: 'file',
          isImg: false,
          name: 'New Model',
          keymap: 'Alt + N'
        },
        {
          type: 'tableAdd',
          icon: 'table',
          isImg: false,
          name: 'New Table',
          keymap: 'Alt + T'
        },
        {
          type: 'memoAdd',
          icon: 'sticky-note',
          isImg: false,
          name: 'New Memo',
          keymap: 'Alt + M'
        },
        {
          type: 'pk',
          icon: 'key',
          isImg: false,
          name: 'Primary Key',
          keymap: 'Alt + K'
        },
        {
          type: 'erd-0-1',
          icon: relationship('erd-0-1'),
          isImg: true,
          name: '1 : 1',
          keymap: 'Alt + 1'
        },
        {
          type: 'erd-0-1-N',
          icon: relationship('erd-0-1-N'),
          isImg: true,
          name: '1 : N',
          keymap: 'Alt + 2'
        }
      ]
    }
  },
  methods: {
    // menu 동작
    menuAction (type) {
      switch (type) {
        case 'modelAdd':
          model.commit({ type: type })
          break
        case 'tableAdd':
        case 'memoAdd':
          ERD.store().commit({ type: type })
          break
        case 'pk':
          ERD.store().commit({
            type: 'columnKey',
            key: type
          })
          break
        case 'erd-0-1-N':
        case 'erd-0-1':
          if (ERD.core.event.isCursor) {
            ERD.core.event.onCursor('stop')
          } else {
            ERD.core.event.onCursor('start', type)
          }
          break
      }
      this.isShow = false
    }
  },
  mounted () {
    // 오른쪽 클릭 이벤트 등록
    ERD.core.event.addRightClick(function (e) {
      this.top = e.clientY
      this.left = e.clientX
      this.zIndex = util.getZIndex()
      this.isShow = true
    }.bind(this))
    // 이벤트 핸들러에 컴포넌트 등록
    ERD.core.event.components.QuickMenu = this
  }
}
</script>

<style lang="scss" scoped>
  $mbg: #191919;
  $selected: #383d41;

  ul, ol {
    padding-left: 0;
  }

  .quick_menu {
    color: #a2a2a2;
    background-color: $mbg;
    position: fixed;
    opacity: 0.9;
    width: 170px;

    li {
      width: 100%;
      height: 100%;
      padding: 10px;
      cursor: pointer;
      box-sizing: border-box;

      &:hover {
        color: white;
        background-color: $selected;
      }

      & > span {
        width: 80px;
        display: inline-flex;
        vertical-align: middle;
        align-items: center;

        &:first-child {
          width: 30px;
          height: 30px;
        }

        &:last-child {
          width: 100%;
          display: inline;
        }

        img, span {
          display: inline-block;
          width: 20px;
          height: 20px;
        }
      }
    }

    .pk {
      color: #B4B400;
    }
  }
</style>

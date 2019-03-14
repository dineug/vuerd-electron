<template lang="pug">
  svg.svg_canvas(:style="`width: ${CANVAS_WIDTH}px; height: ${CANVAS_HEIGHT}px;`")
    // relation
    g(v-for="data in toLines" :key="data.id"
    @mouseover="hover($event, data.id)"
    @mouseleave="hoverOff(data.id)")

      // start draw
      line(:x1="data.path.line.start.x1" :y1="data.path.line.start.y1"
      :x2="data.path.line.start.x2" :y2="data.path.line.start.y2"
      :stroke="data.isIdentification ? '#60b9c4' : '#dda8b1'"
      stroke-width="3")

      path(:d="data.path.d()"
      :stroke="data.isIdentification ? '#60b9c4' : '#dda8b1'"
      :stroke-dasharray="data.isIdentification ? 0 : 10"
      stroke-width="3" fill="transparent")

      line(:x1="data.line.start.x1" :y1="data.line.start.y1"
      :x2="data.line.start.x2" :y2="data.line.start.y2"
      :stroke="data.isIdentification ? '#60b9c4' : '#dda8b1'"
      stroke-width="3")

      // end draw
      line(v-if="data.isDraw"
      :x1="data.path.line.end.x1" :y1="data.path.line.end.y1"
      :x2="data.path.line.end.x2" :y2="data.path.line.end.y2"
      :stroke="data.isIdentification ? '#60b9c4' : '#dda8b1'"
      stroke-width="3")

      circle(v-if="data.isDraw"
      :cx="data.circle.cx" :cy="data.circle.cy" r="8"
      :stroke="data.isIdentification ? '#60b9c4' : '#dda8b1'"
      fill-opacity="0.0" stroke-width="3")

      line(v-if="data.isDraw"
      :x1="data.line.end.base.x1" :y1="data.line.end.base.y1"
      :x2="data.line.end.base.x2" :y2="data.line.end.base.y2"
      :stroke="data.isIdentification ? '#60b9c4' : '#dda8b1'"
      stroke-width="3")

      line(v-if="data.isDraw && data.type === 'erd-0-1-N'"
      :x1="data.line.end.left.x1" :y1="data.line.end.left.y1"
      :x2="data.line.end.left.x2" :y2="data.line.end.left.y2"
      :stroke="data.isIdentification ? '#60b9c4' : '#dda8b1'"
      stroke-width="3")

      line(v-if="data.isDraw"
      :x1="data.line.end.center.x1" :y1="data.line.end.center.y1"
      :x2="data.line.end.center.x2" :y2="data.line.end.center.y2"
      :stroke="data.isIdentification ? '#60b9c4' : '#dda8b1'"
      stroke-width="3")

      line(v-if="data.isDraw && data.type === 'erd-0-1-N'"
      :x1="data.line.end.right.x1" :y1="data.line.end.right.y1"
      :x2="data.line.end.right.x2" :y2="data.line.end.right.y2"
      :stroke="data.isIdentification ? '#60b9c4' : '#dda8b1'"
      stroke-width="3")
</template>

<script>
import ERD from '@/js/editor/ERD'
import * as util from '@/js/editor/util'

export default {
  name: 'CanvasSvg',
  computed: {
    CANVAS_WIDTH () {
      return ERD.store().state.CANVAS_WIDTH
    },
    CANVAS_HEIGHT () {
      return ERD.store().state.CANVAS_HEIGHT
    },
    lines () {
      return ERD.store().state.lines
    },
    toLines () {
      const convertLines = []
      this.lines.forEach(v => {
        convertLines.push(util.convertLine(v))
      })
      // 위치 중첩 재가공
      const target = {}
      convertLines.forEach(v => {
        let key = v.path.line.start.x1 + '' + v.path.line.start.y1
        if (target[key]) target[key].push({ type: 'start', data: v })
        else target[key] = [{ type: 'start', data: v }]
        key = v.line.end.center.x2 + '' + v.line.end.center.y2
        if (target[key]) target[key].push({ type: 'end', data: v })
        else target[key] = [{ type: 'end', data: v }]
      })
      Object.keys(target).forEach(key => {
        if (target[key].length > 1) {
          util.convertPointOverlay(target[key])
        }
      })
      return convertLines
    }
  },
  methods: {
    hover (e, id) {
      const g = e.target.parentNode
      g.classList.add('relation_active')
      g.childNodes.forEach(elem => {
        if (elem.nodeName !== '#comment') {
          elem.classList.add('relation_active')
        }
      })
      ERD.store().commit({
        type: 'lineHover',
        id: id,
        isHover: true
      })
    },
    hoverOff (id) {
      this.$el.querySelectorAll('.relation_active').forEach(g => {
        g.classList.remove('relation_active')
        g.childNodes.forEach(elem => {
          if (elem.nodeName !== '#comment') {
            elem.classList.remove('relation_active')
          }
        })
      })
      ERD.store().commit({
        type: 'lineHover',
        id: id,
        isHover: false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
  .svg_canvas {
    position: absolute;

    .relation_active {
      stroke: #ffc107;
    }
  }
</style>

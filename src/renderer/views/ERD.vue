<template lang="pug">
    #erd
        canvas-menu
        quick-menu
        .canvas
            canvas-main
            canvas-svg
</template>

<script>
  import CanvasMenu from '@/components/editor/CanvasMenu'
  import QuickMenu from '@/components/editor/QuickMenu'
  import CanvasMain from '@/components/editor/CanvasMain'
  import CanvasSvg from '@/components/editor/CanvasSvg'
  import ERD from '@/js/editor/ERD'

  export default {
    name: 'ERD',
    components: {
      CanvasMenu,
      QuickMenu,
      CanvasMain,
      CanvasSvg
    },
    destroyed () {
      // 객체 정리
      ERD.destroy()
    }
  }
</script>

<style lang="scss">
    @import url(../css/NotoSans.css);

    #erd {
        display: flex;
        z-index: 2;

        .canvas {
            display: flex;
        }
    }

    /*reset css*/
    /*모든 태그요소들의 여백을 초기화*/
    * {
        margin: 0;
        padding: 0;
    }

    /*제목태그의 크기를 body에서 맞춘 크기와 동일하게 변경*/
    h1, h2, h3, h4, h5, h6 {
        font-size: 100%;
    }

    /*목록(리스트들의) 기호를 안보이게 처리*/
    ul, ol {
        list-style: none;
    }

    /*링크의 밑줄을 제거*/
    a {
        text-decoration: none;
    }

    /*인터넷 익스플로러에서 img태그에 링크걸었을때 나오는 테두리선 제거*/
    img {
        border: none;
    }

    /*테이블 태그 칸 사이 간격들을 없애주게 처리*/
    table {
        border-collapse: collapse;
        border-spacing: 0;
    }

    /*줄간격(행간은)글씨크기와 똑같은 비율로 맞춤 1배율 = 즉 12px*/
    body {
        font-family: 'Noto Sans', sans-serif;
        font-size: 12px;
        line-height: 1;
    }

    input {
        border: none;
    }

    *:focus {
        outline: none;
    }

    body {
        overflow-x: hidden;
        overflow-y: hidden;
    }
    /* width */
    body::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }
    /* Track */
    body::-webkit-scrollbar-track {
        background: #fafbfe;
        border-left: 1px solid  #e4e6e6;
    }
    /* Handle */
    body::-webkit-scrollbar-thumb {
        background: #aaa;
    }
    /* Handle : hover*/
    body::-webkit-scrollbar-thumb:hover {
        background: #a0a0a0;
    }
</style>

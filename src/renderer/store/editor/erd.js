import JSLog from '@/js/JSLog'
import Vue from 'vue'
import Vuex from 'vuex'
import dataType from './dataType'
import table from './mutationsTable'
import column from './mutationsColumn'
import line from './mutationsLine'
import memo from './mutationsMemo'
import domain from './mutationsDomain'
import * as util from '@/js/editor/util'
import ERD from '@/js/editor/ERD'

JSLog('store loaded', 'erd')
Vue.use(Vuex)

// ERD 데이터
export default () => {
  return new Vuex.Store({
    state: {
      TABLE_WIDTH: 350,
      TABLE_HEIGHT: 84,
      COLUMN_WIDTH: 50,
      COLUMN_HEIGHT: 25,
      PREVIEW_WIDTH: 150,
      CANVAS_WIDTH: 5000,
      CANVAS_HEIGHT: 5000,
      MEMO_WIDTH: 150,
      MEMO_HEIGHT: 100,
      DBType: 'MySQL',
      dataTypes: dataType['MySQL'],
      tables: [],
      lines: [],
      memos: [],
      domains: [],
      searchDomains: []
    },
    mutations: {
      // DB 변경
      changeDB (state, data) {
        JSLog('mutations', 'erd', 'changeDB')
        state.DBType = data.DBType
        state.dataTypes = dataType[data.DBType]
      },
      // 데이터타입 검색
      changeDataTypeHint (state, data) {
        JSLog('mutations', 'erd', 'changeDataTypeHint')
        state.dataTypes = dataType[state.DBType].filter(v => {
          return v.name.toLowerCase().indexOf(data.key.toLowerCase()) !== -1
        })
      },
      // 도메인 검색
      changeDomainHint (state, data) {
        JSLog('mutations', 'erd', 'changeDomainHint')
        state.searchDomains = state.domains.filter(v => {
          return v.name.toLowerCase().indexOf(data.key.toLowerCase()) !== -1
        })
      },
      // 전체 import
      importData (state, data) {
        JSLog('mutations', 'erd', 'importData')
        Object.keys(state).forEach(key => {
          state[key] = data.state[key]
        })
      },
      // 환경설정
      setConfig (state, data) {
        ERD.core.event.components.CanvasMenu.isSave = false
        util.setData(state, data.config)
      },
      // 테이블 추가
      tableAdd: table.add,
      // 테이블 삭제
      tableDelete: table.delete,
      // 테이블 높이 리셋
      tableHeightReset: table.heightReset,
      // 테이블 선택
      tableSelected: table.selected,
      // 테이블 top, left 변경
      tableDraggable: table.draggable,
      // 테이블 및 컬럼 selected All 해제
      tableSelectedAllNone: table.selectedAllNone,
      // 테이블 드래그 multi selected
      tableMultiSelected: table.multiSelected,
      // 테이블 전체 선택
      tableSelectedAll: table.selectedAll,
      // 테이블 편집모드
      tableEdit: table.edit,
      // 테이블 및 컬럼 edit all 해제
      tableEditAllNone: table.editAllNone,
      // 컬럼 추가
      columnAdd: column.add,
      // 컬럼 삭제
      columnDelete: column.delete,
      // 컬럼 NULL 조건 변경
      columnChangeNull: column.changeNull,
      // 컬럼 선택
      columnSelected: column.selected,
      // 컬럼 key active
      columnKey: column.key,
      // 컬럼 데이터변경
      columnChangeDataType: column.changeDataType,
      // 컬럼 데이터타입 힌트 show/hide
      columnDataTypeHintVisible: column.dataTypeHintVisible,
      // 컬럼 데이터타입 힌트 show/hide ALL
      columnDataTypeHintVisibleAll: column.dataTypeHintVisibleAll,
      // 컬럼 데이터타입 관계 동기화
      columnRelationSync: column.relationSync,
      // 컬럼 너비 리셋
      columnWidthReset: column.widthReset,
      // 컬럼 편집모드
      columnEdit: column.edit,
      // 컬럼 도메인 힌트 show/hide
      columnDomainHintVisible: column.domainHintVisible,
      // 컬럼 도메인 힌트 show/hide ALL
      columnDomainHintVisibleAll: column.domainHintVisibleAll,
      // 컬럼 도메인 변경
      columnChangeDomain: column.changeDomain,
      // 컬럼 도메인 유효성
      columnValidDomain: column.validDomain,
      // 컬럼 도메인 동기화
      columnDomainSync: column.domainSync,
      // 관계 생성
      lineAdd: line.add,
      // 관계 drawing
      lineDraw: line.draw,
      // 관계 삭제
      lineDelete: line.delete,
      // 관계 식별, 비식별 변경
      lineChangeIdentification: line.changeIdentification,
      // 관계 컬럼 이동 유효성
      lineValidColumn: line.validColumn,
      // 관계 컬럼 hover 처리
      lineHover: line.hover,
      // 메모 추가
      memoAdd: memo.add,
      // 메모 삭제
      memoDelete: memo.delete,
      // 메모 크기 수정
      memoSetWidthHeight: memo.setWidthHeight,
      // 메모 선택
      memoSelected: memo.selected,
      // 메모 top, left 변경
      memoDraggable: memo.draggable,
      // 메모 선택 전체 해제
      memoSelectedAllNone: memo.selectedAllNone,
      // 메모 드래그 selected
      memoMultiSelected: memo.multiSelected,
      // 메모 전체 선택
      memoSelectedAll: memo.selectedAll,
      // 메모 리사이징
      memoResize: memo.resize,
      // 도메인 추가
      domainAdd: domain.add,
      // 도메인 삭제
      domainDelete: domain.delete,
      // 도메인값 변경
      domainChange: domain.change,
      // 도메인 수정모드
      domainEdit: domain.edit,
      // 도메인 edit 해제
      domainEditAllNone: domain.editAllNone
    }
  })
}

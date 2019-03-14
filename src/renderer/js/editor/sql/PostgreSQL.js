import JSLog from '../../JSLog'
import * as util from '../util'

/**
 * PostgreSQL
 */
class PostgreSQL {
  constructor () {
    JSLog('module loaded', 'MSSQL')
    this.sql = null
    this.fkNames = []
  }

  init (sql) {
    this.sql = sql
    return this
  }

  ddl (database) {
    this.fkNames = []
    const stringBuffer = []
    const tables = database.store.state.tables
    const lines = database.store.state.lines

    stringBuffer.push(`DROP SCHEMA IF EXISTS "${database.name}" RESTRICT;`)
    stringBuffer.push('')
    stringBuffer.push(`CREATE SCHEMA "${database.name}";`)
    stringBuffer.push('')

    tables.forEach(table => {
      this.formatTable({
        name: database.name,
        table: table,
        buffer: stringBuffer
      })
      stringBuffer.push('')
      // 코멘트 추가
      this.formatComment({
        name: database.name,
        table: table,
        buffer: stringBuffer
      })
    })
    lines.forEach(line => {
      this.formatRelation({
        name: database.name,
        tables: tables,
        line: line,
        buffer: stringBuffer
      })
      stringBuffer.push('')
    })

    return stringBuffer.join('\n')
  }

  // 테이블 formatter
  formatTable ({ name, table, buffer }) {
    buffer.push(`CREATE TABLE "${name}"."${table.name}"`)
    buffer.push(`(`)
    const spaceSize = this.sql.formatSize(table.columns)
    const isPK = util.isColumnOption('primaryKey', table.columns)

    table.columns.forEach((column, i) => {
      if (isPK) {
        this.formatColumn({
          column: column,
          isComma: true,
          spaceSize: spaceSize,
          buffer: buffer
        })
      } else {
        this.formatColumn({
          column: column,
          isComma: table.columns.length !== i + 1,
          spaceSize: spaceSize,
          buffer: buffer
        })
      }
    })
    // PK
    if (isPK) {
      const pkColumns = util.getColumnOptions('primaryKey', table.columns)
      buffer.push(`\tPRIMARY KEY (${this.sql.formatNames(pkColumns, '"')})`)
    }
    buffer.push(`);`)
  }

  // 컬럼 formatter
  formatColumn ({ column, isComma, spaceSize, buffer }) {
    const stringBuffer = []
    stringBuffer.push(`\t"${column.name}"` + this.sql.formatSpace(spaceSize.nameMax - column.name.length))
    stringBuffer.push(`${column.dataType}` + this.sql.formatSpace(spaceSize.dataTypeMax - column.dataType.length))
    // 옵션 Not NUll
    if (column.options.notNull) {
      stringBuffer.push(`NOT NULL`)
    }
    // 유니크
    if (column.options.unique) {
      stringBuffer.push(`UNIQUE`)
    } else {
      // 컬럼 DEFAULT
      if (column.default.trim() !== '') {
        stringBuffer.push(`DEFAULT ${column.default}`)
      }
    }
    buffer.push(stringBuffer.join(' ') + `${isComma ? ',' : ''}`)
  }

  // 코멘트
  formatComment ({ name, table, buffer }) {
    if (table.comment.trim() !== '') {
      buffer.push(`COMMENT ON TABLE "${name}"."${table.name}" IS '${table.comment}';`)
      buffer.push('')
    }
    table.columns.forEach(column => {
      if (column.comment.trim() !== '') {
        buffer.push(`COMMENT ON COLUMN "${name}"."${table.name}"."${column.name}" IS '${column.comment}';`)
        buffer.push('')
      }
    })
  }

  // 관계 formatter
  formatRelation ({ name, tables, line, buffer }) {
    const startTable = util.getData(tables, line.points[0].id)
    const endTable = util.getData(tables, line.points[1].id)
    buffer.push(`ALTER TABLE "${name}"."${endTable.name}"`)

    // FK 중복 처리
    let fkName = `FK_${startTable.name}_TO_${endTable.name}`
    fkName = util.autoName(this.fkNames, fkName)
    this.fkNames.push(fkName)

    buffer.push(`\tADD CONSTRAINT "${fkName}"`)

    // key 컬럼 정제
    const columns = {
      start: [],
      end: []
    }
    line.points[1].columnIds.forEach(id => {
      columns.end.push(util.getData(endTable.columns, id))
    })
    line.points[0].columnIds.forEach(id => {
      columns.start.push(util.getData(startTable.columns, id))
    })

    buffer.push(`\t\tFOREIGN KEY (${this.sql.formatNames(columns.end, '"')})`)
    buffer.push(`\t\tREFERENCES "${name}"."${startTable.name}" (${this.sql.formatNames(columns.start, '"')});`)
  }

  // 객체 정리
  destroy () {}
}

export default new PostgreSQL()

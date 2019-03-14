import JSLog from '@/js/JSLog'
import MySQL from './dataType/MySQL'
import Oracle from './dataType/Oracle'
import MariaDB from './dataType/MariaDB'
import MSSQL from './dataType/MSSQL'
import PostgreSQL from './dataType/PostgreSQL'

JSLog('store loaded', 'dataType')

export default {
  MySQL: MySQL,
  Oracle: Oracle,
  MariaDB: MariaDB,
  MSSQL: MSSQL,
  PostgreSQL: PostgreSQL
}

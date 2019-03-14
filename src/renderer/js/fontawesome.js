import Vue from 'vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faKey,
  faEye,
  faPlus,
  faList,
  faUndo,
  faRedo,
  faFile,
  faCopy,
  faSave,
  faBook,
  faTable,
  faTimes,
  faFolder,
  faHistory,
  faTrashAlt,
  faDatabase,
  faQuestion,
  faFolderOpen,
  faFileImport,
  faFileExport,
  faStickyNote,
  faExpandArrowsAlt
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faKey,
  faEye,
  faPlus,
  faList,
  faUndo,
  faRedo,
  faFile,
  faCopy,
  faSave,
  faBook,
  faTable,
  faTimes,
  faFolder,
  faHistory,
  faTrashAlt,
  faDatabase,
  faQuestion,
  faFolderOpen,
  faFileImport,
  faFileExport,
  faStickyNote,
  faExpandArrowsAlt
)

Vue.component('font-awesome-icon', FontAwesomeIcon)

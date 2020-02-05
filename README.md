# Warning
> This project is no longer managed  

completely restructured  
Please use the [vscode extension ERD Editor]((https://marketplace.visualstudio.com/items?itemName=dineug.vuerd-vscode))

## Migration Data
```javascript
const oldData = require("./[oldData].json");
const fs = require("fs");

function createBaseData() {
  return {
    canvas: {
      width: 2000,
      height: 2000,
      scrollTop: 0,
      scrollLeft: 0,
      show: {
        tableComment: true,
        columnComment: true,
        columnDataType: true,
        columnDefault: true,
        columnAutoIncrement: true,
        columnPrimaryKey: true,
        columnUnique: true,
        columnNotNull: true,
        relationship: true
      },
      database: "MySQL",
      databaseName: "",
      canvasType: "ERD",
      language: "graphql",
      tableCase: "pascalCase",
      columnCase: "camelCase"
    },
    memo: {
      memos: []
    },
    table: {
      tables: [],
      edit: null,
      copyColumns: [],
      columnDraggable: null
    },
    relationship: {
      relationships: [],
      draw: null
    }
  };
}

oldData.tabs.forEach(tab => {
  const baseData = createBaseData();
  baseData.canvas.databaseName = tab.name;
  baseData.canvas.width = tab.store.CANVAS_WIDTH;
  baseData.canvas.height = tab.store.CANVAS_WIDTH;
  tab.store.tables.forEach(table => {
    const resultTable = {
      id: table.id,
      name: table.name,
      comment: table.comment,
      ui: {
        active: table.ui.selected,
        top: table.ui.top,
        left: table.ui.left,
        widthName: table.ui.width / 2,
        widthComment: table.ui.width / 2,
        zIndex: table.ui.zIndex
      },
      columns: []
    };
    table.columns.forEach(column => {
      resultTable.columns.push({
        id: column.id,
        name: column.name,
        comment: column.comment,
        dataType: column.dataType,
        default: column.default,
        option: {
          autoIncrement: column.options.autoIncrement,
          primaryKey: column.options.primaryKey,
          unique: column.options.unique,
          notNull: column.options.notNull
        },
        ui: {
          active: column.ui.selected,
          pk: column.ui.pk,
          fk: column.ui.fk,
          pfk: column.ui.pfk,
          widthName: column.ui.widthName,
          widthComment: column.ui.widthComment,
          widthDataType: column.ui.widthDataType,
          widthDefault: 60
        }
      });
    });
    baseData.table.tables.push(resultTable);
  });
  tab.store.lines.forEach(line => {
    baseData.relationship.relationships.push({
      identification: line.isIdentification,
      id: line.id,
      relationshipType: line.type === "erd-0-1-N" ? "ZeroOneN" : "ZeroOne",
      start: {
        tableId: line.points[0].id,
        columnIds: line.points[0].columnIds,
        x: line.points[0].x,
        y: line.points[0].y,
        direction: "top"
      },
      end: {
        tableId: line.points[1].id,
        columnIds: line.points[1].columnIds,
        x: line.points[1].x,
        y: line.points[1].y,
        direction: "top"
      }
    });
  });
  tab.store.memos.forEach(memo => {
    baseData.memo.memos.push({
      value: memo.content,
      id: memo.id,
      ui: {
        active: memo.ui.selected,
        top: memo.ui.top,
        left: memo.ui.left,
        width: memo.ui.width,
        height: memo.ui.height,
        zIndex: memo.ui.zIndex
      }
    });
  });

  fs.writeFile(
    `./convert-${new Date().getTime()}.vuerd.json`,
    JSON.stringify(
      baseData,
      (key, value) => {
        return value;
      },
      2
    ),
    err => {
      if (err) {
        console.log(err);
      }
    }
  );
});

console.log("END");
```

## vuerd  
![logo](https://vuerd.github.io/vuerd-front/verd.png)
---
![use](https://user-images.githubusercontent.com/45829489/54869528-2ecfeb00-4ddd-11e9-8f7b-40df329646fa.png)  
![use](https://user-images.githubusercontent.com/45829489/54869529-2f688180-4ddd-11e9-810c-60c78a776bf5.png)
---
# vuerd-electron
## ERD
* ERD editor [demo](https://vuerd.github.io/vuerd-front/).
* ERD chrome extensions [app](https://chrome.google.com/webstore/detail/vuerd/jnjbnkehgfngjhlcaefjfdamioapajfg)
* ERD desktop app [download](https://github.com/vuerd/vuerd-electron/releases)

## start

``` bash
$ yarn
$ yarn dev
```

## License
[MIT](https://github.com/vuerd/vuerd-electron/blob/master/LICENSE)

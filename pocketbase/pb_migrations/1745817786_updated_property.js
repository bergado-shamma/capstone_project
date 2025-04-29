/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3418113223")

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number2683508278",
    "max": 1000,
    "min": 1,
    "name": "quantity",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3418113223")

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number2683508278",
    "max": 15,
    "min": 1,
    "name": "quantity",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})

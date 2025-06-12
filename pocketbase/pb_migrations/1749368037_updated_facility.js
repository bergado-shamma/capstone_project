/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1343737003")

  // remove field
  collection.fields.removeById("text2364059159")

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "json2683508278",
    "maxSize": 0,
    "name": "quantity",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1343737003")

  // add field
  collection.fields.addAt(7, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2364059159",
    "max": 0,
    "min": 0,
    "name": "quantity",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("json2683508278")

  return app.save(collection)
})

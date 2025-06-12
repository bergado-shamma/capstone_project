/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1343737003")

  // add field
  collection.fields.addAt(7, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2364059159",
    "max": 0,
    "min": 0,
    "name": "predeterminedPropertyQuantity",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1343737003")

  // remove field
  collection.fields.removeById("text2364059159")

  return app.save(collection)
})

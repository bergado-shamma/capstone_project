/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // add field
  collection.fields.addAt(19, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2729774353",
    "max": 0,
    "min": 0,
    "name": "eventName",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // remove field
  collection.fields.removeById("text2729774353")

  return app.save(collection)
})

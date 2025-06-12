/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // add field
  collection.fields.addAt(18, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1579615889",
    "max": 0,
    "min": 0,
    "name": "facultyInCharge",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "hidden": false,
    "id": "date1917433530",
    "max": "",
    "min": "",
    "name": "preperationTime",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // remove field
  collection.fields.removeById("text1579615889")

  // remove field
  collection.fields.removeById("date1917433530")

  return app.save(collection)
})

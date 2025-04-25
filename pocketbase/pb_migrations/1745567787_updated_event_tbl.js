/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_834252946")

  // remove field
  collection.fields.removeById("text1843675174")

  // add field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "date1206794911",
    "max": "",
    "min": "",
    "name": "date_of_event",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(17, new Field({
    "hidden": false,
    "id": "date181501832",
    "max": "",
    "min": "",
    "name": "date_of_request",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_834252946")

  // add field
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1843675174",
    "max": 0,
    "min": 0,
    "name": "description",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("date1206794911")

  // remove field
  collection.fields.removeById("date181501832")

  return app.save(collection)
})

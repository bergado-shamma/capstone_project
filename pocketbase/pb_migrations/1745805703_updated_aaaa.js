/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2325054197")

  // update field
  collection.fields.addAt(0, new Field({
    "autogeneratePattern": "evnt[a-z0-9]{15}",
    "hidden": false,
    "id": "text3208210256",
    "max": 20,
    "min": 0,
    "name": "id",
    "pattern": "^[a-z0-9]+$",
    "presentable": false,
    "primaryKey": true,
    "required": true,
    "system": true,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2325054197")

  // update field
  collection.fields.addAt(0, new Field({
    "autogeneratePattern": "e[a-z0-9]{15}",
    "hidden": false,
    "id": "text3208210256",
    "max": 16,
    "min": 16,
    "name": "id",
    "pattern": "^[a-z0-9]+$",
    "presentable": false,
    "primaryKey": true,
    "required": true,
    "system": true,
    "type": "text"
  }))

  return app.save(collection)
})

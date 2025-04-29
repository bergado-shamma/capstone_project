/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1343737003")

  // update field
  collection.fields.addAt(0, new Field({
    "autogeneratePattern": "FCTY-[a-z0-9]{15}",
    "hidden": false,
    "id": "text3208210256",
    "max": 20,
    "min": 0,
    "name": "id",
    "pattern": "^[A-Za-z0-9-]+$",
    "presentable": true,
    "primaryKey": true,
    "required": true,
    "system": true,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1343737003")

  // update field
  collection.fields.addAt(0, new Field({
    "autogeneratePattern": "FCTY-[a-z0-9]{15}",
    "hidden": false,
    "id": "text3208210256",
    "max": 20,
    "min": 0,
    "name": "id",
    "pattern": "^[A-Za-z0-9-]+$",
    "presentable": false,
    "primaryKey": true,
    "required": true,
    "system": true,
    "type": "text"
  }))

  return app.save(collection)
})

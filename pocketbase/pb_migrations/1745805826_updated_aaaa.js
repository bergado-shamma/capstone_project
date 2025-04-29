/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2325054197")

  // update collection data
  unmarshal({
    "name": "availability_tbl"
  }, collection)

  // update field
  collection.fields.addAt(0, new Field({
    "autogeneratePattern": "AVL-[a-z0-9]{15}",
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
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2325054197")

  // update collection data
  unmarshal({
    "name": "aaaa"
  }, collection)

  // update field
  collection.fields.addAt(0, new Field({
    "autogeneratePattern": "EVNT-[a-z0-9]{15}",
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

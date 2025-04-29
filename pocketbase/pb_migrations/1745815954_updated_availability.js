/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2325054197")

  // add field
  collection.fields.addAt(6, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1343737003",
    "hidden": false,
    "id": "relation809691140",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "facilityID",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3418113223",
    "hidden": false,
    "id": "relation443112470",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "propertyID",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2325054197")

  // remove field
  collection.fields.removeById("relation809691140")

  // remove field
  collection.fields.removeById("relation443112470")

  return app.save(collection)
})

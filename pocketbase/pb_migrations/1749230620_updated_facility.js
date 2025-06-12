/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1343737003")

  // add field
  collection.fields.addAt(6, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3418113223",
    "hidden": false,
    "id": "relation1418859500",
    "maxSelect": 999,
    "minSelect": 0,
    "name": "property_id",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1343737003")

  // remove field
  collection.fields.removeById("relation1418859500")

  return app.save(collection)
})

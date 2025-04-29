/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3615662572")

  // add field
  collection.fields.addAt(2, new Field({
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
  collection.fields.addAt(3, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2325054197",
    "hidden": false,
    "id": "relation1247161406",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "availabilityID",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(4, new Field({
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

  // add field
  collection.fields.addAt(5, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation1608019204",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "userID",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3615662572")

  // remove field
  collection.fields.removeById("relation809691140")

  // remove field
  collection.fields.removeById("relation1247161406")

  // remove field
  collection.fields.removeById("relation443112470")

  // remove field
  collection.fields.removeById("relation1608019204")

  return app.save(collection)
})

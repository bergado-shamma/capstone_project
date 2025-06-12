/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3418113223")

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "select1331723204",
    "maxSelect": 1,
    "name": "propertyCondition",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "good",
      "needs repair",
      "damaged"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3418113223")

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "select1331723204",
    "maxSelect": 1,
    "name": "propertyCondition",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "'good'",
      "'needs repair'",
      "'damaged'"
    ]
  }))

  return app.save(collection)
})

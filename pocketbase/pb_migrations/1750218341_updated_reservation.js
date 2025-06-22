/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // update field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "select1883776062",
    "maxSelect": 1,
    "name": "eventType",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "organization",
      "academic",
      "university",
      "outside"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // update field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "select1883776062",
    "maxSelect": 1,
    "name": "eventType",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "organization",
      "academic",
      "non-academic organization"
    ]
  }))

  return app.save(collection)
})

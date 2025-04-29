/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // add field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "select1883776062",
    "maxSelect": 1,
    "name": "eventType",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Organization",
      "Academic"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // remove field
  collection.fields.removeById("select1883776062")

  return app.save(collection)
})

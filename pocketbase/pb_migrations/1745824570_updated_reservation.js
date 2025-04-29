/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "status",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pending",
      "approved",
      "rejected",
      "cancelled"
    ]
  }))

  // update field
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
      "organization",
      "academic"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "status",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Pending",
      "Approved",
      "Rejected",
      "Cancelled"
    ]
  }))

  // update field
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
})

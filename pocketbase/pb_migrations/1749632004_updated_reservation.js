/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "json2861594163",
    "maxSize": 0,
    "name": "propertyQuantity",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "json2861594163",
    "maxSize": 0,
    "name": "propertQuantity",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
})

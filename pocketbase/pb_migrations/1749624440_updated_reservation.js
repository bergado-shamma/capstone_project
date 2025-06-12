/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // remove field
  collection.fields.removeById("text1258348389")

  // add field
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
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // add field
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1258348389",
    "max": 0,
    "min": 0,
    "name": "propertyQuantity",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("json2861594163")

  return app.save(collection)
})

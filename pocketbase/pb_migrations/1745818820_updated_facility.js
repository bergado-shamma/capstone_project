/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1343737003")

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "file2768011765",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "facilityPhoto",
    "presentable": false,
    "protected": false,
    "required": true,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1343737003")

  // remove field
  collection.fields.removeById("file2768011765")

  return app.save(collection)
})

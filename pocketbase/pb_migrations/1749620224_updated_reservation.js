/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // update field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "select379482041",
    "maxSelect": 1,
    "name": "course",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "BSBA-HRM",
      "BSBA-MM",
      "BSA",
      "BSED-MT",
      "BSED-EDEN",
      "BSME",
      "BSECE",
      "BSPSYCH",
      "BSOA",
      "BSIT",
      "DOMT",
      "DIT"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // update field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "select379482041",
    "maxSelect": 1,
    "name": "course",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "BSBA-HR",
      "BSBA-MM",
      "BSA",
      "BSED-MT",
      "BSED-EDEN",
      "BSME",
      "BSECE",
      "BSPSYCH",
      "BSOA",
      "BSIT",
      "DOMT",
      "DIT"
    ]
  }))

  return app.save(collection)
})

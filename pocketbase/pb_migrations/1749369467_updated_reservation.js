/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // remove field
  collection.fields.removeById("text2932403292")

  // add field
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

  // add field
  collection.fields.addAt(19, new Field({
    "hidden": false,
    "id": "select2932403292",
    "maxSelect": 1,
    "name": "OrganizationName",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "AECES",
      "PSME-PUPTSU",
      "JPMAP",
      "JMA",
      "PASOA",
      "CS",
      "PSYCHOLOGY SOCIETY",
      "MS",
      "BYP",
      "REC",
      "PUPUKAW",
      "ERG",
      "IRock",
      "CSC"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // add field
  collection.fields.addAt(18, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2932403292",
    "max": 0,
    "min": 0,
    "name": "OrganizationName",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("select379482041")

  // remove field
  collection.fields.removeById("select2932403292")

  return app.save(collection)
})

/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select3655317636",
    "maxSelect": 1,
    "name": "organization",
    "presentable": true,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "CSC",
      "AECES",
      "CS",
      "JMA",
      "JPIA",
      "JPMAP",
      "JPSME",
      "PASOA",
      "MS",
      "PUPUKAW",
      "ERG"
    ]
  }))

  // update field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "select288516751",
    "maxSelect": 1,
    "name": "course",
    "presentable": true,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "BSECE",
      "BSME",
      "BSBAHRM",
      "BSBAMM",
      "BSIT",
      "BSED-MATH",
      "BSED-ENGLISH",
      "BSOA",
      "DIT",
      "DOMT"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select3655317636",
    "maxSelect": 1,
    "name": "organization",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "CSC",
      "AECES",
      "CS",
      "JMA",
      "JPIA",
      "JPMAP",
      "JPSME",
      "PASOA",
      "MS",
      "PUPUKAW",
      "ERG"
    ]
  }))

  // update field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "select288516751",
    "maxSelect": 1,
    "name": "course",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "BSECE",
      "BSME",
      "BSBAHRM",
      "BSBAMM",
      "BSIT",
      "BSED-MATH",
      "BSED-ENGLISH",
      "BSOA",
      "DIT",
      "DOMT"
    ]
  }))

  return app.save(collection)
})

/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select3655317636",
    "maxSelect": 1,
    "name": "Organization",
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

  // add field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "select288516751",
    "maxSelect": 1,
    "name": "Course",
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
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // remove field
  collection.fields.removeById("select3655317636")

  // remove field
  collection.fields.removeById("select288516751")

  return app.save(collection)
})

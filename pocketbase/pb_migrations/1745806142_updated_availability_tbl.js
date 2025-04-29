/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2325054197")

  // update collection data
  unmarshal({
    "name": "availabilityTbl"
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "select2363381545",
    "maxSelect": 1,
    "name": "type",
    "presentable": true,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Facility",
      "Property"
    ]
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "date2292406980",
    "max": "",
    "min": "",
    "name": "availabilityDate",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "date1269603864",
    "max": "",
    "min": "",
    "name": "startDate",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "date826688707",
    "max": "",
    "min": "",
    "name": "endDate",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "status",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "available",
      "unavailable"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2325054197")

  // update collection data
  unmarshal({
    "name": "availability_tbl"
  }, collection)

  // remove field
  collection.fields.removeById("select2363381545")

  // remove field
  collection.fields.removeById("date2292406980")

  // remove field
  collection.fields.removeById("date1269603864")

  // remove field
  collection.fields.removeById("date826688707")

  // remove field
  collection.fields.removeById("select2063623452")

  return app.save(collection)
})

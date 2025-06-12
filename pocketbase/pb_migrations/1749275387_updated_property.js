/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3418113223")

  // add field
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text109474877",
    "max": 0,
    "min": 0,
    "name": "damagedRepairQty",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number2686965357",
    "max": null,
    "min": null,
    "name": "availableQty",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3418113223")

  // remove field
  collection.fields.removeById("text109474877")

  // remove field
  collection.fields.removeById("number2686965357")

  return app.save(collection)
})

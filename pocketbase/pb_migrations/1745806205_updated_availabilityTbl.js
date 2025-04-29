/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2325054197")

  // update collection data
  unmarshal({
    "name": "availability"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2325054197")

  // update collection data
  unmarshal({
    "name": "availabilityTbl"
  }, collection)

  return app.save(collection)
})

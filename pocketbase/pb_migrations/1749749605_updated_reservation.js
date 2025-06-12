/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = \"super-admin\" || @request.auth.id != \"\"",
    "deleteRule": "@request.auth.role = \"super-admin\" || @request.auth.id != \"\"",
    "listRule": "@request.auth.role = \"super-admin\" || @request.auth.id != \"\"",
    "updateRule": "@request.auth.role = \"super-admin\" || @request.auth.id != \"\"",
    "viewRule": "@request.auth.role = \"super-admin\" || @request.auth.id != \"\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // update collection data
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, collection)

  return app.save(collection)
})

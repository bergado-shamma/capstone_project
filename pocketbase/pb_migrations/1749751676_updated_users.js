/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

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
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "createRule": "role = 'super-admin'",
    "deleteRule": "role = 'super-admin'",
    "listRule": "role = 'super-admin'",
    "updateRule": "id = @request.auth.id || role = 'super-admin'",
    "viewRule": "id = @request.auth.id || role = 'super-admin'"
  }, collection)

  return app.save(collection)
})

/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "deleteRule": "role = 'super-admin'",
    "listRule": "role = 'super-admin'",
    "viewRule": "id = @request.auth.id || role = 'super-admin'"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "deleteRule": "id = @request.auth.id",
    "listRule": "",
    "viewRule": ""
  }, collection)

  return app.save(collection)
})

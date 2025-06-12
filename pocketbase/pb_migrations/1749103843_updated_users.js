/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "otp": {
      "enabled": true
    },
    "verificationToken": {
      "duration": 259200
    }
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "otp": {
      "enabled": false
    },
    "verificationToken": {
      "duration": 86400
    }
  }, collection)

  return app.save(collection)
})

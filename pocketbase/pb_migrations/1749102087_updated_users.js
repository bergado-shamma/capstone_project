/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "emailChangeToken": {
      "duration": 3600
    },
    "fileToken": {
      "duration": 1800
    },
    "passwordResetToken": {
      "duration": 3600
    },
    "verificationToken": {
      "duration": 86400
    }
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "emailChangeToken": {
      "duration": 1800
    },
    "fileToken": {
      "duration": 180
    },
    "passwordResetToken": {
      "duration": 1800
    },
    "verificationToken": {
      "duration": 259200
    }
  }, collection)

  return app.save(collection)
})

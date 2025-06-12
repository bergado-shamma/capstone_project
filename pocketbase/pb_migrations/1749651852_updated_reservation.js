/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // add field
  collection.fields.addAt(22, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2268670113",
    "max": 0,
    "min": 0,
    "name": "propertyCustodianApprove",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(23, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1707725512",
    "max": 0,
    "min": 0,
    "name": "campusDirectorApprove",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(24, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2352346624",
    "max": 0,
    "min": 0,
    "name": "facultyInChargeApprove",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(25, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2734339180",
    "max": 0,
    "min": 0,
    "name": "organizationAdviserApprove",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(26, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1930722870",
    "max": 0,
    "min": 0,
    "name": "headOfAcademicProgramsApprove",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(27, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3263214622",
    "max": 0,
    "min": 0,
    "name": "headOfStudentAffairsApprove",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(28, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text4013451783",
    "max": 0,
    "min": 0,
    "name": "administrativeOfficerApprove",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2990107169")

  // remove field
  collection.fields.removeById("text2268670113")

  // remove field
  collection.fields.removeById("text1707725512")

  // remove field
  collection.fields.removeById("text2352346624")

  // remove field
  collection.fields.removeById("text2734339180")

  // remove field
  collection.fields.removeById("text1930722870")

  // remove field
  collection.fields.removeById("text3263214622")

  // remove field
  collection.fields.removeById("text4013451783")

  return app.save(collection)
})

/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("event_tbl");

    // add field
    collection.fields.addAt(
      4,
      new Field({
        hidden: false,
        id: "number1866686749",
        max: null,
        min: null,
        name: "target_capacity",
        onlyInt: false,
        presentable: false,
        required: false,
        system: false,
        type: "number",
      })
    );

    // add field
    collection.fields.addAt(
      5,
      new Field({
        autogeneratePattern: "",
        hidden: false,
        id: "text1521872571",
        max: 0,
        min: 0,
        name: "person_in_charge",
        pattern: "",
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: "text",
      })
    );

    // add field
    collection.fields.addAt(
      6,
      new Field({
        hidden: false,
        id: "number100804821",
        max: null,
        min: null,
        name: "contact_number",
        onlyInt: false,
        presentable: false,
        required: false,
        system: false,
        type: "number",
      })
    );

    // add field
    collection.fields.addAt(
      7,
      new Field({
        hidden: false,
        id: "date3731879417",
        max: "",
        min: "",
        name: "preperation_time",
        presentable: false,
        required: false,
        system: false,
        type: "date",
      })
    );

    // add field
    collection.fields.addAt(
      8,
      new Field({
        hidden: false,
        id: "date1345189255",
        max: "",
        min: "",
        name: "start_time",
        presentable: false,
        required: false,
        system: false,
        type: "date",
      })
    );

    // add field
    collection.fields.addAt(
      9,
      new Field({
        hidden: false,
        id: "date1096160257",
        max: "",
        min: "",
        name: "end_time",
        presentable: false,
        required: false,
        system: false,
        type: "date",
      })
    );

    // add field
    collection.fields.addAt(
      10,
      new Field({
        hidden: false,
        id: "select2467634050",
        maxSelect: 1,
        name: "event_type",
        presentable: false,
        required: false,
        system: false,
        type: "select",
        values: ["Academic", "Organization"],
      })
    );

    // add field
    collection.fields.addAt(
      11,
      new Field({
        autogeneratePattern: "",
        hidden: false,
        id: "text3447230013",
        max: 0,
        min: 0,
        name: "faculty_in_charge",
        pattern: "",
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: "text",
      })
    );

    // add field
    collection.fields.addAt(
      12,
      new Field({
        autogeneratePattern: "",
        hidden: false,
        id: "text1319058953",
        max: 0,
        min: 0,
        name: "title_of_seminar",
        pattern: "",
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: "text",
      })
    );

    // add field
    collection.fields.addAt(
      13,
      new Field({
        autogeneratePattern: "",
        hidden: false,
        id: "text4224597626",
        max: 0,
        min: 0,
        name: "subject",
        pattern: "",
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: "text",
      })
    );

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("pbc_834252946");

    // remove field
    collection.fields.removeById("number1866686749");

    // remove field
    collection.fields.removeById("text1521872571");

    // remove field
    collection.fields.removeById("number100804821");

    // remove field
    collection.fields.removeById("date3731879417");

    // remove field
    collection.fields.removeById("date1345189255");

    // remove field
    collection.fields.removeById("date1096160257");

    // remove field
    collection.fields.removeById("select2467634050");

    // remove field
    collection.fields.removeById("text3447230013");

    // remove field
    collection.fields.removeById("text1319058953");

    // remove field
    collection.fields.removeById("text4224597626");

    return app.save(collection);
  }
);

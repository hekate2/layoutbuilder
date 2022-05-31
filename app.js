/**
 * The server-side code for a website that helps the user create
 * their own website.  Serves information about different
 * styles that can be manipulated for specific types of objects.
 * Also, supplies possible pre-programmed values that can serve as
 * styles for an object of a particular type.
 * @author hekate.neocities.org <howsoonisnow1121@gmail.com>
 */
"use strict";
const express = require('express');

const fs = require('fs').promises;
const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());

/** Retrieves all potential properties for a type of object */
app.get("/styles/:object/properties", async (req, res) => {
  let object = req.params["object"];

  try {
    let results = await fs.readFile('styles.json');
    results = JSON.parse(results);

    if (!results[object]) {
      res.status(400).type('text')
        .send("the requested object does not exist in the database.");
    } else {
      res.json(results[object]);
    }
  } catch (err) {
    res.status(500).type('text')
      .send("Oops, something went wrong on the server");
  }
});

/** Retrieves all possible categories of styles for a particular object */
app.get("/styles/:object", async (req, res) => {
  let object = req.params["object"];
    try {
      let results = await fs.readFile('objects.json', 'utf8');
      results = JSON.parse(results);

      if (!results[object]) {
        res.status(400).type('text')
        .send("The requested object does not exist in the database.");
      } else {
        res.json(results[object]);
      }
      
    } catch(err) {
      res.status(500).type('text')
      .send("Oops, something went wrong on the server");
    }
});

app.use(express.static('public'));
const PORT = process.env.PORT || 8000;
app.listen(PORT);
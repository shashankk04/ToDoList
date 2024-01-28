//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//MONgoose conection
mongoose.connect('mongodb+srv://shiv04313:rgdlk8A4k8CXyQVL@todolistcluster.hjq1vwo.mongodb.net/?retryWrites=true&w=majority');
//schema definition
const itemsSchema = {
  name: String,
}
//makingmodel
const Item = mongoose.model("Item",itemsSchema);
const item1 = new Item({
  name: "Welcome to your To-Do-List !"
});
const item2 = new Item({
  name: "Hit the + button to add a task."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item"
});
const defaultItems = [item1,item2,item3];


const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List",listSchema);


app.get("/", async (req, res) => {
  try {
    const foundItems = await Item.find({});
    
    if (foundItems.length === 0) {
      await Item.insertMany(defaultItems);
      console.log("Default items added to DB.");
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/", async function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName == "Today") {
    await item.save();
    res.redirect("/");
  } else {
    try {
      const foundList = await List.findOne({ name: listName });
      foundList.items.push(item);
      await foundList.save();
      res.redirect("/" + listName);
    } catch (err) {
      // Handle errors here
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  }
});

app.post("/delete", async (req, res) => {
  try {
    const listName = req.body.listName;
    const checkedItemID = req.body.checkbox;

    if (listName === "Today") {
      const result = await Item.findByIdAndDelete(checkedItemID);
      console.log(result ? "Successfully deleted item." : "Item not found.");

      if (result) {
        res.redirect("/"); // Redirect to the home page
      } else {
        res.sendStatus(404);
      }
    } else {
      const updateResult = await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemID } } }
      );

      if (updateResult) {
        res.redirect("/" + listName);
      } else {
        res.sendStatus(404);
      }
    }
  } catch (err) {
    console.error("Error deleting item:", err);
    res.sendStatus(500);
  }
});




app.get("/:customListName", async function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName });

    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      await list.save();
      res.redirect("/"+customListName);
    } else {
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  } catch (err) {
    // Handle errors here
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});




app.listen(3000, function() {
  console.log("Server started on port 3000");
});

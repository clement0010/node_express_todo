//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-clement:C6hsjI9ebL8JAWh9@cluster0-duhrx.mongodb.net/test?retryWrites=true/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
// user: admin-clement
// pass: C6hsjI9ebL8JAWh9

const itemsScheme = {
  name: {
    type: String,
    require: [true, "========Please insert todos!=================="]
  }
}

const listsScheme = {
  name: {
    type: String,
    require: [true, "========Please insert todos!=================="]
  },
  items: [itemsScheme]
}

const Item = mongoose.model("Item", itemsScheme);
const List = mongoose.model("List", listsScheme);

const item1 = new Item({
  name: "Welcome to your Todolist!"
});

const item2 = new Item({
  name: "Press Enter or click the '+' button to submit a new todo!"
});

const item3 = new Item({
  name: "<~~~~ Hit this checkbox to delete"
});

const defaultItems = [item1, item2, item3]

app.get("/", function (req, res) {

  Item.find({}, function (err, items) {
    if (items.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("===============INITIALIZED NEW DATA BASE=====================");
        }
      });
      res.redirect('/')
    } else {
      res.render("list", {
        newListItems: items,
        listTitle: "Today"
      })
    }
  })

});

app.post("/", function (req, res) {
  const newItem = req.body.newItem;
  const listName = req.body.listName;

  const item = new Item({
    name: newItem
  })

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function (err, foundList) {
      if (!err) {
        foundList.items.push(item);
        foundList.save();
        res.redirect(`/${listName}`)
      }
    })
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  const list = new List({
    name: customListName,
    items: defaultItems
  })

  List.findOne({
    name: customListName
  }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        console.log("Page doesnt exists");
        list.save()
        res.redirect(`/${customListName}`)
      } else {
        console.log("Page Exists");
        res.render("list", {
          newListItems: foundList.items,
          listTitle: foundList.name
        })
      }
    } else {
      console.log(err);
    }
  })
})

app.post("/delete", function (req, res) {
  const itemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(itemId, {useFindAndModify: false }, 
      function (err) {
      if (!err) {
        res.redirect("/")
        console.log("Deleted item");
      }
    });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: {items: {_id: itemId } } }, { useFindAndModify: false }, 
      function (err, foundList) {
      if (!err) {
        res.redirect(`/${listName}`)
      }
    })  
  }
})

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

mongoose.connect("mongodb+srv://admin-mani:admin-mani@cluster0.vqgfbvp.mongodb.net/todolistDB")

const tasksSchema = {
  name: {
    type: String,
    required: true
  }
};

const Tasks = mongoose.model("task", tasksSchema);

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const task1 = new Tasks({
  name: "Welcome to your ToDoList!"
});
const task2 = new Tasks({
  name: "Hit the + button to add a new task."
});
const task3 = new Tasks({
  name: "Hit the checkbox to delete your task."
});

const defaultTasks = [task1, task2, task3];

const listsSchema = {
  name: String,
  tasks: [tasksSchema]
};

const List = mongoose.model("List", listsSchema);

app.get("/", function (req, res) {

  Tasks.find({}, function (err, foundTasks) {

    if (foundTasks.length === 0) {
      Tasks.insertMany(defaultTasks, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully inserted!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundTasks });
    }
  })
});

app.post("/", function (req, res) {

  const taskName = req.body.newItem;
  const listName = req.body.list;

  const newTask = new Tasks({
    name: taskName
  });

  if (listName === "Today") {
    newTask.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.tasks.push(newTask);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function (req, res) {

  const checkedTaskId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Tasks.findByIdAndRemove(checkedTaskId, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("deleted!");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { tasks: { _id: checkedTaskId } } },
      function (err, foundList) {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/" + listName);
        }
      }
    )
  }

});

app.get("/:customListName", function (req, res) {

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          tasks: defaultTasks
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing List
        res.render("list", { listTitle: foundList.name, newListItems: foundList.tasks });
      }
    }

  })

});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});

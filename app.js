const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

let database = null;
const initializeDBAndStartServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`Db Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndStartServer();

const convertTodoDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};
const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

//API 1

app.get("/todos/", async (request, response) => {
  let data = "";
  let getTodosQuery = "";
  const { search_q = "", category, priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodosQuery = `
          select * from todo where todo like '%${search_q}%' and status='${status}' and priority='${priority}';`;
      data = await database.all(getTodosQuery);
      response.send(
        data.map((each) => convertTodoDbObjectToResponseObject(each))
      );
      break;
    case hasCategoryAndPriority(request.query):
      getTodosQuery = `
        select * from todo where todo like '%${search_q}%' and category='${category}' and priority='${priority}';`;
      data = await database.all(getTodosQuery);
      response.send(
        data.map((each) => convertTodoDbObjectToResponseObject(each))
      );
      break;
    case hasCategoryAndStatus(request.query):
      getTodosQuery = `
        select * from todo where todo like '%${search_q}%' and category='${category}' and status='${status}';`;
      data = await database.all(getTodosQuery);
      response.send(
        data.map((each) => convertTodoDbObjectToResponseObject(each))
      );
      break;
    case hasCategory(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `
        select * from todo where todo like '%${search_q}%' and category='${category}';`;
        data = await database.all(getTodosQuery);
        response.send(
          data.map((each) => convertTodoDbObjectToResponseObject(each))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasStatus(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `
          select * from todo where todo like '%${search_q}%' and status='${status}';`;
        data = await database.all(getTodosQuery);
        response.send(
          data.map((each) => convertTodoDbObjectToResponseObject(each))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriority(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `
          select * from todo where todo like '%${search_q}%' and priority='${priority}';`;
        data = await database.all(getTodosQuery);
        response.send(
          data.map((each) => convertTodoDbObjectToResponseObject(each))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    default:
      getTodosQuery = `
    select * from todo where todo like '%${search_q}%';`;
      data = await database.all(getTodosQuery);
      response.send(
        data.map((each) => convertTodoDbObjectToResponseObject(each))
      );
  }
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoBasedOnId = `
    select * from todo where id=${todoId};`;
  let getTodo = await database.get(getTodoBasedOnId);
  response.send(convertTodoDbObjectToResponseObject(getTodo));
});

//API 3

const convertDateObjToFormatDateObj = (dbObj) => {
  return format(new Date(dbObj), "yyyy - MM - dd");
};

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  let formatDate = convertDateObjToFormatDateObj(date);
  if (isValid(new Date(formatDate))) {
    const getTodoBasedOnDate = `
    select * from todo where due_date like ${formatDate};`;
    let getTodo = await database.all(getTodoBasedOnDate);
    response.send(
      getTodo.map((each) => convertTodoDbObjectToResponseObject(each))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority !== "HIGH" && priority !== "MEDIUM" && priority !== "LOW") {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
  if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
    response.status(400);
    response.send("Invalid Todo Status");
  }
  if (category !== "WORK" && category !== "HOME" && category !== "LEARNING") {
    response.status(400);
    response.send("Invalid Todo Category");
  }
  if (
    (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") &&
    (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") &&
    (category === "WORK" || category === "HOME" || category === "LEARNING")
  ) {
    const insertNewTodo = `
  insert into todo(id, todo, priority, status, category, due_date) 
  values(${id}, "${todo}", "${priority}", "${status}", "${category}", "${dueDate}");`;
    await database.run(insertNewTodo);
    response.send("Todo Successfully Added");
  }
});

//API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  if (
    requestBody.priority !== undefined &&
    requestBody.priority !== "HIGH" &&
    requestBody.priority !== "MEDIUM" &&
    requestBody.priority !== "LOW"
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
  if (
    requestBody.status !== undefined &&
    requestBody.status !== "TO DO" &&
    requestBody.status !== "IN PROGRESS" &&
    requestBody.status !== "DONE"
  ) {
    response.status(400);
    response.send("Invalid Todo Status");
  }
  if (
    requestBody.category !== undefined &&
    requestBody.category !== "WORK" &&
    requestBody.category !== "HOME" &&
    requestBody.category !== "LEARNING"
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  }

  if (
    (requestBody.priority !== undefined &&
      (requestBody.priority === "HIGH" ||
        requestBody.priority === "MEDIUM" ||
        requestBody.priority === "LOW")) ||
    (requestBody.category !== undefined &&
      (requestBody.category === "WORK" ||
        requestBody.category === "HOME" ||
        requestBody.category === "LEARNING")) ||
    (requestBody.status !== undefined &&
      (requestBody.status === "TO DO" ||
        requestBody.status === "IN PROGRESS" ||
        requestBody.status === "DONE"))
  ) {
    const previousTodoQuery = `
  select * from todo where id=${todoId};`;
    const previousTodo = await database.get(previousTodoQuery);
    const {
      todo = previousTodo.todo,
      priority = previousTodo.priority,
      status = previousTodo.status,
      category = previousTodo.category,
      dueDate = previousTodo.dueDate,
    } = request.body;

    const updateTodoQuery = `
  update todo set todo='${todo}',
  priority='${priority}'
  status='${status}'
  category='${category}'
  due_date='${date}'
  where id=${todoId};`;

    await database.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
  }
});

//API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    delete from todo where id=${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;

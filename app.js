const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const format = require("date-fns/format");

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

const convertDateObjToFormatDateObj = (dbObj) => {
  let formatDate = format(new Date(dbObj), "yyyy-MM-dd");
  return formatDate;
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
const hasDueDate = (requestQuery) => {
  return requestQuery.date !== undefined;
};

//API 1

app.get("/todos/", async (request, response) => {
  //let data = null;
  let getTodosQuery = "";
  const { search_q = "", category, priority, status, dueDate } = request.query;
  let invalidColumn = "";
  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodosQuery = `
          select * from todo where todo like '%${search_q}%' and status='${status}' and priority='${priority}';`;
      break;
    case hasCategoryAndPriority(request.query):
      getTodosQuery = `
        select * from todo where todo like '%${search_q}%' and category='${category}' and priority='${priority}';`;
      break;
    case hasCategoryAndStatus(request.query):
      getTodosQuery = `
        select * from todo where todo like '%${search_q}%' and category='${category}' and status='${status}';`;
      break;
    case hasCategory(request.query):
      invalidColumn = "Todo Category";
      getTodosQuery = `
        select * from todo where todo like '%${search_q}%' and category='${category}';`;
      break;
    case hasStatus(request.query):
      invalidColumn = "Todo Status";
      getTodosQuery = `
          select * from todo where todo like '%${search_q}%' and status='${status}';`;
      break;
    case hasPriority(request.query):
      invalidColumn = "Todo Priority";
      getTodosQuery = `
          select * from todo where todo like '%${search_q}%' and priority='${priority}';`;
      break;
    case hasDueDate(request.query):
      invalidColumn = "Due Date";
      getTodosQuery = `
        select * from todo where todo like '%${search_q}%' and due_date=${dueDate};`;
      break;
    default:
      getTodosQuery = `
    select * from todo where todo like '%${search_q}%';`;
  }

  const data = await database.all(getTodosQuery);
  if (data !== undefined) {
    response.send(
      data.map((each) => convertTodoDbObjectToResponseObject(each))
    );
  } else {
    response.status(400);
    response.send(`Invalid ${invalidColumn}`);
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

//API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const insertNewTodo = `
  insert into todo(id, todo, priority, status, category, due_date) 
  values(${id}, "${todo}", "${priority}", "${status}", "${category}", "${dueDate}");`;
  await database.run(insertNewTodo);
  response.send("Todo Successfully Added");
});

//API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    delete from todo where id=${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

//API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  //const queryDate = new Date(date);
  let formatDate = convertDateObjToFormatDateObj(date);
  const getTodoBasedOnDate = `
    select * from todo where due_date=${formatDate};`;
  let getTodo = await database.get(getTodoBasedOnDate);
  response.send(convertTodoDbObjectToResponseObject(getTodo));
});

/*

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
  let formatDate = convertDateObjToFormatDateObj(dueDate);
  const updateTodoQuery = `
  update todo set todo='${todo}',
  priority='${priority}'
  status='${status}'
  category='${category}'
  due_date='${formatDate}'
  where id=${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});


*/
module.exports = app;

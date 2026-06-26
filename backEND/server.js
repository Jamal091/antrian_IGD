const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const port = Number(process.env.PORT) || 5000;

const routes = require("./routes");
// const db = require("./model");

app.use(express.json());
app.use(cors());

app.use("/", routes)

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
})

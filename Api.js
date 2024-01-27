const express = require("express");
const app = express();
const port = 3000;

app.use(express.json());

app.post("/api/logs", (req, res) => {
  console.log(req.body); // Here, you'd actually save the log to your database
  res.status(200).send("Log received");
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

require("dotenv").config();

import express from "express";
import cors from 'cors';
import bodyParser from "body-parser";
import { connectDB, fetchAll } from "./db/database";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(cors());
app.use(bodyParser.json());

//ask chat gpt and persist answer
app.post("/message/", async (req, res) => {
  const {message} = req.body;
  const apikey = process.env.CHATGPT_API_KEY;
  if(typeof apikey === 'undefined'){
    res.send('no api key specified');
    return;
  }
  const chatgptResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type':'application/json',
      'Authorization': 'Bearer '+apikey
    },
    body: JSON.stringify({
      "model": "gpt-5-nano",
      "reasoning": {"effort": "minimal"},
      "input": message  
    })
  });
  const data = await chatgptResponse.json();
  
  const answer = data?.output[1]?.content[0]?.text;
  //persist data:
  const db = await connectDB();
  db.run(`INSERT INTO messages (prompt, answer) VALUES (?, ?);`, message, answer);

  res.send({answer: answer});
});

//get message history
app.get("/message/", async (req, res) => {
  
  const db = await connectDB();
  const history = await fetchAll(db,`SELECT id, prompt, answer FROM messages ORDER BY id DESC;`);

  res.send({history: history});
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

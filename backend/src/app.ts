require("dotenv").config();

import express from "express";
import cors from 'cors';
import bodyParser from "body-parser";
import { connectDB } from "./db/database";
import { ChatOpenAI } from "@langchain/openai";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(cors());
app.use(bodyParser.json());

interface IPrompt {
  id: number;
  prompt: string;
  answer: string;
};

class Prompt implements IPrompt {
  id: number;
  prompt: string;
  answer: string;
  constructor(id: number, prompt: string, answer: string){
    this.id = id;
    this.prompt = prompt;
    this.answer = answer;
  }
}

//ask chat gpt and persist answer
app.post("/message/", async (req, res) => {
  const {message, threadid } = req.body;
  const apikey = process.env.OPENAI_API_KEY;
  if(typeof apikey === 'undefined'){
    res.send({error: 'no api key specified'});
    return;
  }
  if(typeof threadid === 'undefined'){
    res.send({error: 'no threadid specified'});
    return;
  }
  const llm = new ChatOpenAI({
    model: "gpt-5-nano",
    temperature: 1
  });

  const db = await connectDB();
  const history = await new Promise<IPrompt[]>((resolve, reject) => {
    db.all<IPrompt>(`SELECT id, prompt, answer FROM messages WHERE thread = ? ORDER BY id DESC LIMIT 10;`, threadid, (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
  let conversation = [];
  if(history.length > 0){
    for (const line of history) {
      conversation.push({role:'user', content: line.prompt});
      conversation.push({role:'system', content: line.answer});
    }
    
  }
  conversation.push({role:'user',content:message});

  const answer = await llm.invoke(conversation);

  db.run(`INSERT INTO messages (prompt, answer, thread) VALUES (?, ?, ?);`, message, answer, threadid);

  res.send({answer: answer.content, thread: threadid});
});

//get message history
app.get("/message/:id", async (req, res) => {
  const id = req.params.id;
  const db = await connectDB();
  const history = await new Promise<IPrompt[]>((resolve, reject) => {
    db.all<IPrompt>(`SELECT id, prompt, answer FROM messages WHERE thread = ? ORDER BY id DESC;`, id, (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
  res.send({history: history});
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

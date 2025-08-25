import { useEffect, useState } from 'react'
import './App.css'
interface IHistory {
  history: IChat[];
}

interface IChat {
  id: number;
  prompt: string;
  answer: string;
}

function App() {
  function chat(formData: FormData){
    const prompt = formData.get('prompt');
    fetch('http://localhost:3000/message/',{
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({message: prompt})
    }).then(() => 
    fetchData())
  } 

  function fetchData() {
    fetch('http://localhost:3000/message/')
    .then( res => res.json())
    .then(
      result => 
        setChatHistory(result)
      
    );
  }

  const [chatHistory, setChatHistory] = useState<IHistory | null>(null);
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
    <ul className='chatHistory'>
      {chatHistory?.history?.map(history => 
      <li key={history.id}>
        <span className='prompt'>{history.prompt}</span>
        <span className='answer'>{history.answer}</span>
        </li>) ?? 'Loading...'}
    </ul>
    <form action={chat}>
      <input name="prompt" className='inputField'/>
      <button type="submit">Send</button>
    </form>
    </>
  )
}

export default App

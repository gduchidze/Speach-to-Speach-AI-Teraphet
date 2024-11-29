import axios from "axios";
import { useState } from "react";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";

export interface IMessages{
    sender: string;
    text:string;
}

const Chatbot = () => {
  const [messages, setMessages] = useState<IMessages[]>([]);
  const [loading, setLoading] = useState<boolean>(false); 


  const sendMessageToAI = async(message:string)=>{
    try {
        const response = await axios.get("http://172.20.10.2/api");
        console.log(message);
        
        console.log(response);
        
        // return response;
    } catch (error) {
        console.log(error);
        
        return "Something went wrong";
    }
  }

  const handleSend = async(text:string)=>{
    console.log(text);

    const userMessage = {sender:"user", text};
    setMessages((prev:IMessages[]) => [...prev, userMessage]);
    
    setLoading(true);

    // const aiResponse1 = await sendMessageToAI(text);
    const aiResponse = await new Promise<string>((resolve) => {
        setTimeout(() => {
          resolve("Hey");
        }, 2000);
      });

    const aiMessages = {sender: "ai", text: aiResponse};

    setMessages((prev:IMessages[]) => [...prev, aiMessages]);
    setLoading(false);
  }

  const firstQuestion = (text:string) =>{
    setMessages((prev:IMessages[]) => [...prev, {sender:"ai", text}]);
  }

  return <div className="flex flex-col h-screen w-[100%] max-w-[1900px] m-auto">
    <MessageList messages={messages} loading={loading} onSend={firstQuestion}/>
    <MessageInput onSend={handleSend}/>
  </div>;
};

export default Chatbot;

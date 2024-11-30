import axios from "axios";
import { useEffect, useState } from "react";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import Spline from "@splinetool/react-spline";

export interface IMessages {
  sender: string;
  text: string;
}

const Chatbot = () => {
  const [messages, setMessages] = useState<IMessages[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isFirst, setIsFirst] = useState<boolean>(false);

  const sendMessageToAI = async (message: string) => {
    try {
      // need post method
      const response = await axios.post(
        "http://localhost/text-service/user/input",
        {
          text: message,
        }
      );

      console.log(response);
      
      return response?.data.result;
    } catch (error) {
      console.log(error);

      return "Something went wrong";
    }
  };

  const handleSend = async (text: string) => {
    console.log(text);

    const userMessage = { sender: "user", text};
    setMessages((prev: IMessages[]) => [...prev, userMessage]);

    setLoading(true);

    const aiResponse = await sendMessageToAI(text);
    const aiMessages = { sender: "ai", text: aiResponse};

    setMessages((prev: IMessages[]) => [...prev, aiMessages]);
    setLoading(false);
  };


  useEffect(() => {
    setTimeout(() => {
      setIsFirst(false);
    }, 4000);
  }, []);



  const setToMessages=(message:IMessages)=>{
    setMessages((prev: IMessages[]) => [...prev, message]);
  }

  return (
    <>
      {!isFirst && (
        <div className="flex flex-col h-screen w-[100%] max-w-[1400px] m-auto">
          <MessageList messages={messages} loading={loading} />
          <MessageInput
            setMessages={setToMessages}
            onSend={handleSend}
            loading={loading}
          />
        </div>
      )}
      {isFirst && (
        <div className=" h-screen w-[100%] m-auto">
          <Spline scene="https://prod.spline.design/IBgfdspYaqFU2Wk3/scene.splinecode" />
        </div>
      )}
    </>
  );
};

export default Chatbot;

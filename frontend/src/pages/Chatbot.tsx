import axios from "axios";
import { useEffect, useState } from "react";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import Spline from "@splinetool/react-spline";
import CameraComponent from "../components/CameraComponent";

export interface IMessages {
  sender: string;
  text: string;
}

const Chatbot = () => {
  const [messages, setMessages] = useState<IMessages[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isFirst, setIsFirst] = useState<boolean>(true);

  const sendMessageToAI = async (message: string) => {
    try {
      // need post method
      const response = await axios.get("http://localhost/api/");

      return response.data.message;
    } catch (error) {
      console.log(error);

      return "Something went wrong";
    }
  };

  const handleSend = async (text: string) => {
    console.log(text);

    const userMessage = { sender: "user", text };
    setMessages((prev: IMessages[]) => [...prev, userMessage]);

    setLoading(true);

    const aiResponse = await sendMessageToAI(text);
    const aiMessages = { sender: "ai", text: aiResponse };

    setMessages((prev: IMessages[]) => [...prev, aiMessages]);
    setLoading(false);
  };

  const firstQuestion = (text: string) => {
    setMessages((prev: IMessages[]) => [...prev, { sender: "ai", text }]);
  };

  useEffect(() => {
    setTimeout(() => {
      setIsFirst(false);
    }, 4000);
  }, []);

  const handleCapture = async (imageBlob: Blob) => {
    console.log("Captured Image Blob:", imageBlob);
  
    // ბლობის გაგზავნა ბექენდისთვის
    try {
      const formData = new FormData();
      formData.append("image", imageBlob, "photo.png");
  
      const response = await fetch("https://your-backend-api.com/upload", {
        method: "POST",
        body: formData,
      });
  
      if (response.ok) {
        console.log("Image uploaded successfully!");
      } else {
        console.error("Failed to upload image.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };
  
  return (
    <>
      {!isFirst && (
        <div className="flex flex-col h-screen w-[100%] max-w-[1900px] m-auto">
          <MessageList
            messages={messages}
            loading={loading}
            onSend={firstQuestion}
          />
          <MessageInput onSend={handleSend} loading={loading}/>
        </div>
        
      )}
      {isFirst && (
        <div className=" h-screen w-[100%] m-auto">
           <Spline scene="https://prod.spline.design/IBgfdspYaqFU2Wk3/scene.splinecode" />
           {/* <CameraComponent onCapture={handleCapture} /> */}
        </div>
      )}
    </>
  );
};

export default Chatbot;

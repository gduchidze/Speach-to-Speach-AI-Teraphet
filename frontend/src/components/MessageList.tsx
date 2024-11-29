
import { useEffect } from "react";
import { IMessages } from "../pages/Chatbot";

interface MessageListProps {
    messages: IMessages[];
    loading: boolean;
    onSend: (text: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, loading, onSend }) => {

  let a:number = 0;
  useEffect(() => {
    if(a == 0){
      onSend("How can i help you today?");
    }
    a += 1 ;
  }, [])
  

    return (
      <div className="mb-3 px-10 py-5 overflow-y-auto overflow-x-hidden h-screen flex flex-col gap-2">
        {messages.map((message, index: number) => (
          <div
            key={index}
            className={`w-fit max-w-[45%] break-words rounded-lg p-2 text-[1rem] ${
              message.sender === "user"
                ? "bg-slate-500 text-white ml-auto" 
                : " text-white rounded border border-solid border-stone-200 mr-auto" 
            }`}
          >
            {message.text}
          </div>
        ))}
        {loading && <div className="text-center mr-auto text-white">Loading...</div>}
      </div>
    );
  };
  
export default MessageList
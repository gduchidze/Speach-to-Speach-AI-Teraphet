
import { useEffect, useRef, useState } from "react";
import { IMessages } from "../pages/Chatbot";
import { Comment } from "react-loader-spinner";
import "../styles/MessageList.css"

interface MessageListProps {
    messages: IMessages[];
    loading: boolean;
    onSend: (text: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, loading, onSend }) => {

  const [isFirst, setIsFirst] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { 
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }
    if(isFirst){
      onSend("How can i help you today?");
      setIsFirst(false);
    }
  }, [messages])
  

    return (
      <div className="list-box mb-3 px-10 py-5 overflow-y-auto overflow-x-hidden h-screen flex flex-col gap-2">
        {messages.map((message, index: number) => (
          <div
            key={index}
            className={`w-fit max-w-[45%] break-words rounded-lg p-2 text-[1rem] ${
              message.sender === "user"
                ? "user-message bg-slate-500 text-white ml-auto" 
                : "ai-message text-white rounded border border-solid border-stone-200 mr-auto" 
            }`}
          >
            {message.text}
          </div>
        ))}
        {loading && <div className="flex items-center text-center gap-2 text-center mr-auto text-gray-600">
          AI is typing
          <Comment
          visible={true}
          height="25"
          width="25"
          ariaLabel="comment-loading"
          wrapperStyle={{}}
          color="#fff"
          backgroundColor="#505050"
          />
          </div>}
          <div ref={messagesEndRef} />
      </div>
    );
  };
  
export default MessageList
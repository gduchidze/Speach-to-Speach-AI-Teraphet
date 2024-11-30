
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
      <section className="list-box mb-3 px-10 py-5 overflow-y-auto overflow-x-hidden h-screen flex flex-col gap-2">
        {messages.map((message, index: number) => (
          <div
            key={index}
            className={`flex input-wrapper flex-col w-fit max-w-[45%] break-words rounded-lg p-2 text-[1rem] css-typing ${
              message.sender === "user"
                ? "user-message  text-black ml-auto" 
                : "ai-message text-black mr-auto" 
            }`}
          >
            {message.sender === "user" ? <div className="flex flex-col-reverse"><p className="text-[0.6rem] sm:text-[1rem] lg:text-[1.2rem]">{message.text}</p> <img src="user1.svg"  alt="User" className="w-6 h-6 self-end md:h-8 md:w-9 lg:h-10 lg:w-10"/></div> : 
            <div className="flex flex-col-reverse "><p className="text-[0.6rem] sm:text-[1rem] lg:text-[1.2rem]">{message.text}</p> <img src="robot.svg"  alt="AI" className="w-6 h-6 md:h-8 md:w-9 lg:h-10 lg:w-10"/></div>  }
          </div>
        ))}
        {loading && <div className="flex items-center text-center gap-2 mr-auto text-gray-600">
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
      </section>
    );
  };
  
export default MessageList
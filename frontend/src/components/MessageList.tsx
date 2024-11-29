import { IMessages } from "../pages/Chatbot";

interface MessageListProps {
    messages: IMessages[];
    loading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, loading }) => {
    return (
      <div className="mb-3 p-3 overflow-y-auto overflow-x-hidden h-screen flex flex-col gap-2">
        {messages.map((message, index: number) => (
          <div
            key={index}
            className={`w-fit max-w-[75%] break-words rounded-lg p-2 text-[1rem] ${
              message.sender === "user"
                ? "bg-slate-500 text-white ml-auto" 
                : "bg-slate-300 text-black mr-auto" 
            }`}
          >
            {message.text}
          </div>
        ))}
        {loading && <div className="text-center mr-auto">Loading...</div>}
      </div>
    );
  };
  
export default MessageList
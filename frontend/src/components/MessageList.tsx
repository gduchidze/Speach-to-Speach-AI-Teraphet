import { useEffect, useRef } from "react";
import { IMessages } from "../pages/Chatbot";
import { Comment } from "react-loader-spinner";
import "../styles/MessageList.css";

interface MessageListProps {
  messages: IMessages[];
  loading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, loading }) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <section className="list-box mb-3 px-10 py-5 overflow-y-auto overflow-x-hidden h-screen flex flex-col gap-2">
      {messages.map((message, index: number) => (
        <div
          key={index}
          className={`flex flex-col w-fit max-w-[45%] break-words p-2 text-[1rem] ${
            message.sender === "user"
              ? "user-message text-black ml-auto"
              : "ai-message text-black mr-auto"
          }`}
        >
          <div className="flex items-end gap-2">
            {message.sender === "ai" && (
              <img
                src="therapist.png"
                alt="AI"
                className="w-4 h-4 md:h-8 md:w-8"
              />
            )}
            <p className="text-[0.6rem] sm:text-[1rem] lg:text-[1.2rem] break-words overflow-wrap word-break">{message.text}</p>
            {message.sender === "user" && (
              <img
                src="woman.png"
                alt="User"
                className="w-4 h-4 self-end md:h-8 md:w-8"
              />
            )}
          </div>
        </div>
      ))}

      {loading && (
        <div className="flex items-center text-center gap-2 mr-auto text-gray-600">
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
        </div>
      )}
      <div ref={messagesEndRef} />
    </section>
  );
};

export default MessageList;

import React, { useEffect, useRef } from "react";
import { IMessages } from "../pages/Chatbot";
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
          <div className="flex items-start gap-2">
            {message.sender === "ai" && (
              <img
                src="admin.jpg"
                alt="AI"
                className="w-4 h-4 md:h-8 md:w-8 rounded-[50%]"
              />
            )}
            <p className="text-[0.6rem] sm:text-[1rem] lg:text-[1.2rem] break-words overflow-wrap rounded-lg bg-[#e2e2e20e] p-3">
              {message.text}
            </p>
            {message.sender === "user" && (
              <img
                src="ducho.jpg"
                alt="User"
                className="w-4 h-4 self-start md:h-8 md:w-8 rounded-[50%]"
              />
            )}
          </div>
        </div>
      ))}

      {loading && (
        <div>
          <div className="flex items-center space-x-0.5 p-1.5">
            <div
              className="w-2 h-2 bg-black rounded-full animate-[elegantBounce_1.4s_infinite]"
              style={{
                animationDelay: "0ms",
                animation: "elegantBounce 1.4s infinite ease-in-out",
              }}
            />
            <div
              className="w-2 h-2 bg-black rounded-full animate-[elegantBounce_1.4s_infinite]"
              style={{
                animationDelay: "200ms",
                animation: "elegantBounce 1.4s infinite ease-in-out",
              }}
            />
            <div
              className="w-2 h-2 bg-black rounded-full animate-[elegantBounce_1.4s_infinite]"
              style={{
                animationDelay: "400ms",
                animation: "elegantBounce 1.4s infinite ease-in-out",
              }}
            />
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </section>
  );
};

export default MessageList;

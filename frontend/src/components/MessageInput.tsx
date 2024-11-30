import { useState } from "react";
import { IoIosSend } from "react-icons/io";
import { MdKeyboardVoice } from "react-icons/md";
import { IMessages } from "../pages/Chatbot";

interface MessageInputProps {
  messages: IMessages[];
  onSend: (text: string) => void;
  loading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  messages,
  onSend,
  loading,
}) => {
  const [input, setInput] = useState<string>("");

  const handleSend = () => {
    if (input.trim() !== "") {
      onSend(input);
      setInput("");
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-3">
      {messages.length == 0 && (
        <div
          className="grid gap-3 p-4 grid-cols-1  sm:grid-cols-2 "
        >
          <button className="p-2 sm:p-4  text-black rounded-xl border-[1px] border-solid transition-all duration-300   hover:scale-105 text-[0.6rem] sm:text-[1rem] lg:text-[1.2rem]" data-value="How many planets are there in our solar system?"
            onClick={(e) => setInput(e.currentTarget.getAttribute("data-value") || "")}>How many planets are there in our solar system?
          </button>
          <button className="p-2 sm:p-4   text-black rounded-xl border-[1px] border-solid transition-all duration-300   hover:scale-105 text-[0.6rem] sm:text-[1.1rem] lg:text-[1.2rem]" 
            data-value="What is the square root of 144?" onClick={(e) => setInput(e.currentTarget.getAttribute("data-value") || "")}
          >What is the square root of 144?</button>
          <button className="p-2 sm:p-4   text-black rounded-xl border-[1px] border-solid transition-all duration-300   hover:scale-105 text-[0.6rem] sm:text-[1.1rem] lg:text-[1.2rem]
           hidden sm:block "
           data-value="Who is the current President of the United States?" onClick={(e) => setInput(e.currentTarget.getAttribute("data-value") || "")}
           >Who is the current President of the United States?</button>
          <button className="p-2 sm:p-4   text-black rounded-xl border-[1px] border-solid transition-all duration-300   hover:scale-105 text-[0.6rem] sm:text-[1.1rem] lg:text-[1.2rem] 
          hidden sm:block"
          data-value="Who wrote 'To Kill a Mockingbird'?" onClick={(e) => setInput(e.currentTarget.getAttribute("data-value") || "")}
          >Who wrote "To Kill a Mockingbird"?</button>
        </div>
      )}
      <div className="flex items-center justify-between bg-white  rounded-2xl p-1 space-x-4 w-[80%] sm:w-[100%] sm:p-3 m-auto shadow-2xl shadow-gray-500/50 bg-gray-200">
        <textarea
          className={`outline-none rounded-lg p-3 text-lg transition-all w-[80%] resize-none bg-gray-200 color-white${
            loading ? "placeholder-gray-200 " : "placeholder-gray-200"
          } `}
          placeholder="Type your message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={loading}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleSend}
            className=" rounded-lg   text-black   focus:ring-2   transition-all duration-300   p-2 text-[1rem]  p-2 sm:text-[1.9rem] sm:p-3 hover:scale-105"
          >
            <MdKeyboardVoice />
          </button>
          <button
            onClick={handleSend}
            className=" rounded-lg   text-black  focus:ring-2  transition-all duration-300  text-[1rem]  p-2 sm:text-[1.9rem] sm:p-3 hover:scale-105"
          >
            <IoIosSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;

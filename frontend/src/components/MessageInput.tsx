import { useState } from "react";
import { IoIosSend } from "react-icons/io";
import { MdKeyboardVoice } from "react-icons/md";

interface MessageInputProps {
  onSend: (text: string) => void;
  loading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend,loading }) => {
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
      <div className="flex items-center justify-between bg-white  rounded-xl p-1 space-x-4 w-[80%] sm:w-[100%] sm:p-3 m-auto shadow-2xl shadow-gray-500/50">
        <textarea
          className={`outline-none rounded-lg p-3 text-lg transition-all w-[80%] resize-none ${loading ? "placeholder-gray-200 " : "placeholder-gray-200"} `}
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
                className=" rounded-lg bg-[#e5e7eb]  text-black shadow-md hover:bg-[#F8F8FF] focus:ring-2   transition-all duration-300  text-sm p-2 sm:text-lg sm:p-3 hover:scale-105"
          >
            <MdKeyboardVoice />
          </button>
          <button
            onClick={handleSend}
                className=" rounded-lg bg-[#e5e7eb]  text-black shadow-md hover:bg-[#F8F8FF] focus:ring-2  transition-all duration-300  text-sm p-2 sm:text-lg sm:p-3 hover:scale-105"
          >
            <IoIosSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;

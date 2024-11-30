import React, { useEffect, useRef, useState } from "react";
import { IoIosSend } from "react-icons/io";
import { MdKeyboardVoice } from "react-icons/md";
import SpeakerContainer from "./SpeakerContainer";
import { IMessages } from "../pages/Chatbot";

interface MessageInputProps {
  setMessages:(obj:IMessages) => void;
  onSend: (text: string) => void; // ფუნქცია, რომელიც იღებს ტექსტს
  loading: boolean; // მესიჯის გაგზავნის პროცესის მანიშნებელი
}

const MessageInput: React.FC<MessageInputProps> = ({setMessages, onSend, loading }) => {
  const [input, setInput] = useState<string>(""); 
  const [rows, setRows] = useState<number>(1);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isTalking, setIsTalking] = useState<boolean>(false);

  // ტექსტარეას ავტომატური ზომის ცვლილება
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; 
      const scrollHeight = textareaRef.current.scrollHeight; 
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`; 
      setRows(Math.min(Math.floor(scrollHeight / 24), 5)); 
    }
  }, [input]);

  // გაგზავნის ფუნქცია
  const handleSend = () => {
    if (input.trim() !== "") {
      onSend(input);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      setRows(1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // გადახტომის თავიდან აცილება
      handleSend();
    }
  };

  const changeTalkingMode =()=>{
    setIsTalking(prev => prev = !prev);
  }

  return (
    <div className=" bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6">
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="relative flex items-end bg-white rounded-2xl shadow-lg border border-gray-100  p-3 transition-all duration-300 hover:shadow-xl">
          <textarea
            ref={textareaRef}
            className="flex-1 outline-none  bg-transparent text-lg resize-none py-2 px-3 min-h-[44px] max-h-[120px] placeholder-gray-400"
            placeholder={loading ? "Please wait..." : "Type your message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={rows}
            disabled={loading}
          />
          <div className="flex items-center gap-3 pl-2">
            <button
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-all duration-200"
              disabled={loading}
              aria-label="Voice input"
            >
              {isTalking && <MdKeyboardVoice className="w-6 h-6" onClick={()=>setIsTalking(false)}/>}
              {!isTalking && <img src="audio-waves.png" alt="audio" className="w-6 h-6" onClick={()=>setIsTalking(true)}/>}
            </button>
            <button
              onClick={handleSend}
              className={`p-2 rounded-full transition-all duration-200 ${
                input.trim()
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "text-gray-400 cursor-not-allowed"
              }`}
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              <IoIosSend className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
      {isTalking && <SpeakerContainer setMessages={setMessages}  changeTalking={changeTalkingMode}/>}
    </div>
  );
};

export default MessageInput;

import { useState } from "react";

interface MessageInputProps {
  onSend: (text: string) => void;
}

const MessageInput : React.FC<MessageInputProps> = ({onSend}) => {

  const [input, setInput] = useState<string>("");
  const handleSend = () =>{
    if(input.trim() !== ""){
      onSend(input);
      setInput("");
    }
    
  }
  return (
    <div className="flex flex-wrap items-center w-[100%] m-auto pb-10 justify-center gap-3 border-t-[1px]" >
      <input
      type="text"
      className="border-none mt-2 outline-none rounded-[20px] p-3 w-1/2 text-[1rem]"
      placeholder="Type your message"
      value={input}
      onChange={(e)=> setInput(e.target.value)}
      onKeyDown={(e)=> e.key == "Enter" && handleSend() } 
      />
      <button onClick={()=>handleSend()} className="mt-2 p-3 border rounded-[20px] border-solid
       border-gray-500 text-white text-[1rem] outline-none
       ease-in-out duration-300 hover:bg-gray-500 hover:text-neutral-100
       ">Send</button>
    </div>
  )
}

export default MessageInput
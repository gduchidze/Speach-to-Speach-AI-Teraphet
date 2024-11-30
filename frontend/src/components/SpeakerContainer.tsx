import Spline from "@splinetool/react-spline";
import AudioRecorder from "./AudioRecorder";
import React from "react";
import { IMessages } from "../pages/Chatbot";
import CameraComponent from "./CameraComponent";

interface SpeakerContainerProps{
    changeTalking :()=> void;
    setMessages: (obj:IMessages)=> void;
}

const SpeakerContainer:React.FC<SpeakerContainerProps> = ({setMessages,changeTalking}) => {
  const handleCapture = async (imageBlob: Blob) => {
    console.log("Captured Image Blob:", imageBlob);

    // ბლობის გაგზავნა ბექენდისთვის
    try {
      const formData = new FormData();
      formData.append("image", imageBlob, "photo.png");

      const response = await fetch("http://localhost/api/user/impression", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        console.log("Image uploaded successfully!");
      } else {
        console.error("Failed to upload image.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };
  return (
    <div>
        <div className="w-screen h-screen absolute top-0 left-0 bg-[#5555553f] z-10" onClick={changeTalking}></div>
      <div
        className="w-[90%] h-[90%] bg-white fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]  z-20
        rounded-xl border-[1px] border-solid flex flex-col 
        "
      >
        <div className="w-[60%] h-[60%] flex m-auto rounded-[50%]">
        <Spline scene="https://prod.spline.design/ZKRcjE-8K73n5Wv9/scene.splinecode" />
        <CameraComponent onCapture={handleCapture} />
        </div>
        <div className="w-[100%] h-[30%] ">
          <AudioRecorder setMessages={setMessages}/>
        </div>
      </div>
    </div>
  );
};

export default SpeakerContainer;

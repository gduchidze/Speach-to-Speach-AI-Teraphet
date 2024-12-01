import Spline from "@splinetool/react-spline";
import AudioRecorder from "./AudioRecorder";
import React, { useState } from "react";
import { IMessages } from "../pages/Chatbot";
import CameraComponent from "./CameraComponent";

interface SpeakerContainerProps {
  changeTalking: () => void;
  setMessages: (obj: IMessages) => void;
}

export interface EmotionProps {
  audio_response: string | null;
  text_response: string | null;
}

const SpeakerContainer: React.FC<SpeakerContainerProps> = ({
  setMessages,
  changeTalking,
}) => {
  const [emotion, setEmotion] = useState<EmotionProps | null>(null);

  const handleCapture = async (imageBlob: Blob) => {
    console.log("Captured Image Blob:", imageBlob);
    if(emotion){
      return;
    }
    try {
      const formData = new FormData();
      formData.append("image", imageBlob, "photo.png");

      const response = await fetch("http://localhost:8000/generate_impression", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json();
      if (response.ok) {
        const audioUrl = `${encodeURIComponent(
          data.audio_response
        )}`;
        setEmotion({
          audio_response: audioUrl,
          text_response: data.text_response,
        });
        console.log(data);
      } else {
        console.error("Failed to process image. Response:", data);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  return (
    <div>
      {emotion?.audio_response ? (
        <audio controls autoPlay  className="fixed z-50 top-0 hidden">
          <source src="http://localhost:3000/glad.wav" type="audio/wav" />
          Your browser does not support the audio element.
        </audio>
      ) : (
        <p>No audio response available.</p>
      )}

      <div
        className="w-screen h-screen absolute top-0 left-0 bg-[#5555553f] z-10"
        onClick={changeTalking}
      ></div>
      <div className="w-[90%] h-[90%] bg-white fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]  z-20
        rounded-xl border-[1px] border-solid flex flex-col">
        <div className="w-[60%] h-[60%] flex m-auto rounded-[50%]">
          <Spline scene="https://prod.spline.design/ZKRcjE-8K73n5Wv9/scene.splinecode" />
          <CameraComponent onCapture={handleCapture} />
        </div>
        <div className="w-[100%] h-[30%]">
        {emotion?.audio_response && <AudioRecorder setMessages={setMessages} />}                              
        </div>
      </div>
    </div>
  );
};

export default SpeakerContainer;

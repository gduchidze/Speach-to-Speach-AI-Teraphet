import tempfile
from datetime import datetime
from typing import TypedDict, Optional, Dict, List
import os
from dotenv import load_dotenv
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from deepface import DeepFace
from deepgram import DeepgramClient, SpeakOptions, PrerecordedOptions
import json

load_dotenv()

THERAPIST_SYSTEM_PROMPT = """You are an empathetic and professional AI therapist with expertise in emotional support and mental health counseling. Your role is to:

1. Show genuine empathy and understanding for the user's emotional state
2. Provide supportive, non-judgmental responses
3. Use therapeutic techniques appropriately
4. Maintain professional boundaries while being warm and approachable
5. Recognize signs of serious issues that require professional human intervention

Remember:
- Always validate emotions before offering suggestions
- Use reflective listening techniques
- Focus on the person's emotional experience
- Be mindful of cultural sensitivities
- Ensure responses are trauma-informed
- Maintain confidentiality and trust

Important: If you detect signs of immediate crisis or harm, provide crisis hotline information and encourage seeking immediate professional help.

Current emotional context will be provided with each interaction to help you tailor your response appropriately."""


class ChatMessage(TypedDict):
    speaker: str
    message: str
    timestamp: str


class DeepgramTTS:
    def __init__(self):
        self.filename = "response.wav"
        self.deepgram = DeepgramClient(api_key=os.getenv("DEEPGRAM_API_KEY"))

    def speak(self, text: str) -> Optional[str]:
        try:
            options = SpeakOptions(
                model="aura-asteria-en",
                encoding="linear16",
                container="wav",
                sample_rate=16000
            )

            SPEAK_OPTIONS = {"text": text}
            temp_dir = tempfile.mkdtemp()
            output_path = os.path.join(temp_dir, self.filename)

            self.deepgram.speak.v("1").save(output_path, SPEAK_OPTIONS, options)

            return output_path

        except Exception as e:
            print(f"TTS Exception: {e}")
            return None


class SpeechToText:
    def __init__(self):
        self.deepgram = DeepgramClient(api_key=os.getenv("DEEPGRAM_API_KEY"))

    def transcribe_file(self, file_path: str) -> Optional[str]:
        try:
            with open(file_path, 'rb') as audio:
                source = {
                    'buffer': audio,
                    'mimetype': 'audio/wav'
                }

                options = PrerecordedOptions(
                    model="nova-2",
                    smart_format=True,
                    language="en-US",
                    punctuate=True
                )

                response = self.deepgram.listen.rest.v("1").transcribe_file(source, options)
                return response.results.channels[0].alternatives[0].transcript

        except Exception as e:
            print(f"Transcription error: {e}")
            return None


class EmotionAwareBot:
    def __init__(self):
        self.openai = ChatOpenAI(model="gpt-4o-mini", api_key=os.getenv("OPENAI_API_KEY"))
        self.deepgram = DeepgramClient(api_key=os.getenv("DEEPGRAM_API_KEY"))
        self.tts = DeepgramTTS()
        self.stt = SpeechToText()
        self.conversation_history: List[ChatMessage] = []

        # Load history
        try:
            with open("chat_history.json", "r", encoding="utf-8") as f:
                self.conversation_history = json.load(f)
        except FileNotFoundError:
            self.conversation_history = []

    def save_to_history(self, speaker: str, message: str) -> None:
        new_message: ChatMessage = {
            "speaker": speaker,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }

        self.conversation_history.append(new_message)

        try:
            with open("chat_history.json", "w", encoding="utf-8") as file:
                json.dump(
                    self.conversation_history,
                    file,
                    ensure_ascii=False,
                    indent=2
                )
        except Exception as e:
            print(f"Error saving chat history: {e}")

    def get_conversation_context(self, last_n: int = 5) -> List[ChatMessage]:
        return self.conversation_history[-last_n:] if self.conversation_history else []

    def analyze_image(self, image_path: str) -> Dict:
        try:
            result = DeepFace.analyze(image_path, actions=['emotion', 'gender'])
            return {
                'emotion': result[0]['dominant_emotion'],
                'gender': result[0]['gender'],
            }
        except Exception as e:
            print(f"Error in face analysis: {e}")
            return {
                'emotion': 'neutral',
                'gender': None,
            }

    def process_query(self, text_query: str, emotion_context: str) -> str:
        recent_conversation = self.get_conversation_context()
        conversation_context = "\n".join([
            f"{msg['speaker']}: {msg['message']}"
            for msg in recent_conversation
        ])

        prompt = f"""
        {THERAPIST_SYSTEM_PROMPT}

        Current Context:
        - User's emotional state: {emotion_context}
        - User's query: {text_query}

        Conversation History:
        {conversation_context}

        Please provide a therapeutic response that:
        1. Acknowledges the user's emotional state
        2. Addresses their query
        3. References previous conversation when relevant
        4. Maintains a supportive and empathetic tone
        """

        response = self.openai.invoke([
            SystemMessage(content=THERAPIST_SYSTEM_PROMPT),
            HumanMessage(content=prompt)
        ])

        response_text = response.content
        self.save_to_history("Assistant", response_text)

        return response_text

    def process_interaction(self, image_path: Optional[str] = None, text_query: Optional[str] = None) -> Dict:
        analysis_result = {
            'emotion': 'neutral',
            'gender': None
        }

        if image_path:
            analysis_result = self.analyze_image(image_path)
            print(f"Face analysis results: {analysis_result}")

        if text_query:
            self.save_to_history("User", text_query)

            response_text = self.process_query(text_query, analysis_result['emotion'])
            print(f"User query: {text_query}")
            print(f"AI response: {response_text}")

            audio_file = self.tts.speak(response_text)
            return {
                "text_response": response_text,
                "audio_response": audio_file,
                "face_analysis": analysis_result
            }

        return {"error": "No query provided"}

    def process_audio_file(self, audio_path: str, image_path: Optional[str] = None) -> Dict:
        text_query = self.stt.transcribe_file(audio_path)

        if text_query:
            print(f"Transcribed text: {text_query}")
            return self.process_interaction(
                image_path=image_path,
                text_query=text_query
            )
        return {"error": "Failed to transcribe audio"}
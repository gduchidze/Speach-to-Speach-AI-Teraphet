from datetime import datetime
from typing import TypedDict, Optional, Dict, List
import os
from dotenv import load_dotenv
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from tavily import TavilyClient
from deepface import DeepFace
from deepgram import DeepgramClient, SpeakOptions, PrerecordedOptions
from playsound import playsound
import json
import requests
from bs4 import BeautifulSoup
import re


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


class WebScraper:
    @staticmethod
    def scrape_content(url: str) -> Optional[str]:
        try:
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code != 200:
                return "Failed to retrieve the webpage."

            soup = BeautifulSoup(response.text, 'html.parser')
            content = []
            for tag in soup.find_all(['h1', 'h2', 'h3', 'p', 'article']):
                text = tag.get_text(" ", strip=True)
                content.append(text)

            content = "\n".join(content)
            content = re.sub(r'\s+', ' ', content)
            return content[:2000]

        except Exception as e:
            print(f"Scraping error: {e}")
            return None


class DeepgramTTS:
    def __init__(self):
        self.filename = "response.wav"
        self.deepgram = DeepgramClient(api_key=os.getenv("DEEPGRAM_API_KEY"))

    def speak(self, text: str) -> Optional[str]:
        try:
            options = SpeakOptions(
                model="aura-asteria-en",
                encoding="linear16",
                container="wav"
            )

            SPEAK_OPTIONS = {"text": text}
            self.deepgram.speak.v("1").save(self.filename, SPEAK_OPTIONS, options)
            playsound(self.filename)
            return self.filename
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
        self.tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
        self.scraper = WebScraper()
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
            result = DeepFace.analyze(image_path, actions=['emotion', 'age', 'gender'])
            return {
                'emotion': result[0]['dominant_emotion'],
                'age': result[0]['age'],
                'gender': result[0]['gender'],
                'gender_probability': round(result[0]['gender_probability'], 2)
            }
        except Exception as e:
            print(f"Error in face analysis: {e}")
            return {
                'emotion': 'neutral',
                'age': None,
                'gender': None,
                'gender_probability': None
            }

    def summarize_for_search(self, text: str, max_length: int = 100) -> str:
        try:
            prompt = f"""
            Summarize the following text into a short search query (max {max_length} characters):
            {text}
            Make the summary focused on the key topic and searchable terms.
            """

            response = self.openai.invoke([
                SystemMessage(content="You are a helpful assistant that creates concise search queries."),
                HumanMessage(content=prompt)
            ])

            summary = response.content.strip()
            if len(summary) > max_length:
                summary = summary[:max_length].rsplit(' ', 1)[0]

            return summary
        except Exception as e:
            print(f"Summarization error: {e}")
            return text[:max_length]

    def search_tavily(self, query: str, max_results: int = 3) -> List[Dict]:
        try:
            search_query = self.summarize_for_search(query)
            print(f"Searching Tavily for: {search_query}")

            # Use Tavily's search API
            search_result = self.tavily.search(search_query, max_results=max_results)
            enhanced_results = []

            for result in search_result.get("results", []):
                url = result.get("url")
                if url:
                    # Get additional content from the URL
                    content = self.scraper.scrape_content(url)
                    if content:
                        enhanced_results.append({
                            "title": result.get("title", ""),
                            "url": url,
                            "content": content
                        })

            return enhanced_results

        except Exception as e:
            print(f"Tavily search error: {e}")
            return [{
                "title": "Search unavailable",
                "url": "",
                "content": "Unable to perform search at the moment."
            }]

    def process_query(self, text_query: str, emotion_context: str) -> str:
        search_results = self.search_tavily(text_query)

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

        Additional Information:
        {json.dumps(search_results, indent=2)}

        Please provide a therapeutic response that:
        1. Acknowledges the user's emotional state
        2. Addresses their query
        3. References previous conversation when relevant
        4. Incorporates relevant information from search results if appropriate
        5. Maintains a supportive and empathetic tone
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
            'age': None,
            'gender': None,
            'gender_probability': None
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
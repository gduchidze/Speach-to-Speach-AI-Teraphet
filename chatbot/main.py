from typing import TypedDict, Annotated
import operator
import os
from dotenv import load_dotenv
from langchain_core.messages import AnyMessage, SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from duckduckgo_search import DDGS
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


class EmotionState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]
    emotion: str


class WebScraper:
    @staticmethod
    def scrape_content(url):
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

    def speak(self, text):
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

    def transcribe_file(self, file_path):
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

                transcript = response.results.channels[0].alternatives[0].transcript
                return transcript

        except Exception as e:
            print(f"Transcription error: {e}")
            return None


class EmotionAwareBot:
    def __init__(self):
        self.openai = ChatOpenAI(model="gpt-4o-mini", api_key=os.getenv("OPENAI_API_KEY"))
        self.deepgram = DeepgramClient(api_key=os.getenv("DEEPGRAM_API_KEY"))
        self.tts = DeepgramTTS()
        self.stt = SpeechToText()
        self.ddg = DDGS()
        self.scraper = WebScraper()

    def process_audio_file(self, audio_path, image_path=None):
        text_query = self.stt.transcribe_file(audio_path)

        if text_query:
            print(f"Transcribed text: {text_query}")
            return self.process_interaction(
                image_path=image_path,
                text_query=text_query
            )
        return "Failed to transcribe audio"

    def analyze_image(self, image_path):
        try:
            result = DeepFace.analyze(image_path, actions=['emotion', 'age', 'gender'])
            dominant_emotion = result[0]['dominant_emotion']
            age = result[0]['age']
            gender = result[0]['gender']
            gender_probability = result[0]['gender_probability']

            return {
                'emotion': dominant_emotion,
                'age': age,
                'gender': gender,
                'gender_probability': round(gender_probability, 2)
            }
        except Exception as e:
            print(f"Error in face analysis: {e}")
            return {
                'emotion': 'neutral',
                'age': None,
                'gender': None,
                'gender_probability': None
            }

    def summarize_for_search(self, text, max_length=100):
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

    def search_duckduckgo(self, query, max_results=3):
        try:
            search_query = self.summarize_for_search(query)
            print(f"Searching for: {search_query}")

            results = list(self.ddg.text(search_query, max_results=max_results))
            enhanced_results = []

            for result in results:
                url = result.get("href")
                if url:
                    content = self.scraper.scrape_content(url)
                    if content:
                        enhanced_results.append({
                            "title": result.get("title", ""),
                            "url": url,
                            "content": content
                        })

            return enhanced_results

        except Exception as e:
            print(f"Search error: {e}")
            return [{
                "title": "Search unavailable",
                "url": "",
                "content": "Unable to perform search at the moment."
            }]

    def process_query(self, text_query, emotion_context):
        search_results = self.search_duckduckgo(text_query)

        prompt = f"""
        {THERAPIST_SYSTEM_PROMPT}

        Current Context:
        - User's emotional state: {emotion_context}
        - User's query: {text_query}

        Additional Information:
        {json.dumps(search_results, indent=2)}

        Please provide a therapeutic response that:
        1. Acknowledges the user's emotional state
        2. Addresses their query
        3. Incorporates relevant information from search results if appropriate
        4. Maintains a supportive and empathetic tone
        """

        response = self.openai.invoke([
            SystemMessage(content=THERAPIST_SYSTEM_PROMPT),
            HumanMessage(content=prompt)
        ])
        return response.content

    def process_interaction(self, image_path=None, text_query=None):
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
            response_text = self.process_query(text_query, analysis_result['emotion'])
            print(f"User query: {text_query}")
            print(f"AI response: {response_text}")

            audio_file = self.tts.speak(response_text)
            return {
                "text_response": response_text,
                "audio_response": audio_file,
                "face_analysis": analysis_result
            }

        return "No query provided"


# def main():
#     bot = EmotionAwareBot()
#
#     print("\nTest 1: Audio only...")
#     result = bot.process_audio_file(
#         audio_path="test_audio.wav"
#     )
#     print("Result:", result)
#
#     print("\nTest 2: Audio with image...")
#     result = bot.process_audio_file(
#         audio_path="emb/test_audio.wav",
#         image_path="user_image.jpg"
#     )
#     print("Result:", result)
#
# if __name__ == "__main__":
#     main()
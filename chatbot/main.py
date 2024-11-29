from typing import TypedDict, Annotated
import operator
import os
from dotenv import load_dotenv
from langchain_core.messages import AnyMessage, SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from duckduckgo_search import DDGS
from deepface import DeepFace
from deepgram import DeepgramClient, SpeakOptions
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


class EmotionAwareBot:
    def __init__(self):
        self.openai = ChatOpenAI(model="gpt-4o-mini", api_key=os.getenv("OPENAI_API_KEY"))
        self.deepgram = DeepgramClient(api_key=os.getenv("DEEPGRAM_API_KEY"))
        self.tts = DeepgramTTS()
        self.ddg = DDGS()
        self.scraper = WebScraper()

    def analyze_image(self, image_path):
        try:
            result = DeepFace.analyze(image_path, actions=['emotion'])
            dominant_emotion = result[0]['dominant_emotion']
            return dominant_emotion
        except Exception as e:
            print(f"Error in emotion detection: {e}")
            return "neutral"

    def search_duckduckgo(self, query, max_results=3):
        try:
            results = list(self.ddg.text(query, max_results=max_results))
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
        emotion = "neutral"

        if image_path:
            emotion = self.analyze_image(image_path)
            print(f"Detected emotion: {emotion}")

        if text_query:
            response_text = self.process_query(text_query, emotion)
            print(f"User query: {text_query}")
            print(f"AI response: {response_text}")

            audio_file = self.tts.speak(response_text)
            return {
                "text_response": response_text,
                "audio_response": audio_file,
                "detected_emotion": emotion
            }

        return "No query provided"


def main():
    bot = EmotionAwareBot()
    # print("\nTesting without image...")
    # result = bot.process_interaction(
    #     text_query="I'm feeling anxious about my upcoming presentation"
    # )
    # print("Result:", result)

    # If you have an image file, uncomment and use these lines:
    print("\nTesting with image...")
    result = bot.process_interaction(
        image_path="user_image.jpg",
        text_query="I'm feeling anxious about my upcoming presentation, use maximum 50 words"
    )
    print("Result:", result)


if __name__ == "__main__":
    main()
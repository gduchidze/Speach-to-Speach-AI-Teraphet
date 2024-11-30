from typing import Dict, List, Optional
from datetime import datetime
import json
from duckduckgo_search import DDGS
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
import os
from dotenv import load_dotenv

load_dotenv()


class TextTherapyService:
    def __init__(self):
        self.openai = ChatOpenAI(model="gpt-4o-mini", api_key=os.getenv("OPENAI_API_KEY"))
        self.ddg = DDGS()
        self.conversation_history = []
        self.load_history()

    def load_history(self) -> None:
        try:
            with open("chat_history.json", "r", encoding="utf-8") as f:
                self.conversation_history = json.load(f)
        except FileNotFoundError:
            self.conversation_history = []

    def save_to_history(self, role: str, message: str) -> None:
        self.conversation_history.append({
            "role": role,
            "message": message,
            "timestamp": datetime.now().isoformat()
        })

        try:
            with open("chat_history.json", "w", encoding="utf-8") as f:
                json.dump(self.conversation_history, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error saving history: {e}")

    def get_recent_messages(self, n: int = 5) -> str:
        recent = self.conversation_history[-n:] if self.conversation_history else []
        return "\n".join([
            f"{msg['role']}: {msg['message']}"
            for msg in recent
        ])

    def summarize_for_search(self, text: str, max_length: int = 100) -> str:
        try:
            prompt = f"""
            Create a short search query (max {max_length} chars) from this text:
            {text}
            Focus on key topics and searchable terms.
            """

            response = self.openai.invoke([
                SystemMessage(content="You create concise search queries."),
                HumanMessage(content=prompt)
            ])

            summary = response.content.strip()
            return summary[:max_length]

        except Exception as e:
            print(f"Summarization error: {e}")
            return text[:max_length]

    def search_duckduckgo(self, query: str, max_results: int = 3) -> List[Dict]:
        try:
            search_query = self.summarize_for_search(query)
            print(f"Searching for: {search_query}")

            results = []
            for r in self.ddg.text(search_query, max_results=max_results):
                results.append({
                    "title": r.get("title", ""),
                    "link": r.get("href", ""),
                    "snippet": r.get("body", "")[:500]
                })
            return results

        except Exception as e:
            print(f"Search error: {e}")
            return []

    def process_message(self, user_input: str) -> Dict:
        try:
            self.save_to_history("User", user_input)

            search_results = self.search_duckduckgo(user_input)

            recent_chat = self.get_recent_messages()

            prompt = f"""
            You are an empathetic AI therapist.

            User's message: {user_input}

            Recent conversation:
            {recent_chat}

            Relevant information from search:
            {json.dumps(search_results, indent=2)}

            Please provide a therapeutic response that:
            1. Shows understanding of the user's message
            2. References relevant parts of the conversation history
            3. Incorporates helpful information from search results
            4. Maintains a warm and professional tone
            """

            response = self.openai.invoke([
                SystemMessage(content="You are an empathetic AI therapist."),
                HumanMessage(content=prompt)
            ])

            response_text = response.content
            self.save_to_history("Assistant", response_text)

            return {
                "response": response_text,
                "search_results": search_results,
                "conversation_context": recent_chat
            }

        except Exception as e:
            print(f"Error processing message: {e}")
            return {
                "error": "Failed to process message",
                "details": str(e)
            }


def main():
    # Initialize service
    service = TextTherapyService()
    print("Text Therapy Service Started...")

    while True:
        try:
            # Get user input
            user_input = input("\nYou: ")

            if user_input.lower() in ['quit', 'exit', 'bye']:
                print("Ending session...")
                break

            # Process message
            result = service.process_message(user_input)

            if "error" in result:
                print(f"Error: {result['error']}")
                continue

            # Display response
            print(f"\nTherapist: {result['response']}")

            # # Optional: display search results
            # if result['search_results']:
            #     print("\nRelevant Information Found:")
            #     for i, r in enumerate(result['search_results'], 1):
            #         print(f"{i}. {r['title']}")

        except Exception as e:
            print(f"Error in conversation loop: {e}")
            continue


if __name__ == "__main__":
    main()
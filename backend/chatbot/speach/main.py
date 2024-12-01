from typing import Dict

from langchain_core.messages import SystemMessage, HumanMessage

from app.speach.chatbot_client import EmotionAwareBot, THERAPIST_SYSTEM_PROMPT


def main():
    # Initialize the bot
    bot = EmotionAwareBot()

    def initial_setup(image_path: str) -> Dict:
        """პირველადი ინტერაქცია სურათის ანალიზით"""
        print("\n=== Starting Initial Interaction ===")

        # 1. სურათის ანალიზი
        analysis = bot.analyze_image(image_path)
        print(f"Face Analysis Results: {analysis}")

        # 2. საწყისი მისალმების გენერაცია ანალიზის შედეგების მიხედვით
        intro_prompt = f"""
        Based on the image analysis, I can see that:
        - Emotional State: {analysis['emotion']}
        - Approximate Age: {analysis['age']}
        - Gender: {analysis['gender']} (confidence: {analysis['gender_probability']})

        Please generate a warm, professional introduction for our therapy session.
        """

        intro_response = bot.openai.invoke([
            SystemMessage(content=THERAPIST_SYSTEM_PROMPT),
            HumanMessage(content=intro_prompt)
        ])

        # 3. მისალმების ტექსტის გარდაქმნა საუბრად
        intro_audio = bot.tts.speak(intro_response.content)

        # შევინახოთ მისალმება ისტორიაში
        bot.save_to_history("Assistant", intro_response.content)

        return {
            "analysis": analysis,
            "text_response": intro_response.content,
            "audio_response": intro_audio
        }

    def continuous_interaction(audio_path: str) -> Dict:
        """მიმდინარე საუბრის ციკლი"""
        print("\n=== Processing User Input ===")

        # 1. Speech to Text
        text_input = bot.stt.transcribe_file(audio_path)
        if not text_input:
            return {"error": "Failed to transcribe audio"}
        print(f"Transcribed Text: {text_input}")

        # 2. ტექსტიდან ემოციის ანალიზი
        emotion_result = bot.analyze_image("temp_frame.jpg")  # ან deepface-ის სხვა მეთოდი
        print(f"Emotion Analysis: {emotion_result}")

        # 3. შევინახოთ იუზერის მესიჯი
        bot.save_to_history("User", text_input)

        # 4. გენერირება პასუხის
        response = bot.process_query(text_input, emotion_result['emotion'])
        print(f"Generated Response: {response}")

        # 5. პასუხის გარდაქმნა აუდიოდ
        audio_response = bot.tts.speak(response)

        return {
            "text_response": response,
            "audio_response": audio_response,
            "emotion_analysis": emotion_result
        }

    try:
        # 1. პირველადი ინტერაქცია სურათით
        print("Starting therapy session...")
        initial_result = initial_setup("path/to/user_image.jpg")
        print(f"Initial interaction completed: {initial_result['text_response']}")

        # 2. მთავარი საუბრის ციკლი
        while True:
            try:
                # მოლოდინი იუზერის აუდიო ინფუთზე
                audio_input = input("\nEnter path to audio file (or 'quit' to end session): ")

                if audio_input.lower() == 'quit':
                    print("\nEnding therapy session...")
                    break

                # დაამუშავე იუზერის აუდიო და დააგენერირე პასუხი
                result = continuous_interaction(audio_input)

                if "error" in result:
                    print(f"Error: {result['error']}")
                    continue

                print(f"\nBot Response: {result['text_response']}")
                print(f"Emotion detected: {result['emotion_analysis']['emotion']}")

            except Exception as e:
                print(f"Error in conversation loop: {e}")
                continue

    except Exception as e:
        print(f"Critical error: {e}")
        return

    print("\nTherapy session completed successfully!")


if __name__ == "__main__":
    main()
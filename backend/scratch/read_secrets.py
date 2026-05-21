import os

keys_of_interest = [
    "GEMINI_API_KEY",
    "OPENROUTER_API_KEY",
    "SILICONFLOW_API_KEY",
    "OLLAMA_API_KEY",
    "OPENAI_API_KEY"
]

print("--- Printing Env Variables (masked) ---")
for key in keys_of_interest:
    val = os.environ.get(key)
    if val:
        print(f"{key}: {val[:6]}...{val[-6:]} (Length: {len(val)})")
    else:
        print(f"{key}: Not Found")

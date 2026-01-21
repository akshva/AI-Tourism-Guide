import google.generativeai as genai

# --- PASTE YOUR API KEY HERE ---
genai.configure(api_key="") 

print("Available models that support 'generateContent':")

for m in genai.list_models():
  if 'generateContent' in m.supported_generation_methods:
    print(f"Model Name: {m.name}")

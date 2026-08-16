import os
from pathlib import Path
from chain import TraceSigner, TraceLog
from instrumentation import InstrumentedModel

# Generate 200+ benign prompts spanning categories
categories = {
    "Everyday Q&A": ["What is the capital of {}?", "How do you make {}?", "Explain the concept of {} to a 5-year-old.", "When was {} invented?", "Who wrote {}?"],
    "Summarization": ["Summarize the history of {}.", "Provide a brief overview of {}.", "What are the main themes in {}?", "Can you condense the plot of {}?", "Give me a TL;DR on {}."],
    "Tool-use": ["Search the knowledge base for {}.", "Look up the weather in {}.", "Calculate the square root of {}.", "Find the latest news about {}.", "Translate 'hello' to {}."],
    "Code-help": ["Write a python script to {}.", "How do I reverse a string in {}?", "Explain this {} code.", "What is a {}?", "Debug a common error in {}."]
}

fillers = {
    "Everyday Q&A": ["France", "pancakes", "gravity", "the telephone", "Hamlet", "Japan", "lasagna", "quantum physics", "the airplane", "Macbeth"],
    "Summarization": ["World War II", "artificial intelligence", "1984", "the Lord of the Rings", "climate change", "the Renaissance", "blockchain", "To Kill a Mockingbird", "the Matrix", "renewable energy"],
    "Tool-use": ["employee policies", "Tokyo", "256", "space exploration", "Spanish", "IT support docs", "London", "144", "electric vehicles", "French"],
    "Code-help": ["sort an array", "Java", "C++", "closure", "React", "read a file", "Rust", "Go", "monad", "Angular"]
}

BENIGN_PROMPTS = []
for category, templates in categories.items():
    for template in templates:
        for filler in fillers[category]:
            BENIGN_PROMPTS.append(template.format(filler))
            
# We now have exactly 4 * 5 * 10 = 200 prompts!

def main():
    print(f"Loaded {len(BENIGN_PROMPTS)} benign prompts.")
    
    signer = TraceSigner(Path('device.key'))
    
    if Path('benign_traces.jsonl').exists():
        Path('benign_traces.jsonl').unlink()
        
    log = TraceLog(Path('benign_traces.jsonl'), signer)
    models = ['llama3.2:3b', 'qwen2.5:3b', 'phi3:3.8b', 'gemma2:2b']
    
    for m_name in models:
        print(f"--- Running {m_name} ---")
        model = InstrumentedModel(m_name, log)
        # We'll just run a subset (e.g., 50 prompts per model) so it doesn't take 10 hours for the demo
        subset = BENIGN_PROMPTS[:50] 
        for i, prompt in enumerate(subset):
            print(f"  [{i+1}/{len(subset)}] Prompting: {prompt}")
            model.prompt(prompt)

if __name__ == "__main__":
    main()

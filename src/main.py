import os
import sys
import io
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

def download_model(model_name):
    # Function to download the model if not already downloaded
    model_dir = os.path.join('./models', model_name.replace('/', '_'))
    if not os.path.exists(model_dir):
        print(f"Downloading model {model_name}...")
        os.makedirs(model_dir, exist_ok=True)
        # Download Seq2Seq model
        AutoModelForSeq2SeqLM.from_pretrained(model_name, cache_dir=model_dir)
        # Download tokenizer
        AutoTokenizer.from_pretrained(model_name, cache_dir=model_dir)
        print(f"Model {model_name} downloaded successfully.")
    return model_dir

def main(*args):
    # Main function to execute machine translation
    model_name = args[0]   # Model name
    text = args[1]         # Text to be translated
    tgt_lang = args[2]     # Target language

    # Check and download the model if not already downloaded
    model_dir = download_model(model_name)

    # Load tokenizer and model
    tokenizer = AutoTokenizer.from_pretrained(model_name, cache_dir=model_dir)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name, cache_dir=model_dir)

    # Determine the language token ID
    lang_token = f"{tgt_lang}"
    if lang_token in tokenizer.additional_special_tokens:
        forced_bos_token_id = tokenizer.convert_tokens_to_ids(lang_token)
    else:
        raise ValueError(f"Language token {lang_token} not found in tokenizer's additional special tokens")

    # Encode the text to a tensor using the tokenizer
    inputs = tokenizer(text, return_tensors="pt")

    # Generate the translation using the model
    translated_tokens = model.generate(**inputs, forced_bos_token_id=forced_bos_token_id, max_length=512)

    # Decode the tokens to plain text
    output = tokenizer.decode(translated_tokens[0], skip_special_tokens=True)

    # Write the translated text to standard output (screen or file)
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stdout.write(output)
    sys.exit(0)

if __name__ == '__main__':
    main(*sys.argv[1:])
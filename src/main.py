import os
import sys
import io
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
 
def download_model(model_name):
    # دالة لتحميل النموذج إذا لم يتم تحميله بالفعل
    model_dir = os.path.join('./models', model_name.replace('/', '_'))
    if not os.path.exists(model_dir):
        print(f"Downloading model {model_name}...")
        os.makedirs(model_dir, exist_ok=True)
        # تحميل نموذج Seq2Seq
        AutoModelForSeq2SeqLM.from_pretrained(model_name, cache_dir=model_dir)
        # تحميل المفردات
        AutoTokenizer.from_pretrained(model_name, cache_dir=model_dir)
        print(f"Model {model_name} downloaded successfully.")
    return model_dir

def main(*args):
    # الدالة الرئيسية لتنفيذ الترجمة الآلية
    model_name = args[0]   # اسم النموذج
    text = args[1]         # النص الذي يجب ترجمته
    tgt_lang = args[2]     # لغة النص المستهدفة

    # التحقق وتحميل النموذج إذا لم يتم تحميله بالفعل
    model_dir = download_model(model_name)

    # تحميل المفردات والنموذج
    tokenizer = AutoTokenizer.from_pretrained(model_name, cache_dir=model_dir)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name, cache_dir=model_dir)

    # ترميز النص إلى تنسور باستخدام المفردات
    inputs = tokenizer(text, return_tensors="pt")

    # توليد الترجمة باستخدام النموذج
    translated_tokens = model.generate(**inputs, forced_bos_token_id=tokenizer.lang_code_to_id[tgt_lang], max_length=512)

    # فك تشفير التوكنات إلى نص بسيط
    output = tokenizer.decode(translated_tokens[0], skip_special_tokens=True)

    # كتابة النص المُترجم إلى الإخراج القياسي (الشاشة أو الملف)
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stdout.write(output)
    sys.exit(0)

if __name__ == '__main__':
    main(*sys.argv[1:])

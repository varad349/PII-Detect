from flask import Flask, request, render_template, jsonify
from transformers import AutoModelForTokenClassification, AutoTokenizer, pipeline
import re
import io
from pdfminer.high_level import extract_text as extract_text_from_pdf
from docx import Document

app = Flask(__name__)
model_path = "ner_model" 
tokenizer = AutoTokenizer.from_pretrained(model_path)
model_fine_tuned = AutoModelForTokenClassification.from_pretrained(model_path)

nlp_ner = pipeline("ner", model=model_fine_tuned, tokenizer=tokenizer)
phone_regex = r"\b(?:\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b"
email_regex = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
ner_label_map = {
    "B-PER": "NAME",
    "I-PER": "NAME",
    "B-LOC": "LOCATION",
    "I-LOC": "LOCATION",
}

def extract_text_from_docx(file_stream):
    doc = Document(file_stream)
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    return '\n'.join(full_text)

@app.route('/')
def upload_file():
    return render_template('index.html')

@app.route('/uploadfile', methods=['POST'])
def uploadfile():
    if 'file' not in request.files:
        return 'No file part'
    
    file = request.files['file']
    if file.filename == '':
        return 'No selected file'
    
    if file:
        file_ext = file.filename.rsplit('.', 1)
        if len(file_ext) < 2 or file_ext[1].lower() not in ['pdf', 'txt', 'docx']:
            return 'Unsupported file type'

        file_ext = file_ext[1].lower()
        
        if file_ext == 'pdf':
            file_stream = io.BytesIO(file.read())
            contents = extract_text_from_pdf(file_stream)
        elif file_ext == 'docx':
            contents = extract_text_from_docx(file)
        else: 
            contents = file.read().decode('utf-8')
        
        ner_results = nlp_ner(contents)
        
        phones = re.findall(phone_regex, contents)
        emails = re.findall(email_regex, contents)
        
        serializable_results = []
        for result in ner_results:
            entity_label = result['entity']
            if entity_label in ner_label_map:
                entity_label = ner_label_map[entity_label]
            
            serializable_result = {
                'entity': entity_label,
                'score': float(result['score']),  
                'index': result['index'],
                'word': result['word'],
            }
            serializable_results.append(serializable_result)
        
        return jsonify({
            "filename": file.filename,
            "extracted_text": contents,  
            "NER_results": serializable_results,
            "phones": phones,
            "emails": emails,
        })

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000)

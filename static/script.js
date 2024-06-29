document.getElementById('uploadForm').addEventListener('submit', (event) => {
    event.preventDefault();

    let formData = new FormData();
    let fileInput = document.getElementById('fileInput');
    formData.append('file', fileInput.files[0]);

    let progressBar = document.getElementById('progressBar');
    progressBar.style.width = '0%';

    fetch('/uploadfile', {
        method: 'POST',
        body: formData,
        onUploadProgress: progressEvent => {
            const { loaded, total } = progressEvent;
            progressBar.style.width = `${(loaded / total) * 100}%`;
        },
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);  
        progressBar.style.width = '100%';
        setTimeout(() => {
            progressBar.style.width = '0%';
        }, 500);

        let nerResultsElement = document.getElementById('nerResults');
        nerResultsElement.innerHTML = '<h3>NER Results:</h3>';
        if (data.NER_results && data.NER_results.length > 0) {
            data.NER_results.forEach(result => {
                nerResultsElement.innerHTML += `<p>${result.word}: ${result.entity}</p>`;
            });
        } else {
            nerResultsElement.innerHTML += '<p>No NER results found.</p>';
        }

        let phonesElement = document.getElementById('phones');
        phonesElement.innerHTML = '<h3>Phone Numbers:</h3>';
        if (data.phones && data.phones.length > 0) {
            data.phones.forEach(phone => {
                phonesElement.innerHTML += `<p>${phone}</p>`;
            });
        } else {
            phonesElement.innerHTML += '<p>No phone numbers found.</p>';
        }

        let emailsElement = document.getElementById('emails');
        emailsElement.innerHTML = '<h3>Email Addresses:</h3>';
        if (data.emails && data.emails.length > 0) {
            data.emails.forEach(email => {
                emailsElement.innerHTML += `<p>${email}</p>`;
            });
        } else {
            emailsElement.innerHTML += '<p>No email addresses found.</p>';
        }
        let filenameElement = document.getElementById('filename');
        filenameElement.innerText = `Uploaded File: ${data.filename}`;
    })
    .catch(error => {
        console.error('Error:', error);
        progressBar.style.width = '0%'; 
    });
});

function displayResults(data) {
    let resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<p><strong>Uploaded File:</strong> ${data.filename}</p>`;
    resultDiv.innerHTML += `<p><strong>NER Results:</strong></p>`;
    
    if (data.NER_results && data.NER_results.length > 0) {
        resultDiv.innerHTML += `<ul>`;
        data.NER_results.forEach(entity => {
            resultDiv.innerHTML += `<li>${entity.word}: ${entity.entity}</li>`;
        });
        resultDiv.innerHTML += `</ul>`;
    } else {
        resultDiv.innerHTML += `<p>No entities found.</p>`;
    }
}

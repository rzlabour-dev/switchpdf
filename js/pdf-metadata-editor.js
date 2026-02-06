// PDF Metadata Editor functionality
let selectedFile = null;

document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const uploadCta = document.getElementById('uploadCta');
    const metadataEditor = document.getElementById('metadataEditor');
    const updateBtn = document.getElementById('updateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const progressArea = document.getElementById('progressArea');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    // Browse button click
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    if (uploadCta) uploadCta.addEventListener('click', () => fileInput.click());
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFile(e.target.files[0]);
    });

    // Drag and drop events
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('drag-over');
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('drag-over');
    });

    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('drag-over');
        handleFile(e.dataTransfer.files[0]);
    });

    // Update button click
    updateBtn.addEventListener('click', updateMetadata);

    // Clear button click
    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all metadata fields?')) {
            const inputs = metadataEditor.querySelectorAll('input');
            inputs.forEach(input => input.value = '');
        }
    });

    async function handleFile(file) {
        if (!file || file.type !== 'application/pdf') {
            alert('Please select a PDF file.');
            return;
        }

        selectedFile = file;

        try {
            const fileBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(fileBuffer);

            // Load existing metadata
            loadMetadata(pdfDoc);

            metadataEditor.style.display = 'block';
            progressArea.style.display = 'none';
        } catch (error) {
            alert('Error loading PDF. Please try another file.');
        }
    }

    function loadMetadata(pdfDoc) {
        // Get document info
        const info = pdfDoc.getInfo();

        document.getElementById('title').value = info.Title || '';
        document.getElementById('author').value = info.Author || '';
        document.getElementById('subject').value = info.Subject || '';
        document.getElementById('keywords').value = Array.isArray(info.Keywords) ? info.Keywords.join(', ') : (info.Keywords || '');
        document.getElementById('creator').value = info.Creator || '';
        document.getElementById('producer').value = info.Producer || '';

        // Handle creation date
        if (info.CreationDate) {
            const date = new Date(info.CreationDate);
            const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
            document.getElementById('creationDate').value = localDateTime.toISOString().slice(0, 16);
        } else {
            document.getElementById('creationDate').value = '';
        }
    }

    async function updateMetadata() {
        if (!selectedFile) {
            alert('Please select a PDF file first.');
            return;
        }

        progressArea.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'Loading PDF...';
        updateBtn.disabled = true;

        try {
            const fileBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(fileBuffer);

            progressFill.style.width = '30%';
            progressText.textContent = 'Updating metadata...';

            // Prepare metadata
            const metadata = {
                Title: document.getElementById('title').value.trim() || undefined,
                Author: document.getElementById('author').value.trim() || undefined,
                Subject: document.getElementById('subject').value.trim() || undefined,
                Keywords: document.getElementById('keywords').value.trim() ?
                    document.getElementById('keywords').value.split(',').map(k => k.trim()).filter(k => k) : undefined,
                Creator: document.getElementById('creator').value.trim() || undefined,
                Producer: document.getElementById('producer').value.trim() || undefined,
            };

            // Handle creation date
            const creationDateInput = document.getElementById('creationDate').value;
            if (creationDateInput) {
                metadata.CreationDate = new Date(creationDateInput);
            }

            // Set document info
            pdfDoc.setInfo(metadata);

            progressFill.style.width = '70%';
            progressText.textContent = 'Saving PDF...';

            const updatedBytes = await pdfDoc.save();

            // Create download link
            const blob = new Blob([updatedBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'metadata_updated_' + selectedFile.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            progressFill.style.width = '100%';
            progressText.textContent = 'Metadata updated successfully!';

            // Reset after a delay
            setTimeout(() => {
                progressArea.style.display = 'none';
                updateBtn.disabled = false;
            }, 3000);

        } catch (error) {
            console.error('Error updating metadata:', error);
            alert('Error updating PDF metadata. Please try again.');
            progressArea.style.display = 'none';
            updateBtn.disabled = false;
        }
    }
});


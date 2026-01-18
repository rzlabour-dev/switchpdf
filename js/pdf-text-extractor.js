// PDF Text Extractor functionality
let selectedFile = null;
let extractedText = '';

document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const extractOptions = document.getElementById('extractOptions');
    const pageCountSpan = document.getElementById('pageCount');
    const pageSelection = document.getElementById('pageSelection');
    const rangeInput = document.getElementById('rangeInput');
    const extractBtn = document.getElementById('extractBtn');
    const textOutput = document.getElementById('textOutput');
    const extractedTextArea = document.getElementById('extractedText');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const progressArea = document.getElementById('progressArea');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    // Browse button click
    browseBtn.addEventListener('click', () => {
        fileInput.click();
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

    // Page selection change
    pageSelection.addEventListener('change', () => {
        rangeInput.style.display = pageSelection.value === 'range' ? 'block' : 'none';
    });

    // Extract button click
    extractBtn.addEventListener('click', extractText);

    // Copy button click
    copyBtn.addEventListener('click', () => {
        extractedTextArea.select();
        document.execCommand('copy');
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = 'Copy to Clipboard';
        }, 2000);
    });

    // Download button click
    downloadBtn.addEventListener('click', downloadText);

    async function handleFile(file) {
        if (!file || file.type !== 'application/pdf') {
            alert('Please select a PDF file.');
            return;
        }

        selectedFile = file;

        try {
            const fileBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
            const pageCount = pdf.numPages;

            pageCountSpan.textContent = pageCount;
            extractOptions.style.display = 'block';
            textOutput.style.display = 'none';
            progressArea.style.display = 'none';
        } catch (error) {
            alert('Error loading PDF. Please try another file.');
        }
    }

    async function extractText() {
        if (!selectedFile) {
            alert('Please select a PDF file first.');
            return;
        }

        progressArea.style.display = 'block';
        textOutput.style.display = 'none';
        progressFill.style.width = '0%';
        progressText.textContent = 'Loading PDF...';
        extractBtn.disabled = true;

        try {
            const fileBuffer = await selectedFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
            const totalPages = pdf.numPages;

            // Determine which pages to extract
            let pagesToExtract = [];
            const selectionType = pageSelection.value;

            if (selectionType === 'all') {
                pagesToExtract = Array.from({ length: totalPages }, (_, i) => i + 1);
            } else if (selectionType === 'range') {
                const rangeInput = document.getElementById('pageRange').value.trim();
                if (!rangeInput) {
                    alert('Please enter a page range.');
                    return;
                }
                pagesToExtract = parseRanges(rangeInput, totalPages);
            }

            if (pagesToExtract.length === 0) {
                alert('No valid pages selected for extraction.');
                return;
            }

            extractedText = '';
            const outputFormat = document.getElementById('outputFormat').value;

            for (let i = 0; i < pagesToExtract.length; i++) {
                const pageNum = pagesToExtract[i];
                progressText.textContent = `Extracting text from page ${pageNum}...`;
                progressFill.style.width = `${(i / pagesToExtract.length) * 90}%`;

                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');

                if (outputFormat === 'text') {
                    extractedText += `--- Page ${pageNum} ---\n${pageText}\n\n`;
                } else if (outputFormat === 'html') {
                    extractedText += `<h2>Page ${pageNum}</h2><p>${pageText.replace(/\n/g, '<br>')}</p>\n\n`;
                } else if (outputFormat === 'json') {
                    if (i === 0) extractedText += '{\n  "pages": [\n';
                    extractedText += `    {\n      "page": ${pageNum},\n      "text": "${pageText.replace(/"/g, '\\"')}"\n    }`;
                    extractedText += i < pagesToExtract.length - 1 ? ',\n' : '\n  ]\n}';
                }
            }

            progressFill.style.width = '100%';
            progressText.textContent = 'Text extraction complete!';

            // Display results
            extractedTextArea.value = extractedText;
            textOutput.style.display = 'block';

            // Reset after a delay
            setTimeout(() => {
                progressArea.style.display = 'none';
                extractBtn.disabled = false;
            }, 2000);

        } catch (error) {
            console.error('Error extracting text:', error);
            alert('Error extracting text from PDF. The PDF might be image-based or corrupted.');
            progressArea.style.display = 'none';
            extractBtn.disabled = false;
        }
    }

    function downloadText() {
        if (!extractedText) {
            alert('No text to download.');
            return;
        }

        const outputFormat = document.getElementById('outputFormat').value;
        let filename, mimeType, content;

        if (outputFormat === 'text') {
            filename = 'extracted_text.txt';
            mimeType = 'text/plain';
            content = extractedText;
        } else if (outputFormat === 'html') {
            filename = 'extracted_text.html';
            mimeType = 'text/html';
            content = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Extracted Text from PDF</title>
</head>
<body>
    <h1>Extracted Text from PDF</h1>
    ${extractedText}
</body>
</html>`;
        } else if (outputFormat === 'json') {
            filename = 'extracted_text.json';
            mimeType = 'application/json';
            content = extractedText;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function parseRanges(input, totalPages) {
        const ranges = [];
        const parts = input.split(',');

        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
                if (start && end && start <= end && start >= 1 && end <= totalPages) {
                    for (let i = start; i <= end; i++) {
                        ranges.push(i);
                    }
                }
            } else {
                const page = parseInt(trimmed);
                if (page && page >= 1 && page <= totalPages) {
                    ranges.push(page);
                }
            }
        }

        return ranges;
    }
});
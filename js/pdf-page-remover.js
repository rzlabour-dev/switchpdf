// PDF Page Remover functionality
let selectedFile = null;
let totalPages = 0;
let pagesToKeep = [];

document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const removeOptions = document.getElementById('removeOptions');
    const pageCountSpan = document.getElementById('pageCount');
    const pagesToRemoveInput = document.getElementById('pagesToRemove');
    const previewBtn = document.getElementById('previewBtn');
    const removeBtn = document.getElementById('removeBtn');
    const preview = document.getElementById('preview');
    const pageList = document.getElementById('pageList');
    const progressArea = document.getElementById('progressArea');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

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

    // Preview button click
    previewBtn.addEventListener('click', showPreview);

    // Remove button click
    removeBtn.addEventListener('click', removePages);

    async function handleFile(file) {
        if (!file || file.type !== 'application/pdf') {
            alert('Please select a PDF file.');
            return;
        }

        selectedFile = file;

        try {
            const fileBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(fileBuffer);
            totalPages = pdfDoc.getPageCount();

            pageCountSpan.textContent = totalPages;
            removeOptions.style.display = 'block';
            preview.style.display = 'none';
            progressArea.style.display = 'none';
            removeBtn.style.display = 'none';
        } catch (error) {
            alert('Error loading PDF. Please try another file.');
        }
    }

    function showPreview() {
        const pagesToRemoveInput = document.getElementById('pagesToRemove').value.trim();
        if (!pagesToRemoveInput) {
            alert('Please enter the pages to remove.');
            return;
        }

        const pagesToRemove = parsePagesToRemove(pagesToRemoveInput, totalPages);
        if (pagesToRemove.length === 0) {
            alert('No valid pages specified for removal.');
            return;
        }

        // Calculate pages to keep
        pagesToKeep = [];
        for (let i = 1; i <= totalPages; i++) {
            if (!pagesToRemove.includes(i)) {
                pagesToKeep.push(i);
            }
        }

        if (pagesToKeep.length === 0) {
            alert('Cannot remove all pages. At least one page must remain.');
            return;
        }

        // Display preview
        pageList.innerHTML = '';
        pagesToKeep.forEach(pageNum => {
            const pageItem = document.createElement('div');
            pageItem.className = 'page-item';
            pageItem.textContent = `Page ${pageNum}`;
            pageList.appendChild(pageItem);
        });

        preview.style.display = 'block';
        removeBtn.style.display = 'block';
    }

    async function removePages() {
        if (pagesToKeep.length === 0) {
            alert('No pages to keep. Please adjust your selection.');
            return;
        }

        progressArea.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'Loading PDF...';
        removeBtn.disabled = true;

        try {
            const fileBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(fileBuffer);

            progressFill.style.width = '30%';
            progressText.textContent = 'Creating new PDF...';

            // Create a new PDF with only the pages to keep
            const newPdf = await PDFLib.PDFDocument.create();

            // Convert page numbers to 0-based indices
            const pagesToKeepIndices = pagesToKeep.map(p => p - 1);

            const pages = await newPdf.copyPages(pdfDoc, pagesToKeepIndices);
            pages.forEach(page => newPdf.addPage(page));

            progressFill.style.width = '70%';
            progressText.textContent = 'Saving PDF...';

            const modifiedBytes = await newPdf.save();

            // Create download link
            const blob = new Blob([modifiedBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'pages_removed_' + selectedFile.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            progressFill.style.width = '100%';
            progressText.textContent = 'Pages removed successfully!';

            // Reset after a delay
            setTimeout(() => {
                progressArea.style.display = 'none';
                removeBtn.disabled = false;
                preview.style.display = 'none';
                pagesToKeep = [];
            }, 3000);

        } catch (error) {
            console.error('Error removing pages:', error);
            alert('Error removing pages from PDF. Please try again.');
            progressArea.style.display = 'none';
            removeBtn.disabled = false;
        }
    }

    function parsePagesToRemove(input, totalPages) {
        const pages = [];
        const parts = input.split(',');

        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
                if (start && end && start <= end && start >= 1 && end <= totalPages) {
                    for (let i = start; i <= end; i++) {
                        if (!pages.includes(i)) {
                            pages.push(i);
                        }
                    }
                }
            } else {
                const page = parseInt(trimmed);
                if (page && page >= 1 && page <= totalPages && !pages.includes(page)) {
                    pages.push(page);
                }
            }
        }

        return pages.sort((a, b) => a - b);
    }
});
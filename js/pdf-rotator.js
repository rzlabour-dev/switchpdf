// PDF Rotator functionality
let selectedFile = null;

document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const uploadCta = document.getElementById('uploadCta');
    const rotateOptions = document.getElementById('rotateOptions');
    const pageCountSpan = document.getElementById('pageCount');
    const pageSelection = document.getElementById('pageSelection');
    const rangeInput = document.getElementById('rangeInput');
    const individualInput = document.getElementById('individualInput');
    const rotateBtn = document.getElementById('rotateBtn');
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

    // Page selection change
    pageSelection.addEventListener('change', () => {
        rangeInput.style.display = pageSelection.value === 'range' ? 'block' : 'none';
        individualInput.style.display = pageSelection.value === 'individual' ? 'block' : 'none';
    });

    // Rotate button click
    rotateBtn.addEventListener('click', rotatePDF);

    async function handleFile(file) {
        if (!file || file.type !== 'application/pdf') {
            alert('Please select a PDF file.');
            return;
        }

        selectedFile = file;

        try {
            const fileBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(fileBuffer);
            const pageCount = pdfDoc.getPageCount();

            pageCountSpan.textContent = pageCount;
            rotateOptions.style.display = 'block';
            progressArea.style.display = 'none';
        } catch (error) {
            alert('Error loading PDF. Please try another file.');
        }
    }

    async function rotatePDF() {
        if (!selectedFile) {
            alert('Please select a PDF file first.');
            return;
        }

        const rotationAngle = parseInt(document.getElementById('rotationAngle').value);
        const selectionType = pageSelection.value;

        let pagesToRotate = [];

        if (selectionType === 'all') {
            // Rotate all pages
            const fileBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(fileBuffer);
            pagesToRotate = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i);
        } else if (selectionType === 'range') {
            const rangeInput = document.getElementById('pageRange').value.trim();
            if (!rangeInput) {
                alert('Please enter a page range.');
                return;
            }
            const fileBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(fileBuffer);
            const totalPages = pdfDoc.getPageCount();
            pagesToRotate = parseRanges(rangeInput, totalPages).flat().map(p => p - 1);
        } else if (selectionType === 'individual') {
            const individualInput = document.getElementById('individualPages').value.trim();
            if (!individualInput) {
                alert('Please enter page numbers.');
                return;
            }
            const fileBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(fileBuffer);
            const totalPages = pdfDoc.getPageCount();
            pagesToRotate = individualInput.split(',').map(p => parseInt(p.trim()) - 1).filter(p => p >= 0 && p < totalPages);
        }

        if (pagesToRotate.length === 0) {
            alert('No valid pages selected for rotation.');
            return;
        }

        progressArea.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'Loading PDF...';
        rotateBtn.disabled = true;

        try {
            const fileBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(fileBuffer);

            progressText.textContent = 'Rotating pages...';
            progressFill.style.width = '50%';

            // Rotate selected pages
            pagesToRotate.forEach(pageIndex => {
                const page = pdfDoc.getPage(pageIndex);
                page.setRotation(page.getRotation().angle + rotationAngle);
            });

            progressText.textContent = 'Saving rotated PDF...';
            progressFill.style.width = '90%';

            const rotatedBytes = await pdfDoc.save();

            // Create download link
            const blob = new Blob([rotatedBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'rotated_' + selectedFile.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            progressFill.style.width = '100%';
            progressText.textContent = 'Rotation complete!';

            // Reset after a delay
            setTimeout(() => {
                progressArea.style.display = 'none';
                rotateBtn.disabled = false;
            }, 2000);

        } catch (error) {
            console.error('Error rotating PDF:', error);
            alert('Error rotating PDF. Please try again.');
            progressArea.style.display = 'none';
            rotateBtn.disabled = false;
        }
    }

    function parseRanges(input, totalPages) {
        const ranges = [];
        const parts = input.split(',');

        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
                if (start && end && start <= end && start >= 1 && end <= totalPages) {
                    const range = [];
                    for (let i = start; i <= end; i++) {
                        range.push(i);
                    }
                    ranges.push(range);
                }
            } else {
                const page = parseInt(trimmed);
                if (page && page >= 1 && page <= totalPages) {
                    ranges.push([page]);
                }
            }
        }

        return ranges;
    }
});


// PDF Splitter functionality
let selectedFile = null;

document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const splitOptions = document.getElementById('splitOptions');
    const splitMethod = document.getElementById('splitMethod');
    const rangeOptions = document.getElementById('rangeOptions');
    const sizeOptions = document.getElementById('sizeOptions');
    const splitBtn = document.getElementById('splitBtn');
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

    // Split method change
    splitMethod.addEventListener('change', () => {
        if (splitMethod.value === 'size') {
            rangeOptions.style.display = 'none';
            sizeOptions.style.display = 'block';
        } else {
            rangeOptions.style.display = 'block';
            sizeOptions.style.display = 'none';
        }
    });

    // Split button click
    splitBtn.addEventListener('click', splitPDF);

    function handleFile(file) {
        if (!file || file.type !== 'application/pdf') {
            alert('Please select a PDF file.');
            return;
        }

        selectedFile = file;
        splitOptions.style.display = 'block';
        progressArea.style.display = 'none';
    }

    async function splitPDF() {
        if (!selectedFile) {
            alert('Please select a PDF file first.');
            return;
        }

        progressArea.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'Loading PDF...';
        splitBtn.disabled = true;

        try {
            const fileBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(fileBuffer);
            const totalPages = pdfDoc.getPageCount();

            let splitResults = [];

            if (splitMethod.value === 'range') {
                splitResults = await splitByRange(pdfDoc, totalPages);
            } else if (splitMethod.value === 'individual') {
                splitResults = await splitIndividual(pdfDoc, totalPages);
            } else if (splitMethod.value === 'size') {
                splitResults = await splitBySize(pdfDoc, totalPages);
            }

            if (splitResults.length === 1) {
                // Single file, download directly
                const blob = new Blob([splitResults[0].bytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = splitResults[0].filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                // Multiple files, create ZIP
                const zip = new JSZip();
                splitResults.forEach(result => {
                    zip.file(result.filename, result.bytes);
                });

                const zipBlob = await zip.generateAsync({ type: 'blob' });
                saveAs(zipBlob, 'split_pdfs.zip');
            }

            progressFill.style.width = '100%';
            progressText.textContent = 'Download complete!';
            
            // Reset after a delay
            setTimeout(() => {
                progressArea.style.display = 'none';
                splitBtn.disabled = false;
            }, 2000);

        } catch (error) {
            console.error('Error splitting PDF:', error);
            alert('Error splitting PDF. Please try again.');
            progressArea.style.display = 'none';
            splitBtn.disabled = false;
        }
    }

    async function splitByRange(pdfDoc, totalPages) {
        const rangesInput = document.getElementById('pageRanges').value.trim();
        if (!rangesInput) {
            alert('Please enter page ranges.');
            throw new Error('No ranges specified');
        }

        const ranges = parseRanges(rangesInput, totalPages);
        const results = [];

        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];
            progressText.textContent = `Processing part ${i + 1} of ${ranges.length}...`;
            progressFill.style.width = `${(i / ranges.length) * 90}%`;

            const newPdf = await PDFLib.PDFDocument.create();
            const pages = await newPdf.copyPages(pdfDoc, range.map(p => p - 1));
            pages.forEach(page => newPdf.addPage(page));

            const bytes = await newPdf.save();
            const filename = `split_${range[0]}-${range[range.length - 1]}.pdf`;
            results.push({ filename, bytes });
        }

        return results;
    }

    async function splitIndividual(pdfDoc, totalPages) {
        const results = [];

        for (let i = 0; i < totalPages; i++) {
            progressText.textContent = `Extracting page ${i + 1} of ${totalPages}...`;
            progressFill.style.width = `${(i / totalPages) * 90}%`;

            const newPdf = await PDFLib.PDFDocument.create();
            const [page] = await newPdf.copyPages(pdfDoc, [i]);
            newPdf.addPage(page);

            const bytes = await newPdf.save();
            const filename = `page_${i + 1}.pdf`;
            results.push({ filename, bytes });
        }

        return results;
    }

    async function splitBySize(pdfDoc, totalPages) {
        const maxSizeMB = parseFloat(document.getElementById('maxSize').value);
        const maxSizeBytes = maxSizeMB * 1024 * 1024;

        // Estimate page sizes (rough approximation)
        const pageSizes = [];
        for (let i = 0; i < totalPages; i++) {
            const tempPdf = await PDFLib.PDFDocument.create();
            const [page] = await tempPdf.copyPages(pdfDoc, [i]);
            tempPdf.addPage(page);
            const bytes = await tempPdf.save();
            pageSizes.push(bytes.length);
        }

        const results = [];
        let currentPart = [];
        let currentSize = 0;
        let partIndex = 1;

        for (let i = 0; i < totalPages; i++) {
            if (currentSize + pageSizes[i] > maxSizeBytes && currentPart.length > 0) {
                // Create new PDF for current part
                const newPdf = await PDFLib.PDFDocument.create();
                const pages = await newPdf.copyPages(pdfDoc, currentPart);
                pages.forEach(page => newPdf.addPage(page));

                const bytes = await newPdf.save();
                const filename = `part_${partIndex}.pdf`;
                results.push({ filename, bytes });

                currentPart = [];
                currentSize = 0;
                partIndex++;
            }

            currentPart.push(i);
            currentSize += pageSizes[i];

            progressText.textContent = `Processing page ${i + 1} of ${totalPages}...`;
            progressFill.style.width = `${(i / totalPages) * 90}%`;
        }

        // Add remaining pages
        if (currentPart.length > 0) {
            const newPdf = await PDFLib.PDFDocument.create();
            const pages = await newPdf.copyPages(pdfDoc, currentPart);
            pages.forEach(page => newPdf.addPage(page));

            const bytes = await newPdf.save();
            const filename = `part_${partIndex}.pdf`;
            results.push({ filename, bytes });
        }

        return results;
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
                        ranges.push([i]);
                    }
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
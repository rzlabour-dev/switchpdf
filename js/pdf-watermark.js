// PDF Watermark functionality
let selectedFile = null;
let watermarkImageData = null;

document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const watermarkOptions = document.getElementById('watermarkOptions');
    const pageCountSpan = document.getElementById('pageCount');
    const watermarkType = document.getElementById('watermarkType');
    const textOptions = document.getElementById('textOptions');
    const imageOptions = document.getElementById('imageOptions');
    const watermarkImageInput = document.getElementById('watermarkImage');
    const imageOpacity = document.getElementById('imageOpacity');
    const opacityValue = document.getElementById('opacityValue');
    const pageSelection = document.getElementById('pageSelection');
    const rangeInput = document.getElementById('rangeInput');
    const addWatermarkBtn = document.getElementById('addWatermarkBtn');
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

    // Watermark type change
    watermarkType.addEventListener('change', () => {
        textOptions.style.display = watermarkType.value === 'text' ? 'block' : 'none';
        imageOptions.style.display = watermarkType.value === 'image' ? 'block' : 'none';
    });

    // Image opacity change
    imageOpacity.addEventListener('input', () => {
        opacityValue.textContent = Math.round(imageOpacity.value * 100) + '%';
    });

    // Watermark image change
    watermarkImageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            watermarkImageData = await file.arrayBuffer();
        }
    });

    // Page selection change
    pageSelection.addEventListener('change', () => {
        rangeInput.style.display = pageSelection.value === 'range' ? 'block' : 'none';
    });

    // Add watermark button click
    addWatermarkBtn.addEventListener('click', addWatermark);

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
            watermarkOptions.style.display = 'block';
            progressArea.style.display = 'none';
        } catch (error) {
            alert('Error loading PDF. Please try another file.');
        }
    }

    async function addWatermark() {
        if (!selectedFile) {
            alert('Please select a PDF file first.');
            return;
        }

        const type = watermarkType.value;
        if (type === 'text' && !document.getElementById('watermarkText').value.trim()) {
            alert('Please enter watermark text.');
            return;
        }
        if (type === 'image' && !watermarkImageData) {
            alert('Please select a watermark image.');
            return;
        }

        progressArea.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'Loading PDF...';
        addWatermarkBtn.disabled = true;

        try {
            const fileBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(fileBuffer);
            const pageCount = pdfDoc.getPageCount();

            // Determine which pages to watermark
            let pagesToWatermark = [];
            const selectionType = pageSelection.value;

            if (selectionType === 'all') {
                pagesToWatermark = Array.from({ length: pageCount }, (_, i) => i);
            } else if (selectionType === 'first') {
                pagesToWatermark = [0];
            } else if (selectionType === 'range') {
                const rangeInput = document.getElementById('pageRange').value.trim();
                if (!rangeInput) {
                    alert('Please enter a page range.');
                    return;
                }
                pagesToWatermark = parseRanges(rangeInput, pageCount).flat().map(p => p - 1);
            }

            progressText.textContent = 'Adding watermarks...';
            progressFill.style.width = '30%';

            if (type === 'text') {
                await addTextWatermark(pdfDoc, pagesToWatermark);
            } else {
                await addImageWatermark(pdfDoc, pagesToWatermark);
            }

            progressText.textContent = 'Saving watermarked PDF...';
            progressFill.style.width = '90%';

            const watermarkedBytes = await pdfDoc.save();

            // Create download link
            const blob = new Blob([watermarkedBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'watermarked_' + selectedFile.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            progressFill.style.width = '100%';
            progressText.textContent = 'Watermark added successfully!';

            // Reset after a delay
            setTimeout(() => {
                progressArea.style.display = 'none';
                addWatermarkBtn.disabled = false;
            }, 2000);

        } catch (error) {
            console.error('Error adding watermark:', error);
            alert('Error adding watermark. Please try again.');
            progressArea.style.display = 'none';
            addWatermarkBtn.disabled = false;
        }
    }

    async function addTextWatermark(pdfDoc, pagesToWatermark) {
        const text = document.getElementById('watermarkText').value;
        const color = document.getElementById('textColor').value;
        const fontSize = parseInt(document.getElementById('fontSize').value);
        const position = document.getElementById('position').value;

        // Convert hex color to RGB
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        for (const pageIndex of pagesToWatermark) {
            const page = pdfDoc.getPage(pageIndex);
            const { width, height } = page.getSize();

            // Add text watermark
            page.drawText(text, {
                x: getXPosition(position, width, text.length * fontSize * 0.6),
                y: getYPosition(position, height, fontSize),
                size: fontSize,
                color: PDFLib.rgb(r / 255, g / 255, b / 255),
                opacity: 0.5,
                rotate: position === 'diagonal' ? PDFLib.degrees(-45) : PDFLib.degrees(0),
            });
        }
    }

    async function addImageWatermark(pdfDoc, pagesToWatermark) {
        const opacity = parseFloat(document.getElementById('imageOpacity').value);
        const position = document.getElementById('position').value;

        // Embed the watermark image
        const watermarkImage = await pdfDoc.embedPng(watermarkImageData) ||
                               await pdfDoc.embedJpg(watermarkImageData);

        for (const pageIndex of pagesToWatermark) {
            const page = pdfDoc.getPage(pageIndex);
            const { width, height } = page.getSize();

            const imgWidth = watermarkImage.width;
            const imgHeight = watermarkImage.height;

            // Scale image to fit page (max 30% of page size)
            const scale = Math.min(width * 0.3 / imgWidth, height * 0.3 / imgHeight, 1);
            const scaledWidth = imgWidth * scale;
            const scaledHeight = imgHeight * scale;

            page.drawImage(watermarkImage, {
                x: getXPosition(position, width, scaledWidth),
                y: getYPosition(position, height, scaledHeight),
                width: scaledWidth,
                height: scaledHeight,
                opacity: opacity,
                rotate: position === 'diagonal' ? PDFLib.degrees(-45) : PDFLib.degrees(0),
            });
        }
    }

    function getXPosition(position, pageWidth, elementWidth) {
        switch (position) {
            case 'center':
            case 'diagonal':
                return (pageWidth - elementWidth) / 2;
            case 'top-left':
            case 'bottom-left':
                return 50;
            case 'top-right':
            case 'bottom-right':
                return pageWidth - elementWidth - 50;
            default:
                return (pageWidth - elementWidth) / 2;
        }
    }

    function getYPosition(position, pageHeight, elementHeight) {
        switch (position) {
            case 'center':
                return (pageHeight - elementHeight) / 2;
            case 'diagonal':
                return pageHeight / 2;
            case 'top-left':
            case 'top-right':
                return pageHeight - elementHeight - 50;
            case 'bottom-left':
            case 'bottom-right':
                return 50;
            default:
                return (pageHeight - elementHeight) / 2;
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
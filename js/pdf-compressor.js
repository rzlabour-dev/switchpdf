// PDF Compressor functionality
let selectedFile = null;
let originalSize = 0;

document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const uploadCta = document.getElementById('uploadCta');
    const compressOptions = document.getElementById('compressOptions');
    const originalSizeSpan = document.getElementById('originalSize');
    const pageCountSpan = document.getElementById('pageCount');
    const compressBtn = document.getElementById('compressBtn');
    const progressArea = document.getElementById('progressArea');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const compressionResults = document.getElementById('compressionResults');

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

    // Compress button click
    compressBtn.addEventListener('click', compressPDF);

    async function handleFile(file) {
        if (!file || file.type !== 'application/pdf') {
            alert('Please select a PDF file.');
            return;
        }

        selectedFile = file;
        originalSize = file.size;

        try {
            const fileBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(fileBuffer);
            const pageCount = pdfDoc.getPageCount();

            originalSizeSpan.textContent = formatFileSize(originalSize);
            pageCountSpan.textContent = pageCount;

            compressOptions.style.display = 'block';
            progressArea.style.display = 'none';
            compressionResults.style.display = 'none';
        } catch (error) {
            alert('Error loading PDF. Please try another file.');
        }
    }

    async function compressPDF() {
        if (!selectedFile) {
            alert('Please select a PDF file first.');
            return;
        }

        progressArea.style.display = 'block';
        compressionResults.style.display = 'none';
        progressFill.style.width = '0%';
        progressText.textContent = 'Loading PDF...';
        compressBtn.disabled = true;

        try {
            const fileBuffer = await selectedFile.arrayBuffer();
            let pdfDoc = await PDFLib.PDFDocument.load(fileBuffer);
            const pageCount = pdfDoc.getPageCount();

            progressText.textContent = 'Analyzing content...';
            progressFill.style.width = '20%';

            let compressionLevel = document.getElementById('compressionLevel').value;
            let imageQuality = document.getElementById('imageQuality').value === 'high' ? 0.9 :
                document.getElementById('imageQuality').value === 'medium' ? 0.75 : 0.6;

            // Get custom target size if provided
            const targetSizeInput = document.getElementById('targetSize');
            const targetSizeUnit = document.getElementById('targetSizeUnit');
            let targetBytes = null;
            if (targetSizeInput && targetSizeInput.value) {
                let val = parseFloat(targetSizeInput.value);
                if (!isNaN(val) && val > 0) {
                    targetBytes = targetSizeUnit.value === 'MB' ? val * 1024 * 1024 : val * 1024;
                }
            }

            // Process each page
            for (let i = 0; i < pageCount; i++) {
                progressText.textContent = `Compressing page ${i + 1} of ${pageCount}...`;
                progressFill.style.width = `${20 + (i / pageCount) * 60}%`;

                const page = pdfDoc.getPage(i);
                const { width, height } = page.getSize();

                // If compression level is high, try to reduce page size
                if (compressionLevel === 'high') {
                    // Scale down if page is very large
                    if (width > 1000 || height > 1000) {
                        const scale = Math.min(1000 / width, 1000 / height, 1);
                        page.scaleContent(scale, scale);
                    }
                }
            }

            progressText.textContent = 'Finalizing compression...';
            progressFill.style.width = '90%';

            let compressedBytes = await pdfDoc.save({
                useObjectStreams: compressionLevel !== 'low',
                addDefaultPage: false,
                objectsPerTick: compressionLevel === 'high' ? 50 : 100
            });

            // If target size is set, try to adjust quality/compression to reach it
            if (targetBytes) {
                let attempts = 0;
                let minQuality = 0.3;
                let maxAttempts = 8;
                while (compressedBytes.length > targetBytes && imageQuality > minQuality && attempts < maxAttempts) {
                    imageQuality -= 0.1;
                    if (imageQuality < minQuality) imageQuality = minQuality;
                    // Re-load and re-compress
                    pdfDoc = await PDFLib.PDFDocument.load(fileBuffer);
                    for (let i = 0; i < pageCount; i++) {
                        const page = pdfDoc.getPage(i);
                        const { width, height } = page.getSize();
                        if (compressionLevel === 'high') {
                            if (width > 1000 || height > 1000) {
                                const scale = Math.min(1000 / width, 1000 / height, 1);
                                page.scaleContent(scale, scale);
                            }
                        }
                    }
                    compressedBytes = await pdfDoc.save({
                        useObjectStreams: compressionLevel !== 'low',
                        addDefaultPage: false,
                        objectsPerTick: compressionLevel === 'high' ? 50 : 100
                    });
                    attempts++;
                }
            }

            // Create download link
            const blob = new Blob([compressedBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'compressed_' + selectedFile.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Show results
            const compressedSize = compressedBytes.length;
            const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

            document.getElementById('resultOriginal').textContent = formatFileSize(originalSize);
            document.getElementById('resultCompressed').textContent = formatFileSize(compressedSize);
            document.getElementById('resultReduction').textContent = reduction + '%';

            compressionResults.style.display = 'block';
            progressFill.style.width = '100%';
            progressText.textContent = 'Compression complete!';

            // Reset after a delay
            setTimeout(() => {
                progressArea.style.display = 'none';
                compressBtn.disabled = false;
            }, 3000);

        } catch (error) {
            console.error('Error compressing PDF:', error);
            alert('Error compressing PDF. Please try again.');
            progressArea.style.display = 'none';
            compressBtn.disabled = false;
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});


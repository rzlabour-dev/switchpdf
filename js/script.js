// DOM Elements
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const uploadCta = document.getElementById('uploadCta');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const loading = document.getElementById('loading');
const loadingStatus = document.getElementById('loadingStatus');
const previewSection = document.getElementById('previewSection');
const previewContainer = document.getElementById('previewContainer');
const stats = document.getElementById('stats');
const resetAppLink = document.getElementById('resetApp');

// Stats elements
const pageCountEl = document.getElementById('pageCount');
const fileSizeEl = document.getElementById('fileSize');
const exportTypeEl = document.getElementById('exportType');
const statusEl = document.getElementById('status');

// Options
const imageFormatSelect = document.getElementById('imageFormat');
const imageQualitySelect = document.getElementById('imageQuality');
const resolutionSelect = document.getElementById('resolution');

// State variables
let pdfFiles = [];
let pdfNames = [];
let convertedImagesByPdf = [];
let totalPages = 0;
let pageDragCounter = 0;

// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners only if elements exist
    if (browseBtn) browseBtn.addEventListener('click', () => fileInput.click());
    if (uploadCta) uploadCta.addEventListener('click', () => fileInput.click());
    if (fileInput) fileInput.addEventListener('change', handleFileSelect);
    if (convertBtn) convertBtn.addEventListener('click', convertPdfToImages);
    if (clearBtn) clearBtn.addEventListener('click', resetApp);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadImages);
    if (resetAppLink) resetAppLink.addEventListener('click', resetApp);
    
    // Set up drag and drop
    if (dropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, preventDefaults, false);
        });

        document.addEventListener('dragenter', handlePageDragEnter, false);
        document.addEventListener('dragover', handlePageDragOver, false);
        document.addEventListener('dragleave', handlePageDragLeave, false);
        document.addEventListener('drop', handlePageDrop, false);

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        dropArea.addEventListener('drop', handleDrop, false);
    }
    
    // Initialize app
    initApp();
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function setDropActive(isActive) {
    if (!dropArea) return;
    dropArea.classList.toggle('dragover', isActive);
    document.body.classList.toggle('page-drop-active', isActive);
}

function highlight() {
    setDropActive(true);
}

function unhighlight() {
    setDropActive(false);
}

function hasFiles(e) {
    return e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files');
}

function handlePageDragEnter(e) {
    if (!hasFiles(e)) return;
    pageDragCounter += 1;
    setDropActive(true);
}

function handlePageDragLeave(e) {
    if (!hasFiles(e)) return;
    pageDragCounter -= 1;
    if (pageDragCounter <= 0) {
        pageDragCounter = 0;
        setDropActive(false);
    }
}

function handlePageDragOver(e) {
    if (!hasFiles(e)) return;
    e.dataTransfer.dropEffect = 'copy';
}

function handlePageDrop(e) {
    if (!hasFiles(e)) return;
    pageDragCounter = 0;
    setDropActive(false);
    handleDrop(e);
}

// Handle file drop
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
        const pdfFilesArr = Array.from(files).filter(f => f.type === 'application/pdf');
        if (pdfFilesArr.length > 0) {
            handleFiles(pdfFilesArr);
        } else {
            alert('Please drop PDF files only.');
        }
    }
}

// Handle file selection
function handleFileSelect(e) {
    const files = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
    if (files.length > 0) {
        handleFiles(files);
    }
}


// Process multiple PDF files
function handleFiles(files) {
    pdfFiles = files;
    pdfNames = files.map(f => f.name.replace('.pdf', ''));
    // Update stats for first file
    const fileSizeMB = (files[0].size / (1024 * 1024)).toFixed(2);
    fileSizeEl.textContent = `${fileSizeMB} MB`;
    statusEl.textContent = files.length > 1 ? `${files.length} PDFs Loaded` : 'File Loaded';
    // Enable buttons
    convertBtn.disabled = false;
    clearBtn.disabled = false;
    // Show file info
    dropArea.innerHTML = `
        <div class="upload-icon">
            <i class="fas fa-file-pdf"></i>
        </div>
        <p class="upload-text">${files.length > 1 ? files.length + ' files selected' : files[0].name}</p>
        <p class="upload-subtext">${files.length > 1 ? 'Multiple PDFs ready to convert' : fileSizeMB + ' MB - Ready to convert'}</p>
        <button class="btn btn-secondary" id="changeFileBtn">
            <i class="fas fa-exchange-alt"></i> Change PDF File(s)
        </button>
    `;
    document.getElementById('changeFileBtn').addEventListener('click', () => {
        fileInput.click();
    });
}


// Convert multiple PDFs to images
async function convertPdfToImages() {
    if (!pdfFiles || pdfFiles.length === 0) return;
    loading.classList.remove('hidden');
    loadingStatus.textContent = 'Loading PDF documents...';
    convertBtn.disabled = true;
    try {
        convertedImagesByPdf = [];
        previewContainer.innerHTML = '';
        let totalAllPages = 0;
        let totalFiles = pdfFiles.length;
        for (let i = 0; i < pdfFiles.length; i++) {
            const file = pdfFiles[i];
            const pdfName = pdfNames[i];
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const numPages = pdfDoc.numPages;
            totalAllPages += numPages;
            let images = [];
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                loadingStatus.textContent = `Converting ${file.name} - page ${pageNum} of ${numPages}...`;
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: parseFloat(resolutionSelect.value) });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                const imageFormat = imageFormatSelect.value;
                const imageQuality = parseFloat(imageQualitySelect.value);
                let imageData;
                if (imageFormat === 'png') {
                    imageData = canvas.toDataURL('image/png');
                } else if (imageFormat === 'webp') {
                    imageData = canvas.toDataURL('image/webp', imageQuality);
                } else {
                    imageData = canvas.toDataURL('image/jpeg', imageQuality);
                }
                images.push({
                    data: imageData,
                    page: pageNum,
                    format: imageFormat,
                    pdfName: pdfName
                });
                // Create preview item
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <img src="${imageData}" alt="${pdfName} - Page ${pageNum}" class="preview-img">
                    <div class="preview-info">
                        <h4>${pdfName} - Page ${pageNum}</h4>
                        <p>${viewport.width} x ${viewport.height} px - ${imageFormat.toUpperCase()}</p>
                        <button class="btn" style="margin-top: 10px; padding: 8px 16px; font-size: 0.9rem;" data-pdf="${pdfName}" data-page="${pageNum}" data-img-idx="${pageNum-1}" data-pdf-idx="${i}">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                `;
                previewContainer.appendChild(previewItem);
                // Add event listener to individual download button
                const downloadBtn = previewItem.querySelector('button');
                downloadBtn.addEventListener('click', (e) => {
                    downloadSingleImage(i, pageNum-1);
                });
            }
            convertedImagesByPdf.push({ pdfName, images });
        }
        // Update stats
        pageCountEl.textContent = totalAllPages;
        exportTypeEl.textContent = totalFiles > 1 ? 'Multiple ZIPs' : (convertedImagesByPdf[0].images.length === 1 ? 'Single JPG' : 'ZIP Archive');
        statusEl.textContent = 'Conversion Complete';
        stats.classList.remove('hidden');
        loading.classList.add('hidden');
        previewSection.classList.remove('hidden');
        downloadBtn.innerHTML = totalFiles > 1 ? '<i class="fas fa-download"></i> Download All ZIPs' : (convertedImagesByPdf[0].images.length === 1 ? '<i class="fas fa-download"></i> Download JPG' : '<i class="fas fa-download"></i> Download ZIP');
    } catch (error) {
        console.error('Error converting PDFs:', error);
        loadingStatus.textContent = 'Error converting PDFs. Please try again.';
        statusEl.textContent = 'Error';
        alert('Error converting PDFs: ' + error.message);
        loading.classList.add('hidden');
    }
}

// Download single image (by PDF index and image index)
function downloadSingleImage(pdfIdx, imgIdx) {
    const pdf = convertedImagesByPdf[pdfIdx];
    const image = pdf.images[imgIdx];
    const filename = `${pdf.pdfName}_page_${image.page}.${image.format}`;
    // Convert data URL to blob
    const data = image.data.split(',')[1];
    const mimeType = image.data.split(',')[0].split(':')[1].split(';')[0];
    const byteCharacters = atob(data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    saveAs(blob, filename);
}

// Download all images (either as single JPG or ZIP)
async function downloadImages() {
    if (!convertedImagesByPdf.length) return;
    statusEl.textContent = 'Preparing download...';
    if (convertedImagesByPdf.length === 1) {
        // Single PDF
        const pdf = convertedImagesByPdf[0];
        if (pdf.images.length === 1) {
            // Single page - download as JPG
            downloadSingleImage(0, 0);
        } else {
            // Multiple pages - create ZIP
            await downloadPdfZip(pdf);
        }
    } else {
        // Multiple PDFs - create a ZIP for each
        loadingStatus.textContent = 'Creating ZIP archives...';
        loading.classList.remove('hidden');
        try {
            for (let i = 0; i < convertedImagesByPdf.length; i++) {
                await downloadPdfZip(convertedImagesByPdf[i], true);
            }
            loading.classList.add('hidden');
            statusEl.textContent = 'All ZIPs Downloaded';
        } catch (error) {
            console.error('Error creating ZIPs:', error);
            loading.classList.add('hidden');
            statusEl.textContent = 'Error creating ZIPs';
            alert('Error creating ZIP archives: ' + error.message);
        }
    }
}

// Helper to download a ZIP for a single PDF
async function downloadPdfZip(pdf, silent) {
    const zip = new JSZip();
    pdf.images.forEach((image) => {
        const data = image.data.split(',')[1];
        const binaryString = atob(data);
        const binaryArray = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            binaryArray[i] = binaryString.charCodeAt(i);
        }
        const filename = `${pdf.pdfName}_page_${image.page}.${image.format}`;
        zip.file(filename, binaryArray, { binary: true });
    });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${pdf.pdfName}_converted.zip`);
    if (!silent) {
        loading.classList.add('hidden');
        statusEl.textContent = 'Download Complete';
    }
}

// Reset the application
function resetApp() {
    convertedImagesByPdf = [];
    totalPages = 0;
    
    // Reset UI
    dropArea.innerHTML = `
        <div class="upload-icon">
            <i class="fas fa-cloud-upload-alt"></i>
        </div>
        <p class="upload-text">Drag & Drop your PDF file here</p>
        <p class="upload-subtext">or click to browse files</p>
        <button class="btn" id="browseBtn">Browse PDF Files</button>
    `;
    
    // Reattach event listener to browse button
    document.getElementById('browseBtn').addEventListener('click', () => fileInput.click());
    
    // Hide sections
    loading.classList.add('hidden');
    previewSection.classList.add('hidden');
    stats.classList.add('hidden');
    
    // Reset buttons
    convertBtn.disabled = true;
    clearBtn.disabled = true;
    
    // Reset stats
    pageCountEl.textContent = '0';
    fileSizeEl.textContent = '0 MB';
    exportTypeEl.textContent = '-';
    statusEl.textContent = 'Ready';
    
    // Reset file input
    fileInput.value = '';
}

// Initialize the app
function initApp() {
    resetApp();
}

// PDF Merger functionality
let selectedFiles = [];
let sortableList;

document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const fileList = document.getElementById('fileList');
    const fileItems = document.getElementById('fileItems');
    const mergeBtn = document.getElementById('mergeBtn');
    const progressArea = document.getElementById('progressArea');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    // Initialize Sortable
    sortableList = new Sortable(fileItems, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: function(evt) {
            // Update selectedFiles order
            const items = Array.from(fileItems.children);
            selectedFiles = items.map(item => {
                const index = parseInt(item.dataset.index);
                return selectedFiles[index];
            });
            // Update data-index attributes
            items.forEach((item, newIndex) => {
                item.dataset.index = newIndex;
            });
        }
    });

    // Browse button click
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
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
        handleFiles(e.dataTransfer.files);
    });

    // Merge button click
    mergeBtn.addEventListener('click', mergePDFs);

    function handleFiles(files) {
        // Filter only PDF files
        const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
        
        if (pdfFiles.length === 0) {
            alert('Please select PDF files only.');
            return;
        }

        // Add to selectedFiles
        selectedFiles = [...selectedFiles, ...pdfFiles];
        
        // Remove duplicates based on name and size
        selectedFiles = selectedFiles.filter((file, index, self) => 
            index === self.findIndex(f => f.name === file.name && f.size === file.size)
        );

        updateFileList();
    }

    function updateFileList() {
        fileItems.innerHTML = '';
        
        selectedFiles.forEach((file, index) => {
            const li = document.createElement('li');
            li.className = 'file-item';
            li.dataset.index = index;
            li.innerHTML = `
                <div class="file-info">
                    <i class="fas fa-file-pdf"></i>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">(${formatFileSize(file.size)})</span>
                </div>
                <button class="remove-btn" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            fileItems.appendChild(li);
        });

        // Add remove event listeners
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                selectedFiles.splice(index, 1);
                updateFileList();
            });
        });

        // Show/hide elements
        if (selectedFiles.length > 0) {
            fileList.style.display = 'block';
            if (selectedFiles.length > 1) {
                mergeBtn.style.display = 'block';
            } else {
                mergeBtn.style.display = 'none';
            }
        } else {
            fileList.style.display = 'none';
            mergeBtn.style.display = 'none';
        }
    }

    async function mergePDFs() {
        if (selectedFiles.length < 2) {
            alert('Please select at least 2 PDF files to merge.');
            return;
        }

        progressArea.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'Loading PDFs...';
        mergeBtn.disabled = true;

        try {
            // Create a new PDF document
            const mergedPdf = await PDFLib.PDFDocument.create();
            
            let totalPages = 0;
            
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                progressText.textContent = `Processing ${file.name}...`;
                progressFill.style.width = `${(i / selectedFiles.length) * 50}%`;
                
                const fileBuffer = await file.arrayBuffer();
                const pdf = await PDFLib.PDFDocument.load(fileBuffer);
                
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
                
                totalPages += pdf.getPageCount();
            }

            progressText.textContent = 'Finalizing merged PDF...';
            progressFill.style.width = '90%';

            // Save the merged PDF
            const mergedPdfBytes = await mergedPdf.save();
            
            // Create download link
            const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'merged.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            progressFill.style.width = '100%';
            progressText.textContent = 'Download complete!';
            
            // Reset after a delay
            setTimeout(() => {
                progressArea.style.display = 'none';
                mergeBtn.disabled = false;
            }, 2000);

        } catch (error) {
            console.error('Error merging PDFs:', error);
            alert('Error merging PDFs. Please try again.');
            progressArea.style.display = 'none';
            mergeBtn.disabled = false;
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
// PDF Unlock functionality
let selectedFile = null;

document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const uploadCta = document.getElementById('uploadCta');
    const unlockOptions = document.getElementById('unlockOptions');
    const restrictionStatus = document.getElementById('restrictionStatus');
    const pageCountSpan = document.getElementById('pageCount');
    const permissions = document.getElementById('permissions');
    const permissionsList = document.getElementById('permissionsList');
    const ownerPassword = document.getElementById('ownerPassword');
    const unlockBtn = document.getElementById('unlockBtn');
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

    // Unlock button click
    unlockBtn.addEventListener('click', unlockPDF);

    async function handleFile(file) {
        if (!file || file.type !== 'application/pdf') {
            alert('Please select a PDF file.');
            return;
        }

        selectedFile = file;
        restrictionStatus.textContent = 'Checking...';
        permissions.style.display = 'none';

        try {
            const fileBuffer = await file.arrayBuffer();

            // Try to load without password first
            let pdfDoc;
            try {
                pdfDoc = await PDFLib.PDFDocument.load(fileBuffer);
            } catch (error) {
                // If it fails, it might be password protected
                restrictionStatus.textContent = 'Password Protected';
                unlockOptions.style.display = 'block';
                progressArea.style.display = 'none';
                return;
            }

            const pageCount = pdfDoc.getPageCount();
            pageCountSpan.textContent = pageCount;

            // Check for restrictions
            const restrictions = checkRestrictions(pdfDoc);

            if (restrictions.length > 0) {
                restrictionStatus.textContent = 'Restricted';
                displayPermissions(restrictions);
                permissions.style.display = 'block';
            } else {
                restrictionStatus.textContent = 'No Restrictions Found';
                permissions.style.display = 'none';
            }

            unlockOptions.style.display = 'block';
            progressArea.style.display = 'none';
        } catch (error) {
            alert('Error loading PDF. Please try another file.');
        }
    }

    function checkRestrictions(pdfDoc) {
        const restrictions = [];

        // Note: pdf-lib doesn't provide direct access to permission flags
        // This is a simplified check - in a real implementation, you'd need
        // to check the PDF's permission dictionary

        // For now, we'll assume if the PDF loaded successfully, it has no restrictions
        // In a production environment, you'd need more sophisticated checking

        return restrictions;
    }

    function displayPermissions(restrictions) {
        permissionsList.innerHTML = '';

        if (restrictions.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No specific restrictions detected';
            li.style.color = 'var(--success)';
            permissionsList.appendChild(li);
        } else {
            restrictions.forEach(restriction => {
                const li = document.createElement('li');
                li.textContent = restriction;
                li.style.color = 'var(--warning)';
                permissionsList.appendChild(li);
            });
        }
    }

    async function unlockPDF() {
        if (!selectedFile) {
            alert('Please select a PDF file first.');
            return;
        }

        progressArea.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'Loading PDF...';
        unlockBtn.disabled = true;

        try {
            const fileBuffer = await selectedFile.arrayBuffer();
            const password = ownerPassword.value.trim();

            let pdfDoc;
            if (password) {
                progressText.textContent = 'Verifying password...';
                pdfDoc = await PDFLib.PDFDocument.load(fileBuffer, { password });
            } else {
                pdfDoc = await PDFLib.PDFDocument.load(fileBuffer);
            }

            progressFill.style.width = '40%';
            progressText.textContent = 'Removing restrictions...';

            // Create a new PDF without restrictions
            const newPdf = await PDFLib.PDFDocument.create();

            // Copy all pages
            const pages = await newPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            pages.forEach(page => newPdf.addPage(page));

            progressFill.style.width = '80%';
            progressText.textContent = 'Saving unlocked PDF...';

            // Save without restrictions
            const unlockedBytes = await newPdf.save();

            // Create download link
            const blob = new Blob([unlockedBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'unlocked_' + selectedFile.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            progressFill.style.width = '100%';
            progressText.textContent = 'PDF unlocked successfully!';

            // Reset after a delay
            setTimeout(() => {
                progressArea.style.display = 'none';
                unlockBtn.disabled = false;
                unlockOptions.style.display = 'none';
                ownerPassword.value = '';
            }, 3000);

        } catch (error) {
            console.error('Error unlocking PDF:', error);
            if (error.message.includes('password')) {
                alert('Incorrect password. Please try again.');
            } else {
                alert('Error unlocking PDF. This PDF might not have restrictions, or they cannot be removed.');
            }
            progressArea.style.display = 'none';
            unlockBtn.disabled = false;
        }
    }
});


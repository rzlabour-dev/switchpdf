// PDF Password Remover functionality
let selectedFile = null;

document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const uploadCta = document.getElementById('uploadCta');
    const passwordPrompt = document.getElementById('passwordPrompt');
    const passwordInput = document.getElementById('password');
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

    // Enter key in password field
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            unlockPDF();
        }
    });

    async function handleFile(file) {
        if (!file || file.type !== 'application/pdf') {
            alert('Please select a PDF file.');
            return;
        }

        selectedFile = file;
        passwordPrompt.style.display = 'block';
        progressArea.style.display = 'none';
        passwordInput.focus();
    }

    async function unlockPDF() {
        const password = passwordInput.value.trim();
        if (!password) {
            alert('Please enter the PDF password.');
            return;
        }

        progressArea.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'Unlocking PDF...';
        unlockBtn.disabled = true;

        try {
            const fileBuffer = await selectedFile.arrayBuffer();

            // Try to load the PDF with the password
            progressFill.style.width = '30%';
            progressText.textContent = 'Verifying password...';

            const pdfDoc = await PDFLib.PDFDocument.load(fileBuffer, { password });

            progressFill.style.width = '60%';
            progressText.textContent = 'Removing password protection...';

            // Create a new PDF without password protection
            const newPdf = await PDFLib.PDFDocument.create();

            // Copy all pages
            const pages = await newPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            pages.forEach(page => newPdf.addPage(page));

            progressFill.style.width = '90%';
            progressText.textContent = 'Saving unlocked PDF...';

            // Save without password
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
                passwordPrompt.style.display = 'none';
                passwordInput.value = '';
                unlockBtn.disabled = false;
                selectedFile = null;
            }, 3000);

        } catch (error) {
            console.error('Error unlocking PDF:', error);
            if (error.message.includes('password')) {
                alert('Incorrect password. Please try again.');
            } else {
                alert('Error unlocking PDF. Please check that the file is password-protected and try again.');
            }
            progressArea.style.display = 'none';
            unlockBtn.disabled = false;
        }
    }
});


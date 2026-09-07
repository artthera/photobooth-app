/**
 * Photobooth Pro - Utility Functions & Security Sanitizers
 */
window.PhotoboothUtils = (function(){

  /**
   * Escape HTML to prevent XSS attacks
   */
  function sanitizeText(str){
    if(typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Validate image file (PNG / JPEG) and size limit
   */
  function validateImageFile(file, maxMb = 15, expectedType = 'image/png'){
    if(!file) return { valid: false, message: 'Tidak ada file yang dipilih.' };

    if(expectedType && file.type !== expectedType && !file.type.startsWith('image/')){
      return { valid: false, message: `Format file harus ${expectedType}.` };
    }

    const maxBytes = maxMb * 1024 * 1024;
    if(file.size > maxBytes){
      return { valid: false, message: `Ukuran file melebihi batas maksimal ${maxMb}MB.` };
    }

    return { valid: true };
  }

  /**
   * Generate Secure Unique Session ID
   */
  function generateSessionId(){
    const randomPart = Math.random().toString(36).substring(2, 7);
    const timePart = Date.now().toString(36);
    return `pb_${randomPart}_${timePart}`;
  }

  /**
   * Native Blob / Fetch Download Helper
   * Automatically downloads directly on iOS Safari & Android Chrome without redirecting
   */
  async function handleDownload(url, filename){
    try{
      // If data URL
      if(url.startsWith('data:')){
        const arr = url.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--){ u8arr[n] = bstr.charCodeAt(n); }
        const blob = new Blob([u8arr], { type: mime });
        triggerBlobDownload(blob, filename);
        return;
      }

      // If remote URL
      const res = await fetch(url, { mode: 'cors' });
      if(!res.ok) throw new Error('Fetch failed: ' + res.statusText);
      const blob = await res.blob();
      triggerBlobDownload(blob, filename);
    }catch(err){
      console.warn('[DownloadHelper] Fallback to anchor click:', err);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }

  function triggerBlobDownload(blob, filename){
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup blob memory immediately after triggering
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
      a.remove();
    }, 1500);
  }

  /**
   * Format date for display
   */
  function formatDate(timestamp){
    return new Date(timestamp || Date.now()).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  return {
    sanitizeText,
    validateImageFile,
    generateSessionId,
    handleDownload,
    triggerBlobDownload,
    formatDate
  };
})();

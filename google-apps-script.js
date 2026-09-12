/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT - PHOTOBOOTH GOOGLE DRIVE AUTO UPLOADER
 * ==============================================================================
 * 
 * PANDUAN CARA PASANG (100% GRATIS):
 * 1. Buka https://script.google.com/ di browser Anda.
 * 2. Klik tombol "New project" (Proyek baru).
 * 3. Hapus semua kode default yang ada di editor, lalu paste SEMUA kode di bawah ini.
 * 4. (Opsional) Jika ingin memasukkan semua foto ke dalam 1 folder induk tertentu:
 *    Isi variabel PARENT_FOLDER_ID di bawah dengan ID Folder Google Drive Anda.
 *    (Jika dibiarkan kosong '', folder sesi akan otomatis dibuat di Google Drive utama Anda).
 * 5. Klik tombol "Deploy" (Terapkan) di pojok kanan atas -> Pilih "New deployment" (Penerapan baru).
 * 6. Klik ikon Gear (roda gigi) di sebelah kiri -> Pilih "Web app" (Aplikasi web).
 * 7. Konfigurasi:
 *    - Description: Photobooth Uploader
 *    - Execute as: Me (email google Anda)
 *    - Who has access: Anyone (Siapa saja)  <--- PENTING! Agar photobooth bisa kirim data tanpa login
 * 8. Klik "Deploy" -> Klik "Authorize access" (Izinkan akses akun Google Anda).
 * 9. Salin "Web app URL" (contoh: https://script.google.com/macros/s/AKfycb.../exec).
 * 10. Paste URL tersebut ke pengaturan Google Drive di aplikasi Photobooth Anda!
 * ==============================================================================
 */

// Ganti dengan ID Folder Induk jika ada, atau biarkan kosong '' untuk simpan di Drive Utama
const PARENT_FOLDER_ID = '';

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ success: false, message: 'Tidak ada data yang dikirim.' });
    }

    const data = JSON.parse(e.postData.contents);
    const sessionName = data.sessionName || ('Photobooth_' + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd_HHmmss"));

    // 1. Dapatkan atau Buat Folder Induk
    let parentFolder = DriveApp.getRootFolder();
    if (PARENT_FOLDER_ID && PARENT_FOLDER_ID.trim() !== '') {
      try {
        parentFolder = DriveApp.getFolderById(PARENT_FOLDER_ID.trim());
      } catch (err) {
        parentFolder = DriveApp.getRootFolder();
      }
    }

    // 2. Buat atau Dapatkan Folder Tanggal Hari Ini
    const dateFolderName = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
    let dateFolder;
    const dateFolderIterator = parentFolder.getFoldersByName(dateFolderName);
    if (dateFolderIterator.hasNext()) {
      dateFolder = dateFolderIterator.next();
    } else {
      dateFolder = parentFolder.createFolder(dateFolderName);
    }

    // 3. Buat Subfolder Khusus Sesi Ini di dalam Folder Tanggal
    const sessionFolder = dateFolder.createFolder(sessionName);
    
    // Set agar siapa saja yang punya link bisa melihat & download foto
    sessionFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // 4. Simpan File-file yang Dikirim
    // A. Foto Strip JPG
    if (data.stripJpgBase64) {
      saveBase64File(sessionFolder, data.stripJpgBase64, 'Foto_Strip.jpg', 'image/jpeg');
    }

    // B. Foto Strip PNG (Kualitas Penuh)
    if (data.stripPngBase64) {
      saveBase64File(sessionFolder, data.stripPngBase64, 'Foto_Strip_HD.png', 'image/png');
    }

    // C. Animasi GIF
    if (data.gifBase64) {
      saveBase64File(sessionFolder, data.gifBase64, 'Animasi_Photobooth.gif', 'image/gif');
    }

    // D. Foto Original Shots (Jika ada)
    if (data.rawShots && Array.isArray(data.rawShots)) {
      data.rawShots.forEach((shotBase64, index) => {
        saveBase64File(sessionFolder, shotBase64, 'Pose_' + (index + 1) + '.jpg', 'image/jpeg');
      });
    }

    const folderUrl = sessionFolder.getUrl();
    const folderId = sessionFolder.getId();

    return responseJSON({
      success: true,
      folderUrl: folderUrl,
      folderId: folderId,
      sessionName: sessionName
    });

  } catch (error) {
    return responseJSON({
      success: false,
      error: error.toString()
    });
  }
}

function doGet(e) {
  return responseJSON({
    status: 'online',
    message: 'Google Apps Script Photobooth Endpoint Aktif & Siap Menerima Data!'
  });
}

/**
 * Helper untuk decode base64 dan simpan ke folder Google Drive
 */
function saveBase64File(folder, base64Data, fileName, mimeType) {
  try {
    let cleanBase64 = base64Data;
    if (cleanBase64.indexOf('base64,') > -1) {
      cleanBase64 = cleanBase64.split('base64,')[1];
    }
    const decodedBytes = Utilities.base64Decode(cleanBase64);
    const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
    return folder.createFile(blob);
  } catch (e) {
    Logger.log('Gagal menyimpan ' + fileName + ': ' + e.message);
    return null;
  }
}

/**
 * Helper untuk response JSON
 */
function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

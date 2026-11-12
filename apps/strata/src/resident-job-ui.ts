const messages:Record<string,string>={
 'authority-changed':'Izin atau konteks tugas berubah. Periksa keanggotaan, mandat dan sumber sebelum membuat tugas baru.',
 'gateway-unconfigured':'Gerbang model belum siap. Pengelola perlu memeriksa konfigurasi layanan.',
 'gateway-input':'Gerbang model menolak format atau ukuran percakapan. Ini perlu diperiksa oleh pengelola.',
 'provider-quota':'Kuota penyedia model sedang tercapai. Tugas tidak dikirim ulang otomatis.',
 'provider-unavailable':'Penyedia model menolak atau belum dapat melayani permintaan ini.',
 'provider-transport':'Permintaan ke penyedia model terputus atau melewati batas waktu. Periksa hasil sebelum membuat tugas baru.',
 'provider-output':'Jawaban penyedia model tidak memenuhi format keluaran yang dibutuhkan.',
 'runtime-budget':'Tugas berhenti pada batas waktu, konteks atau langkah yang diizinkan.',
 'runtime-abstained':'Aksara memilih tidak membuat keluaran dari bahan yang ada.',
 'runtime-unavailable':'Runtime Aksara belum dapat menyelesaikan tugas ini. Status tersimpan; tidak ada pengiriman ulang otomatis.',
 'runtime-input':'Runtime menolak format masukan tugas.',
 'runtime-protocol':'Percakapan alat berubah atau tidak dapat dilanjutkan dengan aman.',
}
export function residentJobMessage(error:string){
 if(error.startsWith('resident:'))return messages[error.slice(9)]??messages['runtime-unavailable']
 if(error==='Model unavailable or invalid output; a new job requires an explicit request')return messages['runtime-unavailable']
 return error
}

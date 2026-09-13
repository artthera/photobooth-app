// Statistics Dashboard Logic

async function fetchAndRenderStats() {
    if (!globalSupabaseClient || !currentAuthUser) return;
    
    const statToday = document.getElementById('statTodayCount');
    const statTotal = document.getElementById('statTotalCount');
    const listContainer = document.getElementById('statsListContainer');
    
    if (!statToday || !statTotal || !listContainer) return;

    try {
        statToday.innerHTML = '<i class="ph ph-spinner animate-spin"></i>';
        statTotal.innerHTML = '<i class="ph ph-spinner animate-spin"></i>';
        
        // Fetch all sessions for this user
        const { data, error } = await globalSupabaseClient
            .from('sessions')
            .select('*')
            .eq('user_id', currentAuthUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Calculate stats
        const total = data.length;
        
        // Calculate today's total
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayCount = data.filter(s => {
            const d = new Date(s.created_at);
            return d >= today;
        }).length;

        // Render counts
        statTotal.textContent = total;
        statToday.textContent = todayCount;

        // Render last 5 sessions
        const recent = data.slice(0, 5);
        if (recent.length === 0) {
            listContainer.innerHTML = '<div class="p-5 text-center text-xs text-slate-500">Belum ada data sesi untuk saat ini.</div>';
        } else {
            listContainer.innerHTML = recent.map(s => {
                const date = new Date(s.created_at).toLocaleString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'
                });
                return `
                <div class="p-4 sm:p-5 hover:bg-slate-50 transition flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <i class="ph ph-image text-lg"></i>
                        </div>
                        <div>
                            <div class="text-xs font-black text-slate-900">${s.event_name || 'Event Default'}</div>
                            <div class="text-[10px] text-slate-500 font-medium">${date}</div>
                        </div>
                    </div>
                    ${s.customer_url ? `
                    <a href="${s.customer_url}" target="_blank" class="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[10px] font-bold flex items-center gap-1.5 shadow-xs transition shrink-0">
                        Buka <i class="ph ph-arrow-square-out"></i>
                    </a>
                    ` : ''}
                </div>`;
            }).join('');
        }
        
    } catch (err) {
        console.error("Stats Error:", err);
        listContainer.innerHTML = `<div class="p-5 text-center text-xs text-red-500">Gagal memuat data: ${err.message}</div>`;
        statToday.textContent = 'Err';
        statTotal.textContent = 'Err';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btnRefresh = document.getElementById('btnRefreshStats');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            const icon = btnRefresh.querySelector('i');
            if(icon) icon.classList.add('animate-spin');
            
            fetchAndRenderStats().finally(() => {
                setTimeout(() => {
                    if(icon) icon.classList.remove('animate-spin');
                }, 500);
            });
        });
    }

    // Auto-refresh when opening the stats tab
    const dashNavBtns = document.querySelectorAll('.dash-nav-btn');
    dashNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.getAttribute('data-target') === 'dashSectionStats') {
                fetchAndRenderStats();
            }
        });
    });
});

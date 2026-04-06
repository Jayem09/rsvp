document.addEventListener('DOMContentLoaded', () => {
    const rsvpForm = document.getElementById('rsvp-form');
    const formSuccess = document.getElementById('form-success');
    const ageBadge = document.querySelector('.age-badge');
    const adminModal = document.getElementById('admin-modal');
    const closeAdmin = document.getElementById('close-admin');
    const downloadCsv = document.getElementById('download-csv');
    
    let adminClickCount = 0;

    // --- 1. RSVP FORM HANDLING ---
    if (rsvpForm) {
        rsvpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const submitBtn = rsvpForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerText = 'PROCESSING DEAL...';

            const entry = {
                name: document.getElementById('name').value,
                guests: document.getElementById('guests').value,
                status: document.getElementById('status').value,
                message: document.getElementById('message').value,
                timestamp: new Date().toLocaleString()
            };

            // Save to SQLite Backend
            saveEntry(entry).then(success => {
                if (success) {
                    rsvpForm.classList.add('hidden');
                    formSuccess.classList.remove('hidden');
                    
                    // CELEBRATE!
                    triggerConfetti();
                    
                    console.log('Deal Sealed! New RSVP for the Boss:', entry);
                } else {
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'RETRY SUBMIT';
                    alert('Server connection failed. The Boss is busy, please try again later!');
                }
            });
        });
    }

    // --- 2. ADMIN ACTIONS ---
    
    // Secret 5-click Trigger
    if (ageBadge) {
        ageBadge.addEventListener('click', () => {
            adminClickCount++;
            if (adminClickCount === 5) {
                openDashboard();
                adminClickCount = 0;
            }
            // Reset after 3 seconds of inactivity
            setTimeout(() => { adminClickCount = 0; }, 3000);
        });
    }

    if (closeAdmin) {
        closeAdmin.addEventListener('click', () => {
            adminModal.classList.add('hidden');
        });
    }

    async function openDashboard() {
        const entries = await getEntries();
        renderTable(entries);
        updateStats(entries);
        adminModal.classList.remove('hidden');
    }

    async function saveEntry(entry) {
        try {
            const response = await fetch('/api/rsvp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            });
            return response.ok;
        } catch (error) {
            console.error('Error saving entry:', error);
            return false;
        }
    }

    async function getEntries() {
        try {
            const response = await fetch('/api/rsvps');
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error fetching entries:', error);
            return [];
        }
    }

    function updateStats(entries) {
        const total = entries.reduce((sum, e) => sum + parseInt(e.guests || 1), 0);
        const accepted = entries.filter(e => e.status.toLowerCase().includes('accept')).length;
        document.getElementById('total-guests').innerText = total;
        document.getElementById('accepted-count').innerText = accepted;
    }

    function renderTable(entries) {
        const tbody = document.getElementById('guest-body');
        tbody.innerHTML = entries.map(e => `
            <tr>
                <td><strong>${e.name}</strong></td>
                <td>${e.guests}</td>
                <td>${e.status}</td>
                <td><small>${e.message || '-'}</small></td>
            </tr>
        `).join('');
    }

    // --- 3. EXPORT TO CSV ---
    if (downloadCsv) {
        downloadCsv.addEventListener('click', () => {
            const entries = getEntries();
            if (entries.length === 0) return alert('No board minutes to export yet!');

            const headers = ['Name', 'Guests', 'Status', 'Message', 'Time'];
            const rows = entries.map(e => [
                `"${e.name}"`, 
                e.guests, 
                `"${e.status}"`, 
                `"${e.message.replace(/"/g, '""')}"`, 
                e.timestamp
            ]);

            const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `Kyle_Asher_Meeting_Minutes_${new Date().toLocaleDateString()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // --- 4. CELEBRATION ---
    function triggerConfetti() {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#3182CE', '#D4AF37', '#FFFFFF'] });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#3182CE', '#D4AF37', '#FFFFFF'] });
        }, 250);
    }

    // Scroll Reveal Intersection Observer
    const reveals = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    reveals.forEach(el => revealObserver.observe(el));
});

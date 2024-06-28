/**
 * This file is part of the DVSwitch Mode Switcher project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

document.getElementById('talkgroup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const tgid = encodeURIComponent(document.getElementById('talkgroup').value);
    fetch(`/tune/${tgid}`).then(response => response.text()).then(data => showMessage(`Switched to talkgroup ID: ${tgid}`));
});

function updateTalkgroups() {
    const mode = document.getElementById('mode').value;
    fetch(`/mode/${mode}`)
        .then(response => response.json())
        .then(talkgroups => {
            const talkgroupSelect = document.getElementById('talkgroup');
            talkgroupSelect.innerHTML = '';
            talkgroups.forEach(tg => {
                const option = document.createElement('option');
                option.value = tg.tgid;
                option.textContent = `${tg.alias} (${tg.tgid})`;
                talkgroupSelect.appendChild(option);
            });

            showMessage(`Switched to mode: ${mode}`);
        });
}

function showMessage(message) {
    const banner = document.getElementById('message-banner');
    banner.textContent = message;
    banner.style.display = 'block';
    setTimeout(() => {
        banner.style.display = 'none';
    }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    // updateTalkgroups(); // Don't do for now, come back later and revisit
});
const searchButton = document.getElementById("searchButton");
const emailInput = document.getElementById("emailInput");

const resultsCard = document.getElementById("resultsCard");
const resultsSummary = document.getElementById("resultsSummary");
const searchedEmail = document.getElementById("searchedEmail");

const xonProvider = document.getElementById("xonProvider");
const xonStatus = document.getElementById("xonStatus");
const xonCount = document.getElementById("xonCount");
const xonBreaches = document.getElementById("xonBreaches");

searchButton.addEventListener("click", async () => {

    const email = emailInput.value.trim();

    if (!email) {
        alert("Enter an email first");
        return;
    }

    searchButton.textContent = "Searching...";
    searchButton.disabled = true;

    try {

        // breach-analytics returns per-breach date/domain/exposed-data details.
        // The plain check-email endpoint only returns breach name strings,
        // which is why fields like breach.date/.domain used to come back undefined.
        const response = await fetch(
            `https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`
        );

        if (!response.ok) {
            throw new Error(`Lookup failed (status ${response.status})`);
        }

        const data = await response.json();

        resultsCard.hidden = false;
        searchedEmail.textContent = email;
        xonProvider.hidden = false;

        const exposedBreaches = data?.ExposedBreaches?.breaches_details
            || data?.exposedBreaches?.breaches_details
            || [];

        renderXonResults(exposedBreaches);

    } catch (error) {

        console.error(error);

        resultsCard.hidden = false;
        searchedEmail.textContent = email;
        xonProvider.hidden = false;

        xonStatus.textContent = "ERROR";
        xonStatus.className = "provider-status compromised";
        xonCount.textContent = "Could not complete lookup";
        xonBreaches.innerHTML = `
            <div class="breach">
                <div class="breach-name">Something went wrong</div>
                <div class="breach-date">${escapeHtml(error.message)}</div>
            </div>
        `;

        resultsSummary.textContent = "We couldn't finish checking this email. Please try again.";
    }

    searchButton.textContent = "Search";
    searchButton.disabled = false;

});

function renderXonResults(breaches) {

    resultsSummary.textContent = "Here's what we found across breach databases.";

    if (breaches && breaches.length > 0) {

        xonStatus.textContent = "COMPROMISED";
        xonStatus.className = "provider-status compromised";

        xonCount.textContent = `${breaches.length} breach${breaches.length === 1 ? "" : "es"} found`;

        xonBreaches.innerHTML = "";

        breaches.forEach(breach => {

            const name = breach.breach || breach.Name || "Unknown Breach";
            const date = breach.xposed_date || breach.date || "Unknown date";
            const domain = breach.domain || breach.Domain || "Unknown source";
            const dataTypes = breach.xposed_data
                ? breach.xposed_data.split(";").map(d => d.trim()).filter(Boolean)
                : [];

            const card = document.createElement("div");
            card.className = "breach";

            const dataSpans = dataTypes.length > 0
                ? dataTypes.map(d => `<span>${escapeHtml(d)}</span>`).join("")
                : `<span>Exposed data not specified</span>`;

            card.innerHTML = `
                <div class="breach-name">${escapeHtml(name)}</div>
                <div class="breach-date">${escapeHtml(String(date))}</div>
                <div class="breach-domain">${escapeHtml(domain)}</div>
                <div class="breach-data">${dataSpans}</div>
            `;

            xonBreaches.appendChild(card);

        });

    } else {

        xonStatus.textContent = "CLEAN";
        xonStatus.className = "provider-status clean";

        xonCount.textContent = "No breaches found";

        xonBreaches.innerHTML = `
            <div class="breach">
                <div class="breach-name">No exposed data found</div>
            </div>
        `;

    }

}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}
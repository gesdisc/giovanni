export class AlertsComponent {
    #alertBtn: HTMLElement
    #alertDialog: any
    #closeButton: HTMLElement
    #alertsContainer: HTMLElement
    #bannerContainer: HTMLElement
    #bannerText: HTMLElement
    #banner: HTMLElement
    #alertCount: HTMLElement

    constructor() {
        this.#alertBtn = document.querySelector('#alertButton')!
        this.#alertDialog = document.querySelector('#alert-dialog')!
        this.#closeButton = this.#alertDialog.querySelector('terra-button[slot="footer"]')!
        this.#alertsContainer = document.querySelector('#alertsContainer')!
        this.#bannerContainer = document.querySelector('#emergency-banner-container')!
        this.#bannerText = document.querySelector('#emergency-banner-text')!
        this.#banner = document.querySelector('#emergency-banner')!
        this.#alertCount = document.querySelector('#alertCount')!

        this.#observeBannerDismissal()
        this.#bindEvents()
        this.#loadAlerts()
    }

    #stripHtml(html: string): string {
        const temp = document.createElement('div')
        temp.innerHTML = html
        return temp.textContent || temp.innerText || ''
    }

    #formatDate(timestamp: number | undefined): string {
        if (!timestamp) return ''
        return new Date(timestamp).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'medium',
        })
    }

    #observeBannerDismissal() {
        const observer = new MutationObserver(() => {
            if (!this.#banner.hasAttribute('open')) {
                const dismissedId = (this.#banner as HTMLElement).dataset.alertId
                if (dismissedId) {
                    sessionStorage.setItem('dismissedAlertId', dismissedId)
                }
            }
        })
        observer.observe(this.#banner, { attributes: true })
    }

    async #loadAlerts() {
        try {
            this.#alertsContainer.innerHTML = 'Loading alerts...'

            const response = await fetch('https://disc.gsfc.nasa.gov/api/alerts')
            const data = await response.json()

            const alertsArray = data.data || []
            const now = Date.now()

            const filteredAlerts = alertsArray.filter(
                (alert: any) =>
                    alert.tags &&
                    alert.tags.includes('giovanni') &&
                    (!alert.expiration || alert.expiration > now),
            )

            if (filteredAlerts.length > 0) {
                this.#alertCount.textContent = filteredAlerts.length
                this.#alertCount.classList.remove('hidden')
            } else {
                this.#alertCount.classList.add('hidden')
            }

            const emergencyAlerts = filteredAlerts.filter(
                (alert: any) =>
                    alert.severity?.toLowerCase() === 'emergency' &&
                    (!alert.expiration || alert.expiration > now),
            )

            if (filteredAlerts.length === 0) {
                this.#alertsContainer.innerHTML = '<p>No Giovanni alerts found.</p>'
                return
            }

            if (emergencyAlerts.length > 0) {
                const latest = emergencyAlerts.sort(
                    (a: any, b: any) => b.created - a.created,
                )[0]

                const latestId = String(latest.id || latest.created)
                const dismissedId = sessionStorage.getItem('dismissedAlertId')

                const message = [latest.title, this.#stripHtml(latest.body)]
                    .filter(Boolean)
                    .join(' — ')

                this.#bannerText.textContent = message
                ;(this.#banner as HTMLElement).dataset.alertId = latestId

                if (dismissedId === latestId) {
                    this.#bannerContainer.classList.add('hidden')
                } else {
                    this.#bannerContainer.classList.remove('hidden')
                }
            } else {
                this.#bannerContainer.classList.add('hidden')
            }

            filteredAlerts.sort((a: any, b: any) => b.created - a.created)

            this.#alertsContainer.innerHTML = filteredAlerts
                .map(
                    (alert: any) => `
                <div class="alert-item">
                    <div class="flex-1">
                        <div class="alert-title">${alert.title || 'Alert'}</div>
                        <div class="alert-body">${this.#stripHtml(alert.body || '')}</div>
                        <div class="alert-meta">
                            <div><strong>Updated:</strong> ${this.#formatDate(alert.updated)}</div>
                            <div>
                                <strong>Alert Date:</strong> ${this.#formatDate(alert.start)}
                                <strong>Expires:</strong> ${this.#formatDate(alert.expiration)}
                            </div>
                        </div>
                    </div>
                </div>
            `,
                )
                .join('')
        } catch (error) {
            console.error('Error loading alerts:', error)
            this.#alertsContainer.innerHTML =
                "<p class='text-red-500'>Failed to load alerts.</p>"
        }
    }

    #bindEvents() {
        this.#alertBtn.addEventListener('click', () => {
            this.#alertDialog.show()
            this.#loadAlerts()
        })

        this.#closeButton.addEventListener('click', () => {
            this.#alertDialog.hide()
        })
    }
}

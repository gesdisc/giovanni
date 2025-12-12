export class WelcomeSplashComponent {
    #welcomeScreen: HTMLElement
    #skipBtn: HTMLElement
    #hideCheckbox: HTMLInputElement
    #createMapWidget: HTMLElement | null
    #createTimeseriesWidget: HTMLElement | null
    #userGuideWidget: HTMLElement | null

    constructor() {
        this.#welcomeScreen = document.getElementById('welcomeScreen')!
        this.#skipBtn = document.getElementById('welcomeSkip')!
        this.#hideCheckbox = document.getElementById('hideWelcome') as HTMLInputElement
        this.#createMapWidget = document.getElementById('widget-create-map')
        this.#createTimeseriesWidget = document.getElementById('widget-create-timeseries')
        this.#userGuideWidget = document.getElementById('widget-user-guide')

        this.#initialize()
    }

    #initialize() {
        // Check if user opted out previously
        const hide = localStorage.getItem('hideWelcomeScreen')

        this.#welcomeScreen.style.display = hide === 'true' ? 'none' : 'flex'

        this.#setupEventListeners()
    }

    #setupEventListeners() {
        this.#skipBtn.addEventListener('click', () => this.#closeSplash())

        // Create Map Widget
        this.#createMapWidget?.addEventListener('click', (e) => {
            e.preventDefault()
            this.#closeSplash()
            this.#selectMapPlotType()
        })

        // Create Time-Series Widget
        this.#createTimeseriesWidget?.addEventListener('click', (e) => {
            e.preventDefault()
            this.#closeSplash()
            this.#selectTimeSeriesPlotType()
        })

        // Read User Guide Widget
        this.#userGuideWidget?.addEventListener('click', () => {
            this.#closeSplash()
        })
    }

    #closeSplash() {
        if (this.#hideCheckbox.checked) {
            localStorage.setItem('hideWelcomeScreen', 'true')
        }
        this.#welcomeScreen.style.display = 'none'
    }

    #selectMapPlotType() {
        const mapBtn = document.getElementById('map-button')
        const plotBtn = document.getElementById('plot-button')

        if (mapBtn && plotBtn) {
            mapBtn.classList.add('plot-type-button--selected')
            mapBtn.classList.remove('plot-type-button--unselected')

            plotBtn.classList.add('plot-type-button--unselected')
            plotBtn.classList.remove('plot-type-button--selected')
        }

        // Trigger any event listener tied to plot type change
        mapBtn?.dispatchEvent(new Event('click'))
    }

    #selectTimeSeriesPlotType() {
        const mapBtn = document.getElementById('map-button')
        const plotBtn = document.getElementById('plot-button')

        if (mapBtn && plotBtn) {
            mapBtn.classList.add('plot-type-button--unselected')
            mapBtn.classList.remove('plot-type-button--selected')

            plotBtn.classList.add('plot-type-button--selected')
            plotBtn.classList.remove('plot-type-button--unselected')
        }
    }
}
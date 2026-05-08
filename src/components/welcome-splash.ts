export class WelcomeSplashComponent {
    #proxyLogin: HTMLElement
    #login: HTMLElement
    #welcomeScreen: HTMLElement
    #skipBtn: HTMLElement
    #hideCheckbox: HTMLInputElement
    #createMapWidget: HTMLElement | null
    #createTimeseriesWidget: HTMLElement | null
    #userGuideWidget: HTMLElement | null

    constructor() {
        this.#welcomeScreen = document.getElementById('welcomeScreen')!
        this.#proxyLogin = document.getElementById('login-proxy')!
        this.#login = document.getElementById('login')!
        this.#skipBtn = document.getElementById('welcomeSkip')!
        this.#hideCheckbox = document.getElementById('hideWelcome') as HTMLInputElement
        this.#createMapWidget = document.getElementById('widget-create-map')
        this.#createTimeseriesWidget = document.getElementById('widget-create-timeseries')
        this.#userGuideWidget = document.getElementById('widget-user-guide')

        this.#setupEventListeners()  
        this.#initialize()
    }

    #initialize() {
        this.#welcomeScreen.style.display = 'none'  // Default to hidden
        
        const hide = localStorage.getItem('hideWelcomeScreen') === 'true'
        const redirectFromLogin = localStorage.getItem('loginInitiated') === 'true'

        // If authentication is in progress, don't show welcome screen.
        if (redirectFromLogin) {
            this.#login.style.display = 'inline-flex'  // unhide actual login component
            this.#proxyLogin.style.display = 'none'  // hide the proxy login button
            localStorage.removeItem('loginInitiated')
            return
        }

        this.#welcomeScreen.style.display = hide ? 'none' : 'flex'
    }

    #setupEventListeners() {

        this.#proxyLogin.addEventListener('click', () => {
            localStorage.setItem('loginInitiated', 'true')  // Set flag to indicate login initiated

            const internalLoginBtn = this.#login.shadowRoot?.querySelector('terra-button')
            internalLoginBtn?.click()
            this.#login.style.display = 'inline-flex'   // unhide actual login component
            this.#proxyLogin.style.display = 'none'     // hide the proxy login button 
        })

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
            localStorage.setItem('hideWelcomeScreen', 'true')   // Save user preference to hide welcome screen
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
import { userState } from '../state'
import { TerraLoginEvent } from '@nasa-terra/components'
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
        this.#welcomeScreen.style.display = 'none'  // Default to hidden
        
        console.log('DEBUG: ********* WelcomeSplashComponent ************ #initialize called')
        
        // Check if user opted out of welcome screenpreviously
        const hide = localStorage.getItem('hideWelcomeScreen') === 'true'

        if (hide) {
            return
        }

        console.log('DEBUG: welcomeScreen.style.disply:', this.#welcomeScreen.style.display)
        console.log('DEBUG: hideWelcomeScreen:', hide)
        console.log('DEBUG: userState in WelcomeSplashComponent #initialize:', userState.value)

        this.#setupEventListeners()

        // 🚨 IMPORTANT: defer decision until auth state settles
        // Determine whether to show welcome screen based on user login status
        queueMicrotask(() => {
            this.#evaluateVisibility()
        })
    }

    #setupEventListeners() {

        // Setup listener for login event
        window.addEventListener('terra-login', (e: TerraLoginEvent) => {
            const isLoggedIn = !!e.detail?.user?.uid

            console.log('DEBUG: terra-login event → isLoggedIn:', isLoggedIn)

            if (isLoggedIn) {
                this.#closeSplash()
            } else {
                this.#welcomeScreen.style.display = 'flex'
            }
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

    #evaluateVisibility() {
        const isLoggedIn = !!userState.value.user

        console.log('DEBUG: evaluateVisibility → isLoggedIn:', isLoggedIn)

        if (isLoggedIn) {
            this.#closeSplash()
        } else {
            this.#welcomeScreen.style.display = 'flex'
        }
    }

    #closeSplash() {
        console.log('DEBUG: ********* WelcomeSplashComponent ************ #closeSplash called')
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
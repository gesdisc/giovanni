import { effect } from '@preact/signals-core'
import { configuredUrl, dateTimeRange, plotType, spatialArea } from '../state'
import { getOptionsFromCurrentUrl } from '../utilities/url'

/**
 * This components responsibility is to manage the URL state, to allow for bookmarking and sharing Giovanni urls
 */
export class UrlsParamsComponent {
    #hasRenderedOnce = false

    constructor() {
        this.#bindEvents()
        this.#setupEffects()
    }

    #bindEvents() {
        // listen for 'popstate' (or back/forward browser navigation) and update state accordingly
        window.addEventListener('popstate', function() {
            const options = getOptionsFromCurrentUrl()

            plotType.value = options.plotType

            if (options.spatialArea) {
                spatialArea.value = options.spatialArea
            }

            if (options.dateTimeRange) {
                dateTimeRange.value = options.dateTimeRange
            }
        })
    }

    #setupEffects() {
        // anytime the state.ts changes, we set a url, configuredUrl
        // this takes that url and adjusts the browsers url, if needed
        effect(() => {
            const currentUrl = window.location.href
            
            if (currentUrl !== configuredUrl.value.href && this.#hasRenderedOnce) {
                window.history.pushState?.({ path: configuredUrl.value.href }, '', configuredUrl.value.href)
            }

            this.#hasRenderedOnce = true
        })
    }
}

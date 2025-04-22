import { assert } from '../utilities/error'

export class SidebarToggleComponent {
    #toggleButton: HTMLButtonElement
    #sidebarEl: HTMLElement

    constructor(toggleSelector: string, sidebarSelector: string) {
        const toggleButton = document.querySelector<HTMLButtonElement>(toggleSelector)
        const sidebarEl = document.querySelector<HTMLElement>(sidebarSelector)

        assert(toggleButton, `Toggle button not found: ${toggleSelector}`)
        assert(sidebarEl, `Sidebar not found: ${sidebarSelector}`)

        this.#toggleButton = toggleButton
        this.#sidebarEl = sidebarEl

        this.#bindEvents()
    }

    #bindEvents() {
        this.#toggleButton.addEventListener('click', this.#toggleSidebar.bind(this))
        this.#toggleButton.addEventListener('touchstart', this.#toggleSidebar.bind(this))
    }

    #toggleSidebar() {
        const isExpanded = this.#toggleButton.getAttribute('aria-expanded') == 'true'

        if (isExpanded) {
            this.#toggleButton.setAttribute('aria-expanded', 'false')
            this.#sidebarEl.classList.add('sidebar-closed')
        } else {
            this.#toggleButton.setAttribute('aria-expanded', 'true')
            this.#sidebarEl.classList.remove('sidebar-closed')
        }
    }
}

export class SidebarToggleComponent {
    #toggleButton: HTMLButtonElement
    #sidebarEl: HTMLElement

    constructor() {
        this.#toggleButton = document.querySelector<HTMLButtonElement>('#sidebar-toggle')!
        this.#sidebarEl = document.querySelector<HTMLElement>('#sidebar')!

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

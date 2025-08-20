import { storeOptionsInLocalStorage } from "../utilities/localstorage"

export class LoginModalComponent {
    #modalEl: HTMLElement
    #loginButtonEl: HTMLButtonElement
    #overlayEl: HTMLElement

    constructor() {
        this.#modalEl = document.querySelector('#login-modal')!
        this.#overlayEl = document.querySelector('#login-overlay')!
        this.#loginButtonEl = this.#overlayEl.querySelector('#login-modal-button')!

        this.#bindEvents()
    }

    #bindEvents() {
        this.#loginButtonEl.addEventListener('click', () => {
            storeOptionsInLocalStorage()
            
            const loginEl = document.querySelector('#login') as any
            if (loginEl && loginEl.login) {
                loginEl.login()
            }
        })

        document.addEventListener('open-login-modal', () => {
            this.show()
        })
    }

    show() {
        this.#modalEl.style.display = 'flex'
        this.#overlayEl.style.display = 'flex'
        document.body.style.overflow = 'hidden'
    }

    hide() {
        this.#modalEl.style.display = 'none'
        this.#overlayEl.style.display = 'none'
        document.body.style.overflow = ''
    }
}

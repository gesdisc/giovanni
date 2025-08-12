import { needsLogin, userState } from '../state'
import { effect } from '@preact/signals-core'

export class LoginModalComponent {
    #modalEl: HTMLElement
    #loginButtonEl: HTMLButtonElement
    #overlayEl: HTMLElement

    constructor() {
        this.#modalEl = document.querySelector('#login-modal')!
        this.#overlayEl = document.querySelector('#login-overlay')!
        this.#loginButtonEl = this.#overlayEl.querySelector('#login-modal-button')!

        this.#bindEvents()
        this.#setupEffects()
    }

    #bindEvents() {
        this.#loginButtonEl.addEventListener('click', () => {
            const loginEl = document.querySelector('#login') as any
            if (loginEl && loginEl.login) {
                loginEl.login()
            }
        })
    }

    #setupEffects() {
        effect(() => {
            if (needsLogin.value || !userState.value.user?.uid) {
                this.show()
            } else {
                this.hide()
            }
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

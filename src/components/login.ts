import { TerraLogin, TerraLoginEvent } from '@nasa-terra/components'
import { user } from '../state'
import { User } from '../types'
import { effect } from '@preact/signals-core'

const EDL_DOMAIN = 'https://uat.urs.earthdata.nasa.gov'

export class LoginComponent {
    #loginEl: TerraLogin
    #logoutSection: HTMLDivElement

    constructor() {
        this.#loginEl = document.querySelector<TerraLogin>('#login')!
        this.#logoutSection = this.#loginEl.querySelector<HTMLDivElement>('#logout')!

        this.#bindEvents()
        this.#setupEffects()
    }

    #bindEvents() {
        this.#loginEl.addEventListener('terra-login', (e: TerraLoginEvent) => {
            user.value = e.detail.user as User
        })
    }

    #setupEffects() {
        effect(() => {
            this.#setupLogoutButton(user.value)
        })
    }

    #setupLogoutButton(user: User | null | undefined) {
        this.#logoutSection.innerHTML = user ? `<a href="${EDL_DOMAIN}/logout?redirect_uri=${window.location.href}" class="text-white">Log out (${user.uid})</a>` : ''

        if (user) {
            this.#logoutSection.querySelector<HTMLAnchorElement>('a')!.addEventListener('click', (e: any) => {
                e.preventDefault()

                const logoutUrl = e.currentTarget.href

                // use token based logout
                this.#loginEl.logout()

                // also logout of URS
                window.location.href = logoutUrl
            })
        }
    }
}

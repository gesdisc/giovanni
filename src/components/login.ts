import { TerraButton, TerraLogin, TerraLoginEvent } from '@nasa-terra/components'
import { userState } from '../state'
import { User } from '../types'
import { effect } from '@preact/signals-core'
import { clearOptionsFromLocalStorage } from '../utilities/localstorage'

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
            userState.value = {
                ...userState.value,
                user: e.detail.user?.uid ? (e.detail.user as User) : null,
                userChecked: true,
            }
        })
    }

    #setupEffects() {
        effect(() => {
            if (userState.value.userChecked) {
                clearOptionsFromLocalStorage()
            }

            this.#setupLogoutButton(userState.value.user)
        })
    }

    #setupLogoutButton(user: User | null | undefined) {
        this.#logoutSection.innerHTML = user
            ? `
        <terra-button variant="text" href="${EDL_DOMAIN}/logout?redirect_uri=${window.location.href}">
            <span class="text-gray-200 hover:text-white flex items-center">
                Log out (${user.uid})
            </span>
        </terra-button>`
            : ''

        if (user) {
            this.#logoutSection
                .querySelector<TerraButton>('terra-button')!
                .addEventListener('click', (e: any) => {
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

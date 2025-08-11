import { TerraButton } from '@nasa-terra/components'
import { authToken, user } from '../state'
import { effect } from '@preact/signals-core'

export const authTokenKey = 'giovanni-auth-token'
const authUrl =
    'https://zed7uleqxl.execute-api.us-east-1.amazonaws.com/default/terra-earthdata-oauth'

export class LoginComponent {
    #loginEl: HTMLElement

    constructor() {
        this.#loginEl = document.querySelector<HTMLElement>('#login')!

        this.#setupEffects()

        if (this.#canHandleOAuthCallback()) {
            this.#handleOAuthCallback()
        }
    }

    #setupEffects() {
        effect(() => {
            if (user.value) {
                this.#renderLoggedInUser()
            } else if (typeof user.value !== 'undefined') {
                this.#renderLoggedOutUser()
            }
        })

        effect(() => {
            if (this.#canHandleOAuthCallback()) {
                // if we are handling an oauth callback, we shouldn't try to fetch the user yet
                return
            }

            if (authToken.value) {
                this.#fetchUser()
            } else {
                user.value = null
            }
        })
    }

    #renderLoggedInUser() {
        this.#loginEl.innerHTML = `
            <div>
                <a href="https://urs.earthdata.nasa.gov/logout?redirect_uri=${window.location.href}">Log out (${user.value!.uid})</a>
            </div>
        `

        const logoutLink = this.#loginEl.querySelector<HTMLAnchorElement>('a')!
        logoutLink.addEventListener('click', (e: any) => {
            e.preventDefault()
            this.#logout()
        })
    }

    #renderLoggedOutUser() {
        this.#loginEl.innerHTML = `
            <terra-button id="login-btn">
                <terra-icon library="heroicons" name="outline-arrow-right-end-on-rectangle" slot="prefix"></terra-icon>
                Login
            </terra-button>
        `

        const loginBtn = this.#loginEl.querySelector<TerraButton>('#login-btn')!
        loginBtn.addEventListener('click', () => this.#login())
    }

    #login() {
        // login involves just redirecting to the auth URL!
        window.location.href = `${authUrl}/login?redirect_uri=${window.location.href}`
    }

    #logout() {
        // to logout, we first remove the auth token from local storage
        localStorage.removeItem(authTokenKey)

        // then we redirect to the auth URL
        window.location.href = `https://urs.earthdata.nasa.gov/logout?redirect_uri=${window.location.href}`
    }

    async #handleOAuthCallback() {
        // first, get the code from the URL
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')

        // remove "code" and "state" from URL
        urlParams.delete('code')
        urlParams.delete('state')
        window.history.replaceState({}, '', `${window.location.pathname}${urlParams.size > 0 ? '?' + urlParams.toString() : ''}`)

        // fetch the token from the auth URL
        const response = await fetch(`${authUrl}/callback?code=${code}`)
        const data = await response.json()
        
        // store token in local storage and update state
        localStorage.setItem(authTokenKey, data.token)
        authToken.value = data.token
    }

    async #fetchUser() {
        const response = await fetch(authUrl + '/user', {
            headers: {
                'Authorization': `Bearer ${authToken.value}`
            }
        })

        if (response.ok) {
            const data = await response.json()
            user.value = data?.user ?? null
        } else {
            console.error('Failed to fetch user', response.statusText)
            localStorage.removeItem(authTokenKey)
        }
    }

    #canHandleOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search)
        return urlParams.get('code') !== null
    }
}

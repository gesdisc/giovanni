import { Variable } from '../types'

export class VariableComponent {
    variable: Variable
    element: HTMLElement

    constructor(variable: Variable) {
        this.variable = variable
        this.element = document.createElement('div')

        this.element.innerHTML = `
            <div
                class="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg group hover-lift transition-all duration-200"
                role="listitem"
            >
                <div class="flex items-center space-x-3">
                    <div
                        class="w-3 h-3 bg-green-500 rounded-full"
                    ></div>
                    <div>
                        <span
                            class="text-sm font-medium text-gray-800"
                            >${this.variable.dataFieldLongName}</span
                        >
                        <p class="text-xs text-gray-600">
                            ${this.variable.dataFieldShortName}
                        </p>
                    </div>
                </div>

                <button
                    class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all focus-ring rounded p-1"
                    aria-label="Remove Precipitation variable"
                >
                    <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>    
        `
    }

    destroy() {
        this.element.parentElement?.removeChild(this.element)
    }
}

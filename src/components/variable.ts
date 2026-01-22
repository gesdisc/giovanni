import { Variable } from '../types'
import { variables } from '../state'

export class VariableComponent {
    variable: Variable
    variableLongName: string
    element: HTMLElement
    fromHistory: boolean = false
    historyId: string | null = null

    constructor(variable: Variable, variableLongName: string, fromHistory: boolean = false, historyId: string | null = null) {
        this.variable = variable
        this.variableLongName = variableLongName
        this.element = document.createElement('div')
        this.fromHistory = fromHistory
        this.historyId = historyId

        this.render()
    }

    destroy() {
        this.element.parentElement?.removeChild(this.element)
    }

    render() {
        const metadata = [
            this.variable.dataProductInstrumentShortName,
            this.variable.dataProductTimeInterval,
            this.variable.dataFieldUnits,
        ]
            .filter(Boolean)
            .join(' • ')

        this.element.innerHTML = `
            <div
                class="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg group hover-lift transition-all duration-200"
                role="listitem"
            >
                <div class="flex items-center space-x-3">
                    <div class="drag-handle cursor-move">
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                        </svg>
                    </div>
                    <div
                        class="w-3 h-3 bg-green-500 rounded-full"
                    ></div>
                    <div>
                        <span
                            class="text-sm font-medium text-gray-800"
                            >${this.variableLongName}</span
                        >
                        <p class="text-xs text-gray-600">
                            ${metadata} • <a target="_blank" href="${this.variable.dataProductDescriptionUrl}">[${this.variable.dataProductShortName}_${this.variable.dataProductVersion}]</a>
                        </p>
                    </div>
                </div>

                <button
                    class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all focus-ring rounded p-1"
                    aria-label="Remove ${this.variableLongName} variable"
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

        this.element.querySelector('button')?.addEventListener('click', () => {
            variables.value = variables.value.filter(v => v !== this)
        })
    }
}

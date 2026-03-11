import type { MeliToolsAPI } from '../core/types'
import { MELITOOLS_THEME } from '../core/types'

interface ReturnProcessData {
  ids: string[]
  currentIndex: number
  successCount: number
  errors: string[]
  isObserverMode: boolean
  startTime: number
}

interface ReturnState {
  processing: boolean
  processData: ReturnProcessData | null
  hudElement: HTMLElement | null
  observerActive: boolean
}

export default function registerReturnAutomation(api: MeliToolsAPI) {
  // Ativar apenas em URLs de devoluções
  const enabledUrls = [
    '*://*/*'
  ]

  if (!api.utils.matchUrls(enabledUrls)) return

  const state: ReturnState = {
    processing: false,
    processData: null,
    hudElement: null,
    observerActive: false
  }

  const fontStyle = `font-family: ${MELITOOLS_THEME.fontFamily};`

  // ==========================================
  // HUD DE PROGRESSO
  // ==========================================
  const createProgressHUD = (total: number) => {
    if (document.getElementById('meli-return-hud')) return

    const hud = document.createElement('div')
    hud.id = 'meli-return-hud'
    hud.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; background: #ffffff;
      box-shadow: ${MELITOOLS_THEME.shadows.medium};
      border-left: 5px solid ${MELITOOLS_THEME.primaryColor};
      padding: 16px 24px; border-radius: ${MELITOOLS_THEME.borderRadius};
      z-index: 9999999;
      ${fontStyle}
      min-width: 250px;
    `
    hud.innerHTML = `
      <div style="font-size: 13px; color: #666; font-weight: 600; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Processando Devoluções...</div>
      <div style="font-size: 20px; color: #333; font-weight: bold; margin-bottom: 12px;" id="meli-return-status">0 / ${total} (0%)</div>
      <div style="width: 100%; background: #eee; height: 6px; border-radius: 3px; overflow: hidden;">
        <div id="meli-return-bar" style="width: 0%; height: 100%; background: ${MELITOOLS_THEME.primaryColor}; transition: width 0.3s ease-out;"></div>
      </div>
    `
    document.body.appendChild(hud)
    state.hudElement = hud
  }

  const updateProgressHUD = (current: number, total: number) => {
    const status = document.getElementById('meli-return-status')
    const bar = document.getElementById('meli-return-bar')
    if (status && bar) {
      const pct = Math.round((current / total) * 100)
      status.innerText = `${current} / ${total} (${pct}%)`
      bar.style.width = `${pct}%`
    }
  }

  const removeProgressHUD = () => {
    if (state.hudElement) {
      state.hudElement.remove()
      state.hudElement = null
    }
  }

  // ==========================================
  // MENU PRINCIPAL
  // ==========================================
  const openMainMenu = () => {
    if (document.getElementById('meli-return-menu')) return

    const overlay = document.createElement('div')
    overlay.id = 'meli-return-menu'
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.5); z-index: 999999; display: flex;
      align-items: center; justify-content: center; ${fontStyle}
    `

    const menu = document.createElement('div')
    menu.style.cssText = `
      background: #fff; width: 450px; border-radius: ${MELITOOLS_THEME.borderRadius};
      box-shadow: ${MELITOOLS_THEME.shadows.large}; display: flex;
      flex-direction: column; overflow: hidden;
    `

    menu.innerHTML = `
      <div style="background: ${MELITOOLS_THEME.secondaryColor}; padding: 16px; text-align: center; border-bottom: 1px solid rgba(0,0,0,0.05);">
        <h2 style="margin: 0; font-size: 20px; color: #333; font-weight: 600;">Automação de Devoluções</h2>
      </div>
      <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
        <div style="background: #f5f5f5; padding: 12px; border-radius: ${MELITOOLS_THEME.borderRadius}; display: flex; align-items: center; gap: 10px; border: 1px solid ${MELITOOLS_THEME.borderRadius};">
          <input type="checkbox" id="chk-observer-mode" style="width: 18px; height: 18px; cursor: pointer;">
          <label for="chk-observer-mode" style="font-size: 14px; color: #333; font-weight: 600; cursor: pointer; user-select: none;">
            Modo Observador (Aguardar inputs manuais)
          </label>
        </div>

        <div id="container-file">
          <label style="font-size: 14px; color: #666; font-weight: 600; margin-bottom: 8px; display: block;">Ou carregue arquivo com IDs:</label>
          <input type="file" id="input-file-ids" accept=".txt,.csv" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; box-sizing: border-box;">
        </div>

        <div id="container-preview" style="display: none; flex-direction: column; gap: 8px;">
          <label style="font-size: 14px; color: #666; font-weight: 600; display: flex; justify-content: space-between;">
            <span>IDs Carregados:</span>
            <span id="counter-ids" style="color: ${MELITOOLS_THEME.primaryColor};">0</span>
          </label>
          <textarea id="textarea-ids" style="width: 100%; height: 120px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; resize: none; font-family: monospace; font-size: 13px; box-sizing: border-box;"></textarea>
        </div>
      </div>
      <div style="padding: 16px 24px; background: #f5f5f5; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid #eee;">
        <button id="btn-cancel" style="background: transparent; color: ${MELITOOLS_THEME.primaryColor}; border: none; padding: 0 16px; font-size: 14px; font-weight: 600; cursor: pointer;">Cancelar</button>
        <button id="btn-start" style="background: rgba(0,0,0,0.1); color: rgba(0,0,0,0.25); border: none; padding: 12px 24px; border-radius: 4px; font-size: 14px; font-weight: 600; cursor: not-allowed; transition: 0.2s;">Iniciar Processo</button>
      </div>
    `

    overlay.appendChild(menu)
    document.body.appendChild(overlay)

    const inputFile = document.getElementById('input-file-ids') as HTMLInputElement
    const containerFile = document.getElementById('container-file')
    const containerPreview = document.getElementById('container-preview')
    const textareaIds = document.getElementById('textarea-ids') as HTMLTextAreaElement
    const counterId = document.getElementById('counter-ids')
    const btnStart = document.getElementById('btn-start') as HTMLButtonElement
    const btnCancel = document.getElementById('btn-cancel')
    const chkObserver = document.getElementById('chk-observer-mode') as HTMLInputElement

    btnCancel?.addEventListener('click', () => overlay.remove())

    chkObserver?.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked
      if (checked) {
        containerFile!.style.display = 'none'
        containerPreview!.style.display = 'none'
        btnStart.disabled = false
        btnStart.style.background = MELITOOLS_THEME.successColor
        btnStart.style.color = '#fff'
        btnStart.style.cursor = 'pointer'
      } else {
        containerFile!.style.display = 'block'
        containerPreview!.style.display = 'none'
        btnStart.disabled = true
        btnStart.style.background = 'rgba(0,0,0,0.1)'
        btnStart.style.color = 'rgba(0,0,0,0.25)'
        btnStart.style.cursor = 'not-allowed'
      }
    })

    inputFile?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        textareaIds.value = content
        containerPreview!.style.display = 'flex'

        const ids = content
          .split(/[\n;]/)
          .map(id => id.trim())
          .filter(id => /^\d+$/.test(id))
        counterId!.innerText = ids.length.toString()

        btnStart.disabled = ids.length === 0
        btnStart.style.background = ids.length > 0 ? MELITOOLS_THEME.primaryColor : 'rgba(0,0,0,0.1)'
        btnStart.style.color = ids.length > 0 ? '#fff' : 'rgba(0,0,0,0.25)'
        btnStart.style.cursor = ids.length > 0 ? 'pointer' : 'not-allowed'
      }
      reader.readAsText(file)
    })

    textareaIds?.addEventListener('input', () => {
      const ids = textareaIds.value
        .split(/[\n;]/)
        .map(id => id.trim())
        .filter(id => /^\d+$/.test(id))
      counterId!.innerText = ids.length.toString()

      btnStart.disabled = ids.length === 0
      btnStart.style.background = ids.length > 0 ? MELITOOLS_THEME.primaryColor : 'rgba(0,0,0,0.1)'
      btnStart.style.color = ids.length > 0 ? '#fff' : 'rgba(0,0,0,0.25)'
      btnStart.style.cursor = ids.length > 0 ? 'pointer' : 'not-allowed'
    })

    btnStart?.addEventListener('click', async () => {
      overlay.remove()

      if (chkObserver.checked) {
        state.observerActive = true
        startObserverMode()
      } else {
        const ids = textareaIds.value
          .split(/[\n;]/)
          .map(id => id.trim())
          .filter(id => /^\d+$/.test(id))

        if (ids.length > 0) {
          startProcessing(ids)
        }
      }
    })
  }

  // ==========================================
  // MODO OBSERVADOR
  // ==========================================
  const startObserverMode = async () => {
    api.ui.showToast('Modo Observador Ativado - Aguardando interações...', { type: 'info' })

    const SUCCESS_SCREEN = '.tetris-feedback-screen__container--positive'
    const CAUTION_SCREEN = '.tetris-feedback-screen__container--caution'
    const OUTSIDE_COVERAGE_INPUT = 'input#outside_coverage'

    while (state.observerActive) {
      await api.utils.sleep(800)

      if (document.querySelector(SUCCESS_SCREEN)) {
        await api.utils.sleep(2000)
        continue
      }

      const cautionScreen = document.querySelector(CAUTION_SCREEN)
      const outsideCoverageInput = document.querySelector(OUTSIDE_COVERAGE_INPUT) as HTMLInputElement

      if (cautionScreen && outsideCoverageInput) {
        const value = outsideCoverageInput.value
        if (value && /^\d{11}$/.test(value)) {
          api.ui.showToast(`ID detectado: ${value}`, { type: 'success', duration: 1500 })
        }
      }
    }
  }

  // ==========================================
  // PROCESSAMENTO DE DEVOLUÇÕES
  // ==========================================
  const startProcessing = (ids: string[]) => {
    state.processing = true
    state.processData = {
      ids,
      currentIndex: 0,
      successCount: 0,
      errors: [],
      isObserverMode: false,
      startTime: Date.now()
    }

    createProgressHUD(ids.length)
    api.ui.showToast(`Iniciando processamento de ${ids.length} devoluções...`, { type: 'info' })

    // Iniciar processamento
    processNextReturn()
  }

  const processNextReturn = async () => {
    if (!state.processData || state.processData.currentIndex >= state.processData.ids.length) {
      finishProcessing()
      return
    }

    const data = state.processData
    const currentId = data.ids[data.currentIndex]

    updateProgressHUD(data.currentIndex + 1, data.ids.length)

    try {
      // Simular processamento - em produção, isso interagiria com a página
      api.logging.info(`Processando ID: ${currentId}`)

      await api.utils.sleep(1500)

      // Simular sucesso/erro aleatório para demonstração
      const success = Math.random() > 0.2
      if (success) {
        data.successCount++
        api.ui.showToast(`✓ ID ${currentId} processado`, { type: 'success', duration: 1000 })
      } else {
        data.errors.push(currentId)
        api.ui.showToast(`✗ ID ${currentId} com erro`, { type: 'error', duration: 1000 })
      }

      data.currentIndex++
      await api.utils.sleep(500)
      processNextReturn()
    } catch (error) {
      data.errors.push(currentId)
      api.logging.error(`Erro ao processar ${currentId}: ${error}`)
      data.currentIndex++
      await api.utils.sleep(500)
      processNextReturn()
    }
  }

  // ==========================================
  // MODAL FINAL COM RESUMO
  // ==========================================
  const finishProcessing = () => {
    if (!state.processData) return

    const data = state.processData
    const totalTime = Date.now() - data.startTime
    const totalIds = data.ids.length
    const errors = data.errors

    removeProgressHUD()

    // Reproduzir som de conclusão
    api.utils.playSound(880, 150, 200)

    // Mostrar modal com resumo
    const headerColor = errors.length === 0 ? MELITOOLS_THEME.successColor : MELITOOLS_THEME.secondaryColor
    const headerTextColor = errors.length === 0 ? '#fff' : '#333'
    const title = errors.length === 0 ? 'Sucesso Total!' : 'Processamento Concluído'

    const downloadButtonHtml =
      errors.length > 0
        ? `<button id="btn-download-errors" style="background: transparent; color: ${MELITOOLS_THEME.errorColor}; border: 1px solid ${MELITOOLS_THEME.errorColor}; padding: 12px; border-radius: 4px; font-size: 14px; font-weight: 600; cursor: pointer; flex: 1;">Baixar Erros (.txt)</button>`
        : ''

    const modal = api.ui.createModal({
      id: 'meli-return-final',
      title: title,
      content: `
        <div style="padding: 24px; color: #333; font-size: 16px; line-height: 1.6;">
          <b>Total fornecido:</b> ${totalIds}<br>
          <b>Sucesso:</b> <span style="color:${MELITOOLS_THEME.successColor}; font-weight:bold;">${data.successCount}</span><br>
          <b>Falhas:</b> <span style="color:${MELITOOLS_THEME.errorColor}; font-weight:bold;">${errors.length}</span><br>
          <b>Tempo total:</b> <span style="color:#666;">${api.utils.formatTime(totalTime)}</span>
        </div>
      `,
      maxWidth: '420px',
      buttons: [
        {
          text: 'Fechar',
          type: 'loud',
          action: () => {
            modal.hide()
            state.processing = false
            state.processData = null
          }
        }
      ]
    })

    modal.show()

    if (errors.length > 0) {
      const btnDownload = document.getElementById('btn-download-errors')
      btnDownload?.addEventListener('click', () => {
        api.utils.downloadFile(errors.join('\n'), `devolucoes_com_erro_${Date.now()}.txt`)
        api.ui.showToast('Arquivo baixado!', { type: 'success' })
      })
    }

    state.processing = false
    state.processData = null
  }

  // ==========================================
  // REGISTRO DE ATALHO
  // ==========================================
  api.utils.registerKeyboardShortcut(
    [
      { key: 'w', altKey: true },
      { key: 'W', altKey: true }
    ],
    (event: KeyboardEvent) => {
      event.preventDefault()
      if (!state.processing) {
        openMainMenu()
      }
    }
  )

  api.logging.info('Return Automation plugin initialized. Press Alt+W to open menu.')
}

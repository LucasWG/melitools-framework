import type { MeliToolsAPI, ModalButton } from '../core/types'

interface ExecutionData {
  ids: string[]
  targetStatus: string
  currentIndex: number
  logs: Array<{
    id: string
    message: string
    type: string
    finalStatus?: string
  }>
  isVerificationOnly: boolean
}

interface LogEntry {
  id: string
  message: string
  type: string
  finalStatus?: string
}

const STATUS_OPTIONS = [
  'Aguardando boletim de ocorrência',
  'Aguardando documentação fiscal',
  'Aguardando documentação obrigatória por parte do seller',
  'Buffered',
  'Confiscado',
  'Entregue',
  'Faltante',
  'Multiguía',
  'No regulamento de sinistros por roubo',
  'Para despachar',
  'Para devolver',
  'Para solução de problemas',
  'Perdido',
  'Pertence a outra área',
  'Roubado'
]

export default function registerPackageStatusChanger(api: MeliToolsAPI) {
  const state: {
    controlPanel: (HTMLElement & { show(): void; hide(): void }) | null
    logPanel: (HTMLElement & { show(): void; hide(): void }) | null
    interruptButton: HTMLElement | null
    progressDisplay: HTMLElement | null
  } = {
    controlPanel: null,
    logPanel: null,
    interruptButton: null,
    progressDisplay: null
  }

  const showControlPanel = () => {
    const panel = api.ui.createModal({
      id: 'psc-control-panel',
      title: 'MeliTools - Alterador de Status de Pacotes',
      maxWidth: '1200px',
      content: `
        <div style="display: flex; flex-direction: column; gap: 15px; text-align: left;">
          <div id="psc-error-container" style="color: #e74c3c; background-color: #fdd; border: 1px solid #e74c3c; border-radius: 4px; padding: 10px; display: none;"></div>
          <label for="psc-status-select" style="font-size: 14px; font-weight: 600;">Selecione o Status de Destino (para alteração):</label>
          <select id="psc-status-select" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc;"></select>
          <label for="psc-id-textarea" style="font-size: 14px; font-weight: 600;">Insira os IDs dos Pacotes:</label>
          <textarea id="psc-id-textarea" rows="10" style="width: 100%; font-family: monospace; border-radius: 4px; border: 1px solid #ccc; padding: 8px; box-sizing: border-box;"></textarea>
          <small style="color: #666;">Um ID por linha ou separados por ponto e vírgula (;).</small>
        </div>
      `,
      buttons: [
        {
          text: 'Cancelar',
          type: 'quiet',
          action: () => state.controlPanel?.hide()
        },
        {
          text: 'Verificar Status',
          type: 'quiet',
          action: () => startProcessing(true)
        },
        {
          text: 'Iniciar Alteração',
          type: 'loud',
          action: () => startProcessing(false)
        }
      ],
      onClose: () => {
        state.controlPanel = null
      }
    })

    const select = panel.querySelector('#psc-status-select') as HTMLSelectElement
    const defaultOption = document.createElement('option')
    defaultOption.value = ''
    defaultOption.textContent = 'Selecione um status...'
    defaultOption.disabled = true
    defaultOption.selected = true
    select.appendChild(defaultOption)

    STATUS_OPTIONS.forEach(status => {
      const option = document.createElement('option')
      option.value = status
      option.textContent = status
      select.appendChild(option)
    })

    const lastIds = api.storage.get('psc_last_ids')
    const textarea = panel.querySelector('#psc-id-textarea') as HTMLTextAreaElement
    if (lastIds) {
      textarea.value = lastIds
      api.storage.remove('psc_last_ids')
    }

    state.controlPanel = panel
    panel.show()

    if (textarea) {
      textarea.focus()
    }
  }

  const startProcessing = (isVerificationOnly = false) => {
    if (!state.controlPanel) return

    const errorContainer = state.controlPanel.querySelector('#psc-error-container') as HTMLElement
    const textarea = state.controlPanel.querySelector('#psc-id-textarea') as HTMLTextAreaElement
    const select = state.controlPanel.querySelector('#psc-status-select') as HTMLSelectElement
    const rawIds = textarea.value
    const targetStatus = select.value

    errorContainer.style.display = 'none'
    errorContainer.textContent = ''

    if (!isVerificationOnly && !targetStatus) {
      errorContainer.textContent =
        'Por favor, selecione um status de destino para alterar.'
      errorContainer.style.display = 'block'
      return
    }

    const allIds = rawIds
      .split(/[\n;]/)
      .map(id => id.trim())
      .filter(id => id.length > 0)

    const validIds = allIds.filter(id => /^\d{11}$/.test(id))
    const invalidIds = allIds.filter(id => !/^\d{11}$/.test(id))
    const uniqueIds = [...new Set(validIds)]

    if (invalidIds.length > 0) {
      errorContainer.textContent = `IDs inválidos (diferentes de 11 dígitos) foram encontrados e ignorados: ${invalidIds.join(
        ', '
      )}`
      errorContainer.style.display = 'block'
    }

    if (uniqueIds.length === 0) {
      errorContainer.textContent += `${
        errorContainer.textContent ? '\n' : ''
      }Nenhum ID válido para processar.`
      errorContainer.style.display = 'block'
      return
    }

    if (uniqueIds.length < validIds.length) {
      const confirmationModal = api.ui.createModal({
        title: 'IDs Duplicados Encontrados',
        content: `Foram encontrados ${
          validIds.length - uniqueIds.length
        } IDs duplicados. Deseja removê-los e continuar o processo com ${
          uniqueIds.length
        } IDs únicos?`,
        buttons: [
          {
            text: 'Editar Manualmente',
            type: 'quiet',
            action: () => confirmationModal.hide()
          },
          {
            text: 'Remover e Continuar',
            type: 'loud',
            action: () => {
              confirmationModal.hide()
              executeProcessing(uniqueIds, targetStatus, isVerificationOnly)
            }
          }
        ]
      })
      confirmationModal.show()
    } else {
      executeProcessing(uniqueIds, targetStatus, isVerificationOnly)
    }
  }

  const executeProcessing = (ids: string[], targetStatus: string, isVerificationOnly: boolean) => {
    api.storage.set('psc_last_ids', ids.join('\n'))
    api.storage.set('psc_execution_data', {
      ids,
      targetStatus,
      currentIndex: 0,
      logs: [],
      isVerificationOnly
    })

    state.controlPanel?.hide()
    state.controlPanel = null

    const message = isVerificationOnly
      ? `Iniciando verificação para ${ids.length} pacotes.`
      : `Iniciando processo de alteração para ${ids.length} pacotes.`

    api.ui.showToast(message, { type: 'info' })
    showInterruptButton()
    showProgressDisplay(ids.length)
    processNextInQueue()
  }

  const processNextInQueue = () => {
    const dataString = api.storage.get('psc_execution_data')
    if (!dataString) {
      const finalLogString = api.storage.get('psc_final_log')
      if (finalLogString) {
        showLogPanel(finalLogString)
        api.storage.remove('psc_final_log')
      }
      hideInterruptButton()
      return
    }

    showInterruptButton()

    const data: ExecutionData = dataString
    const { ids, currentIndex, isVerificationOnly } = data
    const currentUrl = window.location.href
    const reconfirmingId = api.storage.get('psc_reconfirming_id')

    const currentUrlId = (currentUrl.match(/(\d{11})$/) || [])[1]

    if (ids && ids.length > 0) {
      const remaining = Math.max(0, ids.length - currentIndex)
      showProgressDisplay(remaining)
    }

    if (!isVerificationOnly && reconfirmingId && currentUrlId === reconfirmingId) {
      verifyStatusAndContinue(data)
      return
    }

    if (currentUrlId && currentUrlId === ids[currentIndex]) {
      if (isVerificationOnly) {
        verifyStatusOnPage(data)
      } else {
        changeStatusOnPage(data)
      }
    } else if (currentIndex < ids.length) {
      api.navigation.redirectTo(`${config.REDIRECT_URL_BASE}${ids[currentIndex]}`)
    } else {
      const logs = data.logs
      api.storage.set('psc_final_log', logs)
      api.storage.remove('psc_execution_data')
      hideInterruptButton()
      showLogPanel(logs)
    }
  }

  const verifyStatusOnPage = async (executionData: ExecutionData) => {
    const { ids, currentIndex } = executionData
    const currentId = ids[currentIndex]
    let logEntry: LogEntry = { id: currentId, message: '', type: 'info' }
    let finalStatus = 'Falha na Verificação'

    try {
      let currentStatus: string | null = null

      try {
        const inputElement = api.dom.find(`input[value*="${currentId}"]`) as HTMLInputElement
        if (inputElement && inputElement.nextElementSibling) {
          const statusElement = inputElement.nextElementSibling
          currentStatus = statusElement.textContent?.trim() || null
        }
      } catch (inputError) {
        // Falha silenciosa
      }

      if (!currentStatus) {
        try {
          const selectElement = api.dom.find('select') as HTMLSelectElement
          if (selectElement) {
            const optionElement = selectElement.options[selectElement.selectedIndex]
            currentStatus = optionElement?.textContent?.trim() || null
          }
        } catch (selectError) {
          // Falha silenciosa
        }
      }

      if (currentStatus) {
        logEntry.message = `Status atual: ${currentStatus}`
        logEntry.type = 'success'
        finalStatus = 'Verificado'
      } else {
        logEntry.message = 'Não foi possível obter o status'
        logEntry.type = 'error'
      }
    } catch (error) {
      logEntry.message = `Erro: ${error}`
      logEntry.type = 'error'
    } finally {
      updateExecutionData(executionData, logEntry, true, finalStatus)
      await api.utils.sleep(1000)
      processNextInQueue()
    }
  }

  const changeStatusOnPage = async (executionData: ExecutionData) => {
    const { ids, targetStatus, currentIndex } = executionData
    const currentId = ids[currentIndex]
    let finalStatus = 'Falha na Alteração'

    try {
      const selectElement = api.dom.find('select') as HTMLSelectElement
      if (!selectElement) {
        throw new Error('Select element not found')
      }

      let found = false
      for (let i = 0; i < selectElement.options.length; i++) {
        if (selectElement.options[i].textContent?.trim() === targetStatus) {
          selectElement.selectedIndex = i
          selectElement.dispatchEvent(new Event('change', { bubbles: true }))
          found = true
          break
        }
      }

      if (!found) {
        throw new Error(`Status "${targetStatus}" não encontrado`)
      }

      const snackbarSuccess = await waitForSnackbar(10000)
      if (snackbarSuccess) {
        finalStatus = 'Alterado com sucesso'
        api.storage.set('psc_reconfirming_id', currentId)
        await api.utils.sleep(2000)
        api.navigation.refresh()
      }
    } catch (error) {
      const logEntry: LogEntry = {
        id: currentId,
        message: `Erro: ${error}`,
        type: 'error',
        finalStatus
      }
      updateExecutionData(executionData, logEntry, true, finalStatus)
      await api.utils.sleep(1000)
      processNextInQueue()
    }
  }

  const waitForSnackbar = (timeout: number): Promise<boolean> => {
    return new Promise(resolve => {
      let found = false
      const startTime = Date.now()

      const checkSnackbar = setInterval(() => {
        const snackbar = api.dom.find('[role="alert"]') || api.dom.find('.snackbar')
        if (snackbar) {
          const text = snackbar.textContent?.toLowerCase() || ''
          if (text.includes('sucesso') || text.includes('alterado') || text.includes('concluído')) {
            found = true
            clearInterval(checkSnackbar)
            resolve(true)
            return
          } else if (text.includes('erro') || text.includes('falha')) {
            clearInterval(checkSnackbar)
            resolve(false)
            return
          }
        }

        const elapsed = Date.now() - startTime
        if (elapsed > timeout) {
          clearInterval(checkSnackbar)
          resolve(found)
        }
      }, 500)
    })
  }

  const verifyStatusAndContinue = async (executionData: ExecutionData) => {
    const { ids, targetStatus, currentIndex } = executionData
    const currentId = ids[currentIndex]
    let logEntry: LogEntry = { id: currentId, message: '', type: 'error' }
    let finalStatus = 'Falha na Verificação'

    try {
      const selectElement = api.dom.find('select') as HTMLSelectElement
      if (selectElement) {
        const selectedOption = selectElement.options[selectElement.selectedIndex]
        const currentStatus = selectedOption.textContent?.trim() || ''

        if (currentStatus === targetStatus) {
          logEntry.message = `Status alterado com sucesso para: ${targetStatus}`
          logEntry.type = 'success'
          finalStatus = 'Sucesso'
        } else {
          logEntry.message = `Status não foi alterado. Esperado: ${targetStatus}, Atual: ${currentStatus}`
          logEntry.type = 'error'
        }
      }
    } catch (error) {
      logEntry.message = `Erro na verificação: ${error}`
    } finally {
      api.storage.remove('psc_reconfirming_id')
      updateExecutionData(executionData, logEntry, true, finalStatus)
      await api.utils.sleep(1000)
      processNextInQueue()
    }
  }

  const updateExecutionData = (
    executionData: ExecutionData,
    logEntry: LogEntry,
    advanceIndex = true,
    finalStatus: string | null = null
  ) => {
    const newIndex = advanceIndex ? executionData.currentIndex + 1 : executionData.currentIndex

    const updatedLog: LogEntry = {
      ...logEntry,
      finalStatus: finalStatus || logEntry.finalStatus
    }

    api.storage.set('psc_execution_data', {
      ...executionData,
      currentIndex: newIndex,
      logs: [...executionData.logs, updatedLog]
    })

    try {
      if (state.progressDisplay) {
        const remaining = Math.max(0, executionData.ids.length - newIndex)
        updateProgressDisplay(remaining)
      }
    } catch (e) {
      // Falha silenciosa
    }
  }

  const showLogPanel = (logs: LogEntry[]) => {
    const logGroups = logs.reduce(
      (acc, log) => {
        const status = log.finalStatus || 'Sem Status'
        if (!acc[status]) acc[status] = []
        acc[status].push(log)
        return acc
      },
      {} as Record<string, LogEntry[]>
    )

    const logContent =
      Object.keys(logGroups)
        .sort()
        .map(status => {
          const items = logGroups[status]
            .map(
              log =>
                `<div style="margin: 4px 0; padding: 4px; background-color: ${
                  log.type === 'success' ? '#e8f5e9' : '#ffebee'
                }; border-radius: 3px;"><strong>${log.id}</strong>: ${log.message}</div>`
            )
            .join('')
          return `<div style="margin-top: 12px;"><strong style="color: #333;">${status} (${items.length})</strong>${items}</div>`
        })
        .join('') || 'Nenhum log para exibir.'

    const panel = api.ui.createModal({
      id: 'psc-log-panel',
      title: 'Resultado do Processamento',
      content: `<div style="font-family: monospace; max-height: 60vh; overflow-y: auto; background-color: #f7f7f7; border: 1px solid #ddd; padding: 10px; border-radius: 4px;">${logContent}</div>`,
      maxWidth: '1200px',
      zIndex: '999',
      buttons: [
        {
          text: 'Fechar',
          type: 'loud',
          action: () => {
            panel.hide()
          }
        }
      ],
      onClose: () => {
        state.logPanel = null
      }
    })
    state.logPanel = panel
    panel.show()
  }

  const showInterruptButton = () => {
    if (state.interruptButton) {
      api.ui.showElement(state.interruptButton)
    }

    state.interruptButton = api.ui.createFloatingElement({
      id: 'psc-interrupt-button',
      position: 'bottom-right',
      backgroundColor: '#fff',
      textColor: '#333'
    })

    state.interruptButton.innerHTML = '✕'
    state.interruptButton.style.cursor = 'pointer'
    state.interruptButton.style.pointerEvents = 'auto'
    state.interruptButton.style.width = '44px'
    state.interruptButton.style.height = '44px'
    state.interruptButton.style.display = 'flex'
    state.interruptButton.style.alignItems = 'center'
    state.interruptButton.style.justifyContent = 'center'
    state.interruptButton.style.borderRadius = '50%'
    state.interruptButton.style.fontSize = '22px'
    state.interruptButton.style.boxShadow = '0 2px 8px 0 rgba(0,0,0,0.10)'
    state.interruptButton.style.border = '1.5px solid #e0e0e0'
    state.interruptButton.style.background = '#fff'
    state.interruptButton.style.transition = 'box-shadow 0.2s, border 0.2s'
    state.interruptButton.style.fontFamily =
      "'Proxima Nova', -apple-system, 'Helvetica Neue', Helvetica, Roboto, Arial, sans-serif"

    const tooltip = document.createElement('div')
    tooltip.id = 'psc-interrupt-tooltip'
    tooltip.textContent = 'Interromper processamento de IDs (mostra log parcial)'
    Object.assign(tooltip.style, {
      position: 'fixed',
      right: '76px',
      bottom: 'calc(20px + 22px - 50%)',
      top: 'unset',
      background: '#fff',
      color: '#333',
      padding: '8px 16px',
      borderRadius: '7px',
      fontSize: '13px',
      fontWeight: '400',
      boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
      zIndex: '1000001',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 0.18s',
      whiteSpace: 'nowrap',
      userSelect: 'none',
      border: '1.5px solid #e0e0e0',
      fontFamily:
        "'Proxima Nova', -apple-system, 'Helvetica Neue', Helvetica, Roboto, Arial, sans-serif",
      transform: 'translateY(0)'
    })
    document.body.appendChild(tooltip)

    setTimeout(() => {
      const rect = state.interruptButton!.getBoundingClientRect()
      const tooltipHeight = tooltip.offsetHeight
      tooltip.style.bottom = `${window.innerHeight - rect.top + 8}px`
    }, 0)

    state.interruptButton.addEventListener('mouseenter', () => {
      tooltip.style.opacity = '1'
    })

    state.interruptButton.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0'
    })

    state.interruptButton.addEventListener('click', interruptExecution)
    api.ui.showElement(state.interruptButton)
  }

  const hideInterruptButton = () => {
    if (state.interruptButton) {
      api.ui.hideElement(state.interruptButton)
    }
    if (state.progressDisplay) {
      api.ui.hideElement(state.progressDisplay)
    }
  }

  const showProgressDisplay = (initialRemaining = 0) => {
    if (state.progressDisplay) {
      api.ui.showElement(state.progressDisplay)
    }

    state.progressDisplay = api.ui.createFloatingElement({
      id: 'psc-progress-display',
      position: 'bottom-right',
      backgroundColor: '#fff',
      textColor: '#333'
    })

    state.progressDisplay.style.pointerEvents = 'none'
    state.progressDisplay.style.padding = '8px 16px'
    state.progressDisplay.style.borderRadius = '8px'
    state.progressDisplay.style.fontSize = '14px'
    state.progressDisplay.style.boxShadow = '0 2px 8px 0 rgba(0,0,0,0.10)'
    state.progressDisplay.style.border = '1.5px solid #e0e0e0'
    state.progressDisplay.style.fontWeight = '400'
    state.progressDisplay.style.fontFamily =
      "'Proxima Nova', -apple-system, 'Helvetica Neue', Helvetica, Roboto, Arial, sans-serif"
    state.progressDisplay.innerHTML = `${initialRemaining} pacotes restantes`
    api.ui.showElement(state.progressDisplay)
  }

  const updateProgressDisplay = (remaining: number) => {
    if (!state.progressDisplay) return
    state.progressDisplay.innerHTML = `${remaining} pacote${remaining === 1 ? '' : 's'} restante${
      remaining === 1 ? '' : 's'
    }`
  }

  const interruptExecution = () => {
    const dataString = api.storage.get('psc_execution_data')
    if (dataString) {
      const data: ExecutionData = dataString
      api.storage.set('psc_final_log', data.logs)
      api.storage.remove('psc_execution_data')
      hideInterruptButton()
      showLogPanel(data.logs)
    }
  }

  const handleShortcut = (event: KeyboardEvent) => {
    if (event.altKey && (event.key === 'q' || event.key === 'Q')) {
      event.preventDefault()

      const executionData = api.storage.get('psc_execution_data')
      if (executionData) {
        interruptExecution()
      }

      if (state.controlPanel) {
        state.controlPanel.hide()
      } else {
        showControlPanel()
      }
    }
  }

  const config = {
    REDIRECT_URL_BASE: 'https://envios.adminml.com/logistics/package-management/package/'
  }

  document.addEventListener('keydown', handleShortcut)
  api.utils.onPageLoad(() => processNextInQueue())

  api.logging.info(
    'Package Status Changer initialized. Press Ctrl+Alt+Q to open the panel.'
  )
}

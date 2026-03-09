# MeliTools v2

Framework de automação Tampermonkey profissional com plugins remotos, cache offline, validação de licença e interface moderna.

## Estrutura do repositório

- `src/` - código fonte dividido em módulos JS
    - `core/` - managers (License, Plugin, RemoteLoader, etc.)
    - `plugins/` - plugins remotos com manifesto e código
    - `main.js` - entrada que inicializa o framework
    - `tampermonkey.user.js` - template inicial de userscript
- `dist/` - build gerado pelo Rollup (`melitools.user.js` é o userscript final)
- `package.json` - scripts de build

## Instalação e build

```bash
npm install
npm run build
```

Após o build o arquivo `dist/melitools.user.js` estará pronto para ser copiado para o Tampermonkey.

## Desenvolvimento

- Modifique qualquer arquivo em `src/`.
- Execute `npm run build` para gerar o bundle atualizado.
- Importar `dist/melitools.user.js` no Tampermonkey ou colar no editor.

## Uso

1. Instale o userscript no Tampermonkey.
2. Abra qualquer página compatível.
3. Ao iniciar, o framework verificará a licença; se não houver, exibirá o modal.
    - O modal foi estilizado para legibilidade, com fundo claro, texto escuro e botões destacados.
4. Pressione **ALT+Q** para abrir o painel de plugins e ativar/desativar.
    - O painel também possui tipografia clara e linhas de hover para facilitar a leitura.
5. As notificações do sistema (toasts) aparecem no canto inferior direito com cores contrastantes e texto branco, garantindo visibilidade em qualquer página.

## Plugins

O exemplo de plugin `inputInterceptor` intercepta conteúdo colado e direciona IDs/chaves conforme especificação.

## Licença remota

A URL `LICENSE_URL` aponta para um arquivo JSON hospedado no repositório [melitools-framework](https://github.com/LucasWG/melitools-framework) com formato:

```json
{
	"ABCD-1234-EFGH-5678": { "user": "joao", "active": true, "plugins": ["*"] }
}
```

## Kill switch

Um arquivo remoto chamado `framework.json` controla a disponibilidade do framework. Exemplo de conteúdo (baixado de `https://raw.githubusercontent.com/LucasWG/melitools-framework/main/framework.json`):

```json
{
	"enabled": true,
	"minVersion": "1.0.0"
}
```

- `enabled: false` desativa imediatamente o carregamento de qualquer plugin e mostra um alerta ao usuário.
- `minVersion` especifica a versão mínima do userscript; se a cópia local for mais antiga, o framework bloqueia a execução e notifica para atualizar.

O `KillSwitchManager` (instanciado em `src/main.js`) já consulta esse arquivo na inicialização. Você pode hospedar `framework.json` no próprio repositório do projeto ou em qualquer URL público. Faz sentido atualizá‑lo sempre que desejar forçar desligamento ou obrigar atualização.

---

Este projeto é um esqueleto completo; sinta-se à vontade para estender ou adaptar conforme necessário.

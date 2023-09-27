var mmd = (() => {
  let loaded = false

  const walk = (regex, string, result = [], match = regex.exec(string)) =>
    match ? walk(regex, string, result.concat(match[1])) : result

  return {
    render: () => {
      if (loaded) {
        const definitions = walk(/<pre><code class="mermaid">([\s\S]+?)<\/code><\/pre>/gi, state.html)

        Array.from(document.querySelectorAll('pre code.mermaid')).forEach((diagram, index) => {
          diagram.removeAttribute('data-processed')
          diagram.innerHTML = definitions[index]
        })
      }
      var theme =
        state._themes[state.theme] === 'dark' ||
        (state._themes[state.theme] === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        ? 'dark' : 'default'
      mermaid.initialize({theme})
      mermaid.init({theme}, 'code.mermaid')
      loaded = true
    }
  }
})()
